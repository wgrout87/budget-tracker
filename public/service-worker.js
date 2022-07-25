// All files to save for offline functionality
const FILES_TO_CACHE = [
    "/",
    "/api/transaction",
    "./manifest.json",
    "./css/styles.css",
    "./js/index.js",
    "./js/idb.js",
    "./icons/icon-72x72.png",
    "./icons/icon-96x96.png",
    "./icons/icon-128x128.png",
    "./icons/icon-144x144.png",
    "./icons/icon-152x152.png",
    "./icons/icon-192x192.png",
    "./icons/icon-384x384.png",
    "./icons/icon-512x512.png",
];
// Cache name components
const APP_PREFIX = 'BudgetTracker-';
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;

// Service Worker installation
self.oninstall = function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('installing cache : ' + CACHE_NAME);
            return cache.addAll(FILES_TO_CACHE);
        })
    )
};

// Service Worker activation
self.onactivate = function (e) {
    console.log('activate');
    e.waitUntil(
        caches.keys().then(function (keyList) {
            let cacheKeeplist = keyList.filter(function (key) {
                return key.indexOf(APP_PREFIX);
            })

            cacheKeeplist.push(CACHE_NAME);

            return Promise.all(keyList.map(function (key, i) {
                if (cacheKeeplist.indexOf(key) === -1) {
                    console.log('deleting cache : ' + keyList[i]);
                    return caches.delete(keyList[i]);
                }
            }));
        })
    );
};

// Service Worker intercept fetch requests
self.onfetch = function (e) {
    console.log('fetch request : ' + e.request.url);
    // Update the saved /api/transaction GET request if connected to the internet
    if (navigator.onLine) {
        caches.open(CACHE_NAME).then(function (cache) {
            cache.delete('/api/transaction');
            cache.add('/api/transaction')
        })
    };
    e.respondWith(
        caches.match(e.request).then(function (request) {
            return request || fetch(e.request)
        })
    );
};