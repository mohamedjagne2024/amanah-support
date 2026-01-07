<?php

namespace App\Http\Controllers;

use App\Models\Region;
use App\Models\FrontPage;
use App\Models\Settings;
use App\Models\Ticket;
use App\Models\Comment;
use App\Models\Type;
use Carbon\Carbon;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;
use App\Events\TicketNewComment;
use Illuminate\Support\Facades\Storage;
use App\Models\Attachment;
use App\Models\Review;
use App\Events\TicketCreated;
use App\Events\AssignedUser;
use App\Models\User;

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
            'regions' => Region::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'tickets' => $ticketQuery
                ->filter(Request::only(['search', 'status', 'region_id']))
                ->paginate($limit)
                ->withQueryString()
                ->through(function ($ticket) {
                    return [
                        'id' => $ticket->id,
                        'uid' => $ticket->uid,
                        'subject' => $ticket->subject,
                        'region' => $ticket->region ? $ticket->region->name : null,
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

        // Get existing review for this ticket by the current user
        $review = Review::where('ticket_id', $ticket->id)
            ->where('user_id', $user['id'])
            ->first();

        return Inertia::render('contact-ticket/view', [
            'title' => $ticket->subject ? '#TKT-' . $ticket->uid . ' ' . $ticket->subject : '',
            'footer' => $this->getFooter(),
            'attachments' => $attachments,
            'comments' => $comments,
            'review' => $review ? [
                'id' => $review->id,
                'rating' => $review->rating,
                'review' => $review->review,
                'created_at' => $review->created_at,
            ] : null,
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
                'source' => $ticket->source ?? 'Portal',
                'response' => $ticket->response,
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

    public function create()
    {
        return Inertia::render('contact-ticket/create', [
            'title' => 'Create New Ticket',
            'footer' => $this->getFooter(),
            'regions' => Region::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
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
            'name' => ['required', 'max:100'],
            'email' => ['required', 'max:60', 'email'],
            'phone' => ['nullable', 'max:25'],
            'member_number' => ['nullable', 'max:50'],
            'type_id' => ['nullable', 'exists:types,id'],
            'region_id' => ['nullable', 'exists:regions,id'],
            'subject' => ['required', 'string', 'max:255'],
            'details' => ['required', 'string'],
            'files.*' => ['nullable', 'file', 'max:5120'],
        ]);

        // Update the logged-in user's contact information if provided
        $user->update([
            'name' => $request_data['name'],
            'email' => $request_data['email'],
            'phone' => $request_data['phone'] ?? $user->phone,
        ]);

        // Auto-assign to user in the selected region with fewest open tickets
        $assignedTo = null;
        if (!empty($request_data['region_id'])) {
            $assignedTo = $this->findLeastBusyUser($request_data['region_id']);
        }

        // Create ticket with all provided data
        $ticketData = [
            'subject' => $request_data['subject'],
            'details' => $request_data['details'],
            'contact_id' => $user['id'],
            'type_id' => $request_data['type_id'] ?? null,
            'region_id' => $request_data['region_id'] ?? null,
            'assigned_to' => $assignedTo,
            'priority' => 'low', // default priority
            'status' => 'pending', // default status
            'source' => 'contact_portal',
        ];

        // Get ticket automation settings from general settings
        $automationSettings = Settings::whereIn('name', ['escalate_value', 'escalate_unit', 'autoclose_value', 'autoclose_unit'])
            ->pluck('value', 'name')
            ->toArray();

        $ticketData['escalate_value'] = $automationSettings['escalate_value'] ?? null;
        $ticketData['escalate_unit'] = $automationSettings['escalate_unit'] ?? null;
        $ticketData['autoclose_value'] = $automationSettings['autoclose_value'] ?? null;
        $ticketData['autoclose_unit'] = $automationSettings['autoclose_unit'] ?? null;

        $ticket = Ticket::create($ticketData);

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

        // Notify assigned user if ticket was auto-assigned
        if (!empty($assignedTo)) {
            event(new AssignedUser(['ticket_id' => $ticket->id]));
        }

        return redirect()->route('contact.tickets')->with('success', 'Ticket created successfully.');
    }

    /**
     * Find the user in the specified region with the fewest open tickets.
     */
    private function findLeastBusyUser($regionId)
    {
        // Get all users with 'User' role in the specified region
        $users = User::role('User')
            ->where('region_id', $regionId)
            ->get();

        if ($users->isEmpty()) {
            return null; // No users in this region
        }

        // Find user with fewest open tickets
        $leastBusyUser = null;
        $minOpenTickets = PHP_INT_MAX;

        foreach ($users as $user) {
            // Count open tickets (not closed)
            $openTicketsCount = Ticket::where('assigned_to', $user->id)
                ->where('status', '!=', 'closed')
                ->count();

            if ($openTicketsCount < $minOpenTickets) {
                $minOpenTickets = $openTicketsCount;
                $leastBusyUser = $user;
            }
        }

        return $leastBusyUser ? $leastBusyUser->id : null;
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
            'regions' => Region::orderBy('name')
                ->get()
                ->map
                ->only('id', 'name'),
            'ticket' => [
                'id' => $ticket->id,
                'uid' => $ticket->uid,
                'subject' => $ticket->subject,
                'details' => $ticket->details,
                'region_id' => $ticket->region_id,
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
            'region_id' => ['nullable', 'exists:regions,id'],
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

    /**
     * Submit a review for a ticket.
     */
    public function submitReview($ticketId)
    {
        $user = Auth()->user();

        // Only allow reviewing own tickets
        $ticket = Ticket::where('contact_id', $user['id'])
            ->where(function ($query) use ($ticketId) {
                $query->where('uid', $ticketId);
                $query->orWhere('id', $ticketId);
            })->first();

        if (empty($ticket)) {
            abort(404);
        }

        $request_data = Request::validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'review' => ['nullable', 'string', 'max:1000'],
        ]);

        // Check if user already has a review for this ticket
        $existingReview = Review::where('ticket_id', $ticket->id)
            ->where('user_id', $user['id'])
            ->first();

        if ($existingReview) {
            // Update existing review
            $existingReview->update([
                'rating' => $request_data['rating'],
                'review' => $request_data['review'] ?? null,
            ]);
            $review = $existingReview;
        } else {
            // Create new review
            $review = Review::create([
                'ticket_id' => $ticket->id,
                'user_id' => $user['id'],
                'rating' => $request_data['rating'],
                'review' => $request_data['review'] ?? null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Review submitted successfully.',
            'review' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'review' => $review->review,
                'created_at' => $review->created_at,
            ],
        ]);
    }
}
