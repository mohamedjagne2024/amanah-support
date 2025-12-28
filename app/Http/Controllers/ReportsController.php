<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use App\Models\Ticket;
use App\Models\Comment;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

final class ReportsController extends Controller
{
    public function staffPerformance(Request $request): Response
    {
        // Get all staff members (non-contact users who have roles)
        $staffMembers = User::query()
            ->whereHas('roles')
            ->orderBy('name')
            ->get()
            ->map(fn(User $user) => [
                'id' => $user->id,
                'name' => $user->name,
            ]);

        $selectedStaffId = $request->filled('staff_id') ? $request->integer('staff_id') : null;
        $dateFrom = $request->filled('date_from') ? $request->string('date_from')->value() : null;
        $dateTo = $request->filled('date_to') ? $request->string('date_to')->value() : null;

        // Initialize report data
        $reportData = null;

        if ($selectedStaffId) {
            $staff = User::find($selectedStaffId);

            if ($staff) {
                // Build date range
                $startDate = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
                $endDate = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

                // ============== TICKETS METRICS ==============

                // Tickets created by staff
                $ticketsCreatedQuery = Ticket::where('created_user_id', $selectedStaffId);
                if ($startDate) $ticketsCreatedQuery->where('created_at', '>=', $startDate);
                if ($endDate) $ticketsCreatedQuery->where('created_at', '<=', $endDate);
                $ticketsCreated = $ticketsCreatedQuery->count();

                // Tickets assigned to staff
                $ticketsAssignedQuery = Ticket::where('assigned_to', $selectedStaffId);
                if ($startDate) $ticketsAssignedQuery->where('created_at', '>=', $startDate);
                if ($endDate) $ticketsAssignedQuery->where('created_at', '<=', $endDate);
                $ticketsAssigned = $ticketsAssignedQuery->count();

                // Open tickets assigned to staff
                $ticketsOpenQuery = Ticket::where('assigned_to', $selectedStaffId)
                    ->whereHas('status', function ($q) {
                        $q->whereIn('slug', ['open', 'pending', 'in-progress']);
                    });
                if ($startDate) $ticketsOpenQuery->where('created_at', '>=', $startDate);
                if ($endDate) $ticketsOpenQuery->where('created_at', '<=', $endDate);
                $ticketsOpen = $ticketsOpenQuery->count();

                // Closed tickets assigned to staff
                $ticketsClosedQuery = Ticket::where('assigned_to', $selectedStaffId)
                    ->whereHas('status', function ($q) {
                        $q->whereIn('slug', ['closed', 'resolved', 'completed']);
                    });
                if ($startDate) $ticketsClosedQuery->where('created_at', '>=', $startDate);
                if ($endDate) $ticketsClosedQuery->where('created_at', '<=', $endDate);
                $ticketsClosed = $ticketsClosedQuery->count();

                // Average response time (hours from ticket open to first comment by staff)
                $avgResponseTime = $this->calculateAverageResponseTime($selectedStaffId, $startDate, $endDate);

                // Average resolution time (hours from ticket open to close)
                $avgResolutionTime = $this->calculateAverageResolutionTime($selectedStaffId, $startDate, $endDate);

                // ============== COMMENTS/REPLIES METRICS ==============

                $commentsQuery = Comment::where('user_id', $selectedStaffId);
                if ($startDate) $commentsQuery->where('created_at', '>=', $startDate);
                if ($endDate) $commentsQuery->where('created_at', '<=', $endDate);
                $totalComments = $commentsQuery->count();

                // Average comments per ticket
                $ticketsWithComments = Comment::where('user_id', $selectedStaffId)
                    ->select('ticket_id')
                    ->distinct()
                    ->count();
                $avgCommentsPerTicket = $ticketsWithComments > 0 ? round($totalComments / $ticketsWithComments, 1) : 0;

                // ============== MESSAGES METRICS ==============

                $messagesQuery = Message::where('user_id', $selectedStaffId);
                if ($startDate) $messagesQuery->where('created_at', '>=', $startDate);
                if ($endDate) $messagesQuery->where('created_at', '<=', $endDate);
                $totalMessages = $messagesQuery->count();

                // ============== CONVERSATIONS METRICS ==============

                // Conversations where staff participated (via messages)
                // Note: Conversations are the public messaging widget - contacts chat with support directly
                $conversationsParticipatedQuery = Message::where('user_id', $selectedStaffId)
                    ->select('conversation_id')
                    ->distinct();
                if ($startDate) $conversationsParticipatedQuery->where('created_at', '>=', $startDate);
                if ($endDate) $conversationsParticipatedQuery->where('created_at', '<=', $endDate);
                $conversationsParticipated = $conversationsParticipatedQuery->count();

                // All conversations are public widget conversations (not linked to tickets)
                $publicConversations = $conversationsParticipated;

                // ============== MENTIONS METRICS ==============
                // Count comments/messages where this staff member is mentioned using @name pattern
                $staffName = $staff->name;
                $mentionPattern = '@' . $staffName;

                $mentionsInCommentsQuery = Comment::where('details', 'like', '%' . $mentionPattern . '%');
                if ($startDate) $mentionsInCommentsQuery->where('created_at', '>=', $startDate);
                if ($endDate) $mentionsInCommentsQuery->where('created_at', '<=', $endDate);
                $mentionsInComments = $mentionsInCommentsQuery->count();

                $mentionsInMessagesQuery = Message::where('message', 'like', '%' . $mentionPattern . '%');
                if ($startDate) $mentionsInMessagesQuery->where('created_at', '>=', $startDate);
                if ($endDate) $mentionsInMessagesQuery->where('created_at', '<=', $endDate);
                $mentionsInMessages = $mentionsInMessagesQuery->count();

                $totalMentions = $mentionsInComments + $mentionsInMessages;

                // ============== TICKET TRENDS (Monthly) ==============
                $ticketTrends = $this->getTicketTrends($selectedStaffId, $startDate, $endDate);

                // ============== TICKETS BY STATUS ==============
                $ticketsByStatus = $this->getTicketsByStatus($selectedStaffId, $startDate, $endDate);

                // ============== TICKETS BY PRIORITY ==============
                $ticketsByPriority = $this->getTicketsByPriority($selectedStaffId, $startDate, $endDate);

                // ============== RECENT ACTIVITY ==============
                $recentActivity = $this->getRecentActivity($selectedStaffId, $startDate, $endDate);

                // ============== PERFORMANCE SCORES ==============
                $resolutionRate = $ticketsAssigned > 0 ? round(($ticketsClosed / $ticketsAssigned) * 100, 1) : 0;

                // Customer satisfaction (based on reviews if available)
                $satisfactionScore = $this->calculateSatisfactionScore($selectedStaffId, $startDate, $endDate);

                $reportData = [
                    'staff' => [
                        'id' => $staff->id,
                        'name' => $staff->name,
                        'email' => $staff->email,
                        'title' => $staff->title ?? 'Staff Member',
                        'avatar' => $staff->photo_path,
                    ],
                    'summary' => [
                        'tickets_created' => $ticketsCreated,
                        'tickets_assigned' => $ticketsAssigned,
                        'tickets_open' => $ticketsOpen,
                        'tickets_closed' => $ticketsClosed,
                        'total_comments' => $totalComments,
                        'avg_comments_per_ticket' => $avgCommentsPerTicket,
                        'total_messages' => $totalMessages,
                        'conversations_participated' => $conversationsParticipated,
                        'public_conversations' => $publicConversations,
                        'total_mentions' => $totalMentions,
                        'mentions_in_comments' => $mentionsInComments,
                        'mentions_in_messages' => $mentionsInMessages,
                    ],
                    'performance' => [
                        'avg_response_time_hours' => $avgResponseTime,
                        'avg_resolution_time_hours' => $avgResolutionTime,
                        'resolution_rate' => $resolutionRate,
                        'satisfaction_score' => $satisfactionScore,
                    ],
                    'charts' => [
                        'ticket_trends' => $ticketTrends,
                        'tickets_by_status' => $ticketsByStatus,
                        'tickets_by_priority' => $ticketsByPriority,
                    ],
                    'recent_activity' => $recentActivity,
                ];
            }
        }

        return Inertia::render('reports/staff-performance', [
            'staffMembers' => $staffMembers,
            'reportData' => $reportData,
            'filters' => [
                'staff_id' => $selectedStaffId,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    private function calculateAverageResponseTime(int $staffId, ?Carbon $startDate, ?Carbon $endDate): float
    {
        $query = DB::table('tickets')
            ->join('comments', 'tickets.id', '=', 'comments.ticket_id')
            ->where('tickets.assigned_to', $staffId)
            ->where('comments.user_id', $staffId)
            ->whereRaw('comments.id = (SELECT MIN(c2.id) FROM comments c2 WHERE c2.ticket_id = tickets.id AND c2.user_id = ?)', [$staffId])
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, tickets.created_at, comments.created_at)) as avg_hours'));

        if ($startDate) {
            $query->where('tickets.created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('tickets.created_at', '<=', $endDate);
        }

        $result = $query->first();
        return $result && $result->avg_hours ? round((float) $result->avg_hours, 1) : 0;
    }

    private function calculateAverageResolutionTime(int $staffId, ?Carbon $startDate, ?Carbon $endDate): float
    {
        $query = Ticket::where('assigned_to', $staffId)
            ->whereNotNull('close')
            ->whereNotNull('open')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, open, close)) as avg_hours'));

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        $result = $query->first();
        return $result && $result->avg_hours ? round((float) $result->avg_hours, 1) : 0;
    }

    private function calculateSatisfactionScore(int $staffId, ?Carbon $startDate, ?Carbon $endDate): float
    {
        $query = DB::table('tickets')
            ->join('reviews', 'tickets.id', '=', 'reviews.ticket_id')
            ->where('tickets.assigned_to', $staffId)
            ->select(DB::raw('AVG(reviews.rating) as avg_rating'));

        if ($startDate) {
            $query->where('tickets.created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('tickets.created_at', '<=', $endDate);
        }

        $result = $query->first();
        return $result && $result->avg_rating ? round((float) $result->avg_rating, 1) : 0;
    }

    private function getTicketTrends(int $staffId, ?Carbon $startDate, ?Carbon $endDate): array
    {
        $query = Ticket::where('assigned_to', $staffId)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month', 'asc');

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        return $query->get()
            ->map(fn($item) => [
                'month' => Carbon::createFromFormat('Y-m', $item->month)->format('M Y'),
                'count' => (int) $item->count,
            ])
            ->toArray();
    }

    private function getTicketsByStatus(int $staffId, ?Carbon $startDate, ?Carbon $endDate): array
    {
        $query = Ticket::where('assigned_to', $staffId)
            ->join('status', 'tickets.status_id', '=', 'status.id')
            ->select('status.name as status', DB::raw('COUNT(*) as count'))
            ->groupBy('status.id', 'status.name');

        if ($startDate) {
            $query->where('tickets.created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('tickets.created_at', '<=', $endDate);
        }

        return $query->get()
            ->map(fn($item) => [
                'status' => $item->status,
                'count' => (int) $item->count,
            ])
            ->toArray();
    }

    private function getTicketsByPriority(int $staffId, ?Carbon $startDate, ?Carbon $endDate): array
    {
        $query = Ticket::where('assigned_to', $staffId)
            ->join('priorities', 'tickets.priority_id', '=', 'priorities.id')
            ->select('priorities.name as priority', DB::raw('COUNT(*) as count'))
            ->groupBy('priorities.id', 'priorities.name');

        if ($startDate) {
            $query->where('tickets.created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('tickets.created_at', '<=', $endDate);
        }

        return $query->get()
            ->map(fn($item) => [
                'priority' => $item->priority,
                'count' => (int) $item->count,
            ])
            ->toArray();
    }

    private function getRecentActivity(int $staffId, ?Carbon $startDate, ?Carbon $endDate): array
    {
        $activities = collect();

        // Recent tickets
        $ticketsQuery = Ticket::with(['status', 'priority'])
            ->where('assigned_to', $staffId)
            ->orderBy('created_at', 'desc')
            ->limit(10);

        if ($startDate) {
            $ticketsQuery->where('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $ticketsQuery->where('created_at', '<=', $endDate);
        }

        $tickets = $ticketsQuery->get()
            ->map(fn($ticket) => [
                'type' => 'ticket',
                'id' => $ticket->id,
                'uid' => $ticket->uid,
                'title' => $ticket->subject,
                'status' => $ticket->status?->name ?? '-',
                'priority' => $ticket->priority?->name ?? '-',
                'created_at' => $ticket->created_at,
                'formatted_date' => Carbon::parse($ticket->created_at)->format('M d, Y H:i'),
            ]);

        $activities = $activities->merge($tickets);

        // Recent comments
        $commentsQuery = Comment::with('ticket')
            ->where('user_id', $staffId)
            ->orderBy('created_at', 'desc')
            ->limit(10);

        if ($startDate) {
            $commentsQuery->where('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $commentsQuery->where('created_at', '<=', $endDate);
        }

        $comments = $commentsQuery->get()
            ->map(fn($comment) => [
                'type' => 'comment',
                'id' => $comment->id,
                'ticket_id' => $comment->ticket_id,
                'ticket_uid' => $comment->ticket?->uid ?? '-',
                'title' => 'Replied to ticket #' . ($comment->ticket?->uid ?? $comment->ticket_id),
                'preview' => \Illuminate\Support\Str::limit(strip_tags($comment->details), 100),
                'created_at' => $comment->created_at,
                'formatted_date' => Carbon::parse($comment->created_at)->format('M d, Y H:i'),
            ]);

        $activities = $activities->merge($comments);

        // Recent messages
        $messagesQuery = Message::where('user_id', $staffId)
            ->orderBy('created_at', 'desc')
            ->limit(10);

        if ($startDate) {
            $messagesQuery->where('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $messagesQuery->where('created_at', '<=', $endDate);
        }

        $messages = $messagesQuery->get()
            ->map(fn($message) => [
                'type' => 'message',
                'id' => $message->id,
                'conversation_id' => $message->conversation_id,
                'title' => 'Sent message in conversation',
                'preview' => \Illuminate\Support\Str::limit(strip_tags($message->message), 100),
                'created_at' => $message->created_at,
                'formatted_date' => Carbon::parse($message->created_at)->format('M d, Y H:i'),
            ]);

        $activities = $activities->merge($messages);

        // Sort by created_at and return top 20
        return $activities
            ->sortByDesc('created_at')
            ->take(20)
            ->values()
            ->toArray();
    }

    // ============================================================
    // SUPPORT BY ORGANIZATION REPORT
    // ============================================================

    public function supportByOrganization(Request $request): Response
    {
        // Get all organizations
        $organizations = \App\Models\Organization::query()
            ->orderBy('name')
            ->get()
            ->map(fn($org) => [
                'id' => $org->id,
                'name' => $org->name,
            ]);

        $selectedOrgId = $request->filled('organization_id') ? $request->integer('organization_id') : null;
        $dateFrom = $request->filled('date_from') ? $request->string('date_from')->value() : null;
        $dateTo = $request->filled('date_to') ? $request->string('date_to')->value() : null;

        // Initialize report data
        $reportData = null;

        if ($selectedOrgId) {
            $organization = \App\Models\Organization::find($selectedOrgId);

            if ($organization) {
                // Build date range
                $startDate = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
                $endDate = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

                // Get all contact IDs for this organization
                $contactIds = User::where('organization_id', $selectedOrgId)->pluck('id')->toArray();

                // Get contact details for the report
                $contacts = User::where('organization_id', $selectedOrgId)
                    ->get()
                    ->map(fn($contact) => [
                        'id' => $contact->id,
                        'name' => $contact->name,
                        'email' => $contact->email,
                    ]);

                // ============== TICKETS METRICS ==============

                // Total tickets submitted by organization contacts
                $ticketsSubmittedQuery = Ticket::whereIn('contact_id', $contactIds);
                if ($startDate) $ticketsSubmittedQuery->where('created_at', '>=', $startDate);
                if ($endDate) $ticketsSubmittedQuery->where('created_at', '<=', $endDate);
                $ticketsSubmitted = $ticketsSubmittedQuery->count();

                // Open tickets
                $ticketsOpenQuery = Ticket::whereIn('contact_id', $contactIds)
                    ->whereHas('status', function ($q) {
                        $q->whereIn('slug', ['open', 'pending', 'in-progress']);
                    });
                if ($startDate) $ticketsOpenQuery->where('created_at', '>=', $startDate);
                if ($endDate) $ticketsOpenQuery->where('created_at', '<=', $endDate);
                $ticketsOpen = $ticketsOpenQuery->count();

                // Closed tickets
                $ticketsClosedQuery = Ticket::whereIn('contact_id', $contactIds)
                    ->whereHas('status', function ($q) {
                        $q->whereIn('slug', ['closed', 'resolved', 'completed']);
                    });
                if ($startDate) $ticketsClosedQuery->where('created_at', '>=', $startDate);
                if ($endDate) $ticketsClosedQuery->where('created_at', '<=', $endDate);
                $ticketsClosed = $ticketsClosedQuery->count();

                // Pending tickets
                $ticketsPendingQuery = Ticket::whereIn('contact_id', $contactIds)
                    ->whereHas('status', function ($q) {
                        $q->where('slug', 'pending');
                    });
                if ($startDate) $ticketsPendingQuery->where('created_at', '>=', $startDate);
                if ($endDate) $ticketsPendingQuery->where('created_at', '<=', $endDate);
                $ticketsPending = $ticketsPendingQuery->count();

                // ============== COMMENTS METRICS ==============

                // Get all ticket IDs for this organization
                $ticketIdsQuery = Ticket::whereIn('contact_id', $contactIds);
                if ($startDate) $ticketIdsQuery->where('created_at', '>=', $startDate);
                if ($endDate) $ticketIdsQuery->where('created_at', '<=', $endDate);
                $ticketIds = $ticketIdsQuery->pluck('id')->toArray();

                // Comments on organization's tickets (by contacts)
                $commentsQuery = Comment::whereIn('ticket_id', $ticketIds)->whereIn('user_id', $contactIds);
                if ($startDate) $commentsQuery->where('created_at', '>=', $startDate);
                if ($endDate) $commentsQuery->where('created_at', '<=', $endDate);
                $totalCommentsFromContacts = $commentsQuery->count();

                // Comments on organization's tickets (by staff)
                $staffCommentsQuery = Comment::whereIn('ticket_id', $ticketIds)->whereNotIn('user_id', $contactIds);
                if ($startDate) $staffCommentsQuery->where('created_at', '>=', $startDate);
                if ($endDate) $staffCommentsQuery->where('created_at', '<=', $endDate);
                $totalCommentsFromStaff = $staffCommentsQuery->count();

                $totalComments = $totalCommentsFromContacts + $totalCommentsFromStaff;

                // ============== MESSAGES METRICS ==============

                // Messages from organization contacts
                $messagesQuery = Message::whereIn('user_id', $contactIds);
                if ($startDate) $messagesQuery->where('created_at', '>=', $startDate);
                if ($endDate) $messagesQuery->where('created_at', '<=', $endDate);
                $totalMessages = $messagesQuery->count();

                // ============== CONVERSATIONS METRICS ==============

                // Conversations started by organization contacts
                $conversationsQuery = \App\Models\Conversation::whereIn('contact_id', $contactIds);
                if ($startDate) $conversationsQuery->where('created_at', '>=', $startDate);
                if ($endDate) $conversationsQuery->where('created_at', '<=', $endDate);
                $totalConversations = $conversationsQuery->count();

                // ============== RESPONSE TIME METRICS ==============
                $avgResponseTime = $this->calculateOrgAverageResponseTime($ticketIds, $contactIds, $startDate, $endDate);
                $avgResolutionTime = $this->calculateOrgAverageResolutionTime($ticketIds, $startDate, $endDate);

                // ============== SATISFACTION METRICS ==============
                $satisfactionScore = $this->calculateOrgSatisfactionScore($ticketIds, $startDate, $endDate);

                // ============== TICKETS BY STATUS ==============
                $ticketsByStatus = $this->getOrgTicketsByStatus($contactIds, $startDate, $endDate);

                // ============== TICKETS BY PRIORITY ==============
                $ticketsByPriority = $this->getOrgTicketsByPriority($contactIds, $startDate, $endDate);

                // ============== TICKETS BY CATEGORY ==============
                $ticketsByCategory = $this->getOrgTicketsByCategory($contactIds, $startDate, $endDate);

                // ============== TICKETS BY CONTACT ==============
                $ticketsByContact = $this->getOrgTicketsByContact($contactIds, $startDate, $endDate);

                // ============== RECENT ACTIVITY ==============
                $recentActivity = $this->getOrgRecentActivity($contactIds, $ticketIds, $startDate, $endDate);

                // ============== PERFORMANCE SCORES ==============
                $resolutionRate = $ticketsSubmitted > 0 ? round(($ticketsClosed / $ticketsSubmitted) * 100, 1) : 0;

                $reportData = [
                    'organization' => [
                        'id' => $organization->id,
                        'name' => $organization->name,
                        'email' => $organization->email,
                        'phone' => $organization->phone,
                        'address' => $organization->address,
                        'city' => $organization->city,
                        'region' => $organization->region,
                        'country' => $organization->country,
                    ],
                    'contacts' => $contacts,
                    'summary' => [
                        'total_contacts' => count($contactIds),
                        'tickets_submitted' => $ticketsSubmitted,
                        'tickets_open' => $ticketsOpen,
                        'tickets_closed' => $ticketsClosed,
                        'tickets_pending' => $ticketsPending,
                        'total_comments' => $totalComments,
                        'comments_from_contacts' => $totalCommentsFromContacts,
                        'comments_from_staff' => $totalCommentsFromStaff,
                        'total_messages' => $totalMessages,
                        'total_conversations' => $totalConversations,
                    ],
                    'performance' => [
                        'avg_response_time_hours' => $avgResponseTime,
                        'avg_resolution_time_hours' => $avgResolutionTime,
                        'resolution_rate' => $resolutionRate,
                        'satisfaction_score' => $satisfactionScore,
                    ],
                    'charts' => [
                        'tickets_by_status' => $ticketsByStatus,
                        'tickets_by_priority' => $ticketsByPriority,
                        'tickets_by_category' => $ticketsByCategory,
                        'tickets_by_contact' => $ticketsByContact,
                    ],
                    'recent_activity' => $recentActivity,
                ];
            }
        }

        return Inertia::render('reports/support-by-organization', [
            'organizations' => $organizations,
            'reportData' => $reportData,
            'filters' => [
                'organization_id' => $selectedOrgId,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    private function calculateOrgAverageResponseTime(array $ticketIds, array $contactIds, ?Carbon $startDate, ?Carbon $endDate): float
    {
        if (empty($ticketIds)) {
            return 0;
        }

        // Response time = time from ticket creation to first staff comment
        $query = DB::table('tickets')
            ->join('comments', 'tickets.id', '=', 'comments.ticket_id')
            ->whereIn('tickets.id', $ticketIds)
            ->whereNotIn('comments.user_id', $contactIds) // Staff comments only
            ->whereRaw('comments.id = (SELECT MIN(c2.id) FROM comments c2 WHERE c2.ticket_id = tickets.id AND c2.user_id NOT IN (' . implode(',', array_merge($contactIds, [0])) . '))')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, tickets.created_at, comments.created_at)) as avg_hours'));

        if ($startDate) {
            $query->where('tickets.created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('tickets.created_at', '<=', $endDate);
        }

        $result = $query->first();
        return $result && $result->avg_hours ? round((float) $result->avg_hours, 1) : 0;
    }

    private function calculateOrgAverageResolutionTime(array $ticketIds, ?Carbon $startDate, ?Carbon $endDate): float
    {
        if (empty($ticketIds)) {
            return 0;
        }

        $query = Ticket::whereIn('id', $ticketIds)
            ->whereNotNull('close')
            ->whereNotNull('open')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, open, close)) as avg_hours'));

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        $result = $query->first();
        return $result && $result->avg_hours ? round((float) $result->avg_hours, 1) : 0;
    }

    private function calculateOrgSatisfactionScore(array $ticketIds, ?Carbon $startDate, ?Carbon $endDate): float
    {
        if (empty($ticketIds)) {
            return 0;
        }

        $query = DB::table('tickets')
            ->join('reviews', 'tickets.id', '=', 'reviews.ticket_id')
            ->whereIn('tickets.id', $ticketIds)
            ->select(DB::raw('AVG(reviews.rating) as avg_rating'));

        if ($startDate) {
            $query->where('tickets.created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('tickets.created_at', '<=', $endDate);
        }

        $result = $query->first();
        return $result && $result->avg_rating ? round((float) $result->avg_rating, 1) : 0;
    }

    private function getOrgTicketsByStatus(array $contactIds, ?Carbon $startDate, ?Carbon $endDate): array
    {
        if (empty($contactIds)) {
            return [];
        }

        $query = Ticket::whereIn('contact_id', $contactIds)
            ->join('status', 'tickets.status_id', '=', 'status.id')
            ->select('status.name as status', DB::raw('COUNT(*) as count'))
            ->groupBy('status.id', 'status.name');

        if ($startDate) {
            $query->where('tickets.created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('tickets.created_at', '<=', $endDate);
        }

        return $query->get()
            ->map(fn($item) => [
                'status' => $item->status,
                'count' => (int) $item->count,
            ])
            ->toArray();
    }

    private function getOrgTicketsByPriority(array $contactIds, ?Carbon $startDate, ?Carbon $endDate): array
    {
        if (empty($contactIds)) {
            return [];
        }

        $query = Ticket::whereIn('contact_id', $contactIds)
            ->join('priorities', 'tickets.priority_id', '=', 'priorities.id')
            ->select('priorities.name as priority', DB::raw('COUNT(*) as count'))
            ->groupBy('priorities.id', 'priorities.name');

        if ($startDate) {
            $query->where('tickets.created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('tickets.created_at', '<=', $endDate);
        }

        return $query->get()
            ->map(fn($item) => [
                'priority' => $item->priority,
                'count' => (int) $item->count,
            ])
            ->toArray();
    }

    private function getOrgTicketsByCategory(array $contactIds, ?Carbon $startDate, ?Carbon $endDate): array
    {
        if (empty($contactIds)) {
            return [];
        }

        $query = Ticket::whereIn('contact_id', $contactIds)
            ->join('categories', 'tickets.category_id', '=', 'categories.id')
            ->select('categories.name as category', DB::raw('COUNT(*) as count'))
            ->groupBy('categories.id', 'categories.name');

        if ($startDate) {
            $query->where('tickets.created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('tickets.created_at', '<=', $endDate);
        }

        return $query->get()
            ->map(fn($item) => [
                'category' => $item->category,
                'count' => (int) $item->count,
            ])
            ->toArray();
    }

    private function getOrgTicketsByContact(array $contactIds, ?Carbon $startDate, ?Carbon $endDate): array
    {
        if (empty($contactIds)) {
            return [];
        }

        $query = Ticket::whereIn('contact_id', $contactIds)
            ->join('users', 'tickets.contact_id', '=', 'users.id')
            ->select('users.name as contact', 'users.email', DB::raw('COUNT(*) as count'))
            ->groupBy('users.id', 'users.name', 'users.email');

        if ($startDate) {
            $query->where('tickets.created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('tickets.created_at', '<=', $endDate);
        }

        return $query->get()
            ->map(fn($item) => [
                'contact' => $item->contact,
                'email' => $item->email,
                'count' => (int) $item->count,
            ])
            ->toArray();
    }

    private function getOrgRecentActivity(array $contactIds, array $ticketIds, ?Carbon $startDate, ?Carbon $endDate): array
    {
        $activities = collect();

        if (!empty($ticketIds)) {
            // Recent tickets
            $ticketsQuery = Ticket::with(['status', 'priority', 'contact'])
                ->whereIn('id', $ticketIds)
                ->orderBy('created_at', 'desc')
                ->limit(10);

            if ($startDate) {
                $ticketsQuery->where('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $ticketsQuery->where('created_at', '<=', $endDate);
            }

            $tickets = $ticketsQuery->get()
                ->map(fn($ticket) => [
                    'type' => 'ticket',
                    'id' => $ticket->id,
                    'uid' => $ticket->uid,
                    'title' => $ticket->subject,
                    'status' => $ticket->status?->name ?? '-',
                    'priority' => $ticket->priority?->name ?? '-',
                    'contact' => $ticket->contact?->name ?? '-',
                    'created_at' => $ticket->created_at,
                    'formatted_date' => Carbon::parse($ticket->created_at)->format('M d, Y H:i'),
                ]);

            $activities = $activities->merge($tickets);

            // Recent comments on these tickets
            $commentsQuery = Comment::with(['ticket', 'user'])
                ->whereIn('ticket_id', $ticketIds)
                ->orderBy('created_at', 'desc')
                ->limit(10);

            if ($startDate) {
                $commentsQuery->where('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $commentsQuery->where('created_at', '<=', $endDate);
            }

            $comments = $commentsQuery->get()
                ->map(fn($comment) => [
                    'type' => 'comment',
                    'id' => $comment->id,
                    'ticket_id' => $comment->ticket_id,
                    'ticket_uid' => $comment->ticket?->uid ?? '-',
                    'title' => 'Comment on ticket #' . ($comment->ticket?->uid ?? $comment->ticket_id),
                    'preview' => \Illuminate\Support\Str::limit(strip_tags($comment->details), 100),
                    'user' => $comment->user?->name ?? '-',
                    'created_at' => $comment->created_at,
                    'formatted_date' => Carbon::parse($comment->created_at)->format('M d, Y H:i'),
                ]);

            $activities = $activities->merge($comments);
        }

        if (!empty($contactIds)) {
            // Recent messages from contacts
            $messagesQuery = Message::whereIn('user_id', $contactIds)
                ->orderBy('created_at', 'desc')
                ->limit(10);

            if ($startDate) {
                $messagesQuery->where('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $messagesQuery->where('created_at', '<=', $endDate);
            }

            $messages = $messagesQuery->get()
                ->map(fn($message) => [
                    'type' => 'message',
                    'id' => $message->id,
                    'conversation_id' => $message->conversation_id,
                    'title' => 'Message in conversation',
                    'preview' => \Illuminate\Support\Str::limit(strip_tags($message->message), 100),
                    'created_at' => $message->created_at,
                    'formatted_date' => Carbon::parse($message->created_at)->format('M d, Y H:i'),
                ]);

            $activities = $activities->merge($messages);
        }

        // Sort by created_at and return top 20
        return $activities
            ->sortByDesc('created_at')
            ->take(20)
            ->values()
            ->toArray();
    }
}
