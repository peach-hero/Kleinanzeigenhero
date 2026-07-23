const CACHE_NAME = 'hero-app-v2.0-buster';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './app.js?v=2.0',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

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
    })
  );
  self.clients.claim();
});

// Network-first für app.js und index.html damit Updates immer sofort geladen werden
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('app.js') || event.request.url.includes('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((resp) => resp || fetch(event.request))
    );
  }
});
