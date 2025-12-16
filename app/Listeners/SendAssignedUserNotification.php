<?php

namespace App\Listeners;

use App\Events\AssignedUser;
use App\Mail\SendMailFromHtml;
use App\Models\EmailTemplate;
use App\Models\Ticket;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendAssignedUserNotification
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
    public function handle(AssignedUser $event): void
    {
        $ticketId = $event->ticketId;
        
        // Get email notification settings
        $notifications = app('App\AmanahSupport')->getSettingsEmailNotifications();
        
        // Check if user_assigned notification is enabled
        if (empty($notifications['user_assigned'])) {
            Log::info('SendAssignedUserNotification: user_assigned notification is disabled');
            return;
        }
        
        // Get ticket with relationships
        $ticket = Ticket::where('id', $ticketId)
            ->with(['user', 'ticketType', 'assignedTo'])
            ->first();
        
        if (!$ticket) {
            Log::warning('SendAssignedUserNotification: Ticket not found', ['ticket_id' => $ticketId]);
            return;
        }
        
        // Check if there's an assigned user with an email
        if (!$ticket->assignedTo || !$ticket->assignedTo->email) {
            Log::warning('SendAssignedUserNotification: No assigned user or email found', [
                'ticket_id' => $ticket->id,
            ]);
            return;
        }
        
        // Get the email template
        $template = EmailTemplate::where('slug', 'assigned_ticket')->first();
        
        if (!$template) {
            Log::warning("SendAssignedUserNotification: Email template 'assigned_ticket' not found");
            return;
        }
        
        // Send the notification email
        $this->sendMailWithTemplate($template, $ticket);
    }

    /**
     * Send email using the template with variable substitution.
     */
    private function sendMailWithTemplate(EmailTemplate $template, Ticket $ticket): void
    {
        $assignedUser = $ticket->assignedTo;
        $html = $template->html;
        
        // Build variables for template substitution
        $variables = [
            'name' => $assignedUser->name ?? $assignedUser->first_name ?? 'Dear',
            'email' => $assignedUser->email ?? '',
            'url' => config('app.url') . '/dashboard/tickets/' . $ticket->uid,
            'sender_name' => config('mail.from.name', 'Support'),
            'ticket_id' => (string) $ticket->id,
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
            'subject' => '[Ticket#' . $ticket->uid . '] - You got assigned',
        ];
        
        // Send email (queued or immediate based on config)
        try {
            if (config('queue.enable')) {
                Mail::to($assignedUser->email)->queue(new SendMailFromHtml($messageData));
            } else {
                Mail::to($assignedUser->email)->send(new SendMailFromHtml($messageData));
            }
            
            Log::info('SendAssignedUserNotification: Email sent successfully', [
                'ticket_id' => $ticket->id,
                'recipient' => $assignedUser->email,
            ]);
        } catch (\Exception $e) {
            Log::error('SendAssignedUserNotification: Failed to send email', [
                'ticket_id' => $ticket->id,
                'recipient' => $assignedUser->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
