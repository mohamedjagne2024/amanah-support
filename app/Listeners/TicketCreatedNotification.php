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
            ->with(['user', 'ticketType'])
            ->first();
        
        if (!$ticket) {
            Log::warning('TicketCreatedNotification: Ticket not found', ['data' => $data]);
            return;
        }
        
        // Determine the source of ticket creation and corresponding notification type
        // - 'public_form' = customer submitted ticket (with or without being a new user)
        // - 'dashboard' = admin/staff created ticket from dashboard
        $source = $data['source'] ?? 'public_form';
        $isFromPublicForm = $source === 'public_form';
        
        $notificationKey = $isFromPublicForm ? 'ticket_by_customer' : 'ticket_from_dashboard';
        $templateSlug = $isFromPublicForm ? 'create_ticket_new_customer' : 'create_ticket_dashboard';
        
        // Check if this notification type is enabled
        if (empty($notifications[$notificationKey])) {
            Log::info("TicketCreatedNotification: {$notificationKey} notification is disabled");
            return;
        }
        
        // Get the recipient user
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
     * Send email using the template with variable substitution.
     */
    private function sendMailWithTemplate(EmailTemplate $template, Ticket $ticket, User $user, string $password = ''): void
    {
        $html = $template->html;
        
        // Build variables for template substitution
        $variables = [
            'name' => $user->name ?? '',
            'email' => $user->email ?? '',
            'password' => $password,
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
            'subject' => '[Ticket#' . $ticket->uid . '] - ' . $ticket->subject,
        ];
        
        // Send email (queued or immediate based on config)
        try {
            if (config('queue.enable')) {
                Mail::to($user->email)->queue(new SendMailFromHtml($messageData));
            } else {
                Mail::to($user->email)->send(new SendMailFromHtml($messageData));
            }
            
            Log::info('TicketCreatedNotification: Email sent successfully', [
                'ticket_id' => $ticket->id,
                'recipient' => $user->email,
            ]);
        } catch (\Exception $e) {
            Log::error('TicketCreatedNotification: Failed to send email', [
                'ticket_id' => $ticket->id,
                'recipient' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
