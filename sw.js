const CACHE = 'ravan-offline-v1';
const FILES = ['./', './index.html', './styles.css', './app.js', './core.js', './data.js', './manifest.webmanifest', './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png', './assets/vazirmatn.ttf', './assets/vazirmatn-bold.ttf'];
const scope = new URL(self.registration.scope);
const appFiles = new Set(FILES.map(path => new URL(path, scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('ravan-offline-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin) return;
  if (request.mode === 'navigate' && url.pathname.startsWith(scope.pathname)) {
    event.respondWith(fetch(request).catch(() => caches.match(new URL('./index.html', scope))));
    return;
  }
  if (!appFiles.has(url.href)) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});
