// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import * as path from "node:path";
import * as fs from "node:fs";
import { commandLineMainEntry } from "readium-desktop/main/cli";
import { httpGetWithAuth } from "readium-desktop/main/network/http";
import { CRL_URL, DUMMY_CRL } from "@r2-lcp-js/parser/epub/lcp-certificate";
import { setLcpNativePluginPath, setCRLGetter } from "@r2-lcp-js/parser/epub/lcp";
import { initGlobalConverters_OPDS } from "@r2-opds-js/opds/init-globals";
import {
    initGlobalConverters_GENERIC, initGlobalConverters_SHARED,
} from "@r2-shared-js/init-globals";
import { ContentType } from "readium-desktop/utils/contentType";

import { initSessions as initSessionsNoHTTP } from "./main/streamer/streamerNoHttp";
import { createStoreFromDi } from "./main/di";
import { appActions } from "./main/redux/actions";
import { app } from "electron";
import { _APP_NAME, _APP_VERSION, _LCP_CRL, _PACK_NAME } from "readium-desktop/preprocessor-directives";
import { FORCE_PROD_DB_IN_DEV, USER_DATA_FOLDER } from "readium-desktop/common/constant";
import { appendFileSyncWithRotation } from "readium-desktop/utils/log";

// isURL() excludes the file: and data: URL protocols; the compile-time TLD policy decides whether localhost / non-TLD hosts are accepted (note that ftp: is accepted)
// import isURL from "validator/lib/isURL";
// if (__TH__IS_DEV__) {
//     ["https://edrlab.org", "https://edrlab.org:443", "http://edrlab.org", "http://edrlab.org:80", "http://edrlab.org:8080", "ftp://edrlab.org", "ssh://edrlab.org", "data:,Hello%2C%20World%21", "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==", "data:text/html,%3Ch1%3EHello%2C%20World%21%3C%2Fh1%3E", "data:text/html;charset=utf-8,<html>", "data:text/html,%3Cscript%3Ealert%28%27hi%27%29%3B%3C%2Fscript%3E", "http://127.0.0.1", "http://127.0.0.1:80", "http://127.0.0.1:8080", "http://localhost", "http://localhost:80", "http://localhost:8080", "http://192.168.100.1", "http://192.168.100.1:80", "http://89.66.100.1:8080", "http://89.66.100.1", "http://89.66.100.1:80", "http://89.66.100.1:8080", "file:///root/sub/file", "file://root/sub/file", "file:///root/sub%25file", "file://root/sub%25file", "filex://", "pdfjs-extract://", "thoriumhttps://", "r2https://", "opds-media://", "opds://", "thorium://"].forEach((u) => console.log(`isURL? ${u} ===> ${isURL(u)}`));
// }

// import { initSessions as initSessionsHTTP } from "@r2-navigator-js/electron/main/sessions";

// TO TEST ESM (not COMMONJS):
// // import * as normalizeUrl from_"normalize-url";
// import normalizeUrl from_"normalize-url";
// console.log(normalizeUrl("//www.sindresorhus.com:80/../baz?b=bar&a=foo"), "#".repeat(200));
// // import("normalize-url").then(({default: normalizeUrl}) => {
// //     //=> 'http://sindresorhus.com/baz?a=foo&b=bar'
// //     console.log("#".repeat(2000), normalizeUrl("//www.sindresorhus.com:80/../baz?b=bar&a=foo"));
// // });

if (__TH__IS_PACKAGED__) {
    // Disable debug in packaged app
    delete process.env.DEBUG;
    debug_.disable();

    /**
     * yargs used console and doesn't used process.stdout
     */
    /*
    console.log = (_message?: any, ..._optionalParams: any[]) => { return; };
    console.warn = (_message?: any, ..._optionalParams: any[]) => { return; };
    console.error = (_message?: IArrayWinRegistryReaderState,any, ..._optionalParams: any[]) => { return; };
    console.info = (_message?: any, ..._optionalParams: any[]) => { return; };
     */
}

// Logger
const debug = debug_("readium-desktop:main");

// Global
initGlobalConverters_OPDS();
initGlobalConverters_SHARED();
initGlobalConverters_GENERIC();

// Lcp
const lcpNativePluginPath = path.normalize(path.join(__dirname, "external-assets", "lcp.node"));
setLcpNativePluginPath(lcpNativePluginPath);

interface ILcpCrlCache {
    crlPem: string;
    etag: string | undefined;
    lastModified: string | undefined;
    validatedAt: number;
    expiresAt: number;
    refreshPromise: Promise<void> | undefined;
}

