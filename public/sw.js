// Shuttle Dahana — Service Worker for Push Notifications
const CACHE_NAME = 'shuttle-dahana-v1';

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});

// Handle push notification
self.addEventListener('push', (e) => {
    if (!e.data) return;

    let data;
    try {
        data = e.data.json();
    } catch {
        data = { title: 'Shuttle Dahana', body: e.data.text() };
    }

    const options = {
        body:    data.body,
        icon:    data.icon   || '/icons/icon-192.png',
        badge:   data.badge  || '/icons/badge-72.png',
        data:    data.data   || {},
        vibrate: [200, 100, 200],
        actions: [
            { action: 'open', title: 'Buka App' },
        ],
        requireInteraction: data.data?.priority === 1,
    };

    e.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    const url = e.notification.data?.url || '/driver';

    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(url);
                    return;
                }
            }
            return self.clients.openWindow(url);
        })
    );
});
