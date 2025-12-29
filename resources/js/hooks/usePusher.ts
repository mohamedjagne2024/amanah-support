import Pusher from 'pusher-js';
import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

type PusherConfig = {
  key: string | null;
  cluster: string | null;
};

type CommentData = {
  id: number;
  details: string;
  created_at: string;
  user: {
    id: number;
    name: string;
  };
};

type NewCommentEvent = {
  ticket_id: number;
  ticket_uid: string;
  comment: CommentData;
};

/**
 * Hook to subscribe to a Pusher channel and listen for events
 */
export function usePusherChannel(
  channelName: string,
  eventName: string,
  callback?: (data: any) => void
) {
  const pageProps = usePage().props as { pusher?: PusherConfig };
  const pusher = pageProps.pusher;
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!pusher?.key || !pusher?.cluster) {
      return;
    }

    pusherRef.current = new Pusher(pusher.key, {
      cluster: pusher.cluster,
      forceTLS: true,
    });

    channelRef.current = pusherRef.current.subscribe(channelName);

    channelRef.current.bind(eventName, (data: any) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    });

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusherRef.current?.unsubscribe(channelName);
      }
      pusherRef.current?.disconnect();
    };
  }, [channelName, eventName, pusher?.key, pusher?.cluster]);

  return {
    pusher: pusherRef.current,
    channel: channelRef.current,
  };
}

/**
 * Hook to listen for new ticket comments and update the comments list
 * @param ticketId - The ticket ID to listen for
 * @param onNewComment - Callback to handle the new comment
 */
export function useTicketCommentListener(
  ticketId: number | string,
  onNewComment: (comment: CommentData) => void
) {
  usePusherChannel(
    `ticket.${ticketId}`,
    'new-comment',
    (data: NewCommentEvent) => {
      if (data.comment) {
        onNewComment(data.comment);
      }
    }
  );
}

type ChatMessageData = {
  id: number;
  conversation_id: number;
  user_id: number | null;
  contact_id: number | null;
  message: string;
  is_read: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  contact?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  attachments?: {
    id: number;
    name: string;
    path: string;
    url: string;
  }[];
};

type NewChatMessageEvent = {
  chatMessage: ChatMessageData;
};

/**
 * Hook to listen for new chat messages
 * @param conversationId - The conversation ID to listen for
 * @param onNewMessage - Callback to handle the new message
 */
export function useChatMessageListener(
  conversationId: number | string | null,
  onNewMessage: (message: ChatMessageData) => void
) {
  usePusherChannel(
    conversationId ? `chat.${conversationId}` : '',
    'new-message',
    (data: NewChatMessageEvent) => {
      if (data.chatMessage) {
        onNewMessage(data.chatMessage);
      }
    }
  );
}
