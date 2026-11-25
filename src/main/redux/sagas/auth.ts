// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import debug_ from "debug";
import { app, AuthenticationResponseDetails, AuthInfo, BrowserWindow, Event as ElectronEvent, Event, HandlerDetails, session, shell, WebContents, WebContentsWillNavigateEventParams } from "electron";
import { URL_HOST_COMMON, URL_HOST_OPDS_AUTH, URL_PROTOCOL_OPDS, URL_PROTOCOL_OPDS_MEDIA } from "readium-desktop/common/streamerProtocol";
import { logoutOpdsCatalog } from "readium-desktop/main/services/opdsLogout";
import { getFeed } from "./api/opds/feed";
import { IExternalAuthenticationSession, matchesExternalAuthenticationCallback, startExternalAuthentication } from "./externalAuthentication";
import { submitInlineAuthentication } from "./inlineAuthentication";

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// e__slint-disable-next-line @typescript-eslint/ban-ts-comment
// @__ts-ignore TS1479
import { Headers } from "node-fetch";

import { URL } from "node:url";
import { ToastType } from "readium-desktop/common/models/toast";
import { authActions, opdsActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery, takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { TExternalOpdsAuthenticationType } from "readium-desktop/common/views/opds";
import { getExternalAuthenticationUrl, IExternalAuthenticationDocument } from "./externalAuthenticationUrl";
import { diMainGet, getLibraryWindowFromDi } from "readium-desktop/main/di";
import { cleanCookieJar } from "readium-desktop/main/network/fetch";
import {
    httpGet,
    httpPost,
    httpSetAuthenticationToken,
    IOpdsAuthenticationToken, wipeAuthenticationTokenStorage,
} from "readium-desktop/main/network/http";
import {
    createOpdsPkceTransaction,
    exchangeOpdsPkceAuthorizationCode,
    IOpdsPkceTransaction,
    OPDS_AUTHORIZATION_CODE_PKCE_TYPE,
    OPDS_PKCE_CANONICAL_TYPE,
} from "readium-desktop/main/network/opdsPkce";
import { ContentType } from "readium-desktop/utils/contentType";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, put } from "redux-saga/effects";
import { call as callTyped } from "typed-redux-saga/macro";

import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";

import isURL from "readium-desktop/common/utils/isURL";
import { getOpdsRequestCustomProtocolEventChannel, getOpdsRequestMediaCustomProtocolEventChannel, TregisterHttpProtocolHandler } from "./getEventChannel";

import { getTranslator } from "readium-desktop/common/services/translator";

import { SESSION_PARTITION_AUTH } from "readium-desktop/common/sessions";

const ENABLE_DEV_TOOLS = __TH__IS_DEV__ || __TH__IS_CI__;

// Logger
const filename_ = "readium-desktop:main:saga:auth";
const debug = debug_(filename_);
debug("_");

type TAuthName = "id" | "access_token" | "refresh_token" | "token_type"
    | "code" | "state" | "error" | "error_description";
type TAuthenticationType = TExternalOpdsAuthenticationType;

