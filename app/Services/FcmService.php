<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Exception\FirebaseException;
use Kreait\Firebase\Exception\MessagingException;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Laravel\Firebase\Facades\Firebase;
use RuntimeException;

final class FcmService
{
    private const MAX_TOKENS_PER_REQUEST = 500;

    private ?Messaging $messaging = null;

    public function __construct()
    {
        try {
            $this->messaging = Firebase::messaging();
        } catch (\Throwable $e) {
            Log::warning('Firebase Messaging not configured: ' . $e->getMessage());
        }
    }

    /**
     * Send a notification to a single FCM token.
     *
     * @param string $token FCM device token
     * @param string $title Notification title
     * @param string $body Notification body
     * @param array<string, mixed> $data Additional data payload
     * @return array<string, mixed> FCM response
     *
     * @throws RuntimeException If Firebase is not configured
     */
    public function sendToToken(string $token, string $title, string $body, array $data = []): array
    {
        $this->ensureMessagingIsConfigured();

        try {
            $message = $this->createMessage($title, $body, $data)
                ->withChangedTarget('token', $token);

            $result = $this->messaging->send($message);

            return [
                'success' => true,
                'message_id' => $result,
            ];
        } catch (MessagingException $e) {
            Log::error('FCM messaging error', [
                'message' => $e->getMessage(),
                'token' => substr($token, 0, 20) . '...',
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        } catch (FirebaseException $e) {
            Log::error('Firebase error', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send a notification to multiple FCM tokens.
     *
     * @param array<int, string> $tokens Array of FCM device tokens
     * @param string $title Notification title
     * @param string $body Notification body
     * @param array<string, mixed> $data Additional data payload
     * @return array<string, mixed> Aggregated FCM responses
     *
     * @throws RuntimeException If Firebase is not configured
     */
    public function sendToMany(array $tokens, string $title, string $body, array $data = []): array
    {
        $this->ensureMessagingIsConfigured();

        if (empty($tokens)) {
            return [
                'success' => true,
                'sent' => 0,
                'failed' => 0,
                'responses' => [],
            ];
        }

        $responses = [];
        $totalSuccess = 0;
        $totalFailed = 0;
        $invalidTokens = [];

        // Process tokens in chunks
        $chunks = array_chunk($tokens, self::MAX_TOKENS_PER_REQUEST);

        foreach ($chunks as $chunk) {
            try {
                $message = $this->createMessage($title, $body, $data);
                $report = $this->messaging->sendMulticast($message, $chunk);

                $totalSuccess += $report->successes()->count();
                $totalFailed += $report->failures()->count();

                // Collect invalid tokens for cleanup
                foreach ($report->failures()->getItems() as $failure) {
                    $target = $failure->target();
                    if ($target && $target->type() === 'token') {
                        $error = $failure->error();
                        if ($error && in_array($error->getMessage(), [
                            'UNREGISTERED',
                            'INVALID_ARGUMENT',
                            'NOT_FOUND',
                        ], true)) {
                            $invalidTokens[] = $target->value();
                        }
                    }
                }

                $responses[] = [
                    'success_count' => $report->successes()->count(),
                    'failure_count' => $report->failures()->count(),
                ];
            } catch (MessagingException $e) {
                Log::error('FCM multicast error', [
                    'message' => $e->getMessage(),
                    'tokens_count' => count($chunk),
                ]);

                $totalFailed += count($chunk);
                $responses[] = [
                    'error' => $e->getMessage(),
                    'tokens_count' => count($chunk),
                ];
            }
        }

        return [
            'success' => $totalFailed === 0,
            'sent' => $totalSuccess,
            'failed' => $totalFailed,
            'invalid_tokens' => $invalidTokens,
            'responses' => $responses,
        ];
    }

    /**
     * Send a notification to a topic.
     *
     * @param string $topic Topic name
     * @param string $title Notification title
     * @param string $body Notification body
     * @param array<string, mixed> $data Additional data payload
     * @return array<string, mixed> FCM response
     */
    public function sendToTopic(string $topic, string $title, string $body, array $data = []): array
    {
        $this->ensureMessagingIsConfigured();

        try {
            $message = $this->createMessage($title, $body, $data)
                ->withChangedTarget('topic', $topic);

            $result = $this->messaging->send($message);

            return [
                'success' => true,
                'message_id' => $result,
            ];
        } catch (MessagingException | FirebaseException $e) {
            Log::error('FCM topic notification error', [
                'topic' => $topic,
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Subscribe tokens to a topic.
     *
     * @param array<int, string> $tokens
     * @param string $topic
     * @return array<string, mixed>
     */
    public function subscribeToTopic(array $tokens, string $topic): array
    {
        $this->ensureMessagingIsConfigured();

        try {
            $result = $this->messaging->subscribeToTopic($topic, $tokens);

            return [
                'success' => true,
                'success_count' => $result->successes()->count(),
                'failure_count' => $result->failures()->count(),
            ];
        } catch (MessagingException | FirebaseException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Unsubscribe tokens from a topic.
     *
     * @param array<int, string> $tokens
     * @param string $topic
     * @return array<string, mixed>
     */
    public function unsubscribeFromTopic(array $tokens, string $topic): array
    {
        $this->ensureMessagingIsConfigured();

        try {
            $result = $this->messaging->unsubscribeFromTopic($topic, $tokens);

            return [
                'success' => true,
                'success_count' => $result->successes()->count(),
                'failure_count' => $result->failures()->count(),
            ];
        } catch (MessagingException | FirebaseException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Validate an FCM token.
     *
     * @param string $token
     * @return bool
     */
    public function validateToken(string $token): bool
    {
        if (!$this->messaging) {
            return false;
        }

        try {
            // Send a dry-run message to validate the token
            $message = CloudMessage::new()->withChangedTarget('token', $token);
            $this->messaging->send($message, true); // validateOnly = true

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Create a CloudMessage with data payload only (no notification field).
     * This prevents duplicate notifications - service worker will handle display.
     *
     * @param string $title
     * @param string $body
     * @param array<string, mixed> $data
     * @return CloudMessage
     */
    private function createMessage(string $title, string $body, array $data = []): CloudMessage
    {
        // Include title and body in data payload for service worker
        // Don't use notification field to avoid duplicate notifications
        $dataWithNotification = array_merge([
            'title' => $title,
            'body' => $body,
        ], $data);

        // FCM data must be string key-value pairs
        $stringData = array_map(
            fn($value) => is_string($value) ? $value : json_encode($value),
            $dataWithNotification
        );

        // Send data-only message - service worker will handle notification display
        $message = CloudMessage::new()
            ->withData($stringData);

        return $message;
    }

    /**
     * Ensure Firebase Messaging is configured.
     *
     * @throws RuntimeException
     */
    private function ensureMessagingIsConfigured(): void
    {
        if (!$this->messaging) {
            throw new RuntimeException(
                'Firebase Messaging is not configured. ' .
                'Please ensure your service account JSON file is placed at: storage/app/firebase/service-account.json'
            );
        }
    }

    /**
     * Check if Firebase Messaging is properly configured.
     */
    public function isConfigured(): bool
    {
        return $this->messaging !== null;
    }
}
