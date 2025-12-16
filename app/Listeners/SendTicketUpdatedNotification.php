<?php

namespace App\Listeners;

use App\Events\TicketUpdated;
use App\Mail\SendMailFromHtml;
use App\Models\EmailTemplate;
use App\Models\Ticket;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendTicketUpdatedNotification
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(TicketUpdated $event): void
    {
        $ticketInfo = $event->data;
        
        // Get email notification settings
        $notifications = app('App\AmanahSupport')->getSettingsEmailNotifications();
        
        // Check if status_priority_changes notification is enabled
        if (empty($notifications['status_priority_changes'])) {
            Log::info('SendTicketUpdatedNotification: status_priority_changes notification is disabled');
            return;
        }
        
        // Get ticket with relationships
        $ticket = Ticket::where('id', $ticketInfo['ticket_id'] ?? null)
            ->with(['user', 'ticketType', 'assignedTo', 'priority', 'status', 'department', 'category'])
            ->first();
        
        if (!$ticket) {
            Log::warning('SendTicketUpdatedNotification: Ticket not found', ['data' => $ticketInfo]);
            return;
        }
        
        // Get the email template
        $template = EmailTemplate::where('slug', 'ticket_updated')->first();
        
        if (!$template) {
            Log::warning("SendTicketUpdatedNotification: Email template 'ticket_updated' not found");
            return;
        }
        
        $updateMessage = $ticketInfo['update_message'] ?? 'Ticket has been updated';
        
        // Send notification to ticket owner
        if ($ticket->user && $ticket->user->email) {
            $this->sendMailWithTemplate($template, $ticket, $ticket->user, $updateMessage);
        }
        
        // Send notification to assigned user (if different from owner)
        if ($ticket->assignedTo && $ticket->assignedTo->email) {
            // Avoid sending duplicate if assigned user is the same as owner
            if (!$ticket->user || $ticket->assignedTo->id !== $ticket->user->id) {
                $this->sendMailWithTemplate($template, $ticket, $ticket->assignedTo, $updateMessage);
            }
        }
    }

    /**
     * Send email using the template with variable substitution.
     */
    private function sendMailWithTemplate(EmailTemplate $template, Ticket $ticket, $user, string $updateMessage): void
    {
        $html = $template->html;
        
        // Build variables for template substitution
        $variables = [
            'name' => $user->name ?? $user->first_name ?? '',
            'email' => $user->email ?? '',
            'url' => config('app.url') . '/dashboard/tickets/' . $ticket->uid,
            'update_message' => $updateMessage,
            'sender_name' => config('mail.from.name', 'Support'),
            'ticket_id' => (string) $ticket->id,
            'priority' => $ticket->priority?->name ?? '',
            'status' => $ticket->status?->name ?? '',
            'department' => $ticket->department?->name ?? '',
            'category' => $ticket->category?->name ?? '',
            'uid' => $ticket->uid ?? '',
            'subject' => $ticket->subject ?? '',
            'type' => $ticket->ticketType?->name ?? '',
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
            'subject' => '[Ticket#' . $ticket->uid . '] - ' . $updateMessage,
        ];
        
        // Send email (queued or immediate based on config)
        try {
            if (config('queue.enable')) {
                Mail::to($user->email)->queue(new SendMailFromHtml($messageData));
            } else {
                Mail::to($user->email)->send(new SendMailFromHtml($messageData));
            }
            
            Log::info('SendTicketUpdatedNotification: Email sent successfully', [
                'ticket_id' => $ticket->id,
                'recipient' => $user->email,
            ]);
        } catch (\Exception $e) {
            Log::error('SendTicketUpdatedNotification: Failed to send email', [
                'ticket_id' => $ticket->id,
                'recipient' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