async function prepareExternalAuthentication(url: string): Promise<IExternalAuthenticationSession> {
    const target = new URL(url);
    if (target.protocol !== "https:" && target.protocol !== "http:") throw new Error("Invalid authentication URL");
    const response = await httpGet(url);
    const baseUrl = response.responseUrl || url;
    const doc = TaJsonDeserialize(await response.response.json(), OPDSAuthenticationDoc);
    const auth = opdsAuthDocConverter(doc, baseUrl);
    if (!auth || (auth.authenticationType !== OPDS_PKCE_CANONICAL_TYPE
        && auth.authenticationType !== "http://opds-spec.org/auth/oauth/implicit"
        && auth.authenticationType !== "http://librarysimplified.org/authtype/SAML-2.0")) {
        throw new Error("Unsupported external authentication method");
    }
    const pkce = auth.authenticationType === OPDS_PKCE_CANONICAL_TYPE
        ? createOpdsPkceTransaction({
            allowInsecureLoopback: ENABLE_DEV_TOOLS,
            authorizationUrl: auth.links?.authenticate?.url || "",
            tokenUrl: auth.links?.token?.url || auth.links?.refresh?.url || "",
            refreshUrl: auth.links?.refresh?.url,
        }) : undefined;
    const implicitAuthData = { authenticationDocumentId: "", nonce: "" };
    const authorizationUrl = getExternalAuthenticationUrl(auth, pkce, implicitAuthData);
    const authorization = new URL(authorizationUrl);
    if (authorization.protocol !== "https:" && authorization.protocol !== "http:") throw new Error("Invalid authorization URL");
    const expectedState = authorization.searchParams.get("state");
    let active = true;
    return {
        authorizationUrl,
        openFallback: async () => {
            const win = await createOpdsAuthenticationModalWin(authorizationUrl);
            if (!active) {
                if (win && !win.isDestroyed()) win.close();
                return undefined;
            }
            return win;
        },
        dispose: () => { active = false; },
        complete: async request => {
            if (request.method !== "GET" || !matchesExternalAuthenticationCallback(request.url, expectedState, !!pkce)) return false;
            const callback = new URL(request.url);
            const params = new URLSearchParams(callback.hash.slice(1) || callback.search.slice(1));
            if (params.get("error")) throw new Error("Authentication denied");
            const parsed = parseRequestFromCustomProtocol(request, auth.authenticationType, implicitAuthData);
            if (!parsed) return false;
            const [, error] = await opdsSetAuthCredentials(parsed, {
                id: auth.id || undefined,
                opdsAuthenticationUrl: baseUrl,
                tokenType: "Bearer",
                refreshUrl: auth.links?.refresh?.url || pkce?.tokenUrl,
                authenticateUrl: pkce?.authorizationUrl || auth.links?.authenticate?.url,
                pkce: !!pkce,
            }, auth.authenticationType, pkce, () => active);
            if (error) throw error;
            return true;
        },
    };
}

function* opdsAuthWipeData() {

    debug("Wipping authentication data");

    yield* callTyped(cleanCookieJar);

    yield* callTyped(wipeAuthenticationTokenStorage);

    const translator = getTranslator();
    yield put(toastActions.openRequest.build(ToastType.Success, translator.__("message.wipeData")));
    debug("End of wipping auth data");
}

function* opdsRequestMediaFlow({request, callback}: TregisterHttpProtocolHandler) {

    const schemePrefix = URL_PROTOCOL_OPDS_MEDIA + "://" + URL_HOST_COMMON + "/";
    if (request && request.url.startsWith(schemePrefix)) {
        const b64 = decodeURIComponent(request.url.slice(schemePrefix.length));
        const url = Buffer.from(b64, "base64").toString("utf8");

        // isURL() excludes the file: and data: URL protocols; the compile-time TLD policy decides whether localhost / non-TLD hosts are accepted (note that ftp: is accepted)
        if (!url || !isURL(url)) {
            debug("isURL() NOK opdsRequestMedia failed not a valid url", url);
            return;
        }
        // Promise<response> in function callback argument
        httpGet(url, {
            ...request,
        }, (response) => {

            debug("opdsRequestMedia success", response.url, response.statusCode);
            callback({
                method: "GET",
                url: request.url,
                statusCode: response?.statusCode || 500,
                headers: {
                    "Content-Type": response.contentType,
                },
                data: response.body || undefined,
            });
            return response;
        }).then((_v) => { /* noop */ }).catch((_err) => { /* debug(err); */ });

    } else {
        debug("opdsRequestMedia error ?!!", request);
    }

}

