const CACHE_NAME = 'hero-app-offline-v1';

// Diese Dateien werden auf dem Handy gespeichert
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap'
];

// Installation: App in den Speicher laden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('App offline gespeichert');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Aufräumen: Alte Versionen löschen, falls du ein Update auf GitHub machst
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Lade-Logik: Immer aus dem Speicher laden (für Offline-Nutzung)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Wenn im Speicher gefunden -> sofort laden. Ansonsten aus dem Internet holen.
      return response || fetch(event.request).catch(() => {
        // Fallback: Wenn offline und nicht gefunden, starte die Startseite
        return caches.match('./index.html');
      });
    })
  );
});