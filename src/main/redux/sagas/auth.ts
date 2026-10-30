// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import debug_ from "debug";
import { isOpdsCredentialAuthenticationType, OPDS_AUTHENTICATION_TYPES, TAuthenticationType } from "readium-desktop/common/opdsAuthentication";
import { URL_PROTOCOL_OPDS_MEDIA, URL_HOST_COMMON, URL_PROTOCOL_OPDS, URL_HOST_OPDS_AUTH, URL_OPDS_AUTH_RETRY } from "readium-desktop/common/streamerProtocol";
import { BrowserWindow, HandlerDetails, Event as ElectronEvent, WebContentsWillNavigateEventParams, shell } from "electron";

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

import { ToastType } from "readium-desktop/common/models/toast";
import { authActions, historyActions, opdsActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery, takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { takeSpawnLeading, takeSpawnLeadingChannel } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { diMainGet, getLibraryWindowFromDi } from "readium-desktop/main/di";
import {
    getOpdsAuthenticationChannel, TOpdsAuthenticationChannel,
} from "readium-desktop/main/event";
import { cleanCookieJar, removeCookiesFromHost } from "readium-desktop/main/network/fetch";
import {
    deleteAuthenticationToken,
    getAuthenticationToken,
    httpGet,
    httpPost,
    httpSetAuthenticationToken,
    IOpdsAuthenticationToken, wipeAuthenticationTokenStorage,
} from "readium-desktop/main/network/http";
import { ContentType } from "readium-desktop/utils/contentType";
import {
    IOpdsPkceTransaction,
    OPDS_AUTHORIZATION_CODE_PKCE_TYPE,
    createOpdsPkceTransaction,
    exchangeOpdsPkceAuthorizationCode,
} from "readium-desktop/main/network/opdsPkce";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, cancel, delay, join, put, race, spawn } from "redux-saga/effects";
import { call as callTyped, fork as forkTyped, take as takeTyped } from "typed-redux-saga/macro";
import { URL } from "node:url";

import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { getOpdsRequestCustomProtocolEventChannel, getOpdsRequestMediaCustomProtocolEventChannel, TregisterHttpProtocolHandler} from "./getEventChannel";
import { initClientSecretToken } from "./apiapp";
import { digestAuthentication } from "readium-desktop/utils/digest";
import isURL from "readium-desktop/common/utils/isURL";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// e__slint-disable-next-line @typescript-eslint/ban-ts-comment
// @__ts-ignore TS1479
import { nanoid } from "nanoid";

import { getTranslator } from "readium-desktop/common/services/translator";

import { SESSION_PARTITION_AUTH } from "readium-desktop/common/sessions";

const ENABLE_DEV_TOOLS = __TH__IS_DEV__ || __TH__IS_CI__;
const OPDS_AUTH_APPLICATION = "org.edrlab.thorium.desktop";

// Logger
const filename_ = "readium-desktop:main:saga:auth";
const debug = debug_(filename_);
debug("_");

type TLinkType = "refresh" | "authenticate";
type TLabelName = "login" | "password";
type TDigestInfo = "realm" | "nonce" | "qop" | "algorithm";
type TAuthName = "id" | "access_token" | "refresh_token" | "token_type"
    | "code" | "state" | "error" | "error_description";
const LINK_TYPE: TLinkType[] = [
    "refresh",
    "authenticate",
];

// const LABEL_NAME: TLabelName[] = [
//     "login",
//     "password",
// ];

