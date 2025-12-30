<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Department;
use App\Models\FrontPage;
use App\Models\Settings;
use App\Models\Ticket;
use App\Models\Comment;
use Carbon\Carbon;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;
use App\Events\TicketNewComment;
use Illuminate\Support\Facades\Storage;
use App\Models\Attachment;
use App\Models\Type;
use App\Events\TicketCreated;

class ContactsTicketController extends Controller
{
    /**
     * Get footer data for the layout
     */
    private function getFooter()
    {
        return FrontPage::where('slug', 'footer')->first();
    }

    public function index()
    {
        $user = Auth()->user();

        // Only show tickets belonging to the logged-in contact
        $contactId = $user['id'];
        $limit = Request::input('limit', 10);

        $ticketQuery = Ticket::where('contact_id', $contactId);

        // Handle filtering by status type
        $type = Request::input('type');
        if ($type == 'open') {
            $ticketQuery->where('status', '!=', 'closed');
        } elseif ($type == 'closed') {
            $ticketQuery->where('status', 'closed');
        }

        // Handle sorting
        if (Request::has(['field', 'direction'])) {
            $ticketQuery->orderBy(Request::input('field'), Request::input('direction'));
        } else {
            $ticketQuery->orderBy('updated_at', 'DESC');
        }

        return Inertia::render('contact-ticket/index', [
            'title' => 'My Tickets',
            'filters' => Request::all(),
            'footer' => $this->getFooter(),
            'statuses' => collect(Ticket::STATUSES)->map(function ($label, $value) {
                return ['value' => $value, 'name' => $label];
            })->values(),
            'departments' => Department::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'tickets' => $ticketQuery
                ->filter(Request::only(['search', 'status', 'department_id']))
                ->paginate($limit)
                ->withQueryString()
                ->through(function ($ticket) {
                    return [
                        'id' => $ticket->id,
                        'uid' => $ticket->uid,
                        'subject' => $ticket->subject,
                        'department' => $ticket->department ? $ticket->department->name : null,
                        'priority' => $ticket->priority_label,
                        'status' => $ticket->status_label,
                        'status_slug' => $ticket->status,
                        'assigned_to' => $ticket->assignedTo ? $ticket->assignedTo->name : 'Unassigned',
                        'assigned_to_photo' => $ticket->assignedTo ? $ticket->assignedTo->profile_picture_url : null,
                        'created_at' => Carbon::parse($ticket->created_at)->format(Settings::get('date_format') . ' H:i'),
                        'updated_at' => Carbon::parse($ticket->updated_at)->format(Settings::get('date_format') . ' H:i'),
                    ];
                }),
        ]);
    }

    public function show($uid)
    {
        $user = Auth()->user();

        // Only allow viewing own tickets
        $ticket = Ticket::where('contact_id', $user['id'])
            ->where(function ($query) use ($uid) {
                $query->where('uid', $uid);
                $query->orWhere('id', $uid);
            })->first();

        if (empty($ticket)) {
            abort(404);
        }

        // Get attachments with URLs
        $attachments = Attachment::orderBy('name')
            ->with('user')
            ->where('ticket_id', $ticket->id ?? null)
            ->get()
            ->map(function ($attachment) {
                $path = $attachment->path;
                $url = '';

                // Check if it's a GCS path or local path
                if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
                    $url = $path;
                } elseif (Storage::disk('public')->exists($path)) {
                    $url = Storage::disk('public')->url($path);
                } else {
                    $url = '/storage/' . $path;
                }

                return [
                    'id' => $attachment->id,
                    'name' => $attachment->name,
                    'size' => $attachment->size,
                    'path' => $attachment->path,
                    'url' => $url,
                    'user' => $attachment->user ? [
                        'id' => $attachment->user->id,
                        'name' => $attachment->user->name,
                    ] : null,
                ];
            });

        // Get comments
        $comments = Comment::orderBy('created_at', 'asc')
            ->with('user')
            ->where('ticket_id', $ticket->id ?? null)
            ->get();

