<?php

namespace App\Listeners;

use App\Events\TicketResolved;
use App\Mail\SendMailFromHtml;
use App\Models\EmailTemplate;
use App\Models\Settings;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class TicketResolvedNotification
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
    public function handle(TicketResolved $event): void
    {
        $data = $event->data;

        // Get email notification settings
        $notifications = app('App\AmanahSupport')->getSettingsEmailNotifications();

        // Get ticket with relationships
        $ticket = Ticket::where('id', $data['ticket_id'] ?? null)
            ->with(['user', 'ticketType', 'contact'])
            ->first();

        if (!$ticket) {
            Log::warning('TicketResolvedNotification: Ticket not found', ['data' => $data]);
            return;
        }

        // Check if ticket_resolved notification is enabled
        if (empty($notifications['ticket_resolved'])) {
            Log::info('TicketResolvedNotification: ticket_resolved notification is disabled');
            return;
        }

        // Get the contact user to notify
        $contactUser = $ticket->contact;

        if (!$contactUser) {
            Log::warning('TicketResolvedNotification: No contact user found for ticket', ['ticket_id' => $ticket->id]);
            return;
        }

        // Get the email template from database by slug
        $templateSlug = 'ticket_resolved';
        $template = EmailTemplate::where('slug', $templateSlug)->first();

        if (!$template) {
            Log::warning("TicketResolvedNotification: Email template '{$templateSlug}' not found");
            return;
        }

        // Send the notification email to contact user
        $this->sendMailWithTemplate($template, $ticket, $contactUser, $data['resolution_details'] ?? '');
    }

    /**
     * Send email using the template with variable substitution.
     * 
     * @param EmailTemplate $template The email template to use
     * @param Ticket $ticket The ticket object
     * @param User $recipient The user to send the email to
     * @param string $resolutionDetails The resolution details provided by support
     */
    private function sendMailWithTemplate(EmailTemplate $template, Ticket $ticket, User $recipient, string $resolutionDetails = ''): void
    {
        $html = $template->html;

        // Get auto-close settings
        $autocloseValue = Settings::where('name', 'autoclose_value')->first()?->value ?? '7';
        $autocloseUnit = Settings::where('name', 'autoclose_unit')->first()?->value ?? 'days';

        // Build variables for template substitution
        $variables = [
            'name' => $recipient->name ?? '',
            'email' => $recipient->email ?? '',
            'url' => config('app.url') . '/contact/tickets/' . $ticket->uid,
            'sender_name' => config('mail.from.name', 'Amanah Support'),
            'ticket_id' => (string) $ticket->id,
            'uid' => $ticket->uid ?? '',
            'subject' => $ticket->subject ?? '',
            'type' => $ticket->ticketType?->name ?? '',
            'autoclose_value' => $autocloseValue,
            'autoclose_unit' => $autocloseUnit,
            'resolution_details' => $resolutionDetails,
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
            'subject' => '[Ticket#' . $ticket->uid . '] - Your ticket has been resolved',
        ];

        // Send email to the contact user
        try {
            if (config('queue.enable')) {
                Mail::to($recipient->email)->queue(new SendMailFromHtml($messageData));
            } else {
                Mail::to($recipient->email)->send(new SendMailFromHtml($messageData));
            }

            Log::info('TicketResolvedNotification: Email sent successfully', [
                'ticket_id' => $ticket->id,
                'recipient' => $recipient->email,
            ]);
        } catch (\Exception $e) {
            Log::error('TicketResolvedNotification: Failed to send email', [
                'ticket_id' => $ticket->id,
                'recipient' => $recipient->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