const opdsAuthFlow =
    (opdsRequestFromCustomProtocol: ReturnType<typeof getOpdsRequestCustomProtocolEventChannel>) =>
        function*([doc, baseUrl, retryWithInternalBrowserWindowInsteadOfDefaultExternalWebBrowser]: TOpdsAuthenticationChannel) {

            debug("opds authenticate flow");
            const baseUrlParsed = tryCatchSync(() => new URL(baseUrl), filename_);
            if (!baseUrlParsed) {
                debug("no valid base url", baseUrl);
                return;
            }

            const authParsed = tryCatchSync(() => opdsAuthDocConverter(doc, baseUrl), filename_);
            if (!authParsed) {
                debug("authentication doc parsing error");
                return;
            }
            debug("authentication doc parsed", authParsed);

            let pkceTransaction: IOpdsPkceTransaction | undefined;
            if (authParsed.authenticationType === OPDS_AUTHORIZATION_CODE_PKCE_TYPE) {
                pkceTransaction = tryCatchSync(
                    () => createOpdsPkceTransaction({
                        allowInsecureLoopback: ENABLE_DEV_TOOLS,
                        authorizationUrl: authParsed.links?.authenticate?.url || "",
                        tokenUrl: authParsed.links?.refresh?.url || "",
                    }),
                    filename_,
                );
                if (!pkceTransaction) {
                    debug("invalid OPDS PKCE authenticate or refresh link");
                    return;
                }
            }

            const inlineAuthentication = isOpdsCredentialAuthenticationType(authParsed.authenticationType);
            const browserUrl = inlineAuthentication ? undefined : getAuthenticationUrl(authParsed, pkceTransaction);
            if (!inlineAuthentication && (!browserUrl || !/^https?:\/\//.test(browserUrl))) {
                debug("no valid authentication URL");
                return;
            }
            debug("Browser URL", browserUrl?.slice(0, 100));

            const authCredentials: IOpdsAuthenticationToken = {
                id: authParsed?.id || undefined,
                opdsAuthenticationUrl: baseUrl,
                tokenType: "Bearer",
                refreshUrl: pkceTransaction?.tokenUrl || authParsed?.links?.refresh?.url || undefined,
                authenticateUrl: pkceTransaction?.authorizationUrl || authParsed?.links?.authenticate?.url || undefined,
                pkce: !!pkceTransaction,
            };
            debug("authentication credential config", authCredentials);
            yield* callTyped(httpSetAuthenticationToken, authCredentials);

            const task = yield* forkTyped(function*() {

                if (inlineAuthentication) {
                    let submission: authActions.submit.TAction;
                    do {
                        submission = yield* takeTyped<authActions.submit.TAction>(authActions.submit.ID);
                    } while (submission.payload.url !== baseUrl);
                    return {
                        request: {
                            url: new URL(`${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/`),
                            method: "POST" as const,
                            data: {
                                [URL_OPDS_AUTH_RETRY]: undefined as string | undefined,
                                login: submission.payload.login,
                                password: submission.payload.password,
                                nonce: authParsed.nonce,
                                qop: authParsed.qop,
                                algorithm: authParsed.algorithm,
                                realm: authParsed.realm,
                            },
                        },
                        callback: (_response: { url: string | undefined }) => { /* no protocol response */ },
                    };
                }
                const parsedRequest = yield* takeTyped(opdsRequestFromCustomProtocol);
                // yield delay(1000);

                return {
                    request: parseRequestFromCustomProtocol(parsedRequest.request, authParsed.authenticationType),
                    callback: parsedRequest.callback,
                };
            });

            let win: BrowserWindow | undefined;
            try {
                if (inlineAuthentication) {
                    const converter = diMainGet("opds-feed-view-converter");
                    yield put(authActions.present.build(baseUrl, converter.convertOpdsAuthToView(doc, baseUrl)));
                } else {
                    if (retryWithInternalBrowserWindowInsteadOfDefaultExternalWebBrowser) {
                        win = yield* callTyped(createOpdsAuthenticationModalWin, browserUrl);
                        if (!win) return;
                    } else {
                        yield* callTyped(() => shell.openExternal(browserUrl));
                    }
                }
                yield race({
                    timeout: delay(240000),
                    authentication: join(task),
                    ...(win ? { closed: call(() => new Promise<void>((resolve) => win.once("closed", resolve))) } : {}),
                });

                if (task.isRunning()) {

                    // code branch triggered by:
                    // window.location.href='${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/'
                    // (window.close() is not sufficient)

                    debug("no authentication credentials received");
                    debug("perhaps timeout or closing authentication window occured");

                    yield put(authActions.cancel.build());

                    return;

                } else {
                    const { request: opdsCustomProtocolRequestParsed, callback } = task.result();
                    if (opdsCustomProtocolRequestParsed) {

                        if (!opdsCustomProtocolRequestParsed.data ||
                            !Object.keys(opdsCustomProtocolRequestParsed.data).length) {

                            debug("authentication window was cancelled");

                            yield put(authActions.cancel.build());

                            return;
                        }
                        if (!retryWithInternalBrowserWindowInsteadOfDefaultExternalWebBrowser && opdsCustomProtocolRequestParsed.data[URL_OPDS_AUTH_RETRY] === URL_OPDS_AUTH_RETRY) {
                            debug("OPDS auth retry ...", opdsCustomProtocolRequestParsed.url);

                            callback({
                                url: undefined,
                            });

                            yield put(authActions.done.build()); // ==> triggers nothing
                            // yield put(authActions.cancel.build()); // ==> triggers historyGoBack

                            // yield delay(2000);

                            if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) {
                                win.close();
                            }

                            yield delay(500);

                            // yield put(historyActions.refresh.build()); // ==> keep current context and recalls auth, but we need retryWithInternalBrowserWindowInsteadOfDefaultExternalWebBrowser
                            yield spawn(function* () {
                                debug("OPDS auth retry GO!", opdsCustomProtocolRequestParsed.url, baseUrl, JSON.stringify(doc, null, 4));
                                const opdsAuthChannel = getOpdsAuthenticationChannel();
                                opdsAuthChannel.put([doc, baseUrl, true]); // retryWithInternalBrowserWindowInsteadOfDefaultExternalWebBrowser
                            });

                            return;
                        }

                        const [, err] = yield* callTyped(opdsSetAuthCredentials,
                            opdsCustomProtocolRequestParsed,
                            authCredentials,
                            authParsed.authenticationType,
                            pkceTransaction,
                        );

                        callback({
                            url: undefined,
                        });

                        if (err instanceof Error) {
                            debug("OPDS auth err", err.message);

                            if (authParsed.authenticationType === OPDS_AUTHORIZATION_CODE_PKCE_TYPE) {
                                yield put(authActions.cancel.build());
                            } else if (inlineAuthentication) {
                                yield put(historyActions.refresh.build());
                            }

                            return;
                        } else {
                            if (!inlineAuthentication) yield put(historyActions.refresh.build());
                            yield put(opdsActions.refresh.build());
                            yield put(authActions.done.build());
                        }
                    }
                }

            } finally {

                if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) {
                    win.close();
                }
                if (task.isRunning()) {
                    yield cancel(task);
                }
            }
        };

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

    const opdsAuthChannel = getOpdsAuthenticationChannel();
    const opdsRequestChannel = getOpdsRequestCustomProtocolEventChannel();
    const opdsRequestMediaChannel = getOpdsRequestMediaCustomProtocolEventChannel();

    return all([
        takeSpawnLeadingChannel(
            opdsAuthChannel,
            opdsAuthFlow(opdsRequestChannel),
            (e) => debug("redux OPDS authentication channel error", e),
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
                let catalogLinkUrl: URL;
                try {
                    if (feedUrl.startsWith("apiapp://")) {
                        if (feedUrl.startsWith("apiapp://")) {
                            const urlApiapp = feedUrl.slice("apiapp://".length);
                            const [idGln, urlLib] = urlApiapp.split(":apiapp:");

                            debug("APIAPP");
                            debug("ID_GNL=", idGln);
                            debug("URL_LIB=", urlLib);
                            if (urlLib) {
                                catalogLinkUrl = (new URL(urlLib));
                                catalogLinkUrl.host = `apiapploans.org.edrlab.thoriumreader.break.${idGln}.break.${catalogLinkUrl.host}`;
                            }
                        }
                    } else {

                        catalogLinkUrl = (new URL(feedUrl));
                    }
                } catch (e) {
                    debug(e);
                }
                if (!catalogLinkUrl) {
                    debug("No catalogLinkUrl found, return");
                }
                // debug(JSON.stringify(catalogLinkUrl, null, 4));

                yield* callTyped(() => removeCookiesFromHost(catalogLinkUrl.host));
                yield* callTyped(() => deleteAuthenticationToken(catalogLinkUrl.host));
                const authToken = yield* callTyped(() => getAuthenticationToken(catalogLinkUrl));
                if (authToken?.accessToken) {
                    debug("ERROR to Logout of the feed:", feedUrl);
                } else {
                    debug("LOGOUT from:", feedUrl);
                }
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
    opdsCustomProtocolRequestParsed: IParseRequestFromCustomProtocol<TLabelName | TAuthName | TDigestInfo>,
    authCredentials: IOpdsAuthenticationToken,
    authenticationType: TAuthenticationType,
    pkceTransaction?: IOpdsPkceTransaction,
): Promise<[undefined, Error]> {

    if (!opdsCustomProtocolRequestParsed) {
        return [, new Error("")];
    }

    const { url: { host, searchParams }, method, data } = opdsCustomProtocolRequestParsed;
    if (host === URL_HOST_OPDS_AUTH) {

        // handle GET or POST request

        if (method === "POST") {

            let postDataCredential: IOpdsAuthenticationToken;
            if (authenticationType === "http://opds-spec.org/auth/basic") {

                postDataCredential = {
                    accessToken:
                        Buffer.from(
                            `${data.login}:${data.password}`,
                            ).toString("base64"),
                    refreshToken: undefined,
                    tokenType: "Basic",
                };

            } else if (authenticationType === "http://opds-spec.org/auth/digest") {

                const username = data.login;
                const password = data.password;
                const nonce = data.nonce;
                const qop = data.qop;
                const algorithm = data.algorithm;
                const realm = data.realm;
                const cnonce = "0123456789";
                const uri = new URL(authCredentials.authenticateUrl).pathname; // pathname;
                const method = "GET";
                const nonceCount = "00000001";
                debug("DIGEST", nonce, qop, algorithm, realm);

                const accessToken = digestAuthentication({
                    username,
                    password,
                    nonce,
                    qop,
                    algorithm,
                    realm,
                    cnonce,
                    uri,
                    method,
                    nonceCount,
                });
                postDataCredential = {
                    accessToken,
                    refreshToken: undefined,
                    tokenType: "Digest",
                    password: password,
                };

            } else {

                const requestTokenFromCredentials =
                    await (async (): Promise<[IOpdsAuthenticationToken, Error]> => {
                        // payload in function of authenticationType
                        const payload: any = {
                            username: data.login,
                            password: data.password,
                        };
                        if (authenticationType === "http://opds-spec.org/auth/oauth/password") {
                            payload.grant_type = "password";
                        } else if (authenticationType === "http://opds-spec.org/auth/local") {
                            // do nothing
                        } else if (authenticationType === "http://opds-spec.org/auth/oauth/password/apiapp") {
                            payload.client_secret = await initClientSecretToken(authCredentials.id) || "";
                            payload.client_id = authCredentials.id;
                            payload.grant_type = "password";
                        }

                        const { authenticateUrl } = authCredentials || {};
                        if (!authenticateUrl) {
                            return [, new Error("unable to retrieve the authenticate url !!")];
                        }

                        const headers = new Headers();
                        headers.set("Content-Type", ContentType.FormUrlEncoded);

                        const body = Object.entries(payload).reduce((pv, [k,v]) => `${pv}${pv ? "&" : pv}${k}=${v}`, "");

                        // isURL() excludes the file: and data: URL protocols; the compile-time TLD policy decides whether localhost / non-TLD hosts are accepted (note that ftp: is accepted)
                        if (!authenticateUrl || !isURL(authenticateUrl)) {
                            debug("isURL() NOK", authenticateUrl);
                            // throw new Error("invalid authenticateUrl: " + authenticateUrl);
                            return [, new Error("invalid authenticateUrl: " + authenticateUrl)];
                        }
                        const { data: postData } = await httpPost<IOpdsAuthenticationToken>(
                            authenticateUrl,
                            {
                                body,
                                headers,
                            },
                            async (res) => {
                                if (res.isSuccess) {

                                    const _data: any = await res.response.json();
                                    if (typeof _data === "object") {

                                        res.data = {
                                            accessToken: typeof _data.access_token === "string"
                                                ? _data.access_token
                                                : undefined,
                                            refreshToken: typeof _data.refresh_token === "string"
                                                ? _data.refresh_token
                                                : undefined,
                                            tokenType: (typeof _data.token_type === "string"
                                                ? _data.token_type
                                                : undefined) || "Bearer",
                                        };
                                    }
                                }
                                return res;
                            },
                        );

                        return [postData, undefined];
                    })();
                const [, err] = requestTokenFromCredentials;
                if (err) {
                    return [, err];
                }
                [postDataCredential] = requestTokenFromCredentials;
            }

            if (postDataCredential) {
                postDataCredential.tokenType = postDataCredential.tokenType || authCredentials.tokenType || "Bearer";
                postDataCredential.tokenType =
                    postDataCredential.tokenType.charAt(0).toUpperCase() + postDataCredential.tokenType.slice(1);
                const newCredentials = { ...authCredentials, ...postDataCredential };

                if (typeof newCredentials.accessToken === "string") {

                    debug("new opds authentication credentials");
                    await httpSetAuthenticationToken(newCredentials);

                    return [, undefined];
                }
                // newCredentials maybe an opds feed

                return [, new Error("no accessToken received")];
            }
        }

        if (method === "GET") {

            if (authenticationType === OPDS_AUTHORIZATION_CODE_PKCE_TYPE) {
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
                    await httpSetAuthenticationToken({
                        ...authCredentials,
                        accessToken: tokenResponse.accessToken,
                        pkce: true,
                        refreshToken: tokenResponse.refreshToken,
                        refreshUrl: pkceTransaction.tokenUrl,
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

const _implicitAuthData = { authenticationDocumentId: "", nonce: "" };
const setAndGetImplicitNonceForImplicitAuthentication = () => (_implicitAuthData.nonce = nanoid(16), _implicitAuthData.nonce);
const getImplicitAuthData = () => _implicitAuthData;

function getAuthenticationUrl(auth: IOPDSAuthDocParsed, pkceTransaction?: IOpdsPkceTransaction) {
    let browserUrl: string;
    switch (auth.authenticationType) {
        case OPDS_AUTHORIZATION_CODE_PKCE_TYPE: {
            browserUrl = pkceTransaction?.authorizationRequestUrl || "";
            break;
        }
        case "http://opds-spec.org/auth/oauth/implicit": {
            try {
                if (!auth.links?.authenticate?.url) {
                    debug("OPDS Authentication Document Authentication Object property `authentication.links.href` null, empty, or missing.", auth.links?.authenticate?.url ?? "undefined");
                    browserUrl = "";
                    break;
                }

                const browserUrlParsed = new URL(auth.links?.authenticate?.url);

                // Record the OPDS Authentication Document's Id for later verification
                const implicitAuthData = getImplicitAuthData();
                implicitAuthData.authenticationDocumentId = auth.id;

                // client_id: Required.
                // Any Authentication Provider that supports OPDS Authentication 1.0 and exposes an Authentication Flow based on OAuth
                // must identify all OPDS clients using the client_id "http://opds-spec.org/auth/client"
                if (!browserUrlParsed.searchParams.get("client_id")) {
                    browserUrlParsed.searchParams.set("client_id", "http://opds-spec.org/auth/client");
                }

                // response_type: Mandatory for Implicit Flow
                browserUrlParsed.searchParams.set("response_type", "token");

                // state: Optional, but helps to prevent unsolicited flows
                browserUrlParsed.searchParams.set("state", encodeURIComponent_RFC3986(setAndGetImplicitNonceForImplicitAuthentication()));

                // redirect_uri: Optional, but good to include since it's mandatory if a client has more than one redirect URI configurated
                // Note: Trailing slash is necessary as it is specified in the OPDS Authentication 1.0 specification
                browserUrlParsed.searchParams.set("redirect_uri", `${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/`);

                browserUrlParsed.searchParams.set("application", OPDS_AUTH_APPLICATION);
                browserUrlParsed.searchParams.set("application_version", _APP_VERSION);

                browserUrl = browserUrlParsed.toString();

            } catch {
                debug("Error parsing browserUrl", auth.links?.authenticate?.url);
                browserUrl = "";
            }

            break;
        }

        case "http://librarysimplified.org/authtype/SAML-2.0": {
            browserUrl = `${
                auth.links?.authenticate?.url
            }&redirect_uri=${encodeURIComponent_RFC3986(`${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/`)}`;
            break;
        }

        default: {
            debug("authentication method not found", auth.authenticationType);
            return undefined;
        }
    }
    return browserUrl;
}

interface IOPDSAuthDocParsed {
    title: string;
    id: string;

    authenticationType: TAuthenticationType;

    links?: {
        [str in TLinkType]?: IOpdsLinkView | undefined;
    } | undefined;

    labels?: {
        [str in TLabelName]?: string | undefined;
    } | undefined;

    logo?: IOpdsLinkView | undefined;

    register?: IOpdsLinkView | undefined;

    help?: string[] | undefined;

    // digest authentication
    // see IWWWAuthenticateDataParsed
    nonce?: string,
    algorithm?: string,
    qop?: string,
    realm?: string,

}
function opdsAuthDocConverter(doc: OPDSAuthenticationDoc, baseUrl: string): IOPDSAuthDocParsed | undefined {
    if (!doc || !(doc instanceof OPDSAuthenticationDoc)) {
        // Todo: Return typed error so user-friendly message can be displayed
        debug("OPDS Authentication Document is not an instance of the model");
        return undefined;
    }

    // https://drafts.opds.io/authentication-for-opds-1.0#231-core-properties
    if (!doc.Id || doc.Id === "") {
        debug("OPDS Authentication Document missing required `id` property. IGNORED and bypassed to ensure legacy compatibility with misconfigured OPDS OAuth 2.0 servers");
    }

    if (!doc.Title || doc.Title === "") {
        debug("OPDS Authentication Document missing required `title` property. IGNORED and bypassed to ensure legacy compatibility with misconfigured OPDS OAuth 2.0 servers");
    }

    if (!doc.Authentication) {
        // Todo: Return typed error so user-friendly message can be displayed
        debug("OPDS Authentication Document missing required `authentication` property.");
        return undefined;
    }

    const viewConvert = tryCatchSync(() => {
        return diMainGet("opds-feed-view-converter");
    }, filename_);

    if (!viewConvert) {
        debug("no viewConverter !!");
        return undefined;
    }

    const authentication = doc.Authentication.find((v) => OPDS_AUTHENTICATION_TYPES.includes(v.Type as TAuthenticationType));
    if (!authentication) {
        debug("OPDS Authentication Document does not contain a supported authentication type.");
        return undefined;
    }

    const links = Array.isArray(authentication.Links)
        ? authentication.Links.reduce((pv, cv) => {

            const rel = (cv.Rel || []).find((rel) => LINK_TYPE.find((v) => v === rel));

            if (
                rel
                && typeof cv.Href === "string"
            ) {

                const l = viewConvert.convertLinkToView(cv, baseUrl);

                return { ...pv, [rel]: l } as IOPDSAuthDocParsed["links"]; // typing error why ?
            }

            return pv;

        }, {} as IOPDSAuthDocParsed["links"])
        : undefined;

    const labels: IOPDSAuthDocParsed["labels"] = {};
    if (typeof authentication.Labels?.Login === "string") {
        labels.login = authentication.Labels.Login;
    }
    if (typeof authentication.Labels?.Password === "string") {
        labels.password = authentication.Labels.Password;
    }
    const logo = tryCatchSync(() => {
        const ln = Array.isArray(doc.Links)
            ? doc.Links.find((v) => {
                // debug(v);
                return (v.Rel || []).includes("logo");
            })
            : undefined;
        if (ln) {
            const linkView = viewConvert.convertLinkToView(ln, baseUrl);
            return linkView;
        }
        return undefined;

    }, filename_);

    const register = tryCatchSync(() => {
        const ln = Array.isArray(doc.Links)
            ? doc.Links.find((v) => {
                // debug(v);
                return (v.Rel || []).includes("register");
            })
            : undefined;
        if (ln) {
            const linkView = viewConvert.convertLinkToView(ln, baseUrl);
            return linkView;
        }
        return undefined;

    }, filename_);

    const helpLinkView = tryCatchSync(() => {
        const ln = Array.isArray(doc.Links)
            ? doc.Links.filter((v) => {
                // debug(v);
                return (v.Rel || []).includes("help");
            })
            : [];
        if (ln) {
            const linksView = ln.map((lnItem) => viewConvert.convertLinkToView(lnItem, baseUrl));
            return linksView;
        }
        return undefined;

    }, filename_);
    const helpStringArray = helpLinkView.map((item) => item.url);

    return {
        title: doc.Title || "",
        id: doc.Id || "",
        authenticationType: authentication.Type as TAuthenticationType,
        links,
        labels,
        logo,
        register,
        help: helpStringArray,
        nonce: typeof authentication.AdditionalJSON?.nonce === "string" ? authentication.AdditionalJSON.nonce : undefined,
        algorithm: typeof authentication.AdditionalJSON?.algorithm === "string" ? authentication.AdditionalJSON.algorithm : undefined,
        qop: typeof authentication.AdditionalJSON?.qop === "string" ? authentication.AdditionalJSON.qop : undefined,
        realm: typeof authentication.AdditionalJSON?.realm === "string" ? authentication.AdditionalJSON.realm : "", // mapping to title in opdsAuthentication json
    };
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

    const libWinBound = libWin.getBounds();
    const win = new BrowserWindow(
        {
            title: getTranslator().translate("catalog.opds.auth.login"),
            width: libWinBound?.width || 800,
            height: libWinBound?.height || 600,
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

    debug("OPDS AUTH win LOAD 1", urlStr.substring(0, 500));

    // win.webContents.loadURL
    // await DO NOT AWAIT!! (race condition when urlStr is a HTTP link that immediately redirects to OPDS://AUTHORIZE)
    win.loadURL(urlStr).then(() => { debug("loadURL() ok " + urlStr); }).catch((err) => { debug("loadURL() nok " + urlStr); debug(err); });

    debug("OPDS AUTH win LOAD 2", urlStr.substring(0, 500));

    return win;
}

interface IParseRequestFromCustomProtocol<T = string> {
    url: URL;
    method: "GET" | "POST";
    data: {
        [key in T & string]?: string;
    };
}
function parseRequestFromCustomProtocol(req: Electron.ProtocolRequest, authenticationType: TAuthenticationType)
    : IParseRequestFromCustomProtocol<TLabelName | TAuthName | TDigestInfo | typeof URL_OPDS_AUTH_RETRY> | undefined {

    debug("########");
    debug("opds:// request:", req);
    debug("########");

    if (typeof req === "object") {
        const { method, url, uploadData } = req;

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

        if (method === "POST") {
            if (host === URL_HOST_OPDS_AUTH) {

                debug("POST request", uploadData);

                if (Array.isArray(uploadData)) {

                    const [res] = uploadData;

                    if ((res as any).type === "rawData") {
                        debug("RAW DATA received");
                    }
                    const data =
                        tryCatchSync(
                            () => Buffer.from(res.bytes).toString(),
                            filename_,
                        ) || "";
                    // do not risk showing plaintext password in console / command line shell
                    // debug("data", data);

                    const keyValue = data.split("&");
                    const values = tryCatchSync(
                        () => keyValue.reduce(
                            (pv, cv) => {
                                const splt = cv.split("=");
                                const key = decodeURIComponent(splt[0]);
                                const val = decodeURIComponent(splt[1]);
                                return {
                                    ...pv,
                                    [key]: val,
                                };
                            },
                            {},
                        ),
                        filename_,
                    ) || {};
                    // do not risk showing plaintext password in console / command line shell
                    // debug(values);

                    return {
                        url: urlParsed,
                        method: "POST",
                        data: values,
                    };
                }
            }
        }

        if (method === "GET") {
            if (host === URL_HOST_OPDS_AUTH) {

                if (urlParsed.pathname.startsWith(`/${URL_OPDS_AUTH_RETRY}/`)) {
                    debug("OPDS auth retry internal window", url);
                    return {
                        url: urlParsed,
                        method: "GET",
                        data: { [URL_OPDS_AUTH_RETRY]: URL_OPDS_AUTH_RETRY },
                    };
                }

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
                    if (authenticationType !== OPDS_AUTHORIZATION_CODE_PKCE_TYPE) {
                        return undefined;
                    }
                }

                if (authenticationType === "http://opds-spec.org/auth/oauth/implicit") {
                    const implicitAuthData = getImplicitAuthData();

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
