const CACHE_NAME = 'easy-bot-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.chunk.css',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/manifest.json'
];

// Установка service worker
self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Перехват запросов
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем из кэша, если есть
        if (response) {
          return response;
        }
        
        // Иначе делаем запрос к сети
        return fetch(event.request).then(response => {
          // Не кэшируем API запросы
          if (event.request.url.includes('/api/')) {
            return response;
          }
          
          // Кэшируем статические файлы
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        });
      })
  );
});

// Обновление service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames =>
        Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        )
      )
    ])
  );
});