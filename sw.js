const CACHE_NAME = 'housing-tracker-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/config.js',
  './js/firebase-init.js',
  './js/auth.js',
  './js/utils.js',
  './js/db.js',
  './js/router.js',
  './js/pages/dashboard.js',
  './js/pages/residences.js',
  './js/pages/contracts.js',
  './js/pages/payments.js',
  './js/pages/electricity.js',
  './js/pages/water.js',
  './js/pages/expenses.js',
  './js/pages/reports.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// شبكة أولاً مع رجوع للكاش لو مفيش نت (البيانات نفسها بتتخزن من Firestore persistence)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const resClone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
