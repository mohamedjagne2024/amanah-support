<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event to notify admins about new unread chat messages.
 * This broadcasts to a global channel so the sidebar badge can update in real-time.
 */
class NewUnreadChatMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @var int
     */
    public $conversationId;

    /**
     * @var int
     */
    public $messageId;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct(int $conversationId, int $messageId)
    {
        $this->conversationId = $conversationId;
        $this->messageId = $messageId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        // Use a global channel for admin notifications
        return new Channel('admin.notifications');
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs()
    {
        return 'new-unread-message';
    }
}
