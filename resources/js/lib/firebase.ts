import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
    getMessaging,
    getToken,
    onMessage,
    type MessagePayload,
    type Messaging,
} from 'firebase/messaging';

/**
 * Firebase Configuration
 */
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
    authDomain:
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
    storageBucket:
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
    messagingSenderId:
        import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'YOUR_MEASUREMENT_ID',
};

/**
 * VAPID Key for Web Push
 */
const VAPID_KEY =
    import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_WEB_PUSH_VAPID_KEY';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase app
 */
function initializeFirebase(): FirebaseApp {
    if (!app) {
        app = initializeApp(firebaseConfig);
    }
    return app;
}

/**
 * Get Firebase Messaging instance
 */
function getFirebaseMessaging(): Messaging | null {
    if (typeof window === 'undefined') {
        return null;
    }

    if (!('serviceWorker' in navigator)) {
        return null;
    }

    if (!messaging) {
        try {
            const firebaseApp = initializeFirebase();
            messaging = getMessaging(firebaseApp);
        } catch {
            return null;
        }
    }

    return messaging;
}

/**
 * Request notification permission and get FCM token
 */
export async function requestFcmToken(): Promise<string | null> {
    try {
        if (!('Notification' in window)) {
            return null;
        }

        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            return null;
        }

        const messagingInstance = getFirebaseMessaging();

        if (!messagingInstance) {
            return null;
        }

        const registration = await navigator.serviceWorker.register(
            '/firebase-messaging-sw.js',
            { scope: '/' }
        );

        await navigator.serviceWorker.ready;

        const token = await getToken(messagingInstance, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        return token || null;
    } catch {
        return null;
    }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(
    callback: (payload: MessagePayload) => void
): (() => void) | null {
    const messagingInstance = getFirebaseMessaging();

    if (!messagingInstance) {
        return null;
    }

    return onMessage(messagingInstance, callback);
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator
    );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
    if (!('Notification' in window)) {
        return null;
    }
    return Notification.permission;
}

/**
 * Get FCM token from cache if permission is already granted
 */
export async function getCachedFcmToken(): Promise<string | null> {
    try {
        if (!('Notification' in window)) {
            return null;
        }

        if (Notification.permission !== 'granted') {
            return null;
        }

        const messagingInstance = getFirebaseMessaging();
        if (!messagingInstance) {
            return null;
        }

        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messagingInstance, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        return token || null;
    } catch {
        return null;
    }
}

/**
 * Export Firebase config for use in service worker
 */
export { firebaseConfig };