export function saga() {

    const opdsRequestChannel = getOpdsRequestCustomProtocolEventChannel();
    const opdsRequestMediaChannel = getOpdsRequestMediaCustomProtocolEventChannel();

    return all([
        startExternalAuthentication({
            prepare: prepareExternalAuthentication,
            getCatalog: getFeed,
            openExternal: (url: string) => shell.openExternal(url),
            callbacks: opdsRequestChannel,
        }),
        takeSpawnEvery(
            (action: { type: string }) => action.type === authActions.submit.ID && !(action as authActions.submit.TAction).payload.options?.promptId,
            submitInlineAuthentication,
            (e) => debug("Inline authentication submission failed", e),
        ),
        takeSpawnEvery(
            authActions.wipeData.ID,
            opdsAuthWipeData,
            (e) => debug("opds authentication data wipping error", e),
        ),
        takeSpawnLeading(
            authActions.logout.ID,
            function* (action: authActions.logout.TAction) {
                const feedUrl = action.payload.feedUrl;
                yield* callTyped(logoutOpdsCatalog, feedUrl);
                yield put(opdsActions.refresh.build());
            },
            (e) => debug("opds LOGOUT", e),
        ),
        takeSpawnEveryChannel(
            opdsRequestMediaChannel,
            opdsRequestMediaFlow,
            (e) => debug("redux OPDS Request Media channel error", e),
        ),
    ]);
}

// -----

async function opdsSetAuthCredentials(
    opdsCustomProtocolRequestParsed: IParseRequestFromCustomProtocol<TAuthName>,
    authCredentials: IOpdsAuthenticationToken,
    authenticationType: TAuthenticationType,
    pkceTransaction?: IOpdsPkceTransaction,
    isActive: () => boolean = () => true,
): Promise<[undefined, Error]> {

    if (!opdsCustomProtocolRequestParsed) {
        return [, new Error("")];
    }

    const { url: { host, searchParams }, method, data } = opdsCustomProtocolRequestParsed;
    if (host === URL_HOST_OPDS_AUTH) {

        // handle GET or POST request

        if (method === "GET") {

            if (authenticationType === OPDS_PKCE_CANONICAL_TYPE) {
                if (!pkceTransaction) {
                    return [, new Error("missing PKCE authentication transaction")];
                }

                try {
                    const tokenResponse = await exchangeOpdsPkceAuthorizationCode(
                        pkceTransaction,
                        data,
                        async (tokenUrl, body) => {
                            const headers = new Headers();
                            headers.set("Accept", "application/json");
                            headers.set("Content-Type", ContentType.FormUrlEncoded);
                            const response = await httpPost<unknown>(tokenUrl, {
                                body,
                                headers,
                            });
                            const responseJson = await response.response?.json();
                            if (!response.isSuccess) {
                                throw new Error(`OAuth token endpoint failed with HTTP ${response.statusCode || 0}`);
                            }
                            return responseJson;
                        },
                    );
                    const tokenType = tokenResponse.tokenType.charAt(0).toUpperCase() +
                        tokenResponse.tokenType.slice(1);
                    if (!isActive()) return [, new Error("Authentication cancelled")];
                    await httpSetAuthenticationToken({
                        ...authCredentials,
                        accessToken: tokenResponse.accessToken,
                        pkce: true,
                        refreshToken: tokenResponse.refreshToken,
                        refreshUrl: authCredentials.refreshUrl || pkceTransaction.tokenUrl,
                        tokenType,
                    });
                    return [, undefined];
                } catch (error) {
                    return [, error instanceof Error ? error : new Error(String(error))];
                }
            }

            const newCredentials = {
                ...authCredentials,
                id: data.id || searchParams?.get("id") || authCredentials.id || undefined,
                tokenType: data.token_type || searchParams?.get("token_type") || authCredentials.tokenType || "Bearer",
                refreshToken: data.refresh_token || searchParams?.get("refresh_token") || undefined,
                accessToken: data.access_token || searchParams?.get("access_token") || undefined,
            };

            newCredentials.tokenType =
                newCredentials.tokenType.charAt(0).toUpperCase() + newCredentials.tokenType.slice(1);

            if (typeof newCredentials.accessToken === "string") {

                debug("new opds authentication credentials");
                if (!isActive()) return [, new Error("Authentication cancelled")];
                await httpSetAuthenticationToken(newCredentials);

                return [, undefined];
            }

            return [, new Error("no accessToken received")];

        }
    } else {
        return [, new Error("not host path authorize")];
    }

    return [, new Error("")];
}

