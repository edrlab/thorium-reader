// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import os from "os";
import { getApps, initializeApp, setLogLevel } from "@firebase/app";
import { type Analytics, initializeAnalytics, isSupported, logEvent as firebaseLogEvent, setUserId } from "@firebase/analytics";
import { URL_HOST_APP_ASSETS } from "readium-desktop/common/streamerProtocol";
import {
    _APP_VERSION,
    _FIREBASE_ANALYTICS_CONFIG,
    _FIREBASE_ANALYTICS_DEBUG,
    _FIREBASE_ANALYTICS_ENABLED,
} from "readium-desktop/preprocessor-directives";

const filename_ = "readium-desktop:renderer:common:analytics:firebase";
const debug = debug_(filename_);

const FIREBASE_APP_NAME = "thorium-reader";
const FIREBASE_CLIENT_ID_STORAGE_KEY = "thorium-reader.firebase.analytics.client-id";

let analyticsPromise: Promise<Analytics | undefined> | undefined;

type FirebaseEventParams = Record<string, string | number | boolean>;

const firebaseDebugLog = (message: string, ...optionalParams: unknown[]) => {
    if (_FIREBASE_ANALYTICS_DEBUG) {
        console.log(`[firebase] ${message}`, ...optionalParams);
    }
};

const getDebugConfigSummary = () => ({
    enabled: _FIREBASE_ANALYTICS_ENABLED,
    debug: _FIREBASE_ANALYTICS_DEBUG,
    hasApiKey: !!_FIREBASE_ANALYTICS_CONFIG.apiKey,
    hasAppId: !!_FIREBASE_ANALYTICS_CONFIG.appId,
    measurementId: _FIREBASE_ANALYTICS_CONFIG.measurementId,
    projectId: _FIREBASE_ANALYTICS_CONFIG.projectId,
});

const getOsName = (): "Windows" | "macOS" | "Linux" => {
    switch (process.platform) {
        case "darwin":
            return "macOS";
        case "win32":
            return "Windows";
        default:
            return "Linux";
    }
};

const createGoogleAnalyticsClientId = (): string => {
    let random = Math.floor(Math.random() * 1_000_000_000) + 1;
    try {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        random = values[0] + 1;
    } catch (_e) {
        // Math.random() fallback is enough for a pseudonymous GA browser instance id.
    }

    return `${Date.now()}.${random}`;
};

const getOrCreateGoogleAnalyticsClientId = (): string => {
    try {
        const storedClientId = localStorage.getItem(FIREBASE_CLIENT_ID_STORAGE_KEY);
        if (storedClientId && /^\d+\.\d+$/.test(storedClientId)) {
            return storedClientId;
        }

        const clientId = createGoogleAnalyticsClientId();
        localStorage.setItem(FIREBASE_CLIENT_ID_STORAGE_KEY, clientId);
        return clientId;
    } catch (_e) {
        return createGoogleAnalyticsClientId();
    }
};

const getFirebasePageName = (): "reader" | "library" =>
    window.location.pathname.includes("index_reader") ? "reader" : "library";

const getFirebasePageLocation = (): string =>
    `https://${URL_HOST_APP_ASSETS}/${getFirebasePageName()}`;

const getFirebaseConfigParams = () => ({
    // Let gtag/Firebase own the client id lifecycle through its normal browser storage.
    client_id: getOrCreateGoogleAnalyticsClientId(),
    // Keep GA cookies host-only on thorium-reader.localhost, without public-domain inference.
    cookie_domain: "none",
    // Avoid reporting Electron/local asset URLs as referrers.
    ignore_referrer: true,
    page_location: getFirebasePageLocation(),
    page_referrer: "",
    page_title: "Thorium Reader",
    // Page/screen views are emitted explicitly by the app analytics layer.
    send_page_view: false,
    ...(_FIREBASE_ANALYTICS_DEBUG ? { debug_mode: true } : {}),
});

const getDefaultEventParams = (): FirebaseEventParams => {
    const params: FirebaseEventParams = {
        app_version: _APP_VERSION,
        os_name: getOsName(),
        os_version: os.release(),
        language: navigator.language,
        // engagement_time_msec: 1,
    };

    if (_FIREBASE_ANALYTICS_DEBUG) {
        params.debug_mode = true;
    }

    return params;
};

const getFirebaseApp = () =>
    getApps().find((app) => app.name === FIREBASE_APP_NAME) ||
    initializeApp(_FIREBASE_ANALYTICS_CONFIG, FIREBASE_APP_NAME);

