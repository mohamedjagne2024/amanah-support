<?php

namespace App\Events;

use App\Models\Settings;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketNewComment implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $ticketId;
    public $ticketUid;
    public $comment;

    /**
     * Create a new event instance.
     */
    public function __construct($ticketId, $ticketUid, $comment)
    {
        $this->ticketId = $ticketId;
        $this->ticketUid = $ticketUid;
        $this->comment = $comment;

        $this->configurePusher();
    }

    /**
     * Configure Pusher from database settings.
     */
    protected function configurePusher(): void
    {
        try {
            $appId = Settings::get('pusher_app_id');
            $appKey = Settings::get('pusher_app_key');
            $appSecret = Settings::get('pusher_app_secret');
            $appCluster = Settings::get('pusher_app_cluster');

            if ($appId && $appKey && $appSecret && $appCluster) {
                config([
                    'broadcasting.default' => 'pusher',
                    'broadcasting.connections.pusher' => [
                        'driver' => 'pusher',
                        'key' => $appKey,
                        'secret' => $appSecret,
                        'app_id' => $appId,
                        'options' => [
                            'cluster' => $appCluster,
                            'useTLS' => true,
                            'encrypted' => true,
                        ],
                    ],
                ]);
            }
        } catch (\Exception $e) {
            // Silently fail
        }
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): Channel
    {
        return new Channel('ticket.' . $this->ticketId);
    }

    /**
     * Get the event name to broadcast.
     */
    public function broadcastAs(): string
    {
        return 'new-comment';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'ticket_id' => $this->ticketId,
            'ticket_uid' => $this->ticketUid,
            'comment' => $this->comment,
        ];
    }
}
