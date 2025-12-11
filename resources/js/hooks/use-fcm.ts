import { useCallback, useEffect, useRef, useState } from 'react';
import type { MessagePayload } from 'firebase/messaging';
import {
    getNotificationPermission,
    isNotificationSupported,
    onForegroundMessage,
    requestFcmToken,
} from '@/lib/firebase';

interface UseFcmOptions {
    autoRequest?: boolean;
    onMessage?: (payload: MessagePayload) => void;
    onTokenReceived?: (token: string) => void;
    onError?: (error: Error) => void;
}

interface UseFcmReturn {
    token: string | null;
    isLoading: boolean;
    error: Error | null;
    permission: NotificationPermission | null;
    isSupported: boolean;
    requestPermission: () => Promise<string | null>;
    registerToken: (token: string) => Promise<boolean>;
}

/**
 * Custom hook for Firebase Cloud Messaging integration
 */
export function useFcm(options: UseFcmOptions = {}): UseFcmReturn {
    const { autoRequest = false, onMessage, onTokenReceived, onError } = options;

    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [permission, setPermission] = useState<NotificationPermission | null>(
        getNotificationPermission()
    );

    const isSupported = isNotificationSupported();
    const hasAutoRequested = useRef(false);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    const requestPermission = useCallback(async (): Promise<string | null> => {
        if (!isSupported) {
            const err = new Error('Notifications are not supported in this browser');
            setError(err);
            onError?.(err);
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const fcmToken = await requestFcmToken();

            setPermission(getNotificationPermission());

            if (fcmToken) {
                setToken(fcmToken);
                onTokenReceived?.(fcmToken);
            }

            return fcmToken;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to get FCM token');
            setError(error);
            onError?.(error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, onTokenReceived, onError]);

    const registerToken = useCallback(async (fcmToken: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/fcm-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify({
                    token: fcmToken,
                    device: navigator.userAgent,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to register FCM token: ${response.statusText}`);
            }

            const data = await response.json();
            return data.status === 'ok';
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to register FCM token');
            onError?.(error);
            return false;
        }
    }, [onError]);

    useEffect(() => {
        if (autoRequest && isSupported && !hasAutoRequested.current) {
            hasAutoRequested.current = true;
            requestPermission();
        }
    }, [autoRequest, isSupported, requestPermission]);

    useEffect(() => {
        if (!isSupported || !onMessage) {
            return;
        }

        if (permission === 'granted' && token) {
            unsubscribeRef.current = onForegroundMessage(onMessage);
        }

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [isSupported, permission, token, onMessage]);

    return {
        token,
        isLoading,
        error,
        permission,
        isSupported,
        requestPermission,
        registerToken,
    };
}

export default useFcm;
