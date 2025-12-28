<?php

namespace App\Listeners;

use App\Events\TicketCreated;
use App\Mail\SendMailFromHtml;
use App\Models\EmailTemplate;
use App\Models\Settings;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class TicketCreatedNotification
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
    public function handle(TicketCreated $event): void
    {
        $data = $event->data;

        // Get email notification settings
        $notifications = app('App\AmanahSupport')->getSettingsEmailNotifications();

        // Get ticket with relationships
        $ticket = Ticket::where('id', $data['ticket_id'] ?? null)
            ->with(['user', 'ticketType', 'contact'])
            ->first();

        if (!$ticket) {
            Log::warning('TicketCreatedNotification: Ticket not found', ['data' => $data]);
            return;
        }

        // Determine the source of ticket creation and corresponding notification type
        // - 'contact' = ticket submitted by a logged-in contact user from the contact portal
        // - 'dashboard' = ticket created by admin/staff from the dashboard
        $source = $data['source'] ?? 'dashboard';
        $isFromContact = $source === 'contact';

        $notificationKey = $isFromContact ? 'ticket_by_contact' : 'ticket_from_dashboard';
        $templateSlug = 'create_ticket_dashboard';

        // Check if this notification type is enabled
        if (empty($notifications[$notificationKey])) {
            Log::info("TicketCreatedNotification: {$notificationKey} notification is disabled");
            return;
        }

        // For contact-created tickets, send email to admin only
        // For other sources, use the standard recipient logic
        if ($source === 'contact') {
            // Get admin user to receive the notification
            $adminUser = $this->getAdminRecipient();

            if (!$adminUser) {
                Log::warning('TicketCreatedNotification: No admin recipient found', ['ticket_id' => $ticket->id]);
                return;
            }

            // Get the email template
            $template = EmailTemplate::where('slug', $templateSlug)->first();

            if (!$template) {
                Log::warning("TicketCreatedNotification: Email template '{$templateSlug}' not found");
                return;
            }

            // Get contact user info from ticket->contact for template variables
            $contactUser = $ticket->contact;

            // Send the notification email to admin with contact user info
            $this->sendMailWithTemplate($template, $ticket, $adminUser, $data['password'] ?? '', $contactUser);
        } else {
            // Get the recipient user (standard logic)
            $user = $this->getRecipientUser($ticket, $data);

            if (!$user) {
                Log::warning('TicketCreatedNotification: No recipient user found', ['ticket_id' => $ticket->id]);
                return;
            }

            // Get the email template
            $template = EmailTemplate::where('slug', $templateSlug)->first();

            if (!$template) {
                Log::warning("TicketCreatedNotification: Email template '{$templateSlug}' not found");
                return;
            }

            // Send the notification email
            $this->sendMailWithTemplate($template, $ticket, $user, $data['password'] ?? '');
        }
    }

    /**
     * Get the recipient user for the notification.
     */
    private function getRecipientUser(Ticket $ticket, array $data): ?User
    {
        // First, try to use the ticket's user
        if ($ticket->user) {
            return $ticket->user;
        }

        // If no ticket user, try to get from the default recipient setting
        $defaultRecipientSetting = Settings::where('name', 'default_recipient')->first();

        if ($defaultRecipientSetting && $defaultRecipientSetting->value) {
            $user = User::find($defaultRecipientSetting->value);
            if ($user) {
                return $user;
            }
        }

        // Fallback to first user in the system
        return User::orderBy('id')->first();
    }

    /**
     * Get the admin recipient for contact-created ticket notifications.
     */
    private function getAdminRecipient(): ?User
    {
        // First, try to get from the default recipient setting
        $defaultRecipientSetting = Settings::where('name', 'default_recipient')->first();

        if ($defaultRecipientSetting && $defaultRecipientSetting->value) {
            $user = User::find($defaultRecipientSetting->value);
            if ($user) {
                return $user;
            }
        }

        // Fallback to first admin user in the system
        return User::orderBy('id')->first();
    }

    /**
     * Send email using the template with variable substitution.
     * 
     * @param EmailTemplate $template The email template to use
     * @param Ticket $ticket The ticket object
     * @param User $recipient The user to send the email to
     * @param string $password Optional password for new user notifications
     * @param User|null $contactUser Optional contact user whose info will be used in template variables
     */
    private function sendMailWithTemplate(EmailTemplate $template, Ticket $ticket, User $recipient, string $password = '', ?User $contactUser = null): void
    {
        $html = $template->html;

        // Use contact user info for template variables if provided, otherwise use recipient info
        $templateUser = $contactUser ?? $recipient;

        // Build variables for template substitution
        $variables = [
            'name' => $templateUser->name ?? '',
            'email' => $templateUser->email ?? '',
            'password' => $password,
            'url' => config('app.url') . '/dashboard/tickets/' . $ticket->uid,
            'sender_name' => config('mail.from.name', 'Support'),
            'ticket_id' => (string) $ticket->id,
            'uid' => $ticket->uid ?? '',
            'subject' => $ticket->subject ?? '',
            'type' => $ticket->ticketType?->name ?? '',
            // Additional contact info for admin notifications
            'contact_name' => $contactUser?->name ?? '',
            'contact_email' => $contactUser?->email ?? '',
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
            'subject' => '[Ticket#' . $ticket->uid . '] - ' . $ticket->subject,
        ];

        // Send email to the recipient (not the contact user)
        try {
            if (config('queue.enable')) {
                Mail::to($recipient->email)->queue(new SendMailFromHtml($messageData));
            } else {
                Mail::to($recipient->email)->send(new SendMailFromHtml($messageData));
            }

            Log::info('TicketCreatedNotification: Email sent successfully', [
                'ticket_id' => $ticket->id,
                'recipient' => $recipient->email,
                'contact_user' => $contactUser?->email ?? 'N/A',
            ]);
        } catch (\Exception $e) {
            Log::error('TicketCreatedNotification: Failed to send email', [
                'ticket_id' => $ticket->id,
                'recipient' => $recipient->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
