const CACHE_NAME = 'midrash-aggadah-v1';
const urlsToCache = [
  '/',
  '/images/subtle-parchment.png',
  '/favicon.ico',
  'https://fonts.googleapis.com/css2?family=David+Libre:wght@400;500;700&display=swap'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
}); 