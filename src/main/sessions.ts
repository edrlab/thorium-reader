// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clearDefaultSession, clearSession, clearWebviewSession, getWebViewSession } from "@r2-navigator-js/electron/main/sessions";
import { SESSION_PARTITION_AUTH, SESSION_PARTITION_PDFJS, SESSION_PARTITION_PDFJSEXTRACT } from "readium-desktop/common/sessions";
import { URL_PROTOCOL_PDFJSEXTRACT, URL_PROTOCOL_FILEX, URL_PROTOCOL_STORE, URL_HOST_COMMON } from "readium-desktop/common/streamerProtocol";
import * as debug_ from "debug";
import { net, session } from "electron";
import { tryDecodeURIComponent } from "readium-desktop/common/utils/uri";
import { pathToFileURL } from "url";
import path from "path";
import { diMainGet } from "readium-desktop/main/di";

const debug = debug_("readium-desktop:main#sessions");
debug("_");

interface PromiseFulfilled<T> {
    status: "fulfilled";
    value: T;
}
interface PromiseRejected {
    status: "rejected";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reason: any;
}

async function promiseAllSettled<T>(promises: Array<Promise<T>>):
    Promise<Array<(PromiseFulfilled<T> | PromiseRejected)>> {

    const promises_ = promises.map(async (promise) => {
        return promise
            .then<PromiseFulfilled<T>>((value) => {
                return {
                    status: "fulfilled",
                    value,
                };
            })
            .catch((reason) => {
                return {
                    reason,
                    status: "rejected",
                } as PromiseRejected;
            });
    });
    return Promise.all(promises_);
}

export async function clearPdfJsSession(): Promise<void> {
    const sess = session.fromPartition(SESSION_PARTITION_PDFJS, { cache: false });
    if (sess) {
        try {
            await clearSession(sess, `[${SESSION_PARTITION_PDFJS}]`);
        } catch (err) {
            debug(err);
        }
    }

    return Promise.resolve();
}

export async function clearPdfJsExtractSession(): Promise<void> {
    const sess = session.fromPartition(SESSION_PARTITION_PDFJSEXTRACT, { cache: false });
    if (sess) {
        try {
            await clearSession(sess, `[${SESSION_PARTITION_PDFJSEXTRACT}]`);
        } catch (err) {
            debug(err);
        }
    }

    return Promise.resolve();
}

export async function clearAuthSession(): Promise<void> {
    const sess = session.fromPartition(SESSION_PARTITION_AUTH, { cache: false });
    if (sess) {
        try {
            await clearSession(sess, `[${SESSION_PARTITION_AUTH}]`);
        } catch (err) {
            debug(err);
        }
    }

    return Promise.resolve();
}

export async function clearSessions(): Promise<void> {
    try {
        await promiseAllSettled([clearDefaultSession(), clearWebviewSession(), clearAuthSession(), clearPdfJsSession(), clearPdfJsExtractSession()]);
    } catch (err) {
        debug(err);
    }

    return Promise.resolve();
}

// https://www.electronjs.org/docs/latest/api/session#sessetpermissionrequesthandlerhandler
// 'clipboard-read' | 'clipboard-sanitized-write' | 'display-capture' | 'fullscreen' | 'geolocation' | 'idle-detection' | 'media' | 'mediaKeySystem' | 'midi' | 'midiSysex' | 'notifications' | 'pointerLock' | 'keyboardLock' | 'openExternal' | 'speaker-selection' | 'storage-access' | 'top-level-storage-access' | 'window-management' | 'unknown' | 'fileSystem' | 'hid' ' | 'serial' | 'usb' | 'deprecated-sync-clipboard-read'
export const initPermissions = () => {

    if (session.defaultSession) {
        session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
            debug("setPermissionRequestHandler session.defaultSession");
            debug(wc.getURL());
            debug(permission);
            callback(false);
        });
        session.defaultSession.setPermissionCheckHandler((wc, permission, origin) => {
            debug("setPermissionCheckHandler session.defaultSession");
            debug(wc?.getURL());
            debug(permission);
            debug(origin);
            return false;
        });
    }

    const webViewSession = getWebViewSession();
    if (webViewSession) {
        webViewSession.setPermissionRequestHandler((wc, permission, callback) => {
            debug("setPermissionRequestHandler webViewSession");
            debug(wc.getURL());
            debug(permission);
            callback(false);
        });
        webViewSession.setPermissionCheckHandler((wc, permission, origin) => {
            debug("setPermissionCheckHandler webViewSession");
            debug(wc?.getURL());
            debug(permission);
            debug(origin);
            return false;
        });
    }

    const pdfSession = session.fromPartition(SESSION_PARTITION_PDFJS, { cache: false });
    if (pdfSession) {
        pdfSession.setPermissionRequestHandler((wc, permission, callback) => {
            debug("setPermissionRequestHandler pdfSession");
            debug(wc.getURL());
            debug(permission);
            callback(false);
        });
        pdfSession.setPermissionCheckHandler((wc, permission, origin) => {
            debug("setPermissionCheckHandler pdfSession");
            debug(wc?.getURL());
            debug(permission);
            debug(origin);
            return false;
        });
    }

    const pdfExtractSession = session.fromPartition(SESSION_PARTITION_PDFJSEXTRACT, { cache: false });
    if (pdfExtractSession) {
        pdfExtractSession.setPermissionRequestHandler((wc, permission, callback) => {
            debug("setPermissionRequestHandler pdfExtractSession");
            debug(wc.getURL());
            debug(permission);
            callback(false);
        });
        pdfExtractSession.setPermissionCheckHandler((wc, permission, origin) => {
            debug("setPermissionCheckHandler pdfExtractSession");
            debug(wc?.getURL());
            debug(permission);
            debug(origin);
            return false;
        });
    }


    const authSession = session.fromPartition(SESSION_PARTITION_AUTH, { cache: false });
    if (authSession) {
        authSession.setPermissionRequestHandler((wc, permission, callback) => {
            debug("setPermissionRequestHandler authSession");
            debug(wc.getURL());
            debug(permission);
            callback(false);
        });
        authSession.setPermissionCheckHandler((wc, permission, origin) => {
            debug("setPermissionCheckHandler authSession");
            debug(wc?.getURL());
            debug(permission);
            debug(origin);
            return false;
        });
    }
};

