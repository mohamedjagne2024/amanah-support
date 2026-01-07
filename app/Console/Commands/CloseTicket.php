<?php

namespace App\Console\Commands;

use App\Models\Settings;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CloseTicket extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tickets:auto-close';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically close tickets that have been resolved and exceeded the autoclose time';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for resolved tickets to auto-close...');

        // Get autoclose settings from database
        $autocloseValue = Settings::where('name', 'autoclose_value')->first()?->value;
        $autocloseUnit = Settings::where('name', 'autoclose_unit')->first()?->value;

        if (!$autocloseValue || !$autocloseUnit) {
            $this->warn('Autoclose settings not configured. Please set autoclose_value and autoclose_unit in settings.');
            Log::warning('CloseTicket: Autoclose settings not configured');
            return 1;
        }

        $autocloseValue = (int) $autocloseValue;

        $this->info("Autoclose setting: {$autocloseValue} {$autocloseUnit}");

        // Get all resolved tickets that have a resolve timestamp
        $tickets = Ticket::where('status', 'resolved')
            ->whereNotNull('resolve')
            ->with(['contact', 'assignedTo'])
            ->get();

        if ($tickets->isEmpty()) {
            $this->info('No resolved tickets found to check for auto-close.');
            return 0;
        }

        $closedCount = 0;
        $now = Carbon::now();

        foreach ($tickets as $ticket) {
            // Calculate the deadline for auto-close based on resolve timestamp
            $resolvedAt = Carbon::parse($ticket->resolve);

            // Calculate deadline based on unit
            switch ($autocloseUnit) {
                case 'minutes':
                    $deadline = $resolvedAt->copy()->addMinutes($autocloseValue);
                    break;
                case 'hours':
                    $deadline = $resolvedAt->copy()->addHours($autocloseValue);
                    break;
                case 'days':
                    $deadline = $resolvedAt->copy()->addDays($autocloseValue);
                    break;
                default:
                    $this->warn("Invalid autoclose_unit: {$autocloseUnit}. Skipping ticket #{$ticket->uid}");
                    continue 2; // Skip this ticket if unit is invalid
            }

            // Check if deadline has passed
            if ($now->greaterThan($deadline)) {
                $this->info("Ticket #{$ticket->uid} has exceeded autoclose time. Closing ticket...");

                // Update ticket status to closed
                $ticket->update([
                    'status' => 'closed',
                    'close' => $now,
                ]);

                $closedCount++;
                $this->info("✓ Ticket #{$ticket->uid} has been closed.");

                Log::info('CloseTicket: Ticket auto-closed', [
                    'ticket_id' => $ticket->id,
                    'ticket_uid' => $ticket->uid,
                    'resolved_at' => $resolvedAt->toDateTimeString(),
                    'closed_at' => $now->toDateTimeString(),
                    'autoclose_value' => $autocloseValue,
                    'autoclose_unit' => $autocloseUnit,
                ]);
            } else {
                $remaining = $now->diff($deadline);
                $this->line("Ticket #{$ticket->uid} - Resolved at {$resolvedAt->format('M d, Y H:i')}, will auto-close in " . $this->formatDuration($remaining));
            }
        }

        $this->info("Auto-close check complete. {$closedCount} ticket(s) closed.");
        Log::info('CloseTicket: Command completed', ['closed_count' => $closedCount]);

        return 0;
    }

    /**
     * Format duration for display.
     */
    private function formatDuration(\DateInterval $diff): string
    {
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

        return !empty($parts) ? implode(', ', $parts) : 'less than a minute';
    }
}
