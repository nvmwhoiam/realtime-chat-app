
const cacheName = "Static-v1";
const dynamicCache = "dynamicCache";

const assets = [
    "./index.html",
    // "/fallback.html",
    "./assets/css/index.css",
    "./manifest.json",
    // "/assets/img/nature.jpg",
    // "./assets/js/index.js",
    // "/assets/svgs/x-icon.svg",
    // "/assets/img/manifest-icon-192.png",
    // "/assets/img/manifest-icon-512.png",
    // "/assets/img/touch-icon-iphone.png",
    // "/assets/img/touch-icon-ipad.png",
    // "/assets/img/touch-icon-iphone-retina.png",
    // "/assets/img/touch-icon-ipad-retina.png"
]

self.addEventListener('install', function (event) {

    event.waitUntil(

        caches.open(cacheName).then(function (cache) {
            return cache.addAll(assets);
        })

    );

});

self.addEventListener('activate', function (event) {

    event.waitUntil(

        caches.keys().then(function (keys) {

            return Promise.all(

                keys.filter(key => key !== cacheName && key !== dynamicCache).map(key => caches.delete(key))

            );

        })

    );

});

self.addEventListener('fetch', function (event) {

    event.respondWith(

        caches.match(event.request).then(cache => {
            return cache || fetch(event.request).then(fetchCache => {
                return caches.open(dynamicCache).then(cacheRes => {
                    cacheRes.put(event.request.url, fetchCache.clone());
                    return fetchCache;
                })
            });
        })
        // .catch(() => caches.match("/fallback.html"))

    );
});