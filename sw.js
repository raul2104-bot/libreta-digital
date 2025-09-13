// Define a name for our cache
const CACHE_NAME = 'coop-libreta-cache-v1';

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
  // We only handle GET requests with a Cache-First strategy
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If the request is in the cache, return the cached response.
        if (response) {
          return response;
        }

        // If the request is not in the cache, fetch it from the network.
        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response.
            // We only want to cache successful (status 200) responses.
            // For cross-origin resources (like from a CDN), the response.type must be 'cors'.
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream and can only be consumed once.
            // We need one for the cache and one for the browser.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Don't cache requests from browser extensions.
                if (!event.request.url.startsWith('chrome-extension://')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        ).catch(error => {
            // This will happen if the network request fails and the item is not in the cache.
            console.error('Service Worker: Fetch failed. User is likely offline and resource not cached.', error);
            // We could return a generic offline fallback page here if we had one.
        });
      })
  );
});