function opdsAuthDocConverter(doc: OPDSAuthenticationDoc, baseUrl: string): IExternalAuthenticationDocument | undefined {
    const converter = diMainGet("opds-feed-view-converter");
    const view = converter.convertOpdsAuthToView(doc, baseUrl);
    if (!view.auth?.external) return undefined;
    const authenticationType = view.auth.authenticationType as TExternalOpdsAuthenticationType;
    const authentication = doc.Authentication.find(method => authenticationType === OPDS_PKCE_CANONICAL_TYPE
        ? OPDS_AUTHORIZATION_CODE_PKCE_TYPE.some(type => type === method.Type)
        : method.Type === authenticationType);
    const links: IExternalAuthenticationDocument["links"] = {};
    for (const link of authentication?.Links || []) {
        for (const rel of ["authenticate", "refresh", "token"] as const) {
            if (link.Rel?.includes(rel) && typeof link.Href === "string") {
                links[rel] = converter.convertLinkToView(link, baseUrl);
            }
        }
    }
    return { id: doc.Id || "", authenticationType, links };
}

async function createOpdsAuthenticationModalWin(urlStr: string): Promise<BrowserWindow | undefined> {

    debug("OPDS AUTH win URL", urlStr.slice(0, 100) + (urlStr.length > 100 ? "..." : ""));

    const libWin = tryCatchSync(() => getLibraryWindowFromDi(), filename_);
    if (!libWin || libWin.isDestroyed() || libWin.webContents.isDestroyed()) {
        debug("no lib win !!");
        return undefined;
    }

    if (!/^https?:\/\//.test(urlStr)) {
        debug("INVALID AUTH urlStr", urlStr);
        return undefined;
    }
    const title = getTranslator().translate("catalog.opds.auth.login");

    const libWinBound = libWin.getBounds();
    const win = new BrowserWindow(
        {
            title,
            width: libWinBound?.width || 800,
            minWidth: libWinBound?.width || 800,
            height: libWinBound?.height || 600,
            minHeight: libWinBound?.height || 600,
            parent: libWin,
            modal: true,
            show: false,
            webPreferences: {
                // enableRemoteModule: false,
                allowRunningInsecureContent: false,
                backgroundThrottling: true,
                devTools: ENABLE_DEV_TOOLS, // this does not automatically open devtools, just enables them (see Electron API openDevTools())
                nodeIntegration: false,
                sandbox: true,
                contextIsolation: true,
                nodeIntegrationInWorker: false,
                webSecurity: true,
                webviewTag: false,
                partition: SESSION_PARTITION_AUTH, // => for example, failure in web inspector console debugger:
                // fetch("URL_PROTOCOL_THORIUMHTTPS"+"://"+URL_HOST_COMMON+"/" + URL_PATH_PREFIX_PDFJS + "/web/viewer.html").then((r)=>r.text()).then((t)=>console.log(t));
            },
        });
    win.setMenu(null);

    win.webContents.addListener("input-event", (_ev, inputEvent) => {
        if ((inputEvent.type === "keyUp" || inputEvent.type === "keyDown") && (inputEvent as KeyboardEvent).key === "Escape") {
            debug("win INPUT", inputEvent.type, (inputEvent as KeyboardEvent).key);
            const ur = `${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/`;
            win.webContents.loadURL(ur).then(() => { debug("loadURL() ok " + ur); }).catch((err) => { debug("loadURL() nok " + ur); debug(err); });
        }
    });

    // const handler = () => {
    //     if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) {
    //         win.close();
    //     }
    // };
    // globalShortcut.register("esc", handler);
    // win.on("close", () => {
    //     globalShortcut.unregister("esc");
    // });

    win.once("ready-to-show", () => {
        debug("OPDS AUTH win ready-to-show", urlStr.substring(0, 500));
        win.show();
    });

    const willNavigate = (navUrl: string | undefined | null) => {

        if (!navUrl) {
            debug("willNavigate ==> nil: ", navUrl);
            return;
        }

        if (/^https?:\/\//.test(navUrl)) { // ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc.

            debug("willNavigate ==> EXTERNAL: ", win.webContents.getURL().substring(0, 500), " *** ", navUrl);
            shell.openExternal(navUrl).then(() => { /* noop */ }).catch((err: unknown) => { debug(err); }); // .finally(() => { /* noop */ })
            return;
        }

        debug("willNavigate ==> noop: ", navUrl);
    };

    win.webContents.setWindowOpenHandler((details: HandlerDetails) => {
        debug("BrowserWindow.webContents.setWindowOpenHandler (always DENY), win.webContents.id: ", win.webContents.id, "\n --- details.url: ", details.url.substring(0, 500), "\n === win.webContents.getURL()", win.webContents.getURL().substring(0, 500));

        // willNavigate(details.url);

        return { action: "deny" };
    });

    win.webContents.on("will-navigate", (details: ElectronEvent<WebContentsWillNavigateEventParams>, detailsUrl: string) => {
        debug("BrowserWindow.webContents.on('will-navigate') (always PREVENT?), win.webContents.id: ", win.webContents.id, "\n --- details.url: ", details.url?.substring(0, 500), "\n *** detailsUrl: ", detailsUrl?.substring(0, 500), "\n ~~~ urlStr: ", urlStr.substring(0, 500), "\n === win.webContents.getURL(): ", win.webContents.getURL()?.substring(0, 500));

        if (details.url?.startsWith(`${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/`)) {
            debug(`${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/ ==> PASS: `, details.url?.substring(0, 500));
            return;
        }
        if (details.url === win.webContents.getURL()) {
            debug("same URL ==> PASS: ", details.url?.substring(0, 500));
            return;
        }

        if (details.url && /^https?:\/\//.test(details.url)) {
            let willNavigateOrigin: string | undefined;
            try {
                const detailsUrlURL = new URL(details.url);
                willNavigateOrigin = detailsUrlURL.origin;
                debug("willNavigateOrigin OK:", willNavigateOrigin);
            } catch (e) {
                debug("willNavigateOrigin NOK:", e);
            }

            if (willNavigateOrigin) {
                let initialOrigin: string | undefined;
                try {
                    const initialUrl = new URL(urlStr);
                    initialOrigin = initialUrl.origin;
                    debug("initialOrigin OK:", initialOrigin);
                } catch (e) {
                    debug("initialOrigin NOK:", e);
                }
                if (initialOrigin) {
                    if (willNavigateOrigin === initialOrigin) {
                        debug("willNavigateOrigin === initialOrigin ==> PASS: ");
                        return;
                    }
                }

                const urlStrPossiblyRedirect = win.webContents.getURL();
                if (urlStrPossiblyRedirect) {
                    let possiblyRedirectOrigin: string | undefined;
                    try {
                        const possiblyRedirectUrl = new URL(urlStrPossiblyRedirect);
                        possiblyRedirectOrigin = possiblyRedirectUrl.origin;
                        debug("possiblyRedirectOrigin OK:", possiblyRedirectOrigin);
                    } catch (e) {
                        debug("possiblyRedirectOrigin NOK:", e);
                    }
                    if (possiblyRedirectOrigin) {
                        if (willNavigateOrigin === possiblyRedirectOrigin) {
                            debug("willNavigateOrigin === possiblyRedirectOrigin ==> PASS: ");
                            return;
                        }
                    }
                }
            }
        }

        details.preventDefault();
        willNavigate(details.url);
    });

    // win.on("close", () => {

    // });

    // win.webContents.once("did-start-loading", () => {
    //     (win as any).___POST_PUT_HTTP_REQUEST_IN_MAINFRAME_WAS_DETECTED = false;
    // });

    // win.webContents.once("did-finish-load", () => {
    //     debug("did-finish-load ==> onBeforeRequest hook", win.webContents.getURL());
    //     const authSession = session.fromPartition(SESSION_PARTITION_AUTH, { cache: false });
    //     authSession.webRequest.onBeforeRequest((details, callback) => {
    //         debug("onBeforeRequest details.method", details.method);
    //         debug("onBeforeRequest details.referrer", details.referrer);
    //         debug("onBeforeRequest details.resourceType", details.resourceType);
    //         debug("onBeforeRequest details.url", details.url);
    //         debug("onBeforeRequest details.webContents?.getURL()", details.webContents?.getURL().substring(0, 500));

    //         if ((details.method === "POST" || details.method === "PUT") // && details.resourceType === "mainFrame"
    //             || (win as any).___POST_PUT_HTTP_REQUEST_IN_MAINFRAME_WAS_DETECTED) {

    //             debug("onBeforeRequest ALLOW");
    //             (win as any).___POST_PUT_HTTP_REQUEST_IN_MAINFRAME_WAS_DETECTED = true;
    //             callback({ cancel: false, redirectURL: undefined });
    //         } else { // GET ... HEAD PATCH etc.
    //             debug("onBeforeRequest REJECT");
    //             if (details.method === "GET" && details.resourceType === "mainFrame") {
    //                 debug("onBeforeRequest REJECT reset");
    //                 (win as any).___POST_PUT_HTTP_REQUEST_IN_MAINFRAME_WAS_DETECTED = false;
    //             }
    //             callback({ cancel: true, redirectURL: undefined });
    //         }
    //     });
    // });

    let _proxyWasBypassed = false;

    let _proxyWasUsernamePassword = false;
    let _proxy_username: string | undefined;
    let _proxy_password: string | undefined;
    let _proxy_url: string | undefined;

    const appOnLogin = (
        event: Event,
        _webContents: WebContents | null,
        _authenticationResponseDetails: AuthenticationResponseDetails,
        authInfo: AuthInfo,
        callback: (username?: string, password?: string) => void) => {

        debug("Electron app.onLogin...");
        if (_proxyWasUsernamePassword && authInfo.isProxy && _proxy_username && _proxy_password) {
            debug("Electron app.onLogin PROXY");
            event.preventDefault();
            callback(_proxy_username, _proxy_password);

            // try just once (could try several time, but watch out for "Error: ERR_TOO_MANY_RETRIES (-375) loading")
            _proxyWasUsernamePassword = false;
            _proxy_username = undefined;
            _proxy_password = undefined;
            _proxy_url = undefined;
            app.off("login", appOnLogin);
        }
    };

    win.on("close", () => {
        debug("OPDS AUTH win close", urlStr.substring(0, 500));

        if (_proxyWasUsernamePassword) {
            debug("OPDS AUTH win close _proxyWasUsernamePassword");
            app.off("login", appOnLogin);
        }
        _proxyWasUsernamePassword = false;

        if (_proxyWasBypassed) {
            debug("OPDS AUTH win close _proxyWasBypassed");
            const authSession = session.fromPartition(SESSION_PARTITION_AUTH, { cache: false });
            authSession.setProxy({ mode: "system" }).then(() => { debug("setProxy ok (system)"); }).catch((eee) => { debug("setProxy nok (system)"); debug(eee); });
        }
        _proxyWasBypassed = false;
    });

    // win.webContents.loadURL
    // DO NOT AWAIT!! (race condition when urlStr is a HTTP link that immediately redirects to OPDS://AUTHORIZE)

    debug("OPDS AUTH win LOAD before 1", urlStr.substring(0, 500));
    win.loadURL(urlStr).then(() => {
        debug("loadURL() 1 ok " + urlStr);
    }).catch((err) => {
        debug("loadURL() 1 nok " + urlStr);
        debug(err);
        if (err && String(err).includes("(-111)")) {
            // Error:  (-111) loading
            // Chromium
            // net::ERR_TUNNEL_CONNECTION_FAILED

            function tryProxy(proxyU: string) {
                try {
                    const parsed = new URL(proxyU);
                    if (parsed.username || parsed.password) {
                        _proxy_username = decodeURIComponent(parsed.username);
                        _proxy_password = decodeURIComponent(parsed.password);
                        _proxy_url = `${parsed.protocol}//${parsed.host}`;

                        _proxyWasUsernamePassword = true;

                        debug("_proxy_username: ", _proxy_username);
                        debug("_proxy_password: ", _proxy_password);
                        debug("_proxy_url: ", _proxy_url);

                        session.defaultSession.setProxy({
                            mode: "fixed_servers",
                            proxyRules: _proxy_url,
                        }).then(() => { debug("setProxy ok (fixed_servers)"); }).catch((eee) => { debug("setProxy nok (fixed_servers)"); debug(eee); });
                    }
                } catch (err) {
                    debug("Proxy URL?", err);
                }
            }

            let proxyUrl = process.env.HTTPS_PROXY;
            if (proxyUrl) {
                debug("HTTPS_PROXY ...", proxyUrl);
                tryProxy(proxyUrl);
            }
            if (!_proxyWasUsernamePassword) {
                proxyUrl = process.env.HTTP_PROXY;
                if (proxyUrl) {
                    debug("HTTP_PROXY ...", proxyUrl);
                    tryProxy(proxyUrl);
                }
            }
            if (_proxyWasUsernamePassword) {
                app.on("login", appOnLogin);
            }

            debug("OPDS AUTH win LOAD before 2", urlStr.substring(0, 500));
            win.loadURL(urlStr).then(() => {
                debug("loadURL() 2 ok " + urlStr);
                // authSession.setProxy({ mode: "system" }).then(() => { debug("setProxy ok (system)"); }).catch((eee) => { debug("setProxy nok (system)"); debug(eee); });
            }).catch((err) => {
                debug("loadURL() 2 nok " + urlStr);
                debug(err);

                if (_proxyWasUsernamePassword) {
                    app.off("login", appOnLogin);
                }
                _proxyWasUsernamePassword = false;
                _proxy_username = undefined;
                _proxy_password = undefined;
                _proxy_url = undefined;

                if (err && (String(err).includes("(-111)") || String(err).includes("(-375)"))) {
                    // Error:  (-111) loading
                    // Chromium
                    // net::ERR_TUNNEL_CONNECTION_FAILED
                    //
                    // Error: ERR_TOO_MANY_RETRIES (-375) loading

                    _proxyWasBypassed = true;

                    const authSession = session.fromPartition(SESSION_PARTITION_AUTH, { cache: false });
                    authSession.setProxy({ mode: "direct" }).then(() => { debug("setProxy ok (direct)"); }).catch((eee) => { debug("setProxy nok (direct)"); debug(eee); });

                    debug("OPDS AUTH win LOAD before 3", urlStr.substring(0, 500));
                    win.loadURL(urlStr).then(() => {
                        debug("loadURL() 3 ok " + urlStr);
                        // authSession.setProxy({ mode: "system" }).then(() => { debug("setProxy ok (system)"); }).catch((eee) => { debug("setProxy nok (system)"); debug(eee); });
                    }).catch((err) => {
                        debug("loadURL() 3 nok " + urlStr);
                        debug(err);

                        _proxyWasBypassed = false;

                        authSession.setProxy({ mode: "system" }).then(() => { debug("setProxy ok (system)"); }).catch((eee) => { debug("setProxy nok (system)"); debug(eee); });
                        try {
                            win.close();
                        } catch (e) {
                            debug(e);
                        }
                    });
                    debug("OPDS AUTH win LOAD after 3", urlStr.substring(0, 500));
                } else {
                    try {
                        win.close();
                    } catch (e) {
                        debug(e);
                    }
                }
            });
            debug("OPDS AUTH win LOAD after 2", urlStr.substring(0, 500));
        } else {
            try {
                win.close();
            } catch (e) {
                debug(e);
            }
        }
    });
    debug("OPDS AUTH win LOAD after 1", urlStr.substring(0, 500));

    return win;
}

