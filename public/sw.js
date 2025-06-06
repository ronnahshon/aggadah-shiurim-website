const CACHE_NAME = 'midrash-aggadah-simple-v1';

// Install event - just skip waiting, no precaching
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Very simple fetch handler - only cache static assets, let everything else pass through
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Only handle GET requests from our origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  
  // Only cache static assets (images, JS, CSS)
  if (url.pathname.includes('/assets/') || 
      url.pathname.includes('/images/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.webp')) {
    
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request).then(networkResponse => {
            // Only cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Return a basic 404 response for failed requests
            return new Response('Not found', { status: 404 });
          });
        });
      })
    );
  }
  // For all other requests (HTML, API calls, etc.), just pass through to network
}); 