export const initProtocols = () => {

  const protocolHandler_FILEX = (
    request: Request,
  ): Response | Promise<Response> => {
    debug("---protocolHandler_FILEX");
    debug(request);
    const urlPath = request.url.substring(`${URL_PROTOCOL_FILEX}://${URL_HOST_COMMON}/`.length);
    debug(urlPath);
    const urlPathDecoded = urlPath.split("/").map((segment) => {
      return segment?.length ? tryDecodeURIComponent(segment) : "";
    }).join("/");
    debug(urlPathDecoded);
    const filePathUrl = pathToFileURL(urlPathDecoded).toString();
    debug(filePathUrl);
    return net.fetch(filePathUrl); // potential security hole: local filesystem access (mitigated by URL scheme not .registerSchemesAsPrivileged() and not .handle() or .registerXXXProtocol() directly on r2-navigator-js.getWebViewSession().protocol or any other partitioned session, unlike Electron.protocol and Electron.session.defaultSession.protocol)
  };
  session.defaultSession.protocol.handle(URL_PROTOCOL_FILEX, protocolHandler_FILEX);
  // protocol.unhandle(URL_PROTOCOL_FILEX);

  const protocolHandler_Store = (
    request: Request,
  ): Response | Promise<Response> => {
    debug("---protocolHandler_Store");
    debug(request);
    const urlPath = request.url.substring(`${URL_PROTOCOL_STORE}://`.length);
    debug(urlPath);
    // const urlPathDecoded = tryDecodeURIComponent(urlPath);
    // debug(urlPathDecoded);
    const pubStorage = diMainGet("publication-storage");
    const rootPath = pubStorage.getRootPath();
    debug(rootPath);
    const filePath = path.join(rootPath, urlPath);
    debug(filePath);
    const filePathUrl = pathToFileURL(filePath).toString();
    debug(filePathUrl);
    return net.fetch(filePathUrl); // potential security hole: local filesystem access (mitigated by URL scheme not .registerSchemesAsPrivileged() and not .handle() or .registerXXXProtocol() directly on r2-navigator-js.getWebViewSession().protocol or any other partitioned session, unlike Electron.protocol and Electron.session.defaultSession.protocol)
  };
  session.defaultSession.protocol.handle(URL_PROTOCOL_STORE, protocolHandler_Store);
  // protocol.unhandle(URL_PROTOCOL_STORE);

  const pdfExtractSession = session.fromPartition(SESSION_PARTITION_PDFJSEXTRACT, { cache: false });
  const protocolHandler_PDF = (
    request: Request,
  ): Response | Promise<Response> => {
    debug("---protocolHandler_PDF");
    debug(request);
    const urlPath = request.url.substring(`${URL_PROTOCOL_PDFJSEXTRACT}://${URL_HOST_COMMON}/`.length);
    debug(urlPath);
    const urlPathDecoded = tryDecodeURIComponent(urlPath);
    debug(urlPathDecoded);
    const filePathUrl = pathToFileURL(urlPathDecoded).toString();
    debug(filePathUrl);
    return net.fetch(filePathUrl); // potential security hole: local filesystem access (mitigated by URL scheme not .registerSchemesAsPrivileged() and not .handle() or .registerXXXProtocol() directly on r2-navigator-js.getWebViewSession().protocol or any other partitioned session, unlike Electron.protocol and Electron.session.defaultSession.protocol)
  };
  pdfExtractSession.protocol.handle(URL_PROTOCOL_PDFJSEXTRACT, protocolHandler_PDF);
  // protocol.unhandle(URL_PROTOCOL_PDFJSEXTRACT);

  // FAIL because of unsupported scheme protocol, even if exposed globally in the default session:
  // fetch(URL_PROTOCOL_PDFJSEXTRACT + "://"+URL_HOST_COMMON+"/%2Fpath%2Fto%2Ffile").then((r)=>r.statusCode).then((t)=>console.log(t)).catch((e)=>{console.log(e)});

  // WORKS with non-partitioned BrowserWindow or WebView (CORS):
  // const x = new XMLHttpRequest();
  // x.open("GET", URL_PROTOCOL_PDFJSEXTRACT + "://"+URL_HOST_COMMON+"/%2Fpath%2Fto%2Ffile");
  // //x.responseType = "arraybuffer";
  // x.responseType = "text";
  // x.onerror = () => {
  //     console.log("X ERROR", x.readyState, x.status, typeof x.response);
  // };
  // x.onreadystatechange = () => {
  //     console.log("X STATECHANGE", x.readyState, x.status, typeof x.response, x.readyState === 4 ? x.response : undefined);
  // };
  // x.onprogress = () => {
  //     console.log("X PROGRESS", x.readyState, x.status, typeof x.response);
  // };
  // x.send(null);
};
