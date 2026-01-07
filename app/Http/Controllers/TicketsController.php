<?php

namespace App\Http\Controllers;

use App\Events\AssignedUser;
use App\Events\TicketCreated;
use App\Events\TicketNewComment;
use App\Events\TicketUpdated;
use App\Models\Attachment;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Region;
use App\Models\PendingEmail;
use App\Models\Review;
use App\Models\Settings;
use App\Models\Ticket;
use App\Models\TicketEntry;
use App\Models\TicketField;
use App\Models\Type;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Traits\HasGoogleCloudStorage;
use Illuminate\Support\Facades\Gate;
use App\Events\TicketResolved;

class TicketsController extends Controller
{
    use HasGoogleCloudStorage;

    public function index()
    {
        Gate::authorize('tickets.view');
        $byContact = null;
        $byAssign = null;
        $user = Auth()->user();
        if ($user->hasRole('Contact')) {
            $byContact = $user['id'];
        } elseif ($user->hasRole('Manager')) {
            $byAssign = $user['id'];
        } elseif ($user->hasRole('User')) {
            // Users with 'user' role can only see tickets assigned to them
            $byAssign = $user['id'];
        } else {
            $byAssign = Request::input('assigned_to');
        }
        $whereAll = [];
        $type = Request::input('type');
        $limit = Request::input('limit', 10);
        $contact = Request::input('contact_id');

        if (!empty($contact)) {
            $whereAll[] = ['contact_id', '=', $contact];
        }

        if ($type == 'un_assigned') {
            $whereAll[] = ['assigned_to', '=', null];
        } elseif ($type == 'open') {
            $whereAll[] = ['status', '=', 'open'];
        } elseif ($type == 'new') {
            $whereAll[] = ['created_at', '>=', date('Y-m-d') . ' 00:00:00'];
        }

        $ticketQuery = Ticket::where($whereAll);

        // Handle high priority filter
        if ($type == 'high_priority') {
            $ticketQuery->where('priority', 'high')->orWhere('priority', 'urgent');
        }

        if (Request::has(['field', 'direction'])) {
            if (Request::input('field') == 'tech') {
                $ticketQuery
                    ->join('users', 'tickets.assigned_to', '=', 'users.id')
                    ->orderBy('users.first_name', Request::input('direction'))->select('tickets.*');
            } else {
                $ticketQuery->orderBy(Request::input('field'), Request::input('direction'));
            }
        } else {
            $ticketQuery->orderBy('uid', 'DESC');
        }

        return Inertia::render('ticket/index', [
            'title' => 'Tickets',
            'filters' => Request::all(),
            'priorities' => collect(Ticket::PRIORITIES)->map(function ($label, $value) {
                return ['value' => $value, 'name' => $label];
            })->values(),
            'assignees' => [],
            'types' => Type::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'categories' => Category::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'regions' => Region::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'statuses' => collect(Ticket::STATUSES)->map(function ($label, $value) {
                return ['value' => $value, 'name' => $label];
            })->values(),
            'tickets' => $ticketQuery
                ->filter(Request::only(['search', 'priority', 'status', 'type_id', 'category_id', 'department_id']))
                ->byContact($byContact)
                ->byAssign($byAssign)
                ->paginate($limit)
                ->withQueryString()
                ->through(function ($ticket) {
                    return [
                        'id' => $ticket->id,
                        'uid' => $ticket->uid,
                        'subject' => $ticket->subject,
                        'contact' => $ticket->contact ? $ticket->contact->name : null,
                        'contact_photo' => $ticket->contact ? $ticket->contact->profile_picture_url : null,
                        'priority' => $ticket->priority_label,
                        'category' => $ticket->category ? $ticket->category->name : null,
                        'rating' => $ticket->review ? $ticket->review->rating : 0,
                        'status' => $ticket->status_label,
                        'due' => Carbon::parse($ticket->due)->format(Settings::get('date_format')),
                        'assigned_to' => $ticket->assignedTo ? $ticket->assignedTo->name : null,
                        'assigned_to_photo' => $ticket->assignedTo ? $ticket->assignedTo->profile_picture_url : null,
                        'created_at' => $ticket->created_at->toIso8601String(),
                        'updated_at' => Carbon::parse($ticket->updated_at)->format(Settings::get('date_format')),
                        'escalate_value' => $ticket->escalate_value,
                        'escalate_unit' => $ticket->escalate_unit,
                        'response' => $ticket->response,
                    ];
                }),
        ]);
    }

