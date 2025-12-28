<?php

namespace App\Listeners;

use App\Events\TicketNewComment;
use App\Mail\SendMailFromHtml;
use App\Models\EmailTemplate;
use App\Models\Ticket;
use App\Models\User;
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
     * 
     * Sends reply email notification when a comment is added:
     * - If support team member comments -> notify the contact
     * - If contact comments -> notify assigned user and/or admin
     */
    public function handle(TicketNewComment $event): void
    {
        // Map event format to data array
        $data = [
            'ticket_id' => $event->ticketId,
            'ticket_uid' => $event->ticketUid,
            'comment' => $event->comment['details'] ?? '',
            'commenter_id' => $event->comment['user']['id'] ?? null,
            'commenter_name' => $event->comment['user']['name'] ?? 'Support Team',
        ];

        // Get email notification settings
        $notifications = app('App\AmanahSupport')->getSettingsEmailNotifications();

        // Check if comment_reply notification is enabled (fallback to first_comment for backward compatibility)
        $isEnabled = !empty($notifications['comment_reply']) || !empty($notifications['first_comment']);
        if (!$isEnabled) {
            Log::info('SendTicketNewCommentNotification: Comment reply notification is disabled');
            return;
        }

        // Get ticket with relationships
        $ticket = Ticket::where('id', $data['ticket_id'] ?? null)
            ->with(['contact', 'assignedTo', 'user'])
            ->first();

        if (!$ticket) {
            Log::warning('SendTicketNewCommentNotification: Ticket not found', ['data' => $data]);
            return;
        }

        // Get the email template for comment reply
        $template = EmailTemplate::where('slug', 'ticket_new_comment')->first();

        if (!$template) {
            Log::warning("SendTicketNewCommentNotification: Email template 'ticket_new_comment' not found");
            return;
        }

        $comment = $data['comment'] ?? '';
        $commenterId = $data['commenter_id'];
        $commenterName = $data['commenter_name'];

        // Determine who posted the comment and send to appropriate recipients
        $isContactComment = $ticket->contact_id && $commenterId == $ticket->contact_id;

        if ($isContactComment) {
            // Contact posted the comment -> notify support team (assigned user and/or admins)
            $this->notifySupportTeam($template, $ticket, $comment, $commenterName);
        } else {
            // Support team member posted the comment -> notify the contact
            $this->notifyContact($template, $ticket, $comment, $commenterName);
        }
    }

    /**
     * Notify the contact when support team replies.
     */
    private function notifyContact(EmailTemplate $template, Ticket $ticket, string $comment, string $commenterName): void
    {
        // Get the contact associated with the ticket
        $contact = $ticket->contact;

        if (!$contact || !$contact->email) {
            Log::info('SendTicketNewCommentNotification: No contact email found for ticket', [
                'ticket_id' => $ticket->id,
            ]);
            return;
        }

        // Determine the URL for contact portal vs dashboard
        $url = config('app.url') . '/contact/tickets/' . $ticket->uid;

        $this->sendMailWithTemplate($template, $ticket, $contact, $comment, $commenterName, $url);
    }

    /**
     * Notify the support team when contact replies.
     */
    private function notifySupportTeam(EmailTemplate $template, Ticket $ticket, string $comment, string $commenterName): void
    {
        $recipientsSent = [];

        // Send notification to assigned user first
        if ($ticket->assignedTo && $ticket->assignedTo->email) {
            $url = config('app.url') . '/tickets/' . $ticket->uid;
            $this->sendMailWithTemplate($template, $ticket, $ticket->assignedTo, $comment, $commenterName, $url);
            $recipientsSent[] = $ticket->assignedTo->id;
        }

        // Also send notification to ticket creator (user) if different from assigned
        if ($ticket->user && $ticket->user->email) {
            if (!in_array($ticket->user->id, $recipientsSent)) {
                $url = config('app.url') . '/tickets/' . $ticket->uid;
                $this->sendMailWithTemplate($template, $ticket, $ticket->user, $comment, $commenterName, $url);
            }
        }

        // If no assigned user and no ticket user, notify admins
        if (empty($recipientsSent) && (!$ticket->user || !$ticket->user->email)) {
            $admins = User::role('Admin')->get();
            foreach ($admins as $admin) {
                if ($admin->email && !in_array($admin->id, $recipientsSent)) {
                    $url = config('app.url') . '/tickets/' . $ticket->uid;
                    $this->sendMailWithTemplate($template, $ticket, $admin, $comment, $commenterName, $url);
                    $recipientsSent[] = $admin->id;
                }
            }
        }
    }

    /**
     * Send email using the template with variable substitution.
     */
    private function sendMailWithTemplate(EmailTemplate $template, Ticket $ticket, $user, string $comment, string $commenterName, string $url): void
    {
        $html = $template->html;

        // Build variables for template substitution
        $variables = [
            'name' => $user->name ?? $user->first_name ?? '',
            'email' => $user->email ?? '',
            'comment' => $comment,
            'url' => $url,
            'sender_name' => config('mail.from.name', 'Support'),
            'uid' => $ticket->uid ?? '',
            'subject' => $ticket->subject ?? '',
            'commenter_name' => $commenterName,
        ];

        // Replace template variables
        if (preg_match_all("/{(.*?)}/", $html, $matches)) {
            foreach ($matches[1] as $index => $varname) {
                $value = $variables[$varname] ?? '';
                $html = str_replace($matches[0][$index], $value, $html);
            }
        }

        // Build message data - use "Re:" prefix to indicate it's a reply
        $messageData = [
            'html' => $html,
            'subject' => 'Re: [Ticket#' . $ticket->uid . '] ' . ($ticket->subject ?? 'Ticket Reply'),
        ];

        // Send email (queued or immediate based on config)
        try {
            if (config('queue.enable')) {
                Mail::to($user->email)->queue(new SendMailFromHtml($messageData));
            } else {
                Mail::to($user->email)->send(new SendMailFromHtml($messageData));
            }

            Log::info('SendTicketNewCommentNotification: Reply email sent successfully', [
                'ticket_id' => $ticket->id,
                'ticket_uid' => $ticket->uid,
                'recipient' => $user->email,
                'commenter' => $commenterName,
            ]);
        } catch (\Exception $e) {
            Log::error('SendTicketNewCommentNotification: Failed to send reply email', [
                'ticket_id' => $ticket->id,
                'recipient' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
