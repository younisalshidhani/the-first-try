// Service Worker لتطبيق تقرير الزيارات الشهرية - v4.3.0
// يُتيح العمل دون إنترنت ويعالج الإشعارات المجدولة

const CACHE_NAME = 'visit-report-v4.9.0';
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://unpkg.com/pizzip@3.1.6/dist/pizzip.js',
  'https://unpkg.com/pizzip@3.1.6/dist/pizzip-utils.js',
  'https://unpkg.com/docxtemplater@3.42.7/build/docxtemplater.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
];

// التثبيت: تخزين الملفات
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_FILES).catch((err) => {
        console.warn('فشل تخزين بعض الملفات:', err);
      });
    })
  );
  self.skipWaiting();
});

// التفعيل: حذف الذاكرة القديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// الطلبات: Cache First
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      
      return fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// عند النقر على الإشعار: افتح التطبيق
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // إن كان التطبيق مفتوحًا، ركّز عليه
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // وإلا افتح نافذة جديدة
      if (self.clients.openWindow) {
        return self.clients.openWindow('./');
      }
    })
  );
});

// عند رفض الإشعار (notificationclose)
self.addEventListener('notificationclose', (event) => {
  // يمكن استخدامه لاحقًا لمتابعة معدلات الرفض
});