    private function handleAttachmentUploads(Ticket $ticket, array $files): void
    {
        // Configure GCS from database settings
        $this->configureGCS();

        foreach ($files as $file) {
            // Upload to Google Cloud Storage
            $path = $this->uploadToStorage($file, 'tickets');

            if ($path) {
                Attachment::create([
                    'ticket_id' => $ticket->id,
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'path' => $path,
                    'user_id' => auth()->user()->id ?? null,
                ]);
            }
        }
    }

    public function csvImport()
    {
        Gate::authorize('tickets.csv.import');
        $file = Request::file('file');
        if (!empty($file)) {

            $fileContents = $this->csvToArray($file->getPathname());
            foreach ($fileContents as $data) {
                $findExistingTicket = Ticket::where('uid', $data['UID'])->first();
                if (empty($findExistingTicket)) {
                    // Map priority from CSV to static value
                    $priority = strtolower($data['Priority'] ?? 'low');
                    if (!array_key_exists($priority, Ticket::PRIORITIES)) {
                        $priority = 'low';
                    }

                    // Map status from CSV to static value
                    $status = strtolower(str_replace(' ', '_', $data['Status'] ?? 'pending'));
                    if (!array_key_exists($status, Ticket::STATUSES)) {
                        $status = 'pending';
                    }

                    $category = Category::firstOrCreate(['name' => $data['Category']]);
                    $region = Region::firstOrCreate(['name' => $data['Region']]);
                    $assignTo = User::where(['email' => $data['Assigned To Email']])->first();
                    if (empty($assignTo) && !empty($data['Assigned To Email']) && !empty($data['Assigned To Name'])) {
                        $aName = $data['Assigned To Name'];
                        $assignTo = User::create(['email' => $data['Assigned To Email'], 'first_name' => $aName[0], 'last_name' => $aName[1]]);
                    }

                    $ticket = Ticket::create([
                        'uid' => $data['UID'],
                        'subject' => $data['Subject'],
                        'priority' => $priority,
                        'category_id' => $category->id,
                        'region_id' => $region->id,
                        'status' => $status,
                        'assigned_to' => $assignTo ? $assignTo->id : null
                    ]);
                }
            }
            return redirect()->back()->with('success', 'CSV file imported successfully.');
        } else {
            return redirect()->back()->with('error', 'CSV file import issue!');
        }
    }

    public function csvExport()
    {
        Gate::authorize('tickets.csv.export');
        $tickets = Ticket::all();
        $csvFileName = 'tickets.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $csvFileName . '"',
        ];

        $handle = fopen('php://output', 'w');
        fputcsv($handle, ['UID', 'Subject', 'Priority', 'Category', 'Region', 'Status', 'Assigned To Email', 'Assigned To Name', 'Created']);

        foreach ($tickets as $ticket) {
            fputcsv($handle, [
                $ticket->uid,
                $ticket->subject,
                $ticket->priority_label,
                $ticket->category ? $ticket->category->name : null,
                $ticket->region ? $ticket->region->name : null,
                $ticket->status_label,
                $ticket->assignedTo ? $ticket->assignedTo->email : null,
                $ticket->assignedTo ? $ticket->assignedTo->first_name . ' ' . $ticket->assignedTo->last_name : null,
                $ticket->created_at
            ]);
        }

        fclose($handle);

