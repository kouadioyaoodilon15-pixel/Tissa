const CACHE_NAME = "tissa-shell-v1";
const BASE = self.registration.scope;
const APP_SHELL = [
  "",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "assets/tissa-logo.png",
  "assets/robe-kente.jpg",
  "assets/jupe-baoule.jpg",
  "assets/pantalon-kita.jpg",
  "assets/chemise-bogolan.jpg",
  "assets/veste-nzima.jpg",
  "assets/complet-ivoirien.jpg",
  "assets/robe-enfant.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL.map(file => new URL(file, BASE).toString()))));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(response => response || caches.match("/index.html")))
  );
});
