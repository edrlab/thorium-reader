var CACHE_NAME = "webpub-viewer";
self.addEventListener('activate', function () {
    self.clients.claim();
});
self.addEventListener('fetch', function (event) {
    // Response from the cache immediately if possible, but also fetch an update.
    var cachedOrFetchedResponse = self.caches.open(CACHE_NAME).then(function (cache) {
        return self.caches.match(event.request).then(function (cacheResponse) {
            var fetchPromise = self.fetch(event.request).then(function (fetchResponse) {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
            });
            return cacheResponse || fetchPromise;
        });
    });
    event.respondWith(cachedOrFetchedResponse);
});
//# sourceMappingURL=sw.js.map