        return Response::make('', 200, $headers);
    }

    public function create()
    {
        Gate::authorize('tickets.create');

        $required_fields = [];
        $get_required_fields = Settings::where('name', 'required_ticket_fields')->first();
        if (!empty($get_required_fields)) {
            $required_fields = json_decode($get_required_fields->value, true);
        }

        return Inertia::render('ticket/create', [
            'title' => 'Create a new ticket',
            'contacts' => User::role('contact')
                ->when(Request::input('contact_id'), function ($query) {
                    $query->orWhere('id', Request::input('contact_id'));
                })
                ->orderBy('name')
                ->limit(6)
                ->get()
                ->map
                ->only('id', 'name'),
            'usersExceptContacts' => User::whereDoesntHave('roles', function ($query) {
                $query->where('name', 'contact');
            })
                ->when(Request::input('user_id'), function ($query) {
                    $query->orWhere('id', Request::input('user_id'));
                })
                ->orderBy('name')
                ->limit(6)
                ->get()
                ->map
                ->only('id', 'name'),
            'priorities' => collect(Ticket::PRIORITIES)->map(function ($label, $value) {
                return ['value' => $value, 'name' => $label];
            })->values(),
            'regions' => Region::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'all_categories' => Category::orderBy('name')
                ->get(),
            'statuses' => collect(Ticket::STATUSES)->map(function ($label, $value) {
                return ['value' => $value, 'name' => $label];
            })->values(),
            'types' => Type::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'requiredFields' => $required_fields,
        ]);
    }

    public function store()
    {
        Gate::authorize('tickets.create');
        $required_fields = [];

        $get_required_fields = Settings::where('name', 'required_ticket_fields')->first();
        if (!empty($get_required_fields)) {
            $required_fields = json_decode($get_required_fields->value, true);
        }
        $user = Auth()->user();
        $request_data = Request::validate([
            'contact_id' => ['nullable', Rule::exists('users', 'id')],
            'priority' => ['nullable', 'string', Rule::in(array_keys(Ticket::PRIORITIES))],
            'status' => ['nullable', 'string', Rule::in(array_keys(Ticket::STATUSES))],
            'region_id' => [in_array('region', $required_fields) ? 'required' : 'nullable', Rule::exists('regions', 'id')],
            'assigned_to' => [in_array('assigned_to', $required_fields) ? 'required' : 'nullable', Rule::exists('users', 'id')],
            'category_id' => [in_array('category', $required_fields) ? 'required' : 'nullable', Rule::exists('categories', 'id')],
            'type_id' => [in_array('ticket_type', $required_fields) ? 'required' : 'nullable', Rule::exists('types', 'id')],
            'subject' => ['required'],
            'details' => ['required'],
        ]);

        if ($user->hasRole('Contact')) {
            $request_data['contact_id'] = $user['id'];
        }

        // Set default priority if not provided
        if (empty($request_data['priority'])) {
            $request_data['priority'] = 'low';
        }

        // Set default status to 'pending' for new tickets
        $request_data['status'] = 'pending';

        // Get ticket automation settings from general settings
        $automationSettings = Settings::whereIn('name', ['escalate_value', 'escalate_unit', 'autoclose_value', 'autoclose_unit'])
            ->pluck('value', 'name')
            ->toArray();

        $request_data['escalate_value'] = $automationSettings['escalate_value'] ?? null;
        $request_data['escalate_unit'] = $automationSettings['escalate_unit'] ?? null;
        $request_data['autoclose_value'] = $automationSettings['autoclose_value'] ?? null;
        $request_data['autoclose_unit'] = $automationSettings['autoclose_unit'] ?? null;

        $ticket = Ticket::create($request_data);

        if (Request::hasFile('files')) {
            $files = Request::file('files');
            $this->handleAttachmentUploads($ticket, $files);
        }

        $custom_inputs = Request::input('custom_field');

        if (!empty($custom_inputs)) {
            foreach ($custom_inputs as $cfk => $cfv) {
                $ticket_field = TicketField::where('name', $cfk)->first();
                if (!empty($ticket_field)) {
                    TicketEntry::create(['ticket_id' => $ticket->id, 'field_id' => $ticket_field->id, 'name' => $cfk, 'label' => $ticket_field->label, 'value' => $cfv]);
                }
            }
        }

        event(new TicketCreated(['ticket_id' => $ticket->id, 'source' => 'dashboard']));

        if (!empty($ticket->assigned_to)) {
            event(new AssignedUser($ticket->id));
        }


        return Redirect::route('tickets')->with('success', 'Ticket created.');
    }

    public function show($uid)
    {
        Gate::authorize('tickets.view');
        $user = Auth()->user();
        $byContact = null;
        $byAssign = null;

        if ($user->hasRole('Contact')) {
            $byContact = $user['id'];
        } elseif ($user->hasRole('Manager')) {
            $byAssign = $user['id'];
        } elseif ($user->hasRole('User')) {
            // Users with 'user' role can only see tickets assigned to them
            $byAssign = $user['id'];
        } else {
            $byAssign = Request::input('assigned_to');
        }

        $ticket = Ticket::byContact($byContact)
            ->byAssign($byAssign)
            ->where(function ($query) use ($uid) {
                $query->where('uid', $uid);
                $query->orWhere('id', $uid);
            })->first();

        if (empty($ticket)) {
            abort(404);
        }

        // Get attachments with signed URLs
        $attachments = Attachment::orderBy('name')
            ->with('user')
            ->where('ticket_id', $ticket->id ?? null)
            ->get()
            ->map(function ($attachment) {
                return [
                    'id' => $attachment->id,
                    'name' => $attachment->name,
                    'size' => $attachment->size,
                    'path' => $attachment->path,
                    'url' => $this->getStorageUrl($attachment->path),
                    'user' => $attachment->user ? [
                        'id' => $attachment->user->id,
                        'name' => $attachment->user->name,
                    ] : null,
                ];
            });

        return Inertia::render('ticket/view', [
            'title' => $ticket->subject ? '#TKT-' . $ticket->uid . ' ' . $ticket->subject : '',
            'attachments' => $attachments,
            'comments' => Comment::orderBy('created_at', 'asc')
                ->with('user')
                ->where('ticket_id', $ticket->id ?? null)
                ->get(),
            'ticket' => [
                'id' => $ticket->id,
                'uid' => $ticket->uid,
                'contact_id' => $ticket->contact_id,
                'contact' => $ticket->contact ?: null,
                'priority' => $ticket->priority,
                'created_at' => $ticket->created_at,
                'updated_at' => $ticket->updated_at,
                'priority_label' => $ticket->priority_label,
                'status' => $ticket->status,
                'status_label' => $ticket->status_label,
                'closed' => $ticket->is_closed,
                'review' => (function () use ($ticket) {
                    $latestReview = $ticket->reviews()->with('user')->latest()->first();
                    if (!$latestReview) return null;
                    return [
                        'id' => $latestReview->id,
                        'rating' => $latestReview->rating,
                        'review' => $latestReview->review,
                        'created_at' => $latestReview->created_at,
                        'user' => $latestReview->user ? [
                            'id' => $latestReview->user->id,
                            'name' => $latestReview->user->name,
                        ] : null,
                    ];
                })(),
                'region_id' => $ticket->region_id,
                'region' => $ticket->region ? $ticket->region->name : 'N/A',
                'category_id' => $ticket->category_id,
                'category' => $ticket->category ? $ticket->category->name : 'N/A',
                'assigned_to' => $ticket->assigned_to,
                'assigned_user' => $ticket->assignedTo ? $ticket->assignedTo->name : 'Unassigned',
                'type_id' => $ticket->type_id,
                'type' => $ticket->ticketType ? $ticket->ticketType->name : 'N/A',
                'subject' => $ticket->subject,
                'details' => $ticket->details,
                'due' => $ticket->due,
                'source' => $ticket->source ?? 'Email',
                'tags' => $ticket->tags ?? '',
                'files' => [],
                'comment_access' => 'read',
                'created_by' => $ticket->createdBy ? [
                    'id' => $ticket->createdBy->id,
                    'name' => $ticket->createdBy->name,
                    'profile_picture_url' => $ticket->createdBy->profile_picture_url,
                ] : null,
                'resolution_details' => $ticket->resolution_details,
                'resolve' => $ticket->resolve,
            ],
        ]);
    }

    public function edit($uid)
    {
        Gate::authorize('tickets.update');
        $user = Auth()->user();
        $byContact = null;
        $byAssign = null;
        if ($user->hasRole('Contact')) {
            $byContact = $user['id'];
        } elseif ($user->hasRole('Manager')) {
            $byAssign = $user['id'];
        } elseif ($user->hasRole('User')) {
            // Users with 'user' role can only edit tickets assigned to them
            $byAssign = $user['id'];
        } else {
            $byAssign = Request::input('assigned_to');
        }
        $ticket = Ticket::byContact($byContact)
            ->byAssign($byAssign)
            ->where(function ($query) use ($uid) {
                $query->where('uid', $uid);
                $query->orWhere('id', $uid);
            })->first();
        if (empty($ticket)) {
            abort(404);
        }
        $comment_access = 'read';
        if ($user->hasRole('Admin')) {
            $comment_access = 'delete';
        } elseif ($user->hasRole('Manager')) {
            $comment_access = 'view';
        }

        $required_fields = [];
        $get_required_fields = Settings::where('name', 'required_ticket_fields')->first();
        if (!empty($get_required_fields)) {
            $required_fields = json_decode($get_required_fields->value, true);
        }

        return Inertia::render('ticket/edit', [
            'title' => $ticket->subject ? '#' . $ticket->uid . ' ' . $ticket->subject : '',
            'contacts' => User::role('contact')
                ->when(Request::input('contact_id'), function ($query) {
                    $query->orWhere('id', Request::input('contact_id'));
                })
                ->orderBy('name')
                ->limit(6)
                ->get()
                ->map
                ->only('id', 'name'),
            'usersExceptContacts' => User::whereDoesntHave('roles', function ($query) {
                $query->where('name', 'contact');
            })
                ->when(Request::input('user_id'), function ($query) {
                    $query->orWhere('id', Request::input('user_id'));
                })
                ->orderBy('name')
                ->limit(6)
                ->get()
                ->map
                ->only('id', 'name'),
            'priorities' => collect(Ticket::PRIORITIES)->map(function ($label, $value) {
                return ['value' => $value, 'name' => $label];
            })->values(),
            'regions' => Region::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'all_categories' => Category::orderBy('name')
                ->get(),
            'statuses' => collect(Ticket::STATUSES)->map(function ($label, $value) {
                return ['value' => $value, 'name' => $label];
            })->values(),
            'attachments' => Attachment::orderBy('name')
                ->with('user')
                ->where('ticket_id', $ticket->id ?? null)
                ->get()
                ->map(function ($attachment) {
                    return [
                        'id' => $attachment->id,
                        'name' => $attachment->name,
                        'size' => $attachment->size,
                        'path' => $attachment->path,
                        'url' => $this->getStorageUrl($attachment->path),
                        'user' => $attachment->user ? [
                            'id' => $attachment->user->id,
                            'name' => $attachment->user->name,
                        ] : null,
                    ];
                }),
            'comments' => Comment::orderBy('created_at', 'asc')->with('user')->where('ticket_id', $ticket->id ?? null)->get(),
            'types' => Type::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'requiredFields' => $required_fields,
            'ticket' => [
                'id' => $ticket->id,
                'uid' => $ticket->uid,
                'contact_id' => $ticket->contact_id,
                'contact' => $ticket->contact ?: null,
                'priority' => $ticket->priority,
                'created_at' => Carbon::parse($ticket->created_at)->format(Settings::get('date_format')),
                'updated_at' => Carbon::parse($ticket->updated_at)->format(Settings::get('date_format')),
                'priority_label' => $ticket->priority_label,
                'status' => $ticket->status,
                'status_label' => $ticket->status_label,
                'closed' => $ticket->is_closed,
                'review' => $ticket->review,
                'region_id' => $ticket->region_id,
                'region' => $ticket->region ? $ticket->region->name : 'N/A',
                'category_id' => $ticket->category_id,
                'category' => $ticket->category ? $ticket->category->name : 'N/A',
                'assigned_to' => $ticket->assigned_to,
                'assigned_user' => $ticket->assignedTo ? $ticket->assignedTo->name : 'N/A',
                'type_id' => $ticket->type_id,
                'type' => $ticket->ticketType ? $ticket->ticketType->name : 'N/A',
                'subject' => $ticket->subject,
                'details' => $ticket->details,
                'due' => Carbon::parse($ticket->due)->format(Settings::get('date_format')),
                'source' => $ticket->source ?? 'Email',
                'tags' => $ticket->tags ?? '',
                'files' => [],
                'comment_access' => $comment_access,
            ],
        ]);
    }

    public function update(Ticket $ticket)
    {
        Gate::authorize('tickets.update');
        $required_fields = [];

        $get_required_fields = Settings::where('name', 'required_ticket_fields')->first();
        if (!empty($get_required_fields)) {
            $required_fields = json_decode($get_required_fields->value, true);
        }

        $user = Auth()->user();
        $request_data = Request::validate([
            'contact_id' => ['nullable', Rule::exists('users', 'id')],
            'priority' => ['nullable', 'string', Rule::in(array_keys(Ticket::PRIORITIES))],
            'status' => ['nullable', 'string', Rule::in(array_keys(Ticket::STATUSES))],
            'region_id' => [in_array('region', $required_fields) ? 'required' : 'nullable', Rule::exists('regions', 'id')],
            'assigned_to' => [in_array('assigned_to', $required_fields) ? 'required' : 'nullable', Rule::exists('users', 'id')],
            'category_id' => [in_array('category', $required_fields) ? 'required' : 'nullable', Rule::exists('categories', 'id')],
            'type_id' => [in_array('ticket_type', $required_fields) ? 'required' : 'nullable', Rule::exists('types', 'id')],
            'subject' => ['required'],
            'due' => ['nullable'],
            'details' => ['required'],
            'source' => ['nullable', 'string', 'max:50'],
            'tags' => ['nullable', 'string', 'max:500'],
        ]);

        if (!empty(Request::input('review')) || !empty(Request::input('rating'))) {
            $review = Review::create([
                'review' => Request::input('review'),
                'rating' => Request::input('rating'),
                'ticket_id' => $ticket->id,
                'user_id' => $user['id']
            ]);
            $ticket->update(['review_id' => $review->id]);
            return Redirect::route('tickets.edit', $ticket->uid)->with('success', 'Added the review!');
        }

        $update_message = null;
        // Check for status change
        if ($ticket->status !== 'closed' && ($request_data['status'] ?? null) === 'closed') {
            $update_message = 'The ticket has been closed.';
        } elseif ($ticket->status !== ($request_data['status'] ?? $ticket->status)) {
            $update_message = 'The status has been changed for this ticket.';
        }

        // Check for priority change
        if ($ticket->priority !== ($request_data['priority'] ?? $ticket->priority)) {
            $update_message = 'The priority has been changed for this ticket.';
        }

        if (empty($ticket->response) && $user->hasRole('Admin')) {
            $request_data['response'] = date('Y-m-d H:i:s');
        }

        if (isset($request_data['due']) && !empty($request_data['due'])) {
            $request_data['due'] = date('Y-m-d', strtotime($request_data['due']));
        }

        $assigned = (!empty($request_data['assigned_to']) && ($ticket->assigned_to != $request_data['assigned_to'])) ?? false;

        $ticket->update($request_data);

        if ($assigned) {
            event(new AssignedUser(['ticket_id' => $ticket->id]));
        }

        if (!empty($update_message)) {
            event(new TicketUpdated(['ticket_id' => $ticket->id, 'update_message' => $update_message]));
        }

        if (!empty(Request::input('comment'))) {
            Comment::create([
                'details' => Request::input('comment'),
                'ticket_id' => $ticket->id,
                'user_id' => $user['id']
            ]);
            $this->sendMailCron($ticket->id, 'response', Request::input('comment'));
        }

        $removedFiles = Request::input('removedFiles');
        if (!empty($removedFiles)) {
            $attachments = Attachment::where('ticket_id', $ticket->id)->whereIn('id', $removedFiles)->get();
            foreach ($attachments as $attachment) {
                // Delete from Google Cloud Storage
                $this->deleteFromStorage($attachment->path);
                $attachment->delete();
            }
        }

        if (Request::hasFile('files')) {
            $files = Request::file('files');
            $this->handleAttachmentUploads($ticket, $files);
        }

        return Redirect::route('tickets.edit', $ticket->uid)->with('success', 'Ticket updated.');
    }

    public function newComment()
    {
        Gate::authorize('tickets.comment');
        $request = Request::all();
        $ticket = Comment::where('ticket_id', $request['ticket_id'])->count();
        if (empty($ticket)) {
            event(new TicketNewComment(['ticket_id' => $request['ticket_id'], 'comment' => $request['comment']]));
        }

        $newComment = new Comment;
        if (isset($request['user_id'])) {
            $newComment->user_id = $request['user_id'];
        }
        if (isset($request['ticket_id'])) {
            $newComment->ticket_id = $request['ticket_id'];
        }
        $newComment->details = $request['comment'];

        $newComment->save();

        return response()->json($newComment);
    }

    public function destroy($uid)
    {
        Gate::authorize('tickets.delete');
        $user = Auth()->user();
        $byContact = null;
        $byAssign = null;

        if ($user->hasRole('Contact')) {
            $byContact = $user['id'];
        } elseif ($user->hasRole('Manager')) {
            $byAssign = $user['id'];
        } elseif ($user->hasRole('User')) {
            // Users with 'user' role can only delete tickets assigned to them
            $byAssign = $user['id'];
        } else {
            $byAssign = Request::input('assigned_to');
        }

        $ticket = Ticket::byContact($byContact)
            ->byAssign($byAssign)
            ->where(function ($query) use ($uid) {
                $query->where('uid', $uid);
                $query->orWhere('id', $uid);
            })->first();

        if (empty($ticket)) {
            abort(404);
        }

        $ticket->delete();
        return Redirect::route('tickets')->with('success', 'Ticket deleted.');
    }

    public function bulkDelete()
    {
        Gate::authorize('tickets.delete');
        $validated = Request::validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:tickets,id'],
        ]);

        Ticket::whereIn('id', $validated['ids'])->delete();

        return Redirect::back()->with('success', count($validated['ids']) . ' ticket(s) deleted successfully.');
    }

    public function restore(Ticket $ticket)
    {
        Gate::authorize('tickets.restore');
        $ticket->restore();
        return Redirect::back()->with('success', 'Ticket restored.');
    }

    /**
     * Close a ticket.
     */
    public function close(Ticket $ticket)
    {
        Gate::authorize('tickets.update');

        $ticket->update([
            'status' => 'closed',
            'close' => now(),
        ]);

        event(new TicketUpdated(['ticket_id' => $ticket->id, 'update_message' => 'The ticket has been closed.']));

        return response()->json([
            'success' => true,
            'message' => 'Ticket closed successfully.',
        ]);
    }

    /**
     * Resolve a ticket and send notification to contact user.
     */
    public function resolve(Ticket $ticket)
    {
        Gate::authorize('tickets.update');

        $request = Request::validate([
            'resolution_details' => ['required', 'string', 'min:10'],
        ]);

        // Update ticket status to resolved and save resolution details
        $ticket->update([
            'status' => 'resolved',
            'resolve' => now(),
            'resolution_details' => $request['resolution_details']
        ]);

        // Fire event to send email notification to contact user
        event(new TicketResolved([
            'ticket_id' => $ticket->id,
            'resolution_details' => $request['resolution_details'],
        ]));

        // Also trigger regular ticket updated event
        event(new TicketUpdated([
            'ticket_id' => $ticket->id,
            'update_message' => 'The ticket has been resolved.'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Ticket resolved successfully.',
        ]);
    }


    private function sendMailCron($id, $type = null, $value = null)
    {
        PendingEmail::create(['ticket_id' => $id, 'type' => $type, 'value' => $value]);
    }

    private function csvToArray($filename = '', $delimiter = ',')
    {
        if (!file_exists($filename) || !is_readable($filename))
            return false;

        $header = null;
        $data = array();
        if (($handle = fopen($filename, 'r')) !== false) {
            while (($row = fgetcsv($handle, 1000, $delimiter)) !== false) {
                if (!$header)
                    $header = $row;
                else
                    $data[] = array_combine($header, $row);
            }
            fclose($handle);
        }

        return $data;
    }

    /**
     * Add a comment to a ticket from the view page.
     */
    public function addComment(Ticket $ticket)
    {
        Gate::authorize('tickets.comment');
        $request = Request::all();
        $user = Auth()->user();

        $newComment = new Comment;
        $newComment->user_id = Auth()->id();
        $newComment->ticket_id = $ticket->id;
        $newComment->details = $request['comment'] ?? '';
        $newComment->save();

        // Build the comment response data
        $commentData = [
            'id' => $newComment->id,
            'details' => $newComment->details,
            'created_at' => $newComment->created_at,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
            ],
        ];

        // update the ticket reponse time ( this is the latest response time)
        $ticket->update([
            'response' => now(),
        ]);

        // change the ticket status to open if it is closed
        if ($ticket->status == 'closed' || $ticket->status == 'pending') {
            $ticket->update([
                'status' => 'open',
                'close' => null,
            ]);
        }

        // Dispatch Pusher event for real-time updates
        event(new TicketNewComment(
            $ticket->id,
            $ticket->uid,
            $commentData
        ));

        // Return JSON response for axios calls
        return response()->json([
            'success' => true,
            'message' => 'Comment added successfully.',
            'comment' => $commentData,
        ]);
    }
}
