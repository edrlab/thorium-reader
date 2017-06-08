var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define("Annotator", ["require", "exports"], function (require, exports) {
    "use strict";
});
define("Store", ["require", "exports"], function (require, exports) {
    "use strict";
});
define("MemoryStore", ["require", "exports"], function (require, exports) {
    "use strict";
    /** Class that stores key/value pairs in memory. */
    var MemoryStore = (function () {
        function MemoryStore() {
            this.store = {};
        }
        MemoryStore.prototype.get = function (key) {
            var value = this.store[key] || null;
            return new Promise(function (resolve) { return resolve(value); });
        };
        MemoryStore.prototype.set = function (key, value) {
            this.store[key] = value;
            return new Promise(function (resolve) { return resolve(); });
        };
        return MemoryStore;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Class that stores key/value pairs in memory. */
    exports.default = MemoryStore;
});
define("LocalStorageStore", ["require", "exports", "MemoryStore"], function (require, exports, MemoryStore_1) {
    "use strict";
    /** Class that stores key/value pairs in localStorage if possible
        but falls back to an in-memory store. */
    var LocalStorageStore = (function () {
        function LocalStorageStore(config) {
            this.prefix = config.prefix;
            try {
                // In some browsers (eg iOS Safari in private mode), 
                // localStorage exists but throws an exception when
                // you try to write to it.
                var testKey = config.prefix + "-" + String(Math.random());
                window.localStorage.setItem(testKey, "test");
                window.localStorage.removeItem(testKey);
                this.fallbackStore = null;
            }
            catch (e) {
                this.fallbackStore = new MemoryStore_1.default();
            }
        }
        LocalStorageStore.prototype.getLocalStorageKey = function (key) {
            return this.prefix + "-" + key;
        };
        LocalStorageStore.prototype.get = function (key) {
            return __awaiter(this, void 0, void 0, function () {
                var value;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            value = null;
                            if (!!this.fallbackStore)
                                return [3 /*break*/, 1];
                            value = window.localStorage.getItem(this.getLocalStorageKey(key));
                            return [3 /*break*/, 3];
                        case 1: return [4 /*yield*/, this.fallbackStore.get(key)];
                        case 2:
                            value = _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/, new Promise(function (resolve) { return resolve(value); })];
                    }
                });
            });
        };
        LocalStorageStore.prototype.set = function (key, value) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!!this.fallbackStore)
                                return [3 /*break*/, 1];
                            window.localStorage.setItem(this.getLocalStorageKey(key), value);
                            return [3 /*break*/, 3];
                        case 1: return [4 /*yield*/, this.fallbackStore.set(key, value)];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: return [2 /*return*/, new Promise(function (resolve) { return resolve(); })];
                    }
                });
            });
        };
        return LocalStorageStore;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Class that stores key/value pairs in localStorage if possible
        but falls back to an in-memory store. */
    exports.default = LocalStorageStore;
});
define("Cacher", ["require", "exports"], function (require, exports) {
    "use strict";
    (function (CacheStatus) {
        /** The book has not been cached. */
        CacheStatus[CacheStatus["Uncached"] = 0] = "Uncached";
        /** There is a new version available (Application Cache only - refresh the page to update). */
        CacheStatus[CacheStatus["UpdateAvailable"] = 1] = "UpdateAvailable";
        /** The app is checking for a new version (Application Cache only). */
        CacheStatus[CacheStatus["CheckingForUpdate"] = 2] = "CheckingForUpdate";
        /** The cache is downloading. */
        CacheStatus[CacheStatus["Downloading"] = 3] = "Downloading";
        /** The cache is fully downloaded and the book is available offline. */
        CacheStatus[CacheStatus["Downloaded"] = 4] = "Downloaded";
        /** There was an error downloading the cache, and the book is not available offline. */
        CacheStatus[CacheStatus["Error"] = 5] = "Error";
    })(exports.CacheStatus || (exports.CacheStatus = {}));
    var CacheStatus = exports.CacheStatus;
});
define("Manifest", ["require", "exports"], function (require, exports) {
    "use strict";
    var Manifest = (function () {
        function Manifest(manifestJSON, manifestUrl) {
            this.metadata = manifestJSON.metadata || {};
            this.links = manifestJSON.links || [];
            this.spine = manifestJSON.spine || [];
            this.resources = manifestJSON.resources || [];
            this.toc = manifestJSON.toc || [];
            this.manifestUrl = manifestUrl;
        }
        Manifest.getManifest = function (manifestUrl, store) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var fetchManifest, tryToUpdateManifestButIgnoreResult, manifestString, manifestJSON;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            fetchManifest = function () { return __awaiter(_this, void 0, void 0, function () {
                                var response, manifestJSON;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, window.fetch(manifestUrl.href)];
                                        case 1:
                                            response = _a.sent();
                                            return [4 /*yield*/, response.json()];
                                        case 2:
                                            manifestJSON = _a.sent();
                                            if (!store)
                                                return [3 /*break*/, 4];
                                            return [4 /*yield*/, store.set("manifest", JSON.stringify(manifestJSON))];
                                        case 3:
                                            _a.sent();
                                            _a.label = 4;
                                        case 4: return [2 /*return*/, new Manifest(manifestJSON, manifestUrl)];
                                    }
                                });
                            }); };
                            tryToUpdateManifestButIgnoreResult = function () { return __awaiter(_this, void 0, void 0, function () {
                                var err_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 2, , 3]);
                                            return [4 /*yield*/, fetchManifest()];
                                        case 1:
                                            _a.sent();
                                            return [3 /*break*/, 3];
                                        case 2:
                                            err_1 = _a.sent();
                                            return [3 /*break*/, 3];
                                        case 3: return [2 /*return*/, new Promise(function (resolve) { return resolve(); })];
                                    }
                                });
                            }); };
                            if (!store)
                                return [3 /*break*/, 2];
                            return [4 /*yield*/, store.get("manifest")];
                        case 1:
                            manifestString = _a.sent();
                            if (manifestString) {
                                // Kick off a fetch to update the store for next time,
                                // but don't await it.
                                tryToUpdateManifestButIgnoreResult();
                                manifestJSON = JSON.parse(manifestString);
                                return [2 /*return*/, new Manifest(manifestJSON, manifestUrl)];
                            }
                            _a.label = 2;
                        case 2: return [2 /*return*/, fetchManifest()];
                    }
                });
            });
        };
        Manifest.prototype.getStartLink = function () {
            if (this.spine.length > 0) {
                return this.spine[0];
            }
            return null;
        };
        Manifest.prototype.getPreviousSpineItem = function (href) {
            var index = this.getSpineIndex(href);
            if (index !== null && index > 0) {
                return this.spine[index - 1];
            }
            return null;
        };
        Manifest.prototype.getNextSpineItem = function (href) {
            var index = this.getSpineIndex(href);
            if (index !== null && index < (this.spine.length - 1)) {
                return this.spine[index + 1];
            }
            return null;
        };
        Manifest.prototype.getSpineItem = function (href) {
            var index = this.getSpineIndex(href);
            if (index !== null) {
                return this.spine[index];
            }
            return null;
        };
        Manifest.prototype.getSpineIndex = function (href) {
            for (var index = 0; index < this.spine.length; index++) {
                var item = this.spine[index];
                if (item.href) {
                    var itemUrl = new URL(item.href, this.manifestUrl.href).href;
                    if (itemUrl === href) {
                        return index;
                    }
                }
            }
            return null;
        };
        Manifest.prototype.getTOCItem = function (href) {
            var _this = this;
            var findItem = function (href, links) {
                for (var index = 0; index < links.length; index++) {
                    var item = links[index];
                    if (item.href) {
                        var itemUrl = new URL(item.href, _this.manifestUrl.href).href;
                        if (itemUrl === href) {
                            return item;
                        }
                    }
                    if (item.children) {
                        var childItem = findItem(href, item.children);
                        if (childItem !== null) {
                            return childItem;
                        }
                    }
                }
                return null;
            };
            return findItem(href, this.toc);
        };
        return Manifest;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Manifest;
});
define("ApplicationCacheCacher", ["require", "exports", "Cacher"], function (require, exports, Cacher_1) {
    "use strict";
    /** Class that caches files using the (deprecated) application cache API.
        This is necessary until Service Worker support improves.
        
        This class expects the application to have a cache manifest file
        containing the application files (currently index.html, sw.js, fetch.js,
        and webpub-viewer.js), and all the book content. There must _also_ be an
        html file that includes the manifest. That second html file can be empty
        except for the html tag linking to the manifest, and its location should
        be used as the ApplicationCacheCacher's bookCacheUrl.
    
        The ApplicationCacheCacher will create an iframe with the bookCacheUrl to start
        the download of book content. Since the book's html files are in the manifest,
        once the cache is ready any of those files will be loaded from the cache.
        */
    var ApplicationCacheCacher = (function () {
        function ApplicationCacheCacher(config) {
            this.statusUpdateCallback = function () { };
            this.status = Cacher_1.CacheStatus.Uncached;
            this.bookCacheUrl = config.bookCacheUrl;
        }
        ApplicationCacheCacher.prototype.enable = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    this.bookCacheElement = window.document.createElement("iframe");
                    this.bookCacheElement.style.display = "none";
                    window.document.body.appendChild(this.bookCacheElement);
                    this.bookCacheElement.src = this.bookCacheUrl.href;
                    this.updateStatus();
                    this.bookCacheElement.addEventListener("load", function () {
                        try {
                            _this.updateStatus();
                            var bookCache = _this.bookCacheElement.contentWindow.applicationCache;
                            bookCache.oncached = _this.updateStatus.bind(_this);
                            bookCache.onchecking = _this.updateStatus.bind(_this);
                            bookCache.ondownloading = _this.updateStatus.bind(_this);
                            bookCache.onerror = _this.handleError.bind(_this);
                            bookCache.onnoupdate = _this.updateStatus.bind(_this);
                            bookCache.onupdateready = _this.updateStatus.bind(_this);
                        }
                        catch (err) {
                            _this.handleError();
                        }
                    });
                    return [2 /*return*/, new Promise(function (resolve) { return resolve(); })];
                });
            });
        };
        ApplicationCacheCacher.prototype.onStatusUpdate = function (callback) {
            this.statusUpdateCallback = callback;
            this.updateStatus();
        };
        ApplicationCacheCacher.prototype.getStatus = function () {
            return this.status;
        };
        ApplicationCacheCacher.prototype.updateStatus = function () {
            var status;
            var appCacheStatus = window.applicationCache.UNCACHED;
            if (this.bookCacheElement &&
                this.bookCacheElement.contentWindow.applicationCache &&
                this.bookCacheElement.contentWindow.applicationCache.status !== undefined) {
                appCacheStatus = this.bookCacheElement.contentWindow.applicationCache.status;
            }
            if (appCacheStatus === window.applicationCache.UPDATEREADY) {
                status = Cacher_1.CacheStatus.UpdateAvailable;
            }
            else if (appCacheStatus === window.applicationCache.DOWNLOADING) {
                status = Cacher_1.CacheStatus.Downloading;
            }
            else if (appCacheStatus === window.applicationCache.UNCACHED ||
                appCacheStatus === window.applicationCache.OBSOLETE) {
                status = Cacher_1.CacheStatus.Uncached;
            }
            else if (appCacheStatus === window.applicationCache.CHECKING) {
                status = Cacher_1.CacheStatus.CheckingForUpdate;
            }
            else {
                status = Cacher_1.CacheStatus.Downloaded;
            }
            this.status = status;
            this.statusUpdateCallback(status);
        };
        ApplicationCacheCacher.prototype.handleError = function () {
            this.status = Cacher_1.CacheStatus.Error;
            this.statusUpdateCallback(Cacher_1.CacheStatus.Error);
        };
        return ApplicationCacheCacher;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Class that caches files using the (deprecated) application cache API.
        This is necessary until Service Worker support improves.
        
        This class expects the application to have a cache manifest file
        containing the application files (currently index.html, sw.js, fetch.js,
        and webpub-viewer.js), and all the book content. There must _also_ be an
        html file that includes the manifest. That second html file can be empty
        except for the html tag linking to the manifest, and its location should
        be used as the ApplicationCacheCacher's bookCacheUrl.
    
        The ApplicationCacheCacher will create an iframe with the bookCacheUrl to start
        the download of book content. Since the book's html files are in the manifest,
        once the cache is ready any of those files will be loaded from the cache.
        */
    exports.default = ApplicationCacheCacher;
});
define("ServiceWorkerCacher", ["require", "exports", "Cacher", "Manifest", "ApplicationCacheCacher"], function (require, exports, Cacher_2, Manifest_1, ApplicationCacheCacher_1) {
    "use strict";
    /** Class that caches responses using ServiceWorker's Cache API, and optionally
        falls back to the application cache if service workers aren't available. */
    var ServiceWorkerCacher = (function () {
        /** Create a ServiceWorkerCacher. */
        function ServiceWorkerCacher(config) {
            this.cacheStatus = Cacher_2.CacheStatus.Uncached;
            this.statusUpdateCallback = function () { };
            this.serviceWorkerUrl = config.serviceWorkerUrl || new URL("sw.js", config.manifestUrl.href);
            this.staticFileUrls = config.staticFileUrls || [];
            this.store = config.store;
            this.manifestUrl = config.manifestUrl;
            var protocol = window.location.protocol;
            this.areServiceWorkersSupported = !!navigator.serviceWorker && !!window.caches && (protocol === "https:");
            if (!this.areServiceWorkersSupported && config.fallbackBookCacheUrl) {
                this.fallbackCacher = new ApplicationCacheCacher_1.default({ bookCacheUrl: config.fallbackBookCacheUrl });
            }
        }
        ServiceWorkerCacher.prototype.enable = function () {
            return __awaiter(this, void 0, void 0, function () {
                var err_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.fallbackCacher)
                                return [3 /*break*/, 1];
                            return [2 /*return*/, this.fallbackCacher.enable()];
                        case 1:
                            if (!(this.areServiceWorkersSupported && (this.cacheStatus !== Cacher_2.CacheStatus.Downloaded)))
                                return [3 /*break*/, 5];
                            this.cacheStatus = Cacher_2.CacheStatus.Downloading;
                            this.updateStatus();
                            navigator.serviceWorker.register(this.serviceWorkerUrl.href);
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.verifyAndCacheManifest(this.manifestUrl)];
                        case 3:
                            _a.sent();
                            this.cacheStatus = Cacher_2.CacheStatus.Downloaded;
                            this.updateStatus();
                            return [3 /*break*/, 5];
                        case 4:
                            err_2 = _a.sent();
                            this.cacheStatus = Cacher_2.CacheStatus.Error;
                            this.updateStatus();
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/, new Promise(function (resolve) { return resolve(); })];
                    }
                });
            });
        };
        ServiceWorkerCacher.prototype.verifyAndCacheManifest = function (manifestUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var urlsToCache, _i, _a, url, promises, _b, promises_1, promise, err_3;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, navigator.serviceWorker.ready];
                        case 1:
                            _c.sent();
                            _c.label = 2;
                        case 2:
                            _c.trys.push([2, 7, , 8]);
                            urlsToCache = [manifestUrl.href];
                            for (_i = 0, _a = this.staticFileUrls; _i < _a.length; _i++) {
                                url = _a[_i];
                                urlsToCache.push(url.href);
                            }
                            promises = [this.cacheManifest(manifestUrl), this.cacheUrls(urlsToCache, manifestUrl)];
                            _b = 0, promises_1 = promises;
                            _c.label = 3;
                        case 3:
                            if (!(_b < promises_1.length))
                                return [3 /*break*/, 6];
                            promise = promises_1[_b];
                            return [4 /*yield*/, promise];
                        case 4:
                            _c.sent();
                            _c.label = 5;
                        case 5:
                            _b++;
                            return [3 /*break*/, 3];
                        case 6: return [2 /*return*/, new Promise(function (resolve) { return resolve(); })];
                        case 7:
                            err_3 = _c.sent();
                            return [2 /*return*/, new Promise(function (_, reject) { return reject(err_3); })];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        ServiceWorkerCacher.prototype.cacheUrls = function (urls, manifestUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var cache;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, window.caches.open(manifestUrl.href)];
                        case 1:
                            cache = _a.sent();
                            return [2 /*return*/, cache.addAll(urls.map(function (url) { return new URL(url, manifestUrl.href).href; }))];
                    }
                });
            });
        };
        ServiceWorkerCacher.prototype.cacheManifest = function (manifestUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var manifest, promises, _i, promises_2, promise;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Manifest_1.default.getManifest(manifestUrl, this.store)];
                        case 1:
                            manifest = _a.sent();
                            promises = [this.cacheSpine(manifest, manifestUrl), this.cacheResources(manifest, manifestUrl)];
                            _i = 0, promises_2 = promises;
                            _a.label = 2;
                        case 2:
                            if (!(_i < promises_2.length))
                                return [3 /*break*/, 5];
                            promise = promises_2[_i];
                            return [4 /*yield*/, promise];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [2 /*return*/, new Promise(function (resolve) { return resolve(); })];
                    }
                });
            });
        };
        ServiceWorkerCacher.prototype.cacheSpine = function (manifest, manifestUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var urls, _i, _a, resource;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            urls = [];
                            for (_i = 0, _a = manifest.spine; _i < _a.length; _i++) {
                                resource = _a[_i];
                                if (resource.href) {
                                    urls.push(resource.href);
                                }
                            }
                            return [4 /*yield*/, this.cacheUrls(urls, manifestUrl)];
                        case 1: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        ServiceWorkerCacher.prototype.cacheResources = function (manifest, manifestUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var urls, _i, _a, resource;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            urls = [];
                            for (_i = 0, _a = manifest.resources; _i < _a.length; _i++) {
                                resource = _a[_i];
                                if (resource.href) {
                                    urls.push(resource.href);
                                }
                            }
                            return [4 /*yield*/, this.cacheUrls(urls, manifestUrl)];
                        case 1: return [2 /*return*/, _b.sent()];
                    }
                });
            });
        };
        ServiceWorkerCacher.prototype.onStatusUpdate = function (callback) {
            if (this.fallbackCacher) {
                this.fallbackCacher.onStatusUpdate(callback);
            }
            else {
                this.statusUpdateCallback = callback;
                this.updateStatus();
            }
        };
        ServiceWorkerCacher.prototype.getStatus = function () {
            return this.cacheStatus;
        };
        ServiceWorkerCacher.prototype.updateStatus = function () {
            this.statusUpdateCallback(this.cacheStatus);
        };
        return ServiceWorkerCacher;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Class that caches responses using ServiceWorker's Cache API, and optionally
        falls back to the application cache if service workers aren't available. */
    exports.default = ServiceWorkerCacher;
});
define("Navigator", ["require", "exports"], function (require, exports) {
    "use strict";
});
define("BookView", ["require", "exports"], function (require, exports) {
    "use strict";
});
define("PaginatedBookView", ["require", "exports"], function (require, exports) {
    "use strict";
});
define("BrowserUtilities", ["require", "exports"], function (require, exports) {
    "use strict";
    /** Returns the current width of the document. */
    function getWidth() {
        return document.documentElement.clientWidth;
    }
    exports.getWidth = getWidth;
    /** Returns the current height of the document. */
    function getHeight() {
        return document.documentElement.clientHeight;
    }
    exports.getHeight = getHeight;
    /** Returns true if the browser is zoomed in with pinch-to-zoom on mobile. */
    function isZoomed() {
        return (getWidth() !== window.innerWidth);
    }
    exports.isZoomed = isZoomed;
});
define("HTMLUtilities", ["require", "exports"], function (require, exports) {
    "use strict";
    /** Returns a single element matching the selector within the parentElement,
        or null if no element matches. */
    function findElement(parentElement, selector) {
        return parentElement.querySelector(selector);
    }
    exports.findElement = findElement;
    /** Returns a single element matching the selector within the parent element,
        or throws an exception if no element matches. */
    function findRequiredElement(parentElement, selector) {
        var element = findElement(parentElement, selector);
        if (!element) {
            throw "required element " + selector + " not found";
        }
        else {
            return element;
        }
    }
    exports.findRequiredElement = findRequiredElement;
});
define("ScrollingBookView", ["require", "exports", "BrowserUtilities", "HTMLUtilities"], function (require, exports, BrowserUtilities, HTMLUtilities) {
    "use strict";
    var ScrollingBookView = (function () {
        function ScrollingBookView() {
            this.name = "scrolling-book-view";
            this.label = "Scrolling";
            this.sideMargin = 0;
            this.height = 0;
        }
        ScrollingBookView.prototype.setIFrameSize = function () {
            // Remove previous iframe height so body scroll height will be accurate.
            this.bookElement.style.height = "";
            this.bookElement.style.width = BrowserUtilities.getWidth() + "px";
            var body = HTMLUtilities.findRequiredElement(this.bookElement.contentDocument, "body");
            var width = (BrowserUtilities.getWidth() - this.sideMargin * 2) + "px";
            body.style.width = width;
            body.style.marginLeft = this.sideMargin + "px";
            body.style.marginRight = this.sideMargin + "px";
            var minHeight = this.height;
            var bodyHeight = body.scrollHeight;
            this.bookElement.style.height = Math.max(minHeight, bodyHeight) + "px";
            var images = Array.prototype.slice.call(body.querySelectorAll("img"));
            for (var _i = 0, images_1 = images; _i < images_1.length; _i++) {
                var image = images_1[_i];
                image.style.maxWidth = width;
            }
        };
        ScrollingBookView.prototype.start = function (position) {
            this.goToPosition(position);
        };
        ScrollingBookView.prototype.stop = function () {
            this.bookElement.style.height = "";
            this.bookElement.style.width = "";
            var body = HTMLUtilities.findRequiredElement(this.bookElement.contentDocument, "body");
            body.style.width = "";
            body.style.marginLeft = "";
            body.style.marginRight = "";
            var images = Array.prototype.slice.call(body.querySelectorAll("img"));
            for (var _i = 0, images_2 = images; _i < images_2.length; _i++) {
                var image = images_2[_i];
                image.style.maxWidth = "";
            }
        };
        ScrollingBookView.prototype.getCurrentPosition = function () {
            return document.body.scrollTop / document.body.scrollHeight;
        };
        ScrollingBookView.prototype.atBottom = function () {
            return (document.body.scrollHeight - document.body.scrollTop) === BrowserUtilities.getHeight();
        };
        ScrollingBookView.prototype.goToPosition = function (position) {
            this.setIFrameSize();
            document.body.scrollTop = document.body.scrollHeight * position;
        };
        ScrollingBookView.prototype.goToElement = function (elementId) {
            var element = this.bookElement.contentDocument.getElementById(elementId);
            if (element) {
                // Put the element as close to the top as possible.
                element.scrollIntoView();
                // Unless we're already at the bottom, scroll up so the element is
                // in the middle, and not covered by the top nav.
                if ((document.body.scrollHeight - element.offsetTop) >= this.height) {
                    document.body.scrollTop = Math.max(0, document.body.scrollTop - this.height / 3);
                }
            }
        };
        return ScrollingBookView;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = ScrollingBookView;
});
define("BookSettings", ["require", "exports", "HTMLUtilities"], function (require, exports, HTMLUtilities) {
    "use strict";
    var template = function (sections) { return "\n    <ul class=\"settings-menu\" role=\"menu\">\n        " + sections + "\n    </ul>\n"; };
    var sectionTemplate = function (options) { return "\n    <li><ul class=\"settings-options\">\n        " + options + "\n    </ul></li>\n"; };
    var optionTemplate = function (liClassName, buttonClassName, label, role, svgIcon, buttonId) { return "\n    <li class='" + liClassName + "'><button id='" + buttonId + "' class='" + buttonClassName + "' role='" + role + "' tabindex=-1>" + label + svgIcon + "</button></li>\n"; };
    var offlineTemplate = "\n    <li>\n        <div class='offline-status'></div>\n    </li>\n";
    var decreaseSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" preserveAspectRatio=\"xMidYMid meet\" role=\"img\" aria-labelledby=\"decrease-font-size\" class=\"icon\">\n  <title id=\"decrease-font-size\">Decrease Font Size</title>\n    <path d=\"M30,0A30,30,0,1,0,60,30,30,30,0,0,0,30,0ZM47.41144,32h-35V28h35Z\"/>\n</svg>\n";
    var increaseSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" preserveAspectRatio=\"xMidYMid meet\" role=\"img\" aria-labelledby=\"increase-font-size\" class=\"icon\">\n  <title id=\"increase-font-size\">Increase Font Size</title>\n    <path d=\"M30,0A30,30,0,1,0,60,30,30,30,0,0,0,30,0ZM47.41144,32h-15.5V47.49841h-4V32h-15.5V28h15.5V12.49841h4V28h15.5Z\"/>\n</svg>\n";
    var checkSvg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 45 32\" preserveAspectRatio=\"xMidYMid meet\" class=\"checkedIcon\" aria-label=\"check-icon\" role=\"img\">\n  <title>check icon</title>\n  <path d=\"M18.05257,31.0625,2.00775,15.01814a1,1,0,0,1,0-1.41422l2.535-2.535a1,1,0,0,1,1.4142,0L18.05257,23.16406,40.57154.646a1,1,0,0,1,1.4142,0l2.535,2.535a1,1,0,0,1,0,1.41423Z\" />\n</svg>\n";
    var BookSettings = (function () {
        function BookSettings(store, bookViews, fontSizes) {
            this.viewChangeCallback = function () { };
            this.fontSizeChangeCallback = function () { };
            this.store = store;
            this.bookViews = bookViews;
            this.fontSizes = fontSizes;
        }
        BookSettings.create = function (config) {
            return __awaiter(this, void 0, void 0, function () {
                var fontSizes, settings;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            fontSizes = config.fontSizesInPixels.map(function (fontSize) { return fontSize + "px"; });
                            settings = new this(config.store, config.bookViews, fontSizes);
                            return [4 /*yield*/, settings.initializeSelections(config.defaultFontSizeInPixels ? config.defaultFontSizeInPixels + "px" : undefined)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, settings];
                    }
                });
            });
        };
        BookSettings.prototype.initializeSelections = function (defaultFontSize) {
            return __awaiter(this, void 0, void 0, function () {
                var selectedView, selectedViewName, _i, _a, bookView, selectedFontSize, selectedFontSizeIsAvailable, averageFontSizeIndex;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!(this.bookViews.length >= 1))
                                return [3 /*break*/, 2];
                            selectedView = this.bookViews[0];
                            return [4 /*yield*/, this.store.get(BookSettings.SELECTED_VIEW_KEY)];
                        case 1:
                            selectedViewName = _b.sent();
                            if (selectedViewName) {
                                for (_i = 0, _a = this.bookViews; _i < _a.length; _i++) {
                                    bookView = _a[_i];
                                    if (bookView.name === selectedViewName) {
                                        selectedView = bookView;
                                        break;
                                    }
                                }
                            }
                            this.selectedView = selectedView;
                            _b.label = 2;
                        case 2:
                            if (!(this.fontSizes.length >= 1))
                                return [3 /*break*/, 4];
                            return [4 /*yield*/, this.store.get(BookSettings.SELECTED_FONT_SIZE_KEY)];
                        case 3:
                            selectedFontSize = _b.sent();
                            selectedFontSizeIsAvailable = (selectedFontSize && this.fontSizes.indexOf(selectedFontSize) !== -1);
                            // If not, or the user selected a size that's no longer an option, is there a default font size?
                            if ((!selectedFontSize || !selectedFontSizeIsAvailable) && defaultFontSize) {
                                selectedFontSize = defaultFontSize;
                                selectedFontSizeIsAvailable = (selectedFontSize && this.fontSizes.indexOf(selectedFontSize) !== -1);
                            }
                            // If there's no selection and no default, pick a font size in the middle of the options.
                            if (!selectedFontSize || !selectedFontSizeIsAvailable) {
                                averageFontSizeIndex = Math.floor(this.fontSizes.length / 2);
                                selectedFontSize = this.fontSizes[averageFontSizeIndex];
                            }
                            this.selectedFontSize = selectedFontSize;
                            _b.label = 4;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        BookSettings.prototype.renderControls = function (element) {
            var sections = [];
            if (this.bookViews.length > 1) {
                var viewOptions = this.bookViews.map(function (bookView) {
                    return optionTemplate("reading-style", bookView.name, bookView.label, "menuitem", checkSvg, bookView.label);
                });
                sections.push(sectionTemplate(viewOptions.join("")));
            }
            if (this.fontSizes.length > 1) {
                var fontSizeLabel = "<li class='font-size-label'>A</li>";
                var fontSizeOptions = optionTemplate("font-setting", "decrease", decreaseSvg, "menuitem", "", "decrease-font") + fontSizeLabel + optionTemplate("font-setting", "increase", increaseSvg, "menuitem", "", "increase-font");
                sections.push(sectionTemplate(fontSizeOptions));
            }
            sections.push(offlineTemplate);
            element.innerHTML = template(sections.join(""));
            this.viewButtons = {};
            if (this.bookViews.length > 1) {
                for (var _i = 0, _a = this.bookViews; _i < _a.length; _i++) {
                    var bookView = _a[_i];
                    this.viewButtons[bookView.name] = HTMLUtilities.findRequiredElement(element, "button[class=" + bookView.name + "]");
                }
                this.updateViewButtons();
            }
            this.fontSizeButtons = {};
            if (this.fontSizes.length > 1) {
                for (var _b = 0, _c = ["decrease", "increase"]; _b < _c.length; _b++) {
                    var fontSizeName = _c[_b];
                    this.fontSizeButtons[fontSizeName] = HTMLUtilities.findRequiredElement(element, "button[class=" + fontSizeName + "]");
                }
                this.fontSizeLabel = HTMLUtilities.findRequiredElement(element, 'li[class="font-size-label"]');
                this.updateFontSizeButtons();
            }
            this.offlineStatusElement = HTMLUtilities.findRequiredElement(element, 'div[class="offline-status"]');
            this.setupEvents();
            // Clicking the settings view outside the ul hides it, but clicking inside the ul keeps it up.
            HTMLUtilities.findRequiredElement(element, "ul").addEventListener("click", function (event) {
                event.stopPropagation();
            });
        };
        BookSettings.prototype.onViewChange = function (callback) {
            this.viewChangeCallback = callback;
        };
        BookSettings.prototype.onFontSizeChange = function (callback) {
            this.fontSizeChangeCallback = callback;
        };
        BookSettings.prototype.setupEvents = function () {
            var _this = this;
            var _loop_1 = function (view) {
                var button = this_1.viewButtons[view.name];
                if (button) {
                    button.addEventListener("click", function (event) {
                        var position = _this.selectedView.getCurrentPosition();
                        _this.selectedView.stop();
                        view.start(position);
                        _this.selectedView = view;
                        _this.updateViewButtons();
                        _this.storeSelectedView(view);
                        _this.viewChangeCallback();
                        event.preventDefault();
                    });
                }
            };
            var this_1 = this;
            for (var _i = 0, _a = this.bookViews; _i < _a.length; _i++) {
                var view = _a[_i];
                _loop_1(view);
            }
            if (this.fontSizes.length > 1) {
                this.fontSizeButtons["decrease"].addEventListener("click", function (event) {
                    var currentFontSizeIndex = _this.fontSizes.indexOf(_this.selectedFontSize);
                    if (currentFontSizeIndex > 0) {
                        var newFontSize = _this.fontSizes[currentFontSizeIndex - 1];
                        _this.selectedFontSize = newFontSize;
                        _this.fontSizeChangeCallback();
                        _this.updateFontSizeButtons();
                        _this.storeSelectedFontSize(newFontSize);
                    }
                    event.preventDefault();
                });
                this.fontSizeButtons["increase"].addEventListener("click", function (event) {
                    var currentFontSizeIndex = _this.fontSizes.indexOf(_this.selectedFontSize);
                    if (currentFontSizeIndex < _this.fontSizes.length - 1) {
                        var newFontSize = _this.fontSizes[currentFontSizeIndex + 1];
                        _this.selectedFontSize = newFontSize;
                        _this.fontSizeChangeCallback();
                        _this.updateFontSizeButtons();
                        _this.storeSelectedFontSize(newFontSize);
                    }
                    event.preventDefault();
                });
            }
        };
        BookSettings.prototype.updateViewButtons = function () {
            for (var _i = 0, _a = this.bookViews; _i < _a.length; _i++) {
                var view = _a[_i];
                if (view === this.selectedView) {
                    this.viewButtons[view.name].className = view.name + " active";
                    this.viewButtons[view.name].setAttribute("aria-label", view.label + " mode enabled");
                }
                else {
                    this.viewButtons[view.name].className = view.name;
                    this.viewButtons[view.name].setAttribute("aria-label", view.label + " mode disabled");
                }
            }
        };
        BookSettings.prototype.updateFontSizeButtons = function () {
            var currentFontSizeIndex = this.fontSizes.indexOf(this.selectedFontSize);
            if (currentFontSizeIndex === 0) {
                this.fontSizeButtons["decrease"].className = "decrease disabled";
            }
            else {
                this.fontSizeButtons["decrease"].className = "decrease";
            }
            if (currentFontSizeIndex === this.fontSizes.length - 1) {
                this.fontSizeButtons["increase"].className = "increase disabled";
            }
            else {
                this.fontSizeButtons["increase"].className = "increase";
            }
        };
        BookSettings.prototype.getSelectedView = function () {
            return this.selectedView;
        };
        BookSettings.prototype.getSelectedFontSize = function () {
            return this.selectedFontSize;
        };
        BookSettings.prototype.getOfflineStatusElement = function () {
            return this.offlineStatusElement;
        };
        BookSettings.prototype.storeSelectedView = function (view) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.store.set(BookSettings.SELECTED_VIEW_KEY, view.name)];
                });
            });
        };
        BookSettings.prototype.storeSelectedFontSize = function (fontSize) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.store.set(BookSettings.SELECTED_FONT_SIZE_KEY, fontSize)];
                });
            });
        };
        return BookSettings;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = BookSettings;
    BookSettings.SELECTED_VIEW_KEY = "settings-selected-view";
    BookSettings.SELECTED_FONT_SIZE_KEY = "settings-selected-font-size";
    ;
});
define("EventHandler", ["require", "exports", "BrowserUtilities"], function (require, exports, BrowserUtilities) {
    "use strict";
    var EventHandler = (function () {
        function EventHandler() {
            var _this = this;
            this.pendingMouseEventStart = null;
            this.pendingMouseEventEnd = null;
            this.pendingTouchEventStart = null;
            this.pendingTouchEventEnd = null;
            this.onLeftTap = function () { };
            this.onMiddleTap = function () { };
            this.onRightTap = function () { };
            this.onBackwardSwipe = function () { };
            this.onForwardSwipe = function () { };
            this.onLeftHover = function () { };
            this.onRightHover = function () { };
            this.onRemoveHover = function () { };
            this.handleMouseEventStart = function (event) {
                _this.pendingMouseEventStart = event;
            };
            this.handleTouchEventStart = function (event) {
                if (BrowserUtilities.isZoomed()) {
                    return;
                }
                if (event.changedTouches.length !== 1) {
                    // This is a multi-touch event. Ignore.
                    return;
                }
                _this.pendingTouchEventStart = event;
            };
            this.handleMouseEventEnd = function (event) {
                if (!_this.pendingMouseEventStart) {
                    // Somehow we got an end event without a start event. Ignore it.
                    return;
                }
                var devicePixelRatio = window.devicePixelRatio;
                var xDevicePixels = (_this.pendingMouseEventStart.clientX - event.clientX) / devicePixelRatio;
                var yDevicePixels = (_this.pendingMouseEventStart.clientY - event.clientY) / devicePixelRatio;
                // Is the end event in the same place as the start event?
                if (Math.abs(xDevicePixels) < EventHandler.CLICK_PIXEL_TOLERANCE && Math.abs(yDevicePixels) < EventHandler.CLICK_PIXEL_TOLERANCE) {
                    if (_this.pendingMouseEventEnd) {
                        // This was a double click. Let the browser handle it.
                        _this.pendingMouseEventStart = null;
                        _this.pendingMouseEventEnd = null;
                        return;
                    }
                    // This was a single click.
                    _this.pendingMouseEventStart = null;
                    _this.pendingMouseEventEnd = event;
                    setTimeout(_this.handleClick, EventHandler.DOUBLE_CLICK_MS);
                    return;
                }
                _this.pendingMouseEventEnd = null;
                // This is a swipe or highlight. Let the browser handle it.
                // (Swipes aren't handled on desktop.)
                _this.pendingMouseEventStart = null;
            };
            this.handleTouchEventEnd = function (event) {
                if (BrowserUtilities.isZoomed()) {
                    return;
                }
                if (event.changedTouches.length !== 1) {
                    // This is a multi-touch event. Ignore.
                    return;
                }
                if (!_this.pendingTouchEventStart) {
                    // Somehow we got an end event without a start event. Ignore it.
                    return;
                }
                var startTouch = _this.pendingTouchEventStart.changedTouches[0];
                var endTouch = event.changedTouches[0];
                if (!startTouch) {
                    // Somehow we saved a touch event with no touches.
                    return;
                }
                var devicePixelRatio = window.devicePixelRatio;
                var xDevicePixels = (startTouch.clientX - endTouch.clientX) / devicePixelRatio;
                var yDevicePixels = (startTouch.clientY - endTouch.clientY) / devicePixelRatio;
                // Is the end event in the same place as the start event?
                if (Math.abs(xDevicePixels) < EventHandler.TAP_PIXEL_TOLERANCE && Math.abs(yDevicePixels) < EventHandler.TAP_PIXEL_TOLERANCE) {
                    if (_this.pendingTouchEventEnd) {
                        // This was a double tap. Let the browser handle it.
                        _this.pendingTouchEventStart = null;
                        _this.pendingTouchEventEnd = null;
                        return;
                    }
                    // This was a single tap or long press.
                    if (event.timeStamp - _this.pendingTouchEventStart.timeStamp > EventHandler.LONG_PRESS_MS) {
                        // This was a long press. Let the browser handle it.
                        _this.pendingTouchEventStart = null;
                        _this.pendingTouchEventEnd = null;
                        return;
                    }
                    // This was a single tap.
                    _this.pendingTouchEventStart = null;
                    _this.pendingTouchEventEnd = event;
                    setTimeout(_this.handleTap, EventHandler.DOUBLE_TAP_MS);
                    return;
                }
                _this.pendingTouchEventEnd = null;
                if (event.timeStamp - _this.pendingTouchEventStart.timeStamp > EventHandler.SLOW_SWIPE_MS) {
                    // This is a slow swipe / highlight. Let the browser handle it.
                    _this.pendingTouchEventStart = null;
                    return;
                }
                // This is a swipe. 
                var slope = (startTouch.clientY - endTouch.clientY) / (startTouch.clientX - endTouch.clientX);
                if (Math.abs(slope) > 0.5) {
                    // This is a mostly vertical swipe. Ignore.
                    _this.pendingTouchEventStart = null;
                    return;
                }
                // This was a horizontal swipe.
                if (xDevicePixels < 0) {
                    _this.onBackwardSwipe(event);
                }
                else {
                    _this.onForwardSwipe(event);
                }
                _this.pendingTouchEventStart = null;
            };
            this.handleClick = function () {
                if (!_this.pendingMouseEventEnd) {
                    // Another click happened already.
                    return;
                }
                if (_this.checkForLink(_this.pendingMouseEventEnd)) {
                    // This was a single click on a link. Do nothing.
                    _this.pendingMouseEventEnd = null;
                    return;
                }
                // This was a single click.
                var x = _this.pendingMouseEventEnd.clientX;
                var width = window.innerWidth;
                if (x / width < 0.3) {
                    _this.onLeftTap(_this.pendingMouseEventEnd);
                }
                else if (x / width > 0.7) {
                    _this.onRightTap(_this.pendingMouseEventEnd);
                }
                else {
                    _this.onMiddleTap(_this.pendingMouseEventEnd);
                }
                _this.pendingMouseEventEnd = null;
                return;
            };
            this.handleTap = function () {
                if (!_this.pendingTouchEventEnd) {
                    // Another tap happened already.
                    return;
                }
                if (_this.checkForLink(_this.pendingTouchEventEnd)) {
                    // This was a single tap on a link. Do nothing.
                    _this.pendingTouchEventEnd = null;
                    return;
                }
                // This was a single tap.
                var touch = _this.pendingTouchEventEnd.changedTouches[0];
                if (!touch) {
                    // Somehow we got a touch event with no touches.
                    return;
                }
                var x = touch.clientX;
                var width = window.innerWidth;
                if (x / width < 0.3) {
                    _this.onLeftTap(_this.pendingTouchEventEnd);
                }
                else if (x / width > 0.7) {
                    _this.onRightTap(_this.pendingTouchEventEnd);
                }
                else {
                    _this.onMiddleTap(_this.pendingTouchEventEnd);
                }
                _this.pendingTouchEventEnd = null;
                return;
            };
            this.checkForLink = function (event) {
                var nextElement = event.target;
                while (nextElement && nextElement.tagName.toLowerCase() !== "body") {
                    if (nextElement.tagName.toLowerCase() === "a" && nextElement.href) {
                        return nextElement;
                    }
                    else {
                        nextElement = nextElement.parentElement;
                    }
                }
                return null;
            };
            this.handleMouseMove = function (event) {
                var x = event.clientX;
                var width = window.innerWidth;
                if (x / width < 0.3) {
                    _this.onLeftHover();
                }
                else if (x / width > 0.7) {
                    _this.onRightHover();
                }
                else {
                    _this.onRemoveHover();
                }
            };
            this.handleMouseLeave = function () {
                _this.onRemoveHover();
            };
            this.handleExternalLinks = function (event) {
                var link = _this.checkForLink(event);
                if (link) {
                    // Open external links in new tabs.
                    var isSameOrigin = (window.location.protocol === link.protocol &&
                        window.location.port === link.port &&
                        window.location.hostname === link.hostname);
                    if (!isSameOrigin) {
                        window.open(link.href, "_blank");
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            };
        }
        EventHandler.prototype.setupEvents = function (element) {
            if (this.isTouchDevice()) {
                element.addEventListener("touchstart", this.handleTouchEventStart.bind(this));
                element.addEventListener("touchend", this.handleTouchEventEnd.bind(this));
            }
            else {
                element.addEventListener("mousedown", this.handleMouseEventStart.bind(this));
                element.addEventListener("mouseup", this.handleMouseEventEnd.bind(this));
                element.addEventListener("mouseenter", this.handleMouseMove.bind(this));
                element.addEventListener("mousemove", this.handleMouseMove.bind(this));
                element.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
            }
            // Most click handling is done in the touchend and mouseup event handlers,
            // but if there's a click on an external link we need to cancel the click
            // event to prevent it from opening in the iframe.
            element.addEventListener("click", this.handleExternalLinks.bind(this));
        };
        EventHandler.prototype.isTouchDevice = function () {
            return !!('ontouchstart' in window || navigator.maxTouchPoints);
        };
        return EventHandler;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = EventHandler;
    EventHandler.CLICK_PIXEL_TOLERANCE = 10;
    EventHandler.TAP_PIXEL_TOLERANCE = 10;
    EventHandler.DOUBLE_CLICK_MS = 200;
    EventHandler.LONG_PRESS_MS = 500;
    EventHandler.DOUBLE_TAP_MS = 200;
    EventHandler.SLOW_SWIPE_MS = 500;
});
define("IFrameNavigator", ["require", "exports", "Cacher", "Manifest", "EventHandler", "BrowserUtilities", "HTMLUtilities"], function (require, exports, Cacher_3, Manifest_2, EventHandler_1, BrowserUtilities, HTMLUtilities) {
    "use strict";
    var upLinkTemplate = function (href, label, ariaLabel) { return "\n  <a rel=\"up\" href='" + href + "' aria-label=\"" + ariaLabel + "\">\n    <svg width=\"16\" height=\"25\" viewBox=\"0 0 16 25\" aria-labelledby=\"up-label\" preserveAspectRatio=\"xMidYMid meet\" role=\"img\" class=\"icon\">\n      <title id=\"up-label\">" + label + "</title>\n      <polygon points=\"16 1.741 13.9 0 0 12.5 13.9 25 16 23.258 4.036 12.499 16 1.741\" />\n    </svg>\n    <span class=\"setting-text up\">" + label + "</span>\n  </a>\n"; };
    var template = "\n  <nav class=\"publication\">\n    <div class=\"controls\">\n      <svg xmlns=\"http://www.w3.org/2000/svg\" preserveAspectRatio=\"xMidYMid meet\" class=\"svgIcon use\">\n          <defs>\n            <symbol id=\"close-icon\" viewBox=\"0 0 29.69 29.812\">\n              <title>Close Icon</title>\n              <path d=\"M2081.71,127.488l26.79-26.879a1.459,1.459,0,0,1,2.06,2.068l-26.79,26.879a1.453,1.453,0,0,1-2.06,0A1.483,1.483,0,0,1,2081.71,127.488Z\" transform=\"translate(-2081.31 -100.188)\"/>\n              <path d=\"M2083.77,100.609l26.79,26.879a1.459,1.459,0,0,1-2.06,2.068l-26.79-26.879a1.483,1.483,0,0,1,0-2.068A1.453,1.453,0,0,1,2083.77,100.609Z\" transform=\"translate(-2081.31 -100.188)\"/>\n            </symbol>\n        </defs>\n      </svg>\n      <a href=\"#settings-control\" class=\"scrolling-suggestion\" style=\"display: none\">\n          We recommend scrolling mode for use with screen readers and keyboard navigation.\n          Go to settings to switch to scrolling mode.\n      </a>\n      <ul class=\"links top active\">\n        <li>\n          <button class=\"contents disabled\" aria-labelledby=\"table-of-contents\" aria-haspopup=\"true\" aria-expanded=\"false\">\n            <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 275 180\" aria-labelledby=\"table-of-contents\" preserveAspectRatio=\"xMidYMid meet\" role=\"img\" class=\"icon open\">\n            <title id=\"table-of-contents\">table of contents</title>\n              <rect x=\"66\" y=\"152\" width=\"209\" height=\"28\"/>\n              <rect x=\"66\" y=\"76\" width=\"209\" height=\"28\"/>\n              <rect x=\"66\" width=\"209\" height=\"28\"/>\n              <rect width=\"33\" height=\"28\"/>\n              <rect y=\"76\" width=\"33\" height=\"28\"/>\n              <rect y=\"152\" width=\"33\" height=\"28\"/>\n            </svg>\n            <svg class=\"icon close inactive-icon\" role=\"img\" aria-labelledby=\"close-icon\">\n              <use xlink:href=\"#close-icon\"></use>\n            </svg>\n            <span class=\"setting-text contents\" id=\"contents\">Contents</span>\n          </button>\n          <div class=\"contents-view controls-view inactive\" aria-hidden=\"true\"></div>\n        </li>\n        <li>\n          <button id=\"settings-control\" class=\"settings\" aria-labelledby=\"settings\" aria-expanded=\"false\" aria-haspopup=\"true\">\n            <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 186.47158 186.4716\" aria-labelledby=\"settings\" preserveAspectRatio=\"xMidYMid meet\" role=\"img\" class=\"icon open\">\n              <title id=\"settings\">Settings</title>\n              <path d=\"M183.29465,117.36676l3.17693-24.131-23.52051-9.17834-4.75089-17.73081,15.78033-19.70844L159.1637,27.30789,136.04194,37.44974,120.145,28.2714,117.36676,3.17693,93.2358,0,84.05746,23.52051,66.32665,28.2714,46.61759,12.49107,27.30789,27.30789,37.44974,50.42966l-9.17834,15.897L3.17693,69.10484,0,93.2358l23.52051,9.17834L28.2714,120.145,12.49107,139.854l14.81682,19.3097,23.12177-10.14185,15.897,9.17834,2.77819,25.09447,24.131,3.17693,9.17834-23.52051L120.145,158.2002l19.70844,15.78033,19.31031-14.81682-10.14185-23.12177,9.17834-15.897ZM93.2358,129.84856A36.61276,36.61276,0,1,1,129.84856,93.2358,36.61267,36.61267,0,0,1,93.2358,129.84856Z\"/>\n              </svg>\n              <svg class=\"icon close inactive-icon\" role=\"img\" aria-labelledby=\"close-icon\">\n                <use xlink:href=\"#close-icon\"></use>\n              </svg>\n            <span class=\"setting-text settings\" aria-labelledby=\"settings\">Settings</span>\n          </button>\n          <div class=\"settings-view controls-view inactive\" aria-hidden=\"true\"></div>\n        </li>\n      </ul>\n    </div>\n    <!-- /controls -->\n  </nav>\n  <main style=\"overflow: hidden\" tabindex=-1>\n    <div class=\"loading\" style=\"display:none;\">Loading</div>\n    <div class=\"error\" style=\"display:none;\">\n      <span>There was an error loading this page.</span>\n      <button class=\"try-again\">Try again</button>\n    </div>\n    <div class=\"info top\">\n      <span class=\"book-title\"></span>\n    </div>\n    <iframe title=\"book text\" style=\"border:0; overflow: hidden;\"></iframe>\n    <div class=\"info bottom\">\n      <span class=\"chapter-position\"></span>\n      <span class=\"chapter-title\"></span>\n    </div>\n  </main>\n  <nav class=\"publication\">\n    <div class=\"controls\">\n      <ul class=\"links bottom active\">\n        <li>\n          <a rel=\"prev\" class=\"disabled\" role=\"button\" aria-labelledby=\"left-arrow-icon\">\n          <svg class=\"icon\" role=\"img\" preserveAspectRatio=\"xMidYMid meet\" viewBox=\"0 0 13.43359 24.06299\">\n            <title id=\"left-arrow-icon\">Previous Chapter</title>\n              <polygon points=\"11.995 24.063 0 12.019 12.02 0 13.434 1.414 2.825 12.022 13.413 22.651 11.995 24.063\"/>\n            </svg>\n          <span class=\"chapter-control\">Previous Chapter</span>\n          </a>\n        </li>\n        <li aria-label=\"chapters\">Chapters</li>\n        <li>\n          <a rel=\"next\" class=\"disabled\" role=\"button\" aria-labelledby=\"right-arrow-icon\">\n            <span class=\"chapter-control\">Next Chapter</span>\n            <svg class=\"icon\" role=\"img\" preserveAspectRatio=\"xMidYMid meet\" viewBox=\"0 0 13.43359 24.06299\">\n            <title id=\"right-arrow-icon\">Next Chapter</title>\n              <polygon points=\"1.438 0 13.434 12.044 1.414 24.063 0 22.649 10.608 12.041 0.021 1.412 1.438 0\"/>\n            </svg>\n          </a>\n        </li>\n      </ul>\n    </div>\n    <!-- /controls -->\n  </nav>\n";
    /** Class that shows webpub resources in an iframe, with navigation controls outside the iframe. */
    var IFrameNavigator = (function () {
        function IFrameNavigator(store, cacher, settings, annotator, paginator, scroller, eventHandler, upLinkConfig) {
            if (annotator === void 0) { annotator = null; }
            if (paginator === void 0) { paginator = null; }
            if (scroller === void 0) { scroller = null; }
            if (eventHandler === void 0) { eventHandler = null; }
            if (upLinkConfig === void 0) { upLinkConfig = null; }
            this.upLink = null;
            this.store = store;
            this.cacher = cacher;
            this.paginator = paginator;
            this.scroller = scroller;
            this.annotator = annotator;
            this.settings = settings;
            this.eventHandler = eventHandler || new EventHandler_1.default();
            this.upLinkConfig = upLinkConfig;
        }
        IFrameNavigator.create = function (config) {
            return __awaiter(this, void 0, void 0, function () {
                var navigator;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            navigator = new this(config.store, config.cacher, config.settings, config.annotator || null, config.paginator || null, config.scroller || null, config.eventHandler || null, config.upLink || null);
                            return [4 /*yield*/, navigator.start(config.element, config.manifestUrl)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, navigator];
                    }
                });
            });
        };
        IFrameNavigator.prototype.start = function (element, manifestUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var settingsButtons, lastSettingsButton, err_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            element.innerHTML = template;
                            this.manifestUrl = manifestUrl;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            this.iframe = HTMLUtilities.findRequiredElement(element, "iframe");
                            this.scrollingSuggestion = HTMLUtilities.findRequiredElement(element, ".scrolling-suggestion");
                            this.nextChapterLink = HTMLUtilities.findRequiredElement(element, "a[rel=next]");
                            this.previousChapterLink = HTMLUtilities.findRequiredElement(element, "a[rel=prev]");
                            this.contentsControl = HTMLUtilities.findRequiredElement(element, "button.contents");
                            this.settingsControl = HTMLUtilities.findRequiredElement(element, "button.settings");
                            this.links = HTMLUtilities.findRequiredElement(element, "ul.links.top");
                            this.linksBottom = HTMLUtilities.findRequiredElement(element, "ul.links.bottom");
                            this.tocView = HTMLUtilities.findRequiredElement(element, ".contents-view");
                            this.settingsView = HTMLUtilities.findRequiredElement(element, ".settings-view");
                            this.loadingMessage = HTMLUtilities.findRequiredElement(element, "div[class=loading]");
                            this.errorMessage = HTMLUtilities.findRequiredElement(element, "div[class=error]");
                            this.tryAgainButton = HTMLUtilities.findRequiredElement(element, "button[class=try-again]");
                            this.infoTop = HTMLUtilities.findRequiredElement(element, "div[class='info top']");
                            this.infoBottom = HTMLUtilities.findRequiredElement(element, "div[class='info bottom']");
                            this.bookTitle = HTMLUtilities.findRequiredElement(this.infoTop, "span[class=book-title]");
                            this.chapterTitle = HTMLUtilities.findRequiredElement(this.infoBottom, "span[class=chapter-title]");
                            this.chapterPosition = HTMLUtilities.findRequiredElement(this.infoBottom, "span[class=chapter-position]");
                            this.newPosition = null;
                            this.newElementId = null;
                            this.isLoading = true;
                            this.setupEvents();
                            if (this.paginator) {
                                this.paginator.bookElement = this.iframe;
                            }
                            if (this.scroller) {
                                this.scroller.bookElement = this.iframe;
                            }
                            this.settings.renderControls(this.settingsView);
                            this.settings.onViewChange(this.updateBookView.bind(this));
                            this.settings.onFontSizeChange(this.updateFontSize.bind(this));
                            settingsButtons = this.settingsView.querySelectorAll("button");
                            if (settingsButtons && settingsButtons.length > 0) {
                                lastSettingsButton = settingsButtons[settingsButtons.length - 1];
                                this.setupModalFocusTrap(this.settingsView, this.settingsControl, lastSettingsButton);
                            }
                            this.cacher.onStatusUpdate(this.updateOfflineCacheStatus.bind(this));
                            this.enableOffline();
                            if (this.scroller && (this.settings.getSelectedView() !== this.scroller)) {
                                this.scrollingSuggestion.style.display = "block";
                            }
                            return [4 /*yield*/, this.loadManifest()];
                        case 2: return [2 /*return*/, _a.sent()];
                        case 3:
                            err_4 = _a.sent();
                            // There's a mismatch between the template and the selectors above,
                            // or we weren't able to insert the template in the element.
                            return [2 /*return*/, new Promise(function (_, reject) { return reject(err_4); })];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        IFrameNavigator.prototype.setupEvents = function () {
            this.iframe.addEventListener("load", this.handleIFrameLoad.bind(this));
            window.onresize = this.handleResize.bind(this);
            this.previousChapterLink.addEventListener("click", this.handlePreviousChapterClick.bind(this));
            this.nextChapterLink.addEventListener("click", this.handleNextChapterClick.bind(this));
            this.contentsControl.addEventListener("click", this.handleContentsClick.bind(this));
            this.settingsControl.addEventListener("click", this.handleSettingsClick.bind(this));
            this.settingsView.addEventListener("click", this.handleToggleLinksClick.bind(this));
            this.tryAgainButton.addEventListener("click", this.tryAgain.bind(this));
            this.contentsControl.addEventListener("keydown", this.hideTOCOnEscape.bind(this));
            this.tocView.addEventListener("keydown", this.hideTOCOnEscape.bind(this));
            this.settingsControl.addEventListener("keydown", this.hideSettingsOnEscape.bind(this));
            this.settingsView.addEventListener("keydown", this.hideSettingsOnEscape.bind(this));
        };
        IFrameNavigator.prototype.setupModalFocusTrap = function (modal, closeButton, lastFocusableElement) {
            var _this = this;
            // Trap keyboard focus in a modal dialog when it's displayed.
            var TAB_KEY = 9;
            // Going backwards from the close button sends you to the last focusable element.
            closeButton.addEventListener("keydown", function (event) {
                if (_this.isDisplayed(modal)) {
                    var tab = (event.keyCode === TAB_KEY);
                    var shift = !!event.shiftKey;
                    if (tab && shift) {
                        lastFocusableElement.focus();
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            });
            // Going forward from the last focusable element sends you to the close button.
            lastFocusableElement.addEventListener("keydown", function (event) {
                if (_this.isDisplayed(modal)) {
                    var tab = (event.keyCode === TAB_KEY);
                    var shift = !!event.shiftKey;
                    if (tab && !shift) {
                        closeButton.focus();
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            });
        };
        IFrameNavigator.prototype.updateBookView = function () {
            var _this = this;
            var doNothing = function () { };
            if (this.settings.getSelectedView() === this.paginator) {
                this.scrollingSuggestion.style.display = "block";
                document.body.onscroll = function () { };
                this.chapterTitle.style.display = "inline";
                this.chapterPosition.style.display = "inline";
                if (this.eventHandler) {
                    this.eventHandler.onBackwardSwipe = this.handlePreviousPageClick.bind(this);
                    this.eventHandler.onForwardSwipe = this.handleNextPageClick.bind(this);
                    this.eventHandler.onLeftTap = this.handlePreviousPageClick.bind(this);
                    this.eventHandler.onMiddleTap = this.handleToggleLinksClick.bind(this);
                    this.eventHandler.onRightTap = this.handleNextPageClick.bind(this);
                    this.eventHandler.onLeftHover = this.handleLeftHover.bind(this);
                    this.eventHandler.onRightHover = this.handleRightHover.bind(this);
                    this.eventHandler.onRemoveHover = this.handleRemoveHover.bind(this);
                }
                if (this.isDisplayed(this.linksBottom)) {
                    this.toggleDisplay(this.linksBottom);
                }
            }
            else if (this.settings.getSelectedView() === this.scroller) {
                this.scrollingSuggestion.style.display = "none";
                document.body.onscroll = function () {
                    _this.saveCurrentReadingPosition();
                    if (_this.scroller && _this.scroller.atBottom()) {
                        // Bring up the bottom nav when you get to the bottom,
                        // if it wasn't already displayed.
                        if (!_this.isDisplayed(_this.linksBottom)) {
                            _this.toggleDisplay(_this.linksBottom);
                        }
                    }
                    else {
                        // Remove the bottom nav when you scroll back up,
                        // if it was displayed because you were at the bottom.
                        if (_this.isDisplayed(_this.linksBottom) && !_this.isDisplayed(_this.links)) {
                            _this.toggleDisplay(_this.linksBottom);
                        }
                    }
                };
                this.chapterTitle.style.display = "none";
                this.chapterPosition.style.display = "none";
                if (this.eventHandler) {
                    this.eventHandler.onBackwardSwipe = doNothing;
                    this.eventHandler.onForwardSwipe = doNothing;
                    this.eventHandler.onLeftTap = this.handleToggleLinksClick.bind(this);
                    this.eventHandler.onMiddleTap = this.handleToggleLinksClick.bind(this);
                    this.eventHandler.onRightTap = this.handleToggleLinksClick.bind(this);
                    this.eventHandler.onLeftHover = doNothing;
                    this.eventHandler.onRightHover = doNothing;
                    this.eventHandler.onRemoveHover = doNothing;
                    this.handleRemoveHover();
                }
                if (this.isDisplayed(this.links) && !this.isDisplayed(this.linksBottom)) {
                    this.toggleDisplay(this.linksBottom);
                }
            }
            this.updatePositionInfo();
        };
        IFrameNavigator.prototype.updateFontSize = function () {
            this.handleResize();
        };
        IFrameNavigator.prototype.enableOffline = function () {
            if (this.cacher.getStatus() !== Cacher_3.CacheStatus.Downloaded) {
                this.cacher.enable();
            }
        };
        IFrameNavigator.prototype.updateOfflineCacheStatus = function (status) {
            var statusElement = this.settings.getOfflineStatusElement();
            var statusMessage = "";
            if (status === Cacher_3.CacheStatus.Uncached) {
                statusMessage = "";
            }
            else if (status === Cacher_3.CacheStatus.UpdateAvailable) {
                statusMessage = "A new version is available. Refresh to update.";
            }
            else if (status === Cacher_3.CacheStatus.CheckingForUpdate) {
                statusMessage = "Checking for update.";
            }
            else if (status === Cacher_3.CacheStatus.Downloading) {
                statusMessage = "Downloading...";
            }
            else if (status === Cacher_3.CacheStatus.Downloaded) {
                statusMessage = "Downloaded for offline use";
            }
            else if (status === Cacher_3.CacheStatus.Error) {
                statusMessage = "Error downloading for offline use";
            }
            statusElement.innerHTML = statusMessage;
        };
        IFrameNavigator.prototype.loadManifest = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var manifest, toc, createTOC_1, upUrl, upLabel, upAriaLabel, upHTML, upParent, lastReadingPosition, startLink, startUrl, position;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Manifest_2.default.getManifest(this.manifestUrl, this.store)];
                        case 1:
                            manifest = _a.sent();
                            toc = manifest.toc;
                            if (toc.length) {
                                this.contentsControl.className = "contents";
                                createTOC_1 = function (parentElement, links) {
                                    var listElement = document.createElement("ul");
                                    var lastLink = null;
                                    var _loop_2 = function (link) {
                                        var listItemElement = document.createElement("li");
                                        var linkElement = document.createElement("a");
                                        linkElement.tabIndex = -1;
                                        var href = "";
                                        if (link.href) {
                                            href = new URL(link.href, _this.manifestUrl.href).href;
                                        }
                                        linkElement.href = href;
                                        linkElement.innerHTML = link.title || "";
                                        linkElement.addEventListener("click", function (event) {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            if (event.currentTarget.className.indexOf("active") !== -1) {
                                                // This TOC item is already loaded. Hide the TOC
                                                // but don't navigate.
                                                _this.hideTOC();
                                            }
                                            else {
                                                // Set focus back to the contents toggle button so screen readers
                                                // don't get stuck on a hidden link.
                                                _this.contentsControl.focus();
                                                _this.navigate({
                                                    resource: linkElement.href,
                                                    position: 0
                                                });
                                            }
                                        });
                                        listItemElement.appendChild(linkElement);
                                        if (link.children && link.children.length > 0) {
                                            createTOC_1(listItemElement, link.children);
                                        }
                                        listElement.appendChild(listItemElement);
                                        lastLink = linkElement;
                                    };
                                    for (var _i = 0, links_1 = links; _i < links_1.length; _i++) {
                                        var link = links_1[_i];
                                        _loop_2(link);
                                    }
                                    // Trap keyboard focus inside the TOC while it's open.
                                    if (lastLink) {
                                        _this.setupModalFocusTrap(_this.tocView, _this.contentsControl, lastLink);
                                    }
                                    parentElement.appendChild(listElement);
                                };
                                createTOC_1(this.tocView, toc);
                            }
                            else {
                                this.contentsControl.parentElement.style.display = "none";
                            }
                            if (this.upLinkConfig && this.upLinkConfig.url) {
                                upUrl = this.upLinkConfig.url;
                                upLabel = this.upLinkConfig.label || "";
                                upAriaLabel = this.upLinkConfig.ariaLabel || upLabel;
                                upHTML = upLinkTemplate(upUrl.href, upLabel, upAriaLabel);
                                upParent = document.createElement("li");
                                upParent.innerHTML = upHTML;
                                this.links.insertBefore(upParent, this.links.firstChild);
                                this.upLink = HTMLUtilities.findRequiredElement(this.links, "a[rel=up]");
                            }
                            lastReadingPosition = null;
                            if (!this.annotator)
                                return [3 /*break*/, 3];
                            return [4 /*yield*/, this.annotator.getLastReadingPosition()];
                        case 2:
                            lastReadingPosition = (_a.sent());
                            _a.label = 3;
                        case 3:
                            startLink = manifest.getStartLink();
                            startUrl = null;
                            if (startLink && startLink.href) {
                                startUrl = new URL(startLink.href, this.manifestUrl.href).href;
                            }
                            if (lastReadingPosition) {
                                this.navigate(lastReadingPosition);
                            }
                            else if (startUrl) {
                                position = {
                                    resource: startUrl,
                                    position: 0
                                };
                                this.navigate(position);
                            }
                            return [2 /*return*/, new Promise(function (resolve) { return resolve(); })];
                    }
                });
            });
        };
        IFrameNavigator.prototype.handleIFrameLoad = function () {
            return __awaiter(this, void 0, void 0, function () {
                var bookViewPosition, currentLocation, elementId, manifest, previous, next, chapterTitle, spineItem, tocItem, err_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.errorMessage.style.display = "none";
                            this.showLoadingMessageAfterDelay();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 5, , 6]);
                            this.hideTOC();
                            bookViewPosition = 0;
                            if (this.newPosition) {
                                bookViewPosition = this.newPosition.position;
                                this.newPosition = null;
                            }
                            this.updateBookView();
                            this.updateFontSize();
                            this.settings.getSelectedView().start(bookViewPosition);
                            if (this.newElementId) {
                                this.settings.getSelectedView().goToElement(this.newElementId);
                                this.newElementId = null;
                            }
                            currentLocation = this.iframe.src;
                            if (this.iframe.contentDocument && this.iframe.contentDocument.location && this.iframe.contentDocument.location.href) {
                                currentLocation = this.iframe.contentDocument.location.href;
                            }
                            if (currentLocation.indexOf("#") !== -1) {
                                elementId = currentLocation.slice(currentLocation.indexOf("#") + 1);
                                // Set the element to go to the next time the iframe loads.
                                this.newElementId = elementId;
                                // Reload the iframe without the anchor.
                                this.iframe.src = currentLocation.slice(0, currentLocation.indexOf("#"));
                                return [2 /*return*/, new Promise(function (resolve) { return resolve(); })];
                            }
                            this.updatePositionInfo();
                            return [4 /*yield*/, Manifest_2.default.getManifest(this.manifestUrl, this.store)];
                        case 2:
                            manifest = _a.sent();
                            previous = manifest.getPreviousSpineItem(currentLocation);
                            if (previous && previous.href) {
                                this.previousChapterLink.href = new URL(previous.href, this.manifestUrl.href).href;
                                this.previousChapterLink.className = "";
                            }
                            else {
                                this.previousChapterLink.removeAttribute("href");
                                this.previousChapterLink.className = "disabled";
                            }
                            next = manifest.getNextSpineItem(currentLocation);
                            if (next && next.href) {
                                this.nextChapterLink.href = new URL(next.href, this.manifestUrl.href).href;
                                this.nextChapterLink.className = "";
                            }
                            else {
                                this.nextChapterLink.removeAttribute("href");
                                this.nextChapterLink.className = "disabled";
                            }
                            this.setActiveTOCItem(currentLocation);
                            if (manifest.metadata.title) {
                                this.bookTitle.innerHTML = manifest.metadata.title;
                            }
                            chapterTitle = void 0;
                            spineItem = manifest.getSpineItem(currentLocation);
                            if (spineItem !== null) {
                                chapterTitle = spineItem.title;
                            }
                            if (!chapterTitle) {
                                tocItem = manifest.getTOCItem(currentLocation);
                                if (tocItem !== null && tocItem.title) {
                                    chapterTitle = tocItem.title;
                                }
                            }
                            if (chapterTitle) {
                                this.chapterTitle.innerHTML = "(" + chapterTitle + ")";
                            }
                            else {
                                this.chapterTitle.innerHTML = "(Current Chapter)";
                            }
                            if (this.eventHandler) {
                                this.eventHandler.setupEvents(this.iframe.contentDocument);
                            }
                            if (!this.annotator)
                                return [3 /*break*/, 4];
                            return [4 /*yield*/, this.saveCurrentReadingPosition()];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            this.hideLoadingMessage();
                            return [2 /*return*/, new Promise(function (resolve) { return resolve(); })];
                        case 5:
                            err_5 = _a.sent();
                            this.errorMessage.style.display = "block";
                            return [2 /*return*/, new Promise(function (_, reject) { return reject(); })];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        IFrameNavigator.prototype.tryAgain = function () {
            this.iframe.src = this.iframe.src;
            this.enableOffline();
        };
        IFrameNavigator.prototype.isDisplayed = function (element) {
            return element.className.indexOf(" active") !== -1;
        };
        IFrameNavigator.prototype.showElement = function (element, control) {
            element.className = element.className.replace(" inactive", "");
            if (element.className.indexOf(" active") === -1) {
                element.className += " active";
            }
            element.setAttribute("aria-hidden", "false");
            if (control) {
                control.setAttribute("aria-expanded", "true");
                var openIcon = control.querySelector(".icon.open");
                if (openIcon && (openIcon.getAttribute("class") || "").indexOf(" inactive-icon") === -1) {
                    var newIconClass = (openIcon.getAttribute("class") || "") + " inactive-icon";
                    openIcon.setAttribute("class", newIconClass);
                }
                var closeIcon = control.querySelector(".icon.close");
                if (closeIcon) {
                    var newIconClass = (closeIcon.getAttribute("class") || "").replace(" inactive-icon", "");
                    closeIcon.setAttribute("class", newIconClass);
                }
            }
            // Add buttons and links in the element to the tab order.
            var buttons = Array.prototype.slice.call(element.querySelectorAll("button"));
            var links = Array.prototype.slice.call(element.querySelectorAll("a"));
            for (var _i = 0, buttons_1 = buttons; _i < buttons_1.length; _i++) {
                var button = buttons_1[_i];
                button.tabIndex = 0;
            }
            for (var _a = 0, links_2 = links; _a < links_2.length; _a++) {
                var link = links_2[_a];
                link.tabIndex = 0;
            }
        };
        IFrameNavigator.prototype.hideElement = function (element, control) {
            element.className = element.className.replace(" active", "");
            if (element.className.indexOf(" inactive") === -1) {
                element.className += " inactive";
            }
            element.setAttribute("aria-hidden", "true");
            if (control) {
                control.setAttribute("aria-expanded", "false");
                var openIcon = control.querySelector(".icon.open");
                if (openIcon) {
                    var newIconClass = (openIcon.getAttribute("class") || "").replace(" inactive-icon", "");
                    openIcon.setAttribute("class", newIconClass);
                }
                var closeIcon = control.querySelector(".icon.close");
                if (closeIcon && (closeIcon.getAttribute("class") || "").indexOf(" inactive-icon") === -1) {
                    var newIconClass = (closeIcon.getAttribute("class") || "") + " inactive-icon";
                    closeIcon.setAttribute("class", newIconClass);
                }
            }
            // Remove buttons and links in the element from the tab order.
            var buttons = Array.prototype.slice.call(element.querySelectorAll("button"));
            var links = Array.prototype.slice.call(element.querySelectorAll("a"));
            for (var _i = 0, buttons_2 = buttons; _i < buttons_2.length; _i++) {
                var button = buttons_2[_i];
                button.tabIndex = -1;
            }
            for (var _a = 0, links_3 = links; _a < links_3.length; _a++) {
                var link = links_3[_a];
                link.tabIndex = -1;
            }
        };
        IFrameNavigator.prototype.showModal = function (modal, control) {
            // Hide the rest of the page for screen readers.
            this.iframe.setAttribute("aria-hidden", "true");
            this.scrollingSuggestion.setAttribute("aria-hidden", "true");
            if (this.upLink) {
                this.upLink.setAttribute("aria-hidden", "true");
            }
            this.contentsControl.setAttribute("aria-hidden", "true");
            this.settingsControl.setAttribute("aria-hidden", "true");
            this.linksBottom.setAttribute("aria-hidden", "true");
            this.loadingMessage.setAttribute("aria-hidden", "true");
            this.errorMessage.setAttribute("aria-hidden", "true");
            this.infoTop.setAttribute("aria-hidden", "true");
            this.infoBottom.setAttribute("aria-hidden", "true");
            if (control) {
                control.setAttribute("aria-hidden", "false");
            }
            this.showElement(modal, control);
        };
        IFrameNavigator.prototype.hideModal = function (modal, control) {
            // Restore the page for screen readers.
            this.iframe.setAttribute("aria-hidden", "false");
            this.scrollingSuggestion.setAttribute("aria-hidden", "false");
            if (this.upLink) {
                this.upLink.setAttribute("aria-hidden", "false");
            }
            this.contentsControl.setAttribute("aria-hidden", "false");
            this.settingsControl.setAttribute("aria-hidden", "false");
            this.linksBottom.setAttribute("aria-hidden", "false");
            this.loadingMessage.setAttribute("aria-hidden", "false");
            this.errorMessage.setAttribute("aria-hidden", "false");
            this.infoTop.setAttribute("aria-hidden", "false");
            this.infoBottom.setAttribute("aria-hidden", "false");
            this.hideElement(modal, control);
        };
        IFrameNavigator.prototype.toggleDisplay = function (element, control) {
            if (!this.isDisplayed(element)) {
                this.showElement(element, control);
            }
            else {
                this.hideElement(element, control);
            }
        };
        IFrameNavigator.prototype.toggleModal = function (modal, control) {
            if (!this.isDisplayed(modal)) {
                this.showModal(modal, control);
            }
            else {
                this.hideModal(modal, control);
            }
        };
        IFrameNavigator.prototype.handleToggleLinksClick = function (event) {
            this.hideTOC();
            this.hideSettings();
            this.toggleDisplay(this.links);
            if (this.settings.getSelectedView() === this.scroller) {
                if (!this.scroller.atBottom()) {
                    this.toggleDisplay(this.linksBottom);
                }
            }
            event.preventDefault();
            event.stopPropagation();
        };
        IFrameNavigator.prototype.handlePreviousPageClick = function (event) {
            if (this.paginator) {
                if (this.paginator.onFirstPage()) {
                    if (this.previousChapterLink.hasAttribute("href")) {
                        var position = {
                            resource: this.previousChapterLink.href,
                            position: 1
                        };
                        this.navigate(position);
                    }
                }
                else {
                    this.paginator.goToPreviousPage();
                    this.updatePositionInfo();
                    this.saveCurrentReadingPosition();
                }
                event.preventDefault();
                event.stopPropagation();
            }
        };
        IFrameNavigator.prototype.handleNextPageClick = function (event) {
            if (this.paginator) {
                if (this.paginator.onLastPage()) {
                    if (this.nextChapterLink.hasAttribute("href")) {
                        var position = {
                            resource: this.nextChapterLink.href,
                            position: 0
                        };
                        this.navigate(position);
                    }
                }
                else {
                    this.paginator.goToNextPage();
                    this.updatePositionInfo();
                    this.saveCurrentReadingPosition();
                }
                event.preventDefault();
                event.stopPropagation();
            }
        };
        IFrameNavigator.prototype.handleLeftHover = function () {
            this.iframe.className = "left-hover";
        };
        IFrameNavigator.prototype.handleRightHover = function () {
            this.iframe.className = "right-hover";
        };
        IFrameNavigator.prototype.handleRemoveHover = function () {
            this.iframe.className = "";
        };
        IFrameNavigator.prototype.handleResize = function () {
            var selectedView = this.settings.getSelectedView();
            var oldPosition = selectedView.getCurrentPosition();
            var fontSize = this.settings.getSelectedFontSize();
            var body = HTMLUtilities.findRequiredElement(this.iframe.contentDocument, "body");
            body.style.fontSize = fontSize;
            body.style.lineHeight = "1.5";
            var fontSizeNumber = parseInt(fontSize.slice(0, -2));
            var sideMargin = fontSizeNumber * 2;
            if (BrowserUtilities.getWidth() > fontSizeNumber * 45) {
                var extraMargin = Math.floor((BrowserUtilities.getWidth() - fontSizeNumber * 40) / 2);
                sideMargin = sideMargin + extraMargin;
            }
            if (this.paginator) {
                this.paginator.sideMargin = sideMargin;
            }
            if (this.scroller) {
                this.scroller.sideMargin = sideMargin;
            }
            // If the links are hidden, show them temporarily
            // to determine the top and bottom heights.
            var linksHidden = !this.isDisplayed(this.links);
            if (linksHidden) {
                this.toggleDisplay(this.links);
            }
            var topHeight = this.links.clientHeight;
            this.infoTop.style.height = topHeight + "px";
            if (linksHidden) {
                this.toggleDisplay(this.links);
            }
            var linksBottomHidden = !this.isDisplayed(this.linksBottom);
            if (linksBottomHidden) {
                this.toggleDisplay(this.linksBottom);
            }
            var bottomHeight = this.linksBottom.clientHeight;
            this.infoBottom.style.height = bottomHeight + "px";
            if (linksBottomHidden) {
                this.toggleDisplay(this.linksBottom);
            }
            if (this.paginator) {
                this.paginator.height = (BrowserUtilities.getHeight() - topHeight - bottomHeight - 10);
            }
            if (this.scroller) {
                this.scroller.height = (BrowserUtilities.getHeight() - topHeight - bottomHeight - 10);
            }
            selectedView.goToPosition(oldPosition);
            this.updatePositionInfo();
        };
        IFrameNavigator.prototype.updatePositionInfo = function () {
            if (this.settings.getSelectedView() === this.paginator) {
                var currentPage = Math.round(this.paginator.getCurrentPage());
                var pageCount = Math.round(this.paginator.getPageCount());
                this.chapterPosition.innerHTML = "Page " + currentPage + " of " + pageCount;
            }
            else {
                this.chapterPosition.innerHTML = "";
            }
        };
        IFrameNavigator.prototype.handlePreviousChapterClick = function (event) {
            if (this.previousChapterLink.hasAttribute("href")) {
                var position = {
                    resource: this.previousChapterLink.href,
                    position: 0
                };
                this.navigate(position);
            }
            event.preventDefault();
            event.stopPropagation();
        };
        IFrameNavigator.prototype.handleNextChapterClick = function (event) {
            if (this.nextChapterLink.hasAttribute("href")) {
                var position = {
                    resource: this.nextChapterLink.href,
                    position: 0
                };
                this.navigate(position);
            }
            event.preventDefault();
            event.stopPropagation();
        };
        IFrameNavigator.prototype.handleContentsClick = function (event) {
            this.hideSettings();
            this.toggleModal(this.tocView, this.contentsControl);
            // While the TOC is displayed, prevent scrolling in the book.
            if (this.settings.getSelectedView() === this.scroller) {
                if (this.isDisplayed(this.tocView)) {
                    document.body.style.overflow = "hidden";
                }
                else {
                    document.body.style.overflow = "auto";
                }
            }
            event.preventDefault();
            event.stopPropagation();
        };
        IFrameNavigator.prototype.hideTOC = function () {
            this.hideModal(this.tocView, this.contentsControl);
            if (this.settings.getSelectedView() === this.scroller) {
                document.body.style.overflow = "auto";
            }
        };
        IFrameNavigator.prototype.hideTOCOnEscape = function (event) {
            var ESCAPE_KEY = 27;
            if (this.isDisplayed(this.tocView) && event.keyCode === ESCAPE_KEY) {
                this.hideTOC();
            }
        };
        IFrameNavigator.prototype.setActiveTOCItem = function (resource) {
            var allItems = Array.prototype.slice.call(this.tocView.querySelectorAll("li > a"));
            for (var _i = 0, allItems_1 = allItems; _i < allItems_1.length; _i++) {
                var item = allItems_1[_i];
                item.className = "";
            }
            var activeItem = this.tocView.querySelector('li > a[href="' + resource + '"]');
            if (activeItem) {
                activeItem.className = "active";
            }
        };
        IFrameNavigator.prototype.handleSettingsClick = function (event) {
            this.hideTOC();
            this.toggleModal(this.settingsView, this.settingsControl);
            event.preventDefault();
            event.stopPropagation();
        };
        IFrameNavigator.prototype.hideSettings = function () {
            this.hideModal(this.settingsView, this.settingsControl);
        };
        IFrameNavigator.prototype.hideSettingsOnEscape = function (event) {
            var ESCAPE_KEY = 27;
            if (this.isDisplayed(this.settingsView) && event.keyCode === ESCAPE_KEY) {
                this.hideSettings();
            }
        };
        IFrameNavigator.prototype.navigate = function (readingPosition) {
            this.showLoadingMessageAfterDelay();
            this.newPosition = readingPosition;
            if (readingPosition.resource.indexOf("#") === -1) {
                this.iframe.src = readingPosition.resource;
            }
            else {
                // We're navigating to an anchor within the resource,
                // rather than the resource itself. Go to the resource
                // first, then go to the anchor.
                this.newElementId = readingPosition.resource.slice(readingPosition.resource.indexOf("#") + 1);
                var newResource = readingPosition.resource.slice(0, readingPosition.resource.indexOf("#"));
                if (newResource === this.iframe.src) {
                    // The resource isn't changing, but handle it like a new
                    // iframe load to hide the menus and popups and go to the 
                    // new element.
                    this.handleIFrameLoad();
                }
                else {
                    this.iframe.src = newResource;
                }
            }
        };
        IFrameNavigator.prototype.showLoadingMessageAfterDelay = function () {
            var _this = this;
            this.isLoading = true;
            setTimeout(function () {
                if (_this.isLoading) {
                    _this.loadingMessage.style.display = "block";
                }
            }, 200);
        };
        IFrameNavigator.prototype.hideLoadingMessage = function () {
            this.isLoading = false;
            this.loadingMessage.style.display = "none";
        };
        IFrameNavigator.prototype.saveCurrentReadingPosition = function () {
            return __awaiter(this, void 0, void 0, function () {
                var resource, position;
                return __generator(this, function (_a) {
                    if (this.annotator) {
                        resource = this.iframe.src;
                        position = this.settings.getSelectedView().getCurrentPosition();
                        return [2 /*return*/, this.annotator.saveLastReadingPosition({
                                resource: resource,
                                position: position
                            })];
                    }
                    else {
                        return [2 /*return*/, new Promise(function (resolve) { return resolve(); })];
                    }
                    return [2 /*return*/];
                });
            });
        };
        return IFrameNavigator;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Class that shows webpub resources in an iframe, with navigation controls outside the iframe. */
    exports.default = IFrameNavigator;
});
define("ColumnsPaginatedBookView", ["require", "exports", "HTMLUtilities", "BrowserUtilities"], function (require, exports, HTMLUtilities, BrowserUtilities) {
    "use strict";
    var ColumnsPaginatedBookView = (function () {
        function ColumnsPaginatedBookView() {
            this.name = "columns-paginated-view";
            this.label = "Paginated";
            this.sideMargin = 0;
            this.height = 0;
            this.hasFixedScrollWidth = false;
        }
        ColumnsPaginatedBookView.prototype.start = function (position) {
            // any is necessary because CSSStyleDeclaration type does not include
            // all the vendor-prefixed attributes.
            var body = HTMLUtilities.findRequiredElement(this.bookElement.contentDocument, "body");
            body.style.columnCount = 1;
            body.style.WebkitColumnCount = 1;
            body.style.MozColumnCount = 1;
            body.style.columnFill = "auto";
            body.style.WebkitColumnFill = "auto";
            body.style.MozColumnFill = "auto";
            body.style.overflow = "hidden";
            body.style.position = "relative";
            this.setSize();
            var viewportElement = document.createElement("meta");
            viewportElement.name = "viewport";
            viewportElement.content = "width=device-width, initial-scale=1, maximum-scale=1";
            var head = HTMLUtilities.findElement(this.bookElement.contentDocument, "head");
            if (head) {
                head.appendChild(viewportElement);
            }
            this.checkForFixedScrollWidth();
            this.goToPosition(position);
            // This is delayed to prevent a bug in iOS 10.3 that causes
            // the top links to be displayed in the middle of the page.
            setTimeout(function () {
                document.body.style.overflow = "hidden";
                // This prevents overscroll/bouncing on iOS.
                document.body.style.position = "fixed";
                document.body.style.left = "0";
                document.body.style.right = "0";
                document.body.style.top = "0";
                document.body.style.bottom = "0";
            }, 0);
        };
        ColumnsPaginatedBookView.prototype.checkForFixedScrollWidth = function () {
            // Determine if the scroll width changes when the left position
            // changes. This differs across browsers and sometimes across
            // books in the same browser.
            var body = HTMLUtilities.findRequiredElement(this.bookElement.contentDocument, "body");
            var originalLeft = (body.style.left || "0px").slice(0, -2);
            var originalScrollWidth = body.scrollWidth;
            body.style.left = (originalLeft - 1) + "px";
            this.hasFixedScrollWidth = (body.scrollWidth === originalScrollWidth);
            body.style.left = originalLeft + "px";
        };
        ColumnsPaginatedBookView.prototype.setSize = function () {
            // any is necessary because CSSStyleDeclaration type does not include
            // all the vendor-prefixed attributes.
            var body = HTMLUtilities.findRequiredElement(this.bookElement.contentDocument, "body");
            var width = (BrowserUtilities.getWidth() - this.sideMargin * 2) + "px";
            body.style.columnWidth = width;
            body.style.WebkitColumnWidth = width;
            body.style.MozColumnWidth = width;
            body.style.columnGap = this.sideMargin * 2 + "px";
            body.style.WebkitColumnGap = this.sideMargin * 2 + "px";
            body.style.MozColumnGap = this.sideMargin * 2 + "px";
            body.style.height = this.height + "px";
            body.style.width = width;
            body.style.marginLeft = this.sideMargin + "px";
            body.style.marginRight = this.sideMargin + "px";
            body.style.marginTop = "0px";
            body.style.marginBottom = "0px";
            this.bookElement.contentDocument.documentElement.style.height = this.height + "px";
            this.bookElement.style.height = this.height + "px";
            this.bookElement.style.width = BrowserUtilities.getWidth() + "px";
            var images = body.querySelectorAll("img");
            for (var _i = 0, images_3 = images; _i < images_3.length; _i++) {
                var image = images_3[_i];
                image.style.maxWidth = width;
                // Determine how much vertical space there is for the image.
                var nextElement = image;
                var totalMargins = 0;
                while (nextElement !== body) {
                    var computedStyle = window.getComputedStyle(nextElement);
                    if (computedStyle.marginTop) {
                        totalMargins += parseInt(computedStyle.marginTop.slice(0, -2), 10);
                    }
                    if (computedStyle.marginBottom) {
                        totalMargins += parseInt(computedStyle.marginBottom.slice(0, -2), 10);
                    }
                    nextElement = nextElement.parentElement;
                }
                image.style.maxHeight = (this.height - totalMargins) + "px";
                // Without this, an image at the end of a resource can end up
                // with an extra empty column after it.
                image.style.display = "block";
                image.style.marginLeft = "auto";
                image.style.marginRight = "auto";
            }
        };
        ColumnsPaginatedBookView.prototype.stop = function () {
            document.body.style.overflow = "auto";
            document.body.style.position = "static";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.top = "";
            document.body.style.bottom = "";
            var body = HTMLUtilities.findRequiredElement(this.bookElement.contentDocument, "body");
            body.style.columnCount = "";
            body.style.WebkitColumnCount = "";
            body.style.MozColumnCount = "";
            body.style.columnGap = "";
            body.style.WebkitColumnGap = "";
            body.style.MozColumnGap = "";
            body.style.columnFill = "";
            body.style.WebkitColumnFill = "";
            body.style.MozColumnFill = "";
            body.style.overflow = "";
            body.style.position = "";
            body.style.columnWidth = "";
            body.style.WebkitColumnWidth = "";
            body.style.MozColumnWidth = "";
            body.style.height = "";
            body.style.width = "";
            body.style.marginLeft = "";
            body.style.marginRight = "";
            body.style.marginTop = "";
            body.style.marginBottom = "";
            this.bookElement.contentDocument.documentElement.style.height = "";
            this.bookElement.style.height = "";
            this.bookElement.style.width = "";
            var images = body.querySelectorAll("img");
            for (var _i = 0, images_4 = images; _i < images_4.length; _i++) {
                var image = images_4[_i];
                image.style.maxWidth = "";
                image.style.maxHeight = "";
                image.style.display = "";
                image.style.marginLeft = "";
                image.style.marginRight = "";
            }
        };
        /** Returns the total width of the columns that are currently
            positioned to the left of the iframe viewport. */
        ColumnsPaginatedBookView.prototype.getLeftColumnsWidth = function () {
            var body = HTMLUtilities.findRequiredElement(this.bookElement.contentDocument, "body");
            var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
            var isXML = this.bookElement.src.indexOf(".xml") !== -1;
            if (isFirefox && isXML) {
                // Feedbooks epubs have resources with .xml file extensions for historical
                // reasons. Firefox handles these differently than XHTML files, and setting
                // a left position as well as overflow:hidden causes the pages to be blank.
                return body.scrollLeft;
            }
            return -(body.style.left || "0px").slice(0, -2);
        };
        /** Returns the total width of the columns that are currently
            positioned to the right of the iframe viewport. */
        ColumnsPaginatedBookView.prototype.getRightColumnsWidth = function () {
            // scrollWidth includes the column in the iframe viewport as well as
            // columns to the right.
            var body = HTMLUtilities.findRequiredElement(this.bookElement.contentDocument, "body");
            var scrollWidth = body.scrollWidth;
            var width = this.getColumnWidth();
            var rightWidth = scrollWidth + this.sideMargin - width;
            if (this.hasFixedScrollWidth) {
                // In some browsers (IE and Firefox with certain books), 
                // scrollWidth doesn't change when some columns
                // are off to the left, so we need to subtract them.
                var leftWidth = this.getLeftColumnsWidth();
                rightWidth = Math.max(0, rightWidth - leftWidth);
            }
            if (rightWidth === this.sideMargin) {
                return 0;
            }
            else {
                return rightWidth;
            }
        };
        /** Returns the width of one column. */
        ColumnsPaginatedBookView.prototype.getColumnWidth = function () {
            var body = HTMLUtilities.findRequiredElement(this.bookElement.contentDocument, "body");
            return body.offsetWidth + this.sideMargin * 2;
        };
        /** Shifts the columns so that the specified width is positioned
            to the left of the iframe viewport. */
        ColumnsPaginatedBookView.prototype.setLeftColumnsWidth = function (width) {
            var body = HTMLUtilities.findRequiredElement(this.bookElement.contentDocument, "body");
            var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
            var isXML = this.bookElement.src.indexOf(".xml") !== -1;
            if (isFirefox && isXML) {
                // Feedbooks epubs have resources with .xml file extensions for historical
                // reasons. Firefox handles these differently than XHTML files, and setting
                // a left position as well as overflow:hidden causes the pages to be blank.
                body.scrollLeft = width;
            }
            else {
                body.style.left = -width + "px";
            }
        };
        /** Returns number in range [0..1) representing the
            proportion of columns that are currently positioned
            to the left of the iframe viewport. */
        ColumnsPaginatedBookView.prototype.getCurrentPosition = function () {
            var width = this.getColumnWidth();
            var leftWidth = this.getLeftColumnsWidth();
            var rightWidth = this.getRightColumnsWidth();
            var totalWidth = leftWidth + width + rightWidth;
            return leftWidth / totalWidth;
        };
        /** Returns the current 1-indexed page number. */
        ColumnsPaginatedBookView.prototype.getCurrentPage = function () {
            return this.getCurrentPosition() * this.getPageCount() + 1;
        };
        /** Returns the total number of pages. */
        ColumnsPaginatedBookView.prototype.getPageCount = function () {
            var width = this.getColumnWidth();
            var leftWidth = this.getLeftColumnsWidth();
            var rightWidth = this.getRightColumnsWidth();
            var totalWidth = leftWidth + width + rightWidth;
            return totalWidth / width;
        };
        ColumnsPaginatedBookView.prototype.onFirstPage = function () {
            var leftWidth = this.getLeftColumnsWidth();
            return (leftWidth <= 0);
        };
        ColumnsPaginatedBookView.prototype.onLastPage = function () {
            var rightWidth = this.getRightColumnsWidth();
            return (rightWidth <= 0);
        };
        ColumnsPaginatedBookView.prototype.goToPreviousPage = function () {
            var leftWidth = this.getLeftColumnsWidth();
            var width = this.getColumnWidth();
            this.setLeftColumnsWidth(leftWidth - width);
        };
        ColumnsPaginatedBookView.prototype.goToNextPage = function () {
            var leftWidth = this.getLeftColumnsWidth();
            var width = this.getColumnWidth();
            this.setLeftColumnsWidth(leftWidth + width);
        };
        /** Goes to a position specified by a number in the range [0..1].
            The position should be a number as returned by getCurrentPosition,
            or 1 to go to the last page. The position will be rounded down so
            it matches the position of one of the columns. */
        /** @param position Number in range [0..1] */
        ColumnsPaginatedBookView.prototype.goToPosition = function (position) {
            this.setSize();
            // If the window has changed size since the columns were set up,
            // we need to reset position so we can determine the new total width.
            this.setLeftColumnsWidth(0);
            var width = this.getColumnWidth();
            var rightWidth = this.getRightColumnsWidth();
            var totalWidth = width + rightWidth;
            var newLeftWidth = position * totalWidth;
            // Round the new left width so it's a multiple of the column width.
            var roundedLeftWidth = Math.floor(newLeftWidth / width) * width;
            if (roundedLeftWidth === totalWidth) {
                // We've gone too far and all the columns are off to the left.
                // Move one column back into the viewport.
                roundedLeftWidth = roundedLeftWidth - width;
            }
            this.setLeftColumnsWidth(roundedLeftWidth);
        };
        ColumnsPaginatedBookView.prototype.goToElement = function (elementId) {
            var element = this.bookElement.contentDocument.getElementById(elementId);
            if (element) {
                // Get the element's position in the iframe, and
                // round that to figure out the column it's in.
                // There is a bug in Safari when using getBoundingClientRect
                // on an element that spans multiple columns. Temporarily
                // set the element's height to fit it on one column so we
                // can determine the first column position.
                var originalHeight = element.style.height;
                element.style.height = "0";
                var left = element.getBoundingClientRect().left;
                var width = this.getColumnWidth();
                var roundedLeftWidth = Math.floor(left / width) * width;
                // Restore element's original height.
                element.style.height = originalHeight;
                this.setLeftColumnsWidth(roundedLeftWidth);
            }
        };
        return ColumnsPaginatedBookView;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = ColumnsPaginatedBookView;
});
define("LocalAnnotator", ["require", "exports"], function (require, exports) {
    "use strict";
    /** Annotator that stores annotations locally, in the browser. */
    var LocalAnnotator = (function () {
        function LocalAnnotator(config) {
            this.store = config.store;
        }
        LocalAnnotator.prototype.getLastReadingPosition = function () {
            return __awaiter(this, void 0, void 0, function () {
                var positionString, position_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.store.get(LocalAnnotator.LAST_READING_POSITION)];
                        case 1:
                            positionString = _a.sent();
                            if (positionString) {
                                position_1 = JSON.parse(positionString);
                                return [2 /*return*/, new Promise(function (resolve) { return resolve(position_1); })];
                            }
                            return [2 /*return*/, new Promise(function (resolve) { return resolve(); })];
                    }
                });
            });
        };
        LocalAnnotator.prototype.saveLastReadingPosition = function (position) {
            return __awaiter(this, void 0, void 0, function () {
                var positionString;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            positionString = JSON.stringify(position);
                            return [4 /*yield*/, this.store.set(LocalAnnotator.LAST_READING_POSITION, positionString)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, new Promise(function (resolve) { return resolve(); })];
                    }
                });
            });
        };
        return LocalAnnotator;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    /** Annotator that stores annotations locally, in the browser. */
    exports.default = LocalAnnotator;
    LocalAnnotator.LAST_READING_POSITION = "last-reading-position";
});
define("app", ["require", "exports", "LocalStorageStore", "ServiceWorkerCacher", "IFrameNavigator", "ColumnsPaginatedBookView", "ScrollingBookView", "BookSettings", "LocalAnnotator"], function (require, exports, LocalStorageStore_1, ServiceWorkerCacher_1, IFrameNavigator_1, ColumnsPaginatedBookView_1, ScrollingBookView_1, BookSettings_1, LocalAnnotator_1) {
    "use strict";
    var _this = this;
    var app = function (element, manifestUrl) { return __awaiter(_this, void 0, void 0, function () {
        var bookStore, cacher, annotator, paginator, scroller, settingsStore, fontSizes, settings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    bookStore = new LocalStorageStore_1.default({ prefix: manifestUrl.href });
                    cacher = new ServiceWorkerCacher_1.default({ store: bookStore, manifestUrl: manifestUrl });
                    annotator = new LocalAnnotator_1.default({ store: bookStore });
                    paginator = new ColumnsPaginatedBookView_1.default();
                    scroller = new ScrollingBookView_1.default();
                    settingsStore = new LocalStorageStore_1.default({ prefix: "all-books" });
                    fontSizes = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
                    return [4 /*yield*/, BookSettings_1.default.create({
                            store: settingsStore,
                            bookViews: [paginator, scroller],
                            fontSizesInPixels: fontSizes,
                            defaultFontSizeInPixels: 16
                        })];
                case 1:
                    settings = _a.sent();
                    return [4 /*yield*/, IFrameNavigator_1.default.create({
                            element: element,
                            manifestUrl: manifestUrl,
                            store: bookStore,
                            cacher: cacher,
                            settings: settings,
                            annotator: annotator,
                            paginator: paginator,
                            scroller: scroller
                        })];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    }); };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = app;
});
define("index", ["require", "exports", "Cacher", "BookSettings", "MemoryStore", "LocalStorageStore", "ApplicationCacheCacher", "ServiceWorkerCacher", "LocalAnnotator", "ColumnsPaginatedBookView", "ScrollingBookView", "EventHandler", "IFrameNavigator"], function (require, exports, Cacher_4, BookSettings_2, MemoryStore_2, LocalStorageStore_2, ApplicationCacheCacher_2, ServiceWorkerCacher_2, LocalAnnotator_2, ColumnsPaginatedBookView_2, ScrollingBookView_2, EventHandler_2, IFrameNavigator_2) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    __export(Cacher_4);
    __export(BookSettings_2);
    __export(MemoryStore_2);
    __export(LocalStorageStore_2);
    __export(ApplicationCacheCacher_2);
    __export(ServiceWorkerCacher_2);
    __export(LocalAnnotator_2);
    __export(ColumnsPaginatedBookView_2);
    __export(ScrollingBookView_2);
    __export(EventHandler_2);
    __export(IFrameNavigator_2);
});
//# sourceMappingURL=webpub-viewer.js.map