interface IParseRequestFromCustomProtocol<T = string> {
    url: URL;
    method: "GET";
    data: {
        [key in T & string]?: string;
    };
}
function parseRequestFromCustomProtocol(req: Electron.ProtocolRequest, authenticationType: TAuthenticationType, implicitAuthData = { authenticationDocumentId: "", nonce: "" })
    : IParseRequestFromCustomProtocol<TAuthName> | undefined {

    debug("########");
    debug("opds:// request:", req);
    debug("########");

    if (typeof req === "object") {
        const { method, url } = req;

        const urlParsed = tryCatchSync(() => new URL(url), filename_);
        if (!urlParsed) {
            debug("authentication: can't parse the opds:// request url", url);
            return undefined;
        }
        const { protocol: urlProtocol, host } = urlParsed;

        if (urlProtocol !== `${URL_PROTOCOL_OPDS}:`) {
            debug("bad opds protocol !!", urlProtocol);
            return undefined;
        }

        if (method === "GET") {
            if (host === URL_HOST_OPDS_AUTH) {

                // OPDS Authentication Document Specification is at odds with the OAuth 2.0 Implicit Grant Flow Specification:
                //     OPDS Auth wants the response parameters in the query component of the Redirection URI
                //     OAuth 2.0 Implicit Grant Flow wants the response parameters in the fragment component of the Redirection URI
                // Solution: Replace the fragment component with a query component to ensure the response parameters are parsed correctly
                const urlSearchParam = url.replace("#", "?");

                const urlObject = new URL(urlSearchParam);

                const data: Record<string, string> = {};
                for (const [key, value] of urlObject.searchParams) {
                    data[key] = value;
                }

                // https://openid.net/specs/openid-connect-core-1_0.html#ImplicitAuthError
                // When using the Implicit Flow, Authorization Error Responses are made in the same manner
                // as for the Authorization Code Flow:
                //     When using the Authorization Code Flow, the error response parameters are added to the
                //     query component of the Redirection URI, unless a different Response Mode was specified.
                if (data.error) {
                    debug("OAuth Error Response", "error:", { error: data.error, error_description: data.error_description });
                    if (authenticationType !== OPDS_PKCE_CANONICAL_TYPE) {
                        return undefined;
                    }
                }

                if (authenticationType === "http://opds-spec.org/auth/oauth/implicit") {
                    if (data.id && implicitAuthData.authenticationDocumentId && data.id !== implicitAuthData.authenticationDocumentId) {
                        debug("OAuth 2.0 implicit grant flow ID mismatch!", "expected (auth doc):", implicitAuthData.authenticationDocumentId, "actual (URL query param):", data.id);
                        return undefined;
                        // see https://github.com/edrlab/thorium-reader/pull/2510
                    } else {
                        debug("OAuth 2.0 implicit grant flow ID match or missing (URL query param and/or auth doc) ==> pass.", "expected (auth doc):", implicitAuthData.authenticationDocumentId, "actual (URL query param):", data.id);
                    }

                    if (data.state && implicitAuthData.nonce && data.state !== implicitAuthData.nonce) {
                        debug("OAuth 2.0 implicit grant flow NONCE mismatch!", "expected (auth doc):", implicitAuthData.nonce, "actual (URL query param):", data.state);
                        return undefined;
                        // https://auth0.com/docs/secure/attack-protection/state-parameters
                        // https://github.com/edrlab/thorium-reader/issues/2506
                    } else {
                        debug("OAuth 2.0 implicit grant flow NONCE match or missing (URL query param and/or auth doc) ==> pass.", "expected (auth doc):", implicitAuthData.nonce, "actual (URL query param):", data.state);
                    }
                }

                return {
                    url: urlParsed,
                    method: "GET",
                    data,
                };
            }
        }
    }

    return undefined;
}
