const CACHE_NAME = 'midrash-aggadah-v5';
const STATIC_CACHE = 'static-v5';

// Resources to cache immediately
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Simple fetch event with better error handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching for unsupported schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip caching for Google Analytics and other external services that might cause issues
  if (url.hostname.includes('google-analytics.com') || 
      url.hostname.includes('googletagmanager.com') ||
      url.hostname.includes('gstatic.com')) {
    return;
  }
  
  // Handle different types of requests
  if (request.destination === 'document') {
    event.respondWith(handleDocumentRequest(request));
  } else if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (url.pathname.includes('/assets/')) {
    event.respondWith(handleStaticAssetRequest(request));
  } else if (url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(handleFontRequest(request));
  } else {
    // For other requests, just pass through to network
    event.respondWith(fetch(request));
  }
});

// Handle document requests (HTML)
async function handleDocumentRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // Fallback for navigation requests
  if (request.mode === 'navigate') {
    const cachedFallback = await caches.match('/');
    if (cachedFallback) {
      return cachedFallback;
    }
  }
  
  return new Response('Network error', { status: 503 });
}

// Handle image requests
async function handleImageRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    // Return empty response for failed images
    return new Response('', { status: 204 });
  }
}

// Handle static assets (JS, CSS)
async function handleStaticAssetRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Asset not found', { status: 404 });
  }
}

// Handle Google Fonts with simpler logic
async function handleFontRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      // Only cache successful font responses
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // If font fails, just return the error - don't try to cache it
    const cachedResponse = await caches.match(request);
    return cachedResponse || fetch(request);
  }
} 