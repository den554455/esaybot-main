// public/sw.js - Service Worker для PWA

const CACHE_NAME = 'easy-bot-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/apple-touch-icon.svg'
];

// Установка service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Активация и очистка старых кешей
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Стратегия: сначала сеть, потом кеш (для API)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // API запросы - только сеть
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Статические assets - кеш сначала
  if (STATIC_ASSETS.includes(url.pathname) || 
      url.pathname.match(/\.(css|js|svg|png|jpg|jpeg|webp)$/)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }
  
  // Остальное - сеть с падбэком на кеш
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});