// Service Worker for PWA Offline Support
const CACHE_NAME = 'granitstone-price-list-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    '../public/logogs.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Failed to cache resources:', error);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Otherwise, fetch from network
                return fetch(event.request).then((response) => {
                    // Don't cache if not a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // Return offline page for navigation requests
                if (event.request.destination === 'document') {
                    return caches.match('./index.html');
                }
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for data updates
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        console.log('Background sync initiated');
        // Here you could update cached data from Google Sheets
        // For now, we'll just log the event
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notification support (for future updates)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Fiyat listesi güncellendi',
        icon: '../public/logogs.png',
        badge: '../public/logogs.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Görüntüle',
                icon: '../public/logogs.png'
            },
            {
                action: 'close',
                title: 'Kapat'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Granitstone Fiyat Listesi', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});
