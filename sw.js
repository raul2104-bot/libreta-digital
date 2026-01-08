// Define a name for our cache
const CACHE_NAME = 'coop-libreta-cache-v2';

// List of files that should be precached for offline use.
const urlsToCache = [
  '/',
  './index.html',
  './index.tsx',
  './manifest.json'
  // Note: CDN assets are not listed here. They will be cached on-the-fly by the fetch handler.
];

// Install event: This is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        // Add all the specified URLs to the cache.
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error("Service Worker: Pre-caching failed:", err))
  );
});

// Activate event: This is fired when the service worker is activated.
// It's a good place to clean up old caches.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // If a cache is not in our whitelist, delete it.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: This is fired for every network request made by the page.
self.addEventListener('fetch', (event) => {
  // We only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return the cached response if it exists
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Check if we received a valid response.
        // We want to cache successful responses (status 200) and opaque responses
        // from CDNs, which are essential for offline functionality.
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          // IMPORTANT: Clone the response. A response is a stream and can only be consumed once.
          // We need one for the cache and one for the browser.
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Don't cache requests from browser extensions.
            if (!event.request.url.startsWith('chrome-extension://')) {
              cache.put(event.request, responseToCache);
            }
          });
        }
        return networkResponse;
      }).catch(error => {
        console.error('SW: Fetch failed, and not in cache:', event.request.url, error);
        // Let the request fail, which is the default browser behavior when offline.
      });
    })
  );
});