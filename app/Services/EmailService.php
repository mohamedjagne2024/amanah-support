<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Settings;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

final class EmailService
{
    /**
     * Configure mail settings from database.
     */
    private function configureMail(): void
    {
        $settings = Settings::all()->pluck('value', 'name')->toArray();

        $emailType = $settings['email_type'] ?? 'smtp';
        $emailHost = $settings['email_host'] ?? null;
        $emailPort = $settings['email_port'] ?? null;
        $emailUsername = $settings['email_username'] ?? null;
        $emailPassword = $settings['email_password'] ?? null;
        $emailSecurity = $settings['email_security'] ?? 'tls';
        $emailFrom = $settings['email_from'] ?? null;
        $emailFromName = $settings['email_from_name'] ?? null;

        // Only configure if we have the minimum required settings (host and port)
        // Username, password, and encryption are optional for testing servers like Mailhog/Mailtrap
        if (!$emailHost || !$emailPort) {
            Log::warning('EmailService: Email settings are not fully configured (host and port required)');
            return;
        }

        // Configure mail dynamically
        Config::set('mail.default', $emailType);
        Config::set('mail.mailers.smtp.host', $emailHost);
        Config::set('mail.mailers.smtp.port', (int) $emailPort);

        // Credentials are optional (for testing servers like Mailhog that don't require auth)
        Config::set('mail.mailers.smtp.username', $emailUsername ?: null);
        Config::set('mail.mailers.smtp.password', $emailPassword ?: null);

        // Encryption is optional - set to null if empty or 'none' for testing servers
        $encryption = (!$emailSecurity || strtolower($emailSecurity) === 'none') ? null : $emailSecurity;
        Config::set('mail.mailers.smtp.encryption', $encryption);

        if ($emailFrom) {
            Config::set('mail.from.address', $emailFrom);
        }
        if ($emailFromName) {
            Config::set('mail.from.name', $emailFromName);
        }
    }

    /**
     * Check if email is configured.
     * Only requires host and port - credentials are optional for testing servers.
     */
    public function isConfigured(): bool
    {
        $settings = Settings::all()->pluck('value', 'name')->toArray();

        $emailHost = $settings['email_host'] ?? null;
        $emailPort = $settings['email_port'] ?? null;

        return !empty($emailHost) && !empty($emailPort);
    }

    /**
     * Send email to a specific user.
     *
     * @param int $userId
     * @param string $mailableClass
     * @param array<string, mixed> $data
     * @return void
     */
    public function sendToUser(int $userId, string $mailableClass, array $data = []): void
    {
        if (!$this->isConfigured()) {
            Log::warning('EmailService: Email is not configured, skipping email', [
                'user_id' => $userId,
                'mailable' => $mailableClass,
            ]);
            return;
        }

        $user = User::find($userId);
        if (!$user || !$user->email) {
            Log::warning('EmailService: User not found or has no email', [
                'user_id' => $userId,
            ]);
            return;
        }

        $this->configureMail();

        try {
            Mail::to($user->email)->send(new $mailableClass($data));
        } catch (\Throwable $e) {
            Log::error('EmailService: Failed to send email', [
                'user_id' => $userId,
                'email' => $user->email,
                'mailable' => $mailableClass,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send email to multiple users.
     *
     * @param array<int> $userIds
     * @param string $mailableClass
     * @param array<string, mixed> $data
     * @return void
     */
    public function sendToUsers(array $userIds, string $mailableClass, array $data = []): void
    {
        if (!$this->isConfigured()) {
            Log::warning('EmailService: Email is not configured, skipping emails', [
                'mailable' => $mailableClass,
            ]);
            return;
        }

        if (empty($userIds)) {
            return;
        }

        $users = User::whereIn('id', $userIds)
            ->whereNotNull('email')
            ->get();

        if ($users->isEmpty()) {
            Log::warning('EmailService: No users with emails found', [
                'user_ids' => $userIds,
            ]);
            return;
        }

        $this->configureMail();

        foreach ($users as $user) {
            try {
                Mail::to($user->email)->send(new $mailableClass($data));
            } catch (\Throwable $e) {
                Log::error('EmailService: Failed to send email', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'mailable' => $mailableClass,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Send email to users who have ANY of the specified permissions.
     *
     * @param array<string> $permissions
     * @param string $mailableClass
     * @param array<string, mixed> $data
     * @param int|null $excludeUserId User ID to exclude from email
     * @return void
     */
    public function sendToUsersWithPermissions(
        array $permissions,
        string $mailableClass,
        array $data = [],
        ?int $excludeUserId = null
    ): void {
        $userIds = User::query()
            ->permission($permissions)
            ->when($excludeUserId, fn($query) => $query->where('id', '!=', $excludeUserId))
            ->pluck('id')
            ->toArray();

        if (empty($userIds)) {
            return;
        }

        $this->sendToUsers($userIds, $mailableClass, $data);
    }

    /**
     * Send email to users who have a specific role.
     *
     * @param string|array<string> $roles
     * @param string $mailableClass
     * @param array<string, mixed> $data
     * @param int|null $excludeUserId
     * @return void
     */
    public function sendToUsersWithRoles(
        string|array $roles,
        string $mailableClass,
        array $data = [],
        ?int $excludeUserId = null
    ): void {
        $userIds = User::query()
            ->role($roles)
            ->when($excludeUserId, fn($query) => $query->where('id', '!=', $excludeUserId))
            ->pluck('id')
            ->toArray();

        if (empty($userIds)) {
            return;
        }

        $this->sendToUsers($userIds, $mailableClass, $data);
    }
}
