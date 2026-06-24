const CACHE_NAME = 'sms-portal-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/public/favicon.svg',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event with Cache-First for assets & Network-First for API requests
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip chrome-extension, internal debugging urls or analytics
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API routes or supabase requests using direct network fetch
  if (requestUrl.pathname.startsWith('/api') || requestUrl.host.includes('supabase') || requestUrl.host.includes('firestore')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // General static strategy: Cache First, Network Fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in the background to keep cache warm (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => { /* mute background fetch errors when offline */ });
        
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback or generic responses if we are offline for html pages
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/');
        }
      });
    })
  );
});
