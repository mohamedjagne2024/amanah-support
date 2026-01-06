<?php

namespace App\Console\Commands;

use App\Mail\SendMailFromHtml;
use App\Models\EmailTemplate;
use App\Models\Settings;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendTicketEsclation extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tickets:check-escalation';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for tickets that have exceeded escalation time and send notifications to managers';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for tickets requiring escalation...');

        // Get the email template for escalation
        $template = EmailTemplate::where('slug', 'ticket_esclation')->first();

        if (!$template) {
            $this->error('Escalation email template not found. Please create a template with slug "ticket_esclation"');
            Log::error('SendTicketEsclation: Email template "ticket_esclation" not found');
            return 1;
        }

        // Get all open/pending tickets that haven't been escalated yet
        $tickets = Ticket::whereIn('status', ['open', 'pending'])
            ->whereNull('escalated_at') // Only tickets not yet escalated
            ->whereNotNull('escalate_value')
            ->whereNotNull('escalate_unit')
            ->whereNotNull('assigned_to')
            ->with(['assignedTo', 'contact', 'ticketType'])
            ->get();

        if ($tickets->isEmpty()) {
            $this->info('No tickets found requiring escalation check.');
            return 0;
        }

        $escalatedCount = 0;
        $now = Carbon::now();

        foreach ($tickets as $ticket) {
            // Calculate escalation deadline
            $createdAt = Carbon::parse($ticket->created_at);
            $escalateValue = $ticket->escalate_value;
            $escalateUnit = $ticket->escalate_unit;

            // Calculate deadline based on unit
            switch ($escalateUnit) {
                case 'minutes':
                    $deadline = $createdAt->copy()->addMinutes($escalateValue);
                    break;
                case 'hours':
                    $deadline = $createdAt->copy()->addHours($escalateValue);
                    break;
                case 'days':
                    $deadline = $createdAt->copy()->addDays($escalateValue);
                    break;
                default:
                    continue 2; // Skip this ticket if unit is invalid
            }

            // Check if deadline has passed
            if ($now->greaterThan($deadline)) {
                $this->info("Ticket #{$ticket->uid} has exceeded escalation time. Sending notification...");

                // Get the manager of the assigned user
                $assignedUser = $ticket->assignedTo;

                if (!$assignedUser) {
                    $this->warn("Ticket #{$ticket->uid} has no assigned user. Skipping.");
                    continue;
                }

                // Get manager - you might want to add a manager_id field to users table
                // For now, we'll get the first admin/manager role user
                $manager = $this->getManagerForUser($assignedUser);

                if (!$manager) {
                    $this->warn("No manager found for ticket #{$ticket->uid}. Skipping.");
                    Log::warning('SendTicketEsclation: No manager found', ['ticket_id' => $ticket->id]);
                    continue;
                }

                // Send escalation email
                $emailSent = $this->sendEscalationEmail($template, $ticket, $manager, $assignedUser, $createdAt, $deadline);

                if ($emailSent) {
                    // Mark ticket as escalated
                    $ticket->escalated_at = $now;
                    $ticket->save();

                    $escalatedCount++;
                    $this->info("✓ Escalation email sent for ticket #{$ticket->uid}");
                }
            }
        }

        $this->info("Escalation check complete. {$escalatedCount} escalation email(s) sent.");
        Log::info('SendTicketEsclation: Command completed', ['escalated_count' => $escalatedCount]);

        return 0;
    }

    /**
     * Get the manager for a given user.
     * This is a simple implementation - you might want to add a manager_id field to users.
     */
    private function getManagerForUser(User $user): ?User
    {
        // If user already has a manager_id field, use it
        // Otherwise, get first user with 'Manager' or 'Admin' role

        // Try to find a manager from settings
        $managerSetting = Settings::where('name', 'escalation_manager')->first();
        if ($managerSetting && $managerSetting->value) {
            $manager = User::find($managerSetting->value);
            if ($manager) {
                return $manager;
            }
        }

        // Fallback: Find first user with Manager role
        $manager = User::whereHas('roles', function ($query) {
            $query->where('name', 'Manager');
        })->first();

        if ($manager) {
            return $manager;
        }

        // Final fallback: Find first user with Admin role
        return User::whereHas('roles', function ($query) {
            $query->where('name', 'Admin');
        })->first();
    }

    /**
     * Send escalation email to the manager.
     */
    private function sendEscalationEmail(
        EmailTemplate $template,
        Ticket $ticket,
        User $manager,
        User $assignedUser,
        Carbon $createdAt,
        Carbon $deadline
    ): bool {
        $html = $template->html;

        // Calculate time elapsed
        $now = Carbon::now();
        $timeElapsed = $this->formatDuration($createdAt, $now);
        $escalationThreshold = $this->formatThreshold($ticket->escalate_value, $ticket->escalate_unit);

        // Build variables for template substitution
        $variables = [
            'name' => $manager->name ?? '',
            'uid' => $ticket->uid ?? '',
            'subject' => $ticket->subject ?? '',
            'contact' => $ticket->contact?->name ?? 'N/A',
            'assigned_to' => $assignedUser->name ?? '',
            'priority' => ucfirst($ticket->priority ?? 'Low'),
            'status' => ucfirst($ticket->status ?? 'Open'),
            'created_at' => $createdAt->format('M d, Y h:i A'),
            'time_elapsed' => $timeElapsed,
            'escalation_threshold' => $escalationThreshold,
            'url' => config('app.url') . '/tickets/' . $ticket->uid,
            'sender_name' => config('mail.from.name', 'Support System'),
        ];

        // Replace template variables
        if (preg_match_all("/{(.*?)}/", $html, $matches)) {
            foreach ($matches[1] as $index => $varname) {
                $value = $variables[$varname] ?? '';
                $html = str_replace($matches[0][$index], $value, $html);
            }
        }

        // Build message data
        $messageData = [
            'html' => $html,
            'subject' => '⚠️ URGENT: Ticket Escalation Required - #' . $ticket->uid,
        ];

        // Send email
        try {
            if (config('queue.enable')) {
                Mail::to($manager->email)->queue(new SendMailFromHtml($messageData));
            } else {
                Mail::to($manager->email)->send(new SendMailFromHtml($messageData));
            }

            Log::info('SendTicketEsclation: Escalation email sent', [
                'ticket_id' => $ticket->id,
                'ticket_uid' => $ticket->uid,
                'manager' => $manager->email,
                'assigned_to' => $assignedUser->email,
            ]);

            return true;
        } catch (\Exception $e) {
            $this->error("Failed to send escalation email for ticket #{$ticket->uid}: " . $e->getMessage());
            Log::error('SendTicketEsclation: Failed to send email', [
                'ticket_id' => $ticket->id,
                'ticket_uid' => $ticket->uid,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Format duration between two times.
     */
    private function formatDuration(Carbon $start, Carbon $end): string
    {
        $diff = $start->diff($end);

        $parts = [];

        if ($diff->d > 0) {
            $parts[] = $diff->d . ' day' . ($diff->d > 1 ? 's' : '');
        }
        if ($diff->h > 0) {
            $parts[] = $diff->h . ' hour' . ($diff->h > 1 ? 's' : '');
        }
        if ($diff->i > 0 && $diff->d == 0) { // Only show minutes if less than a day
            $parts[] = $diff->i . ' minute' . ($diff->i > 1 ? 's' : '');
        }

        return !empty($parts) ? implode(', ', $parts) : 'Less than a minute';
    }

    /**
     * Format the escalation threshold.
     */
    private function formatThreshold(int $value, string $unit): string
    {
        $unitLabel = $unit;
        if ($value == 1) {
            // Singularize
            $unitLabel = rtrim($unit, 's');
        }

        return "{$value} {$unitLabel}";
    }
}
