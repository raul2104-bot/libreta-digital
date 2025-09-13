
// This empty install event handler is sufficient to make the app installable as a PWA.
// By keeping it empty and removing skipWaiting(), we prevent installation errors in tricky environments.
self.addEventListener('install', () => {
  // Intentionally empty.
});

self.addEventListener('fetch', (event) => {
  // We only care about POST requests for the share target.
  if (event.request.method !== 'POST') {
    return;
  }

  const url = new URL(event.request.url);
  const scopeUrl = new URL(self.registration.scope);

  // Check if it's a share request to the app's root.
  if (url.pathname === scopeUrl.pathname) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get('receipt');

        if (file) {
          const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          if (clients.length > 0) {
            // Post the file to the most recently focused client.
            clients[0].postMessage({ file: file, action: 'load-receipt' });
            clients[0].focus();
          }
        }
      } catch (err) {
        console.error('SW: Error handling share target:', err);
      }
      
      // Redirect back to the app's page to bring it into focus.
      return Response.redirect(self.registration.scope, 303);
    })());
  }
});
