importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

const COMUNICA_CACHE = 'comunica-shell-v3';
const COMUNICA_SHELL = ['/', '/manifest.json', '/pwa/icon-192.png', '/pwa/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(COMUNICA_CACHE).then((cache) => cache.addAll(COMUNICA_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('comunica-shell-') && key !== COMUNICA_CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Sempre consulta a rede para detectar uma nova publicação.
  if (url.pathname === '/version.json') {
    event.respondWith(fetch(event.request, {cache: 'no-store'}));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(COMUNICA_CACHE).then((cache) => cache.put('/', copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/'))));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    // Clone enquanto o corpo ainda está disponível. Fazer isso dentro do
    // callback assíncrono do cache permitia que o navegador consumisse antes.
    const cacheCopy = response.ok ? response.clone() : null;
    if (cacheCopy) caches.open(COMUNICA_CACHE).then((cache) => cache.put(event.request, cacheCopy));
    return response;
  })));
});

firebase.initializeApp({
  apiKey: "AIzaSyAj3iR_upKAW5Iy0IKnqdcUgnEsbIaoCMo",
  authDomain: "comunica-salvador.firebaseapp.com",
  projectId: "comunica-salvador",
  storageBucket: "comunica-salvador.firebasestorage.app",
  messagingSenderId: "328110966548",
  appId: "1:328110966548:web:64c36a5985214157422401"
});

// Handle message clicks before the Firebase SDK consumes the click event.
self.addEventListener('notificationclick', (event) => {
  const data = event.notification?.data?.FCM_MSG?.data;
  if (!['message', 'message_deadline', 'activity_assignment', 'activity_update', 'activity_deadline'].includes(data?.type)) return;
  event.stopImmediatePropagation();
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await clients.matchAll({type: 'window', includeUncontrolled: true});
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.focus();
      existing.postMessage(data.threadId
        ? {type: 'comunica-open-message', companyId: data.companyId, threadId: data.threadId, messageId: data.messageId}
        : {type: 'comunica-open-activity', companyId: data.companyId, activityId: data.messageId});
    } else {
      const url = new URL('/', self.location.origin);
      if (data.threadId) {
        url.searchParams.set('messageCompany', data.companyId || '');
        url.searchParams.set('messageThread', data.threadId || '');
        if (data.messageId) url.searchParams.set('messageId', data.messageId);
      } else {
        url.searchParams.set('activityCompany', data.companyId || '');
        if (data.messageId) url.searchParams.set('activityId', data.messageId);
      }
      await clients.openWindow(url.href);
    }
  })());
}, {capture: true});

firebase.messaging();

// As notificações enviadas pelo Firebase já possuem título e conteúdo.
// O próprio Firebase as apresenta em segundo plano; criar outra manualmente
// aqui fazia cada publicação aparecer duas vezes no navegador.
