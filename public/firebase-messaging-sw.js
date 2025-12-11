/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging Service Worker
 */

importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: 'AIzaSyCPMf2SVXFwot2-FD9E3qre6xDxcxWOM2c',
    authDomain: 'amanah-assets.firebaseapp.com',
    projectId: 'amanah-assets',
    storageBucket: 'amanah-assets.appspot.com',
    messagingSenderId: '275885061862',
    appId: '1:275885061862:web:1dc36a755e813521326d27',
    measurementId: 'G-NQWMPXG513',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || payload.data?.title || 'New Notification';
    const notificationBody = payload.notification?.body || payload.data?.body || 'You have a new message.';
    
    // Create a unique tag based on messageId or timestamp
    const messageId = payload.messageId || payload.fcmMessageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tag = `amanah-${messageId}`;
    
    const notificationOptions = {
        body: notificationBody,
        icon: payload.notification?.icon || payload.data?.icon || '/assets/images/favicon.png',
        badge: '/assets/images/favicon.png',
        tag: tag,
        data: {
            ...payload.data,
            url: payload.data?.url || payload.fcmOptions?.link || '/',
        },
        vibrate: [100, 50, 100],
        requireInteraction: false,
        renotify: false,
    };

    // Close any existing notifications with the same tag before showing new one
    self.registration.getNotifications({ tag: tag }).then((notifications) => {
        notifications.forEach((notification) => notification.close());
    }).then(() => {
        // Show the new notification
        return self.registration.showNotification(notificationTitle, notificationOptions);
    });
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    const url = data.url || '/';

    event.waitUntil(
        clients
            .matchAll({
                type: 'window',
                includeUncontrolled: true,
            })
            .then((windowClients) => {
                for (const client of windowClients) {
                    if ('focus' in client) {
                        if (url && url !== '/') {
                            return client.navigate(url).then(() => client.focus());
                        }
                        return client.focus();
                    }
                }

                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
