<?php

namespace App\Listeners;

use App\Events\ContactCreated;
use App\Mail\SendMailFromHtml;
use App\Models\EmailTemplate;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ContactCreatedNotification
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
    public function handle(ContactCreated $event): void
    {
        $data = $event->data;

        // Get user
        $user = User::find($data['id'] ?? null);

        if (!$user) {
            Log::warning('ContactCreatedNotification: User not found', ['data' => $data]);
            return;
        }

        if (!$user->email) {
            Log::warning('ContactCreatedNotification: User has no email', ['user_id' => $user->id]);
            return;
        }

        // Get the email template
        $template = EmailTemplate::where('slug', 'created_new_contact')->first();

        if (!$template) {
            Log::warning("ContactCreatedNotification: Email template 'created_new_contact' not found");
            return;
        }

        // Send the notification email
        $this->sendMailWithTemplate($template, $user, $data['password'] ?? '');
    }

    /**
     * Send email using the template with variable substitution.
     */
    private function sendMailWithTemplate(EmailTemplate $template, User $user, string $password): void
    {
        $html = $template->html;

        // Build variables for template substitution
        $variables = [
            'name' => $user->name ?? $user->first_name ?? '',
            'email' => $user->email ?? '',
            'password' => $password,
            'url' => config('app.url') . '/login',
            'sender_name' => config('mail.from.name', 'Support'),
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
            'subject' => 'Amanah Support - Your account has been created',
        ];

        // Send email (queued or immediate based on config)
        try {
            if (config('queue.enable')) {
                Mail::to($user->email)->queue(new SendMailFromHtml($messageData));
            } else {
                Mail::to($user->email)->send(new SendMailFromHtml($messageData));
            }

            Log::info('ContactCreatedNotification: Email sent successfully', [
                'user_id' => $user->id,
                'recipient' => $user->email,
            ]);
        } catch (\Exception $e) {
            Log::error('ContactCreatedNotification: Failed to send email', [
                'user_id' => $user->id,
                'recipient' => $user->email,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