const lcpCrlCache: ILcpCrlCache = {
    crlPem: _LCP_CRL || DUMMY_CRL,
    etag: undefined,
    lastModified: undefined,
    validatedAt: 0,
    expiresAt: 0,
    refreshPromise: undefined,
};

const LCP_CRL_CACHE_FALLBACK_FRESHNESS_MS = 60 * 60 * 1000;

const getCacheControlMaxAgeMs = (cacheControl: string | undefined): number | undefined => {
    if (!cacheControl) {
        return undefined;
    }
    let maxAgeMs: number | undefined;
    for (const directive of cacheControl.split(",")) {
        const [rawName, rawValue] = directive.trim().split("=", 2);
        const name = rawName.trim().toLowerCase();
        const value = rawValue?.trim();
        if (name === "no-cache" || name === "no-store") {
            return 0;
        }
        if (name === "max-age" && value) {
            const seconds = Number(value.replace(/^"|"$/g, ""));
            if (Number.isFinite(seconds) && seconds >= 0) {
                maxAgeMs = seconds * 1000;
            }
        }
    }
    return maxAgeMs;
};

const getLcpCrlExpiresAt = (headers: { get(name: string): string | null } | undefined, validatedAt: number): number => {
    const cacheControlMaxAgeMs = getCacheControlMaxAgeMs(headers?.get("cache-control") || undefined);
    return validatedAt + (cacheControlMaxAgeMs ?? LCP_CRL_CACHE_FALLBACK_FRESHNESS_MS);
};

const isLcpCrlCacheExpired = () =>
    Date.now() >= lcpCrlCache.expiresAt;

const refreshLcpCrlCache = (): Promise<void> => {
    debug("REFRESH LCP CRL REQUEST", lcpCrlCache);
    if (typeof lcpCrlCache.refreshPromise !== "undefined") {
        return lcpCrlCache.refreshPromise;
    }

    lcpCrlCache.refreshPromise = (async () => {
        try {
            const headers: Record<string, string> = {
                Accept: ContentType.PkixCrl,
            };
            if (lcpCrlCache.etag) {
                headers["If-None-Match"] = lcpCrlCache.etag;
            }
            if (lcpCrlCache.lastModified) {
                headers["If-Modified-Since"] = lcpCrlCache.lastModified;
            }
            // RFC 2585 Security Considerations: CRL retrieval does not need
            // authentication, so this uses Thorium's no-auth HTTP helper.
            const res = await httpGetWithAuth(false)(CRL_URL, {
                headers,
                // Reject redirects so the native LCP plugin receives bytes from the
                // configured CRL endpoint only.
                redirect: "error",
            });
            if (res.statusCode === 304) {
                lcpCrlCache.lastModified = res.response.headers?.get("last-modified") || lcpCrlCache.lastModified;
                const validatedAt = Date.now();
                lcpCrlCache.validatedAt = validatedAt;
                lcpCrlCache.expiresAt = getLcpCrlExpiresAt(res.response.headers, validatedAt);
                debug("LCP CRL HTTP cache refreshed: not modified");
                return;
            }
            const mediaType = res.contentType?.split(";")[0].trim().toLowerCase();
            // RFC 5280 section 4.2.1.13 says HTTP CRL distribution point URIs point
            // to a single DER encoded CRL, and HTTP servers SHOULD respond with
            // Content-Type application/pkix-crl.
            // https://datatracker.ietf.org/doc/html/rfc5280#section-4.2.1.13
            // RFC 2585 section 4.2 registers application/pkix-crl.
            // https://datatracker.ietf.org/doc/html/rfc2585#section-4.2
            // RFC 2585 Security Considerations: authentication is not necessary
            // to retrieve certificates and CRLs.
            // https://datatracker.ietf.org/doc/html/rfc2585#page-6
            if (res.statusCode === 200 && mediaType === ContentType.PkixCrl) {
                const buf = await res.response.buffer();
                const lcplStr = "-----BEGIN X509 CRL-----\n" + buf.toString("base64") + "\n-----END X509 CRL-----";
                lcpCrlCache.crlPem = lcplStr;
                lcpCrlCache.etag = res.response.headers?.get("etag") || undefined; // '"295-65b0d9de8addd"' double quote is included
                lcpCrlCache.lastModified = res.response.headers?.get("last-modified") || undefined;
                const validatedAt = Date.now();
                lcpCrlCache.validatedAt = validatedAt;
                lcpCrlCache.expiresAt = getLcpCrlExpiresAt(res.response.headers, validatedAt);
                debug("LCP CRL HTTP fetch success");
                debug(lcplStr);
                return;
            }
            debug(`LCP CRL HTTP fetch fail; keeping cached CRL (${res.statusCode} ${res.contentType})`);
        } catch (err) {
            debug("LCP CRL HTTP fetch error; keeping cached CRL");
            debug(err);
        }
    })().finally(() => {
        lcpCrlCache.refreshPromise = undefined;
    });

    return lcpCrlCache.refreshPromise;
};
const initLcpCrlCacheValidatedAt = lcpCrlCache.validatedAt;
refreshLcpCrlCache().then(() => {
    debug(lcpCrlCache.validatedAt > initLcpCrlCacheValidatedAt ? "INIT LCP CRL LOADED" : "INIT LCP CRL FAILED");
    debug(lcpCrlCache);
}).catch((err) => {
    debug("INIT LCP CRL FAILED");
    debug(err);
});