        return Inertia::render('contact-ticket/view', [
            'title' => $ticket->subject ? '#TKT-' . $ticket->uid . ' ' . $ticket->subject : '',
            'footer' => $this->getFooter(),
            'attachments' => $attachments,
            'comments' => $comments,
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
                'department_id' => $ticket->department_id,
                'department' => $ticket->department ? $ticket->department->name : 'N/A',
                'category_id' => $ticket->category_id,
                'category' => $ticket->category ? $ticket->category->name : 'N/A',
                'assigned_to' => $ticket->assigned_to,
                'assigned_user' => $ticket->assignedTo ? $ticket->assignedTo->name : 'Unassigned',
                'type_id' => $ticket->type_id,
                'type' => $ticket->ticketType ? $ticket->ticketType->name : 'N/A',
                'subject' => $ticket->subject,
                'details' => $ticket->details,
                'due' => $ticket->due,
                'source' => $ticket->source ?? 'Portal',
                'created_by' => $ticket->createdBy ? [
                    'id' => $ticket->createdBy->id,
                    'name' => $ticket->createdBy->name,
                    'profile_picture_url' => $ticket->createdBy->profile_picture_url,
                ] : null,
            ],
        ]);
    }

    public function create()
    {
        $hide_ticket_fields = json_decode(Settings::where('name', 'hide_ticket_fields')->value('value') ?? '[]', true);

        return Inertia::render('contact-ticket/create', [
            'title' => 'Create New Ticket',
            'footer' => $this->getFooter(),
            'hide_ticket_fields' => $hide_ticket_fields,
            'departments' => Department::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'all_categories' => Category::orderBy('name')->get(),
            'types' => Type::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
        ]);
    }

    public function store()
    {
        $user = Auth()->user();

        $request_data = Request::validate([
            'subject' => ['required', 'string', 'max:255'],
            'details' => ['required', 'string'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'type_id' => ['nullable', 'exists:types,id'],
            'files.*' => ['nullable', 'file', 'max:5120'],
        ]);

        // Set the contact_id to the logged-in user
        $request_data['contact_id'] = $user['id'];

        // Set default priority to low if not provided
        $request_data['priority'] = 'low';

        // Set default status to pending for new tickets
        $request_data['status'] = 'pending';

        // Remove files from request_data as it's handled separately
        unset($request_data['files']);

        $ticket = Ticket::create($request_data);

        // Handle file attachments
        if (Request::hasFile('files')) {
            foreach (Request::file('files') as $file) {
                $path = $file->store('tickets', ['disk' => 'public']);
                if ($path) {
                    Attachment::create([
                        'ticket_id' => $ticket->id,
                        'name' => $file->getClientOriginalName(),
                        'size' => $file->getSize(),
                        'path' => $path,
                        'user_id' => $user['id'],
                    ]);
                }
            }
        }

        event(new TicketCreated(['ticket_id' => $ticket->id, 'source' => 'contact']));

        return redirect()->route('contact.tickets')->with('success', 'Ticket created successfully.');
    }

    public function edit($uid)
    {
        $user = Auth()->user();

        $ticket = Ticket::where('contact_id', $user['id'])
            ->where(function ($query) use ($uid) {
                $query->where('uid', $uid);
                $query->orWhere('id', $uid);
            })->first();

        if (empty($ticket)) {
            abort(404);
        }

        return Inertia::render('contact-ticket/edit', [
            'title' => 'Edit Ticket',
            'footer' => $this->getFooter(),
            'departments' => Department::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'ticket' => [
                'id' => $ticket->id,
                'uid' => $ticket->uid,
                'subject' => $ticket->subject,
                'details' => $ticket->details,
                'department_id' => $ticket->department_id,
            ],
        ]);
    }

    public function update($uid)
    {
        $user = Auth()->user();

        $ticket = Ticket::where('contact_id', $user['id'])
            ->where(function ($query) use ($uid) {
                $query->where('uid', $uid);
                $query->orWhere('id', $uid);
            })->first();

        if (empty($ticket)) {
            abort(404);
        }

        $request_data = Request::validate([
            'subject' => ['required', 'string', 'max:255'],
            'details' => ['required', 'string'],
            'department_id' => ['nullable', 'exists:departments,id'],
        ]);

        $ticket->update($request_data);

        return redirect()->route('contact.tickets')->with('success', 'Ticket updated successfully.');
    }

    public function addComment($ticketId)
    {
        $user = Auth()->user();

        // Only allow commenting on own tickets
        $ticket = Ticket::where('contact_id', $user['id'])
            ->where(function ($query) use ($ticketId) {
                $query->where('uid', $ticketId);
                $query->orWhere('id', $ticketId);
            })->first();

        if (empty($ticket)) {
            abort(404);
        }

        $request_data = Request::validate([
            'comment' => ['required', 'string'],
        ]);

        $comment = Comment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user['id'],
            'details' => $request_data['comment'],
        ]);

        // Build the comment response data
        $commentData = [
            'id' => $comment->id,
            'details' => $comment->details,
            'created_at' => $comment->created_at,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
            ],
        ];

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