const isFirebaseBrowserExtensionContext = (): boolean => {
    const globalWithExtensionAPIs = globalThis as unknown as {
        browser?: { runtime?: { id?: unknown } };
        chrome?: { runtime?: { id?: unknown } };
    };
    const runtime =
        typeof globalWithExtensionAPIs.chrome === "object" && globalWithExtensionAPIs.chrome
            ? globalWithExtensionAPIs.chrome.runtime
            : typeof globalWithExtensionAPIs.browser === "object" && globalWithExtensionAPIs.browser
                ? globalWithExtensionAPIs.browser.runtime
                : undefined;

    return typeof runtime === "object" && !!runtime && runtime.id !== undefined;
};

const isIndexedDBAvailable = (): boolean => {
    try {
        return typeof indexedDB === "object";
    } catch (_e) {
        return false;
    }
};

const validateIndexedDBOpenable = (): Promise<{ openable: boolean; error?: string }> =>
    new Promise((resolve) => {
        try {
            let preExist = true;
            const dbCheckName = "validate-browser-context-for-indexeddb-analytics-module";
            const request = self.indexedDB.open(dbCheckName);
            request.onsuccess = () => {
                request.result.close();
                if (!preExist) {
                    self.indexedDB.deleteDatabase(dbCheckName);
                }
                resolve({ openable: true });
            };
            request.onupgradeneeded = () => {
                preExist = false;
            };
            request.onerror = () => {
                resolve({ openable: false, error: request.error?.message || "IndexedDB open error" });
            };
            request.onblocked = () => {
                resolve({ openable: false, error: "IndexedDB open blocked" });
            };
        } catch (e) {
            resolve({ openable: false, error: e instanceof Error ? e.message : `${e}` });
        }
    });

const logFirebaseSupportDiagnostics = async () => {
    if (!_FIREBASE_ANALYTICS_DEBUG) {
        return;
    }

    const indexedDBAvailable = isIndexedDBAvailable();
    const indexedDBOpen = indexedDBAvailable
        ? await validateIndexedDBOpenable()
        : { openable: false, error: "IndexedDB unavailable" };

    firebaseDebugLog("support diagnostics", {
        browserExtensionContext: isFirebaseBrowserExtensionContext(),
        cookiesEnabled: typeof navigator !== "undefined" && navigator.cookieEnabled,
        indexedDBAvailable,
        indexedDBOpenable: indexedDBOpen.openable,
        indexedDBOpenError: indexedDBOpen.error,
        isSecureContext: typeof window !== "undefined" ? window.isSecureContext : undefined,
        locationHref: typeof window !== "undefined" ? window.location.href : undefined,
        locationOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
        locationProtocol: typeof window !== "undefined" ? window.location.protocol : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });
};

const getAnalytics = async (): Promise<Analytics | undefined> => {

    if (!_FIREBASE_ANALYTICS_ENABLED) {
        firebaseDebugLog("disabled", getDebugConfigSummary());
        debug("Firebase Analytics disabled: missing build-time config");
        return undefined;
    }

    if (analyticsPromise === undefined) {
        firebaseDebugLog("initializing", getDebugConfigSummary());
        if (_FIREBASE_ANALYTICS_DEBUG) {
            setLogLevel("debug");
        }
        analyticsPromise = isSupported()
            .then(async (supported: boolean): Promise<Analytics | undefined> => {
                firebaseDebugLog("isSupported", supported);
                if (!supported) {
                    await logFirebaseSupportDiagnostics();
                    debug("Firebase Analytics unsupported in this renderer context");
                    return undefined;
                }

                const config = getFirebaseConfigParams();
                const analytics = initializeAnalytics(getFirebaseApp(), {
                    config,
                });
                firebaseDebugLog("initialized", config);
                return analytics;
            })
            .catch((e: unknown): undefined => {
                firebaseDebugLog("init failed", e);
                debug("Firebase Analytics init failed", e);
                return undefined;
            });
    }

    return analyticsPromise;
};

export const logFirebaseEvent = async (
    eventName: string,
    eventParams?: FirebaseEventParams,
): Promise<boolean> => {

    try {
        const analytics = await getAnalytics();
        if (analytics) {
            const params = {
                ...getDefaultEventParams(),
                ...eventParams,
            };
            firebaseDebugLog("event handed to Firebase SDK", eventName, params);
            debug("Firebase Analytics event handed to SDK", eventName, params);
            firebaseLogEvent(analytics, eventName, params);
            return true;
        }
    } catch (e) {
        firebaseDebugLog("event failed", eventName, e);
        debug("Firebase Analytics event failed", eventName, e);
    }

    return false;
};

export const initFirebaseAnalytics = async (
    userId: string,
): Promise<boolean> => {

    try {
        const analytics = await getAnalytics();
        if (!analytics) {
            return false;
        }

        firebaseDebugLog("set user id", { hasUserId: !!userId });
        setUserId(analytics, userId);
        return true;
    } catch (e) {
        firebaseDebugLog("user id setup failed", e);
        debug("Firebase Analytics user id setup failed", e);
        return false;
    }
};