setCRLGetter(async (): Promise<string> => {
    const crlPem = lcpCrlCache.crlPem;
    if (isLcpCrlCacheExpired()) {
        void refreshLcpCrlCache();
    }
    return crlPem;
});

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("enable-speech-dispatcher");

// https://github.com/electron/electron/issues/46538
// --gtk-version=3
// Gtk-ERROR **: 12:09:19.718: GTK 2/3 symbols detected. Using GTK 2/3 and GTK 4 in the same process is not supported
// app.commandLine.appendSwitch("gtk-version", "3");

// so that "tmp" can cleanup on process exit?
// SIGTERM?
// in Electron: before-quit App event
// process.on("SIGINT", () => {
//     console.log("SIGINT ... process.exit()");
//     process.exit();
// });

// protocol.registerSchemesAsPrivileged should be called before app is ready at initSessions
// if (_USE_HTTP_STREAMER) {
//     initSessionsHTTP();
// } else {
//     initSessionsNoHTTP();
// }
initSessionsNoHTTP();

if (__TH__IS_VSCODE_LAUNCH__) {
    createStoreFromDi().then((store) => store.dispatch(appActions.initRequest.build())).catch((err) => { debug(err); });
} else {
    commandLineMainEntry(); // call main fct

    // setTimeout(() => {

    //     const BRANCH = "master";
    //     const JSON_URL = `https://raw.githubusercontent.com/edrlab/thorium-reader/${BRANCH}/latest.json`;
    //     debug("*********** HTTP REQUEST test...");
    //     httpGet(JSON_URL).then((res) => {
    //         debug("*********** HTTP REQUEST test: ", res.isSuccess);
    //         if (res.isSuccess) {
    //             res.response.text().then((t) => {
    //                 debug("*********** HTTP REQUEST res: ", t);
    //             }).catch((err) => {
    //                 debug("*********** HTTP REQUEST err: ", err);
    //             }).finally(() => {
    //                 app.quit();
    //                 process.exit();
    //             });
    //         } else {
    //             debug("*********** HTTP REQUEST not success: ");
    //         }
    //     }).catch((err) => {
    //         debug(err);
    //     });

    // }, 4000);
}

const processInfoStr = JSON.stringify({
    node_version: process.version,
    pid: process.pid,
    platform: process.platform,
    arch: process.arch,
    uptime_seconds: process.uptime(),
    memory_usage: process.memoryUsage(),
    argv: process.argv,
    MSWindowsStore: process.windowsStore,
    thoriumAppName: _APP_NAME,
    thoriumAppVersion: _APP_VERSION,
    thoriumPackName: _PACK_NAME,
    thoriumUserDataPath: USER_DATA_FOLDER,
}, null, 4);

debug("Process info:", processInfoStr);

const folderPath = path.join(
    USER_DATA_FOLDER,
    !FORCE_PROD_DB_IN_DEV && (__TH__IS_DEV__ || __TH__IS_CI__) ? "app-logs-dev" : "app-logs",
);
const PROCESS_LOGS = "processLogs.txt";
const appLogs = path.join(
    folderPath,
    PROCESS_LOGS,
);

if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
}

let dump = "#############################################\n";
dump += "MAIN-INSTANCE:\n";
dump += `Date: ${(new Date()).toISOString()}\n`;
// dump +=

dump += `Process: ${processInfoStr}\n`;
dump += "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$44\n";
appendFileSyncWithRotation(appLogs, dump);
