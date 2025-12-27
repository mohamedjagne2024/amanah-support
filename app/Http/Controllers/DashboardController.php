<?php

namespace App\Http\Controllers;


use Inertia\Inertia;
use App\Models\Ticket;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Redirect contact users to their ticket dashboard
        if (auth()->check() && auth()->user()->hasRole('Contact')) {
            return redirect()->route('contact.tickets');
        }

        $userName = 'User';
        if (auth()->check()) {
            $user = auth()->user();
            $userName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
            if (!$userName) $userName = $user->name ?? 'User';
        }

        $metrics = [
            'totalTickets' => Ticket::count(),
            'openTickets' => Ticket::whereHas('status', function ($q) {
                $q->where('slug', 'not like', '%closed%')
                    ->where('slug', 'not like', '%resolved%');
            })->count(),
            'closedTickets' => Ticket::whereHas('status', function ($q) {
                $q->where('slug', 'like', '%closed%')
                    ->orWhere('slug', 'like', '%resolved%');
            })->count(),
            'unassignedTickets' => Ticket::whereNull('assigned_to')->count(),
        ];

        // Charts
        $ticketsByStatus = Ticket::select('status_id', DB::raw('count(*) as count'))
            ->with('status')
            ->groupBy('status_id')
            ->get()
            ->map(function ($item) {
                return [
                    'status' => $item->status->name ?? 'Unknown',
                    'count' => $item->count
                ];
            })->values();

        $ticketsByPriority = Ticket::select('priority_id', DB::raw('count(*) as count'))
            ->with('priority')
            ->groupBy('priority_id')
            ->get()
            ->map(function ($item) {
                return [
                    'priority' => $item->priority->name ?? 'Unknown',
                    'count' => $item->count
                ];
            })->values();

        $ticketsByCategory = Ticket::select('category_id', DB::raw('count(*) as count'))
            ->with('category')
            ->groupBy('category_id')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category->name ?? 'Unknown',
                    'count' => $item->count
                ];
            })->values();

        // Trend (Last 12 months)
        $ticketsTrend = Ticket::select(
            DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
            DB::raw('count(*) as count')
        )
            ->where('created_at', '>=', Carbon::now()->subMonths(12))
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => $item->month,
                    'count' => $item->count
                ];
            });

        // Recent Activities
        $recentTickets = Ticket::with(['status', 'priority', 'category', 'user'])
            ->latest()
            ->take(6)
            ->get()
            ->map(function ($ticket) {
                $uName = 'Unknown';
                if ($ticket->user) {
                    $uName = trim(($ticket->user->first_name ?? '') . ' ' . ($ticket->user->last_name ?? ''));
                    if (!$uName) $uName = $ticket->user->name ?? 'Unknown';
                }

                return [
                    'id' => $ticket->id,
                    'title' => $ticket->subject,
                    'uid' => $ticket->uid,
                    'user_name' => $uName,
                    'status' => $ticket->status->name ?? 'Unknown',
                    'priority' => $ticket->priority->name ?? 'Unknown',
                    'category' => $ticket->category->name ?? 'Unknown',
                    'created_at' => $ticket->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('dashboard', [
            'userName' => $userName,
            'metrics' => $metrics,
            'charts' => [
                'ticketsByStatus' => $ticketsByStatus,
                'ticketsByPriority' => $ticketsByPriority,
                'ticketsByCategory' => $ticketsByCategory,
                'ticketsTrend' => $ticketsTrend,
            ],
            'activities' => [
                'recentTickets' => $recentTickets
            ]
        ]);
    }
}
