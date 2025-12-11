<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\FcmToken;
use App\Models\PushNotification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

final class NotificationService
{
    public function __construct(
        private readonly FcmService $fcmService
    ) {}

    /**
     * Send notification to a specific user.
     *
     * @param int $userId
     * @param string $title
     * @param string $body
     * @param array<string, mixed> $data
     * @return void
     */
    public function sendToUser(int $userId, string $title, string $body, array $data = []): void
    {
        // Store notification in database
        $this->storeNotification($userId, $title, $body, $data);

        $tokens = FcmToken::where('user_id', $userId)->pluck('token')->toArray();

        if (empty($tokens)) {
            return;
        }

        $this->sendAndCleanup($tokens, $title, $body, $data);
    }

    /**
     * Send notification to multiple users.
     *
     * @param array<int> $userIds
     * @param string $title
     * @param string $body
     * @param array<string, mixed> $data
     * @return void
     */
    public function sendToUsers(array $userIds, string $title, string $body, array $data = []): void
    {
        if (empty($userIds)) {
            return;
        }

        // Store notifications in database for each user
        foreach ($userIds as $userId) {
            $this->storeNotification($userId, $title, $body, $data);
        }

        $tokens = FcmToken::whereIn('user_id', $userIds)->pluck('token')->toArray();

        if (empty($tokens)) {
            return;
        }

        $this->sendAndCleanup($tokens, $title, $body, $data);
    }

    /**
     * Send notification to users who have ANY of the specified permissions.
     *
     * @param array<string> $permissions
     * @param string $title
     * @param string $body
     * @param array<string, mixed> $data
     * @param int|null $excludeUserId User ID to exclude from notification
     * @return void
     */
    public function sendToUsersWithPermissions(
        array $permissions,
        string $title,
        string $body,
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

        $this->sendToUsers($userIds, $title, $body, $data);
    }

    /**
     * Send notification to users who have a specific role.
     *
     * @param string|array<string> $roles
     * @param string $title
     * @param string $body
     * @param array<string, mixed> $data
     * @param int|null $excludeUserId
     * @return void
     */
    public function sendToUsersWithRoles(
        string|array $roles,
        string $title,
        string $body,
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

        $this->sendToUsers($userIds, $title, $body, $data);
    }

    /**
     * Store notification in database.
     *
     * @param int $userId
     * @param string $title
     * @param string $body
     * @param array<string, mixed> $data
     * @return void
     */
    private function storeNotification(int $userId, string $title, string $body, array $data = []): void
    {
        try {
            PushNotification::create([
                'user_id' => $userId,
                'feature' => $data['type'] ?? 'general',
                'title' => $title,
                'body' => $body,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            Log::error('NotificationService: Failed to store notification in database', [
                'user_id' => $userId,
                'title' => $title,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send and cleanup invalid tokens.
     *
     * @param array<string> $tokens
     * @param string $title
     * @param string $body
     * @param array<string, mixed> $data
     * @return void
     */
    private function sendAndCleanup(array $tokens, string $title, string $body, array $data = []): void
    {
        if (!$this->fcmService->isConfigured()) {
            Log::warning('NotificationService: FCM is not configured, skipping notification', [
                'title' => $title,
            ]);
            return;
        }

        try {
            $result = $this->fcmService->sendToMany($tokens, $title, $body, $data);

            // Clean up invalid tokens
            if (!empty($result['invalid_tokens'])) {
                FcmToken::whereIn('token', $result['invalid_tokens'])->delete();
            }
        } catch (\Throwable $e) {
            Log::error('NotificationService: Failed to send notification', [
                'title' => $title,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

