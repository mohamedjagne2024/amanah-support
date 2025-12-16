<?php

namespace App\Listeners;

use App\Events\TicketNewComment;
use App\Mail\SendMailFromHtml;
use App\Models\EmailTemplate;
use App\Models\Ticket;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendTicketNewCommentNotification
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
    public function handle(TicketNewComment $event): void
    {
        $data = $event->data;
        
        // Get email notification settings
        $notifications = app('App\AmanahSupport')->getSettingsEmailNotifications();
        
        // Check if first_comment notification is enabled
        if (empty($notifications['first_comment'])) {
            Log::info('SendTicketNewCommentNotification: first_comment notification is disabled');
            return;
        }
        
        // Get ticket with relationships
        $ticket = Ticket::where('id', $data['ticket_id'] ?? null)
            ->with(['user', 'assignedTo', 'comments'])
            ->first();
        
        if (!$ticket) {
            Log::warning('SendTicketNewCommentNotification: Ticket not found', ['data' => $data]);
            return;
        }
        
        // Get the email template
        $template = EmailTemplate::where('slug', 'ticket_new_comment')->first();
        
        if (!$template) {
            Log::warning("SendTicketNewCommentNotification: Email template 'ticket_new_comment' not found");
            return;
        }
        
        $comment = $data['comment'] ?? '';
        
        // Send notification to ticket owner
        if ($ticket->user && $ticket->user->email) {
            $this->sendMailWithTemplate($template, $ticket, $ticket->user, $comment);
        }
        
        // Send notification to assigned user (if different from owner)
        if ($ticket->assignedTo && $ticket->assignedTo->email) {
            // Avoid sending duplicate if assigned user is the same as owner
            if (!$ticket->user || $ticket->assignedTo->id !== $ticket->user->id) {
                $this->sendMailWithTemplate($template, $ticket, $ticket->assignedTo, $comment);
            }
        }
    }

    /**
     * Send email using the template with variable substitution.
     */
    private function sendMailWithTemplate(EmailTemplate $template, Ticket $ticket, $user, string $comment): void
    {
        $html = $template->html;
        
        // Build variables for template substitution
        $variables = [
            'name' => $user->name ?? $user->first_name ?? '',
            'email' => $user->email ?? '',
            'comment' => $comment,
            'url' => config('app.url') . '/dashboard/tickets/' . $ticket->uid,
            'sender_name' => config('mail.from.name', 'Support'),
            'uid' => $ticket->uid ?? '',
            'subject' => $ticket->subject ?? '',
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
            'subject' => '[Ticket#' . $ticket->uid . '] - A new comment',
        ];
        
        // Send email (queued or immediate based on config)
        try {
            if (config('queue.enable')) {
                Mail::to($user->email)->queue(new SendMailFromHtml($messageData));
            } else {
                Mail::to($user->email)->send(new SendMailFromHtml($messageData));
            }
            
            Log::info('SendTicketNewCommentNotification: Email sent successfully', [
                'ticket_id' => $ticket->id,
                'recipient' => $user->email,
            ]);
        } catch (\Exception $e) {
            Log::error('SendTicketNewCommentNotification: Failed to send email', [
                'ticket_id' => $ticket->id,
                'recipient' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
