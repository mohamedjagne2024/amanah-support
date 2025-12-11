<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FcmToken;
use App\Services\FcmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class NotificationTestController extends Controller
{
    public function __construct(
        private readonly FcmService $fcmService
    ) {}

    /**
     * Broadcast a test notification to all registered FCM tokens.
     */
    public function broadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:1000'],
            'data' => ['nullable', 'array'],
        ]);

        $title = $validated['title'] ?? 'Test Notification';
        $body = $validated['body'] ?? 'This is a broadcast test notification from Amanah Assets.';
        $data = $validated['data'] ?? [];

        $tokens = FcmToken::pluck('token')->toArray();

        if (empty($tokens)) {
            return response()->json([
                'status' => 'warning',
                'message' => 'No FCM tokens found to broadcast to.',
                'tokens_count' => 0,
            ]);
        }

        $result = $this->fcmService->sendToMany($tokens, $title, $body, $data);

        // Clean up invalid tokens if any were detected
        if (!empty($result['invalid_tokens'])) {
            FcmToken::whereIn('token', $result['invalid_tokens'])->delete();
        }

        return response()->json([
            'status' => $result['success'] ? 'ok' : 'partial',
            'message' => 'Broadcast notification sent.',
            'tokens_count' => count($tokens),
            'sent' => $result['sent'] ?? 0,
            'failed' => $result['failed'] ?? 0,
            'invalid_tokens_removed' => count($result['invalid_tokens'] ?? []),
        ]);
    }

    /**
     * Send a test notification to a specific user by user ID.
     */
    public function toUser(Request $request, int $userId): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:1000'],
            'data' => ['nullable', 'array'],
        ]);

        $title = $validated['title'] ?? 'Test Notification';
        $body = $validated['body'] ?? 'This is a test notification for you.';
        $data = $validated['data'] ?? [];

        $tokens = FcmToken::where('user_id', $userId)->pluck('token')->toArray();

        if (empty($tokens)) {
            return response()->json([
                'status' => 'warning',
                'message' => "No FCM tokens found for user ID: {$userId}.",
                'tokens_count' => 0,
            ]);
        }

        $result = $this->fcmService->sendToMany($tokens, $title, $body, $data);

        // Clean up invalid tokens
        if (!empty($result['invalid_tokens'])) {
            FcmToken::whereIn('token', $result['invalid_tokens'])->delete();
        }

        return response()->json([
            'status' => $result['success'] ? 'ok' : 'partial',
            'message' => "Notification sent to user ID: {$userId}.",
            'tokens_count' => count($tokens),
            'sent' => $result['sent'] ?? 0,
            'failed' => $result['failed'] ?? 0,
        ]);
    }

    /**
     * Send a test notification to the currently authenticated user.
     */
    public function toSelf(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not authenticated.',
            ], 401);
        }

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['nullable', 'string', 'max:1000'],
            'data' => ['nullable', 'array'],
        ]);

        $title = $validated['title'] ?? 'Test Notification';
        $body = $validated['body'] ?? 'This is a test notification for you.';
        $data = $validated['data'] ?? [];

        $tokens = FcmToken::where('user_id', $user->id)->pluck('token')->toArray();

        if (empty($tokens)) {
            return response()->json([
                'status' => 'warning',
                'message' => 'No FCM tokens found for your account.',
                'tokens_count' => 0,
            ]);
        }

        $result = $this->fcmService->sendToMany($tokens, $title, $body, $data);

        // Clean up invalid tokens
        if (!empty($result['invalid_tokens'])) {
            FcmToken::whereIn('token', $result['invalid_tokens'])->delete();
        }

        return response()->json([
            'status' => $result['success'] ? 'ok' : 'partial',
            'message' => 'Test notification sent to your devices.',
            'tokens_count' => count($tokens),
            'sent' => $result['sent'] ?? 0,
            'failed' => $result['failed'] ?? 0,
        ]);
    }

    /**
     * Check if FCM is properly configured.
     */
    public function status(): JsonResponse
    {
        $isConfigured = $this->fcmService->isConfigured();
        $tokenCount = FcmToken::count();

        return response()->json([
            'status' => 'ok',
            'fcm_configured' => $isConfigured,
            'total_tokens' => $tokenCount,
            'configuration_method' => 'Firebase Admin SDK (Service Account)',
            'service_account_path' => $isConfigured
                ? 'storage/app/firebase/service-account.json'
                : 'NOT FOUND - Please add your service account JSON file',
        ]);
    }
}
