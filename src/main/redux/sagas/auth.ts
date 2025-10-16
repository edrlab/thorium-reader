// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { URL_PROTOCOL_OPDS_MEDIA, URL_HOST_COMMON, URL_PROTOCOL_OPDS, URL_HOST_OPDS_AUTH } from "readium-desktop/common/streamerProtocol";
import { BrowserWindow, globalShortcut, HandlerDetails, Event as ElectronEvent, WebContentsWillNavigateEventParams, shell } from "electron";

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS1479
import { Headers } from "node-fetch";

import { ToastType } from "readium-desktop/common/models/toast";
import { authActions, historyActions, toastActions } from "readium-desktop/common/redux/actions";
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
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, cancel, delay, join, put, race } from "redux-saga/effects";
import { call as callTyped, fork as forkTyped, take as takeTyped } from "typed-redux-saga/macro";
import { URL } from "url";

import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { getOpdsRequestCustomProtocolEventChannel, getOpdsRequestMediaCustomProtocolEventChannel, TregisterHttpProtocolHandler} from "./getEventChannel";
import { initClientSecretToken } from "./apiapp";
import { digestAuthentication } from "readium-desktop/utils/digest";
import isURL from "validator/lib/isURL";

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TS1479
import { nanoid } from "nanoid";

import { getTranslator } from "readium-desktop/common/services/translator";

import { SESSION_PARTITION_AUTH } from "readium-desktop/common/sessions";

// https://github.com/cure53/DOMPurify?tab=readme-ov-file#running-dompurify-on-the-server
import { JSDOM } from "jsdom";
import DOMPurify_ from "dompurify";
const DOMPurify = DOMPurify_(new JSDOM("").window);

const ENABLE_DEV_TOOLS = __TH__IS_DEV__ || __TH__IS_CI__;

// Logger
const filename_ = "readium-desktop:main:saga:auth";
const debug = debug_(filename_);
debug("_");

type TLinkType = "refresh" | "authenticate";
type TLabelName = "login" | "password";
type TDigestInfo = "realm" | "nonce" | "qop" | "algorithm";
type TAuthName = "id" | "access_token" | "refresh_token" | "token_type";
type TAuthenticationType = "http://opds-spec.org/auth/oauth/password"
    | "http://opds-spec.org/auth/oauth/password/apiapp"
    | "http://opds-spec.org/auth/oauth/implicit"
    | "http://opds-spec.org/auth/basic"
    | "http://opds-spec.org/auth/digest"
    | "http://opds-spec.org/auth/local"
    | "http://librarysimplified.org/authtype/SAML-2.0";

const AUTHENTICATION_TYPE: TAuthenticationType[] = [
    "http://opds-spec.org/auth/oauth/password",
    "http://opds-spec.org/auth/oauth/password/apiapp",
    "http://opds-spec.org/auth/oauth/implicit",
    "http://opds-spec.org/auth/basic",
    "http://opds-spec.org/auth/digest",
    "http://opds-spec.org/auth/local",
    "http://librarysimplified.org/authtype/SAML-2.0",
];

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
        function*([doc, baseUrl]: TOpdsAuthenticationChannel) {

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

            const browserUrl = getHtmlAuthenticationUrl(authParsed);
            if (!browserUrl) {
                debug("no valid authentication html url");
                return;
            }
            debug("Browser URL", browserUrl);

            const authCredentials: IOpdsAuthenticationToken = {
                id: authParsed?.id || undefined,
                opdsAuthenticationUrl: baseUrl,
                tokenType: "Bearer",
                refreshUrl: authParsed?.links?.refresh?.url || undefined,
                authenticateUrl: authParsed?.links?.authenticate?.url || undefined,
            };
            debug("authentication credential config", authCredentials);
            yield* callTyped(httpSetAuthenticationToken, authCredentials);

            const task = yield* forkTyped(function*() {

                const parsedRequest = yield* takeTyped(opdsRequestFromCustomProtocol);
                return {
                    request: parseRequestFromCustomProtocol(parsedRequest.request),
                    callback: parsedRequest.callback,
                };
            });

            const win =
                tryCatchSync(
                    () => createOpdsAuthenticationModalWin(browserUrl),
                    filename_,
                );
            if (!win) {
                debug("modal win undefined");

                yield cancel(task);
                return;
            }

            try {

                yield race({
                    a: delay(240000),
                    b: join(task),
                    c: call(
                        async () =>
                            new Promise<void>((resolve) => win.on("close", () => resolve())),
                    ),
                });

                if (task.isRunning()) {
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

                        const [, err] = yield* callTyped(opdsSetAuthCredentials,
                            opdsCustomProtocolRequestParsed,
                            authCredentials,
                            authParsed.authenticationType,
                        );

                        callback({
                            url: undefined,
                        });

                        if (err instanceof Error) {
                            debug(err.message);

                            return;

                        } else {
                            yield put(historyActions.refresh.build());
                            yield put(authActions.done.build());
                        }
                    }
                }

            } finally {

                if (win) {
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

    yield put(toastActions.openRequest.build(ToastType.Success, "👍"));
    debug("End of wipping auth data");
}

function* opdsRequestMediaFlow({request, callback}: TregisterHttpProtocolHandler) {

    const schemePrefix = URL_PROTOCOL_OPDS_MEDIA + "://" + URL_HOST_COMMON + "/";
    if (request && request.url.startsWith(schemePrefix)) {
        const b64 = decodeURIComponent(request.url.slice(schemePrefix.length));
        const url = Buffer.from(b64, "base64").toString("utf-8");

        // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
        if (!url || !isURL(url)) {
            debug("isURL() NOK opdsRequestMedia failed not a valid url", url);
            return;
        }
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
        });

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

                        // isURL() excludes the file: and data: URL protocols, as well as http://localhost but not http://127.0.0.1 or http(s)://IP:PORT more generally (note that ftp: is accepted)
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

function getHtmlAuthenticationUrl(auth: IOPDSAuthDocParsed) {
    let browserUrl: string;
    switch (auth.authenticationType) {
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

        case "http://opds-spec.org/auth/local":
        case "http://opds-spec.org/auth/basic":
        case "http://opds-spec.org/auth/digest":
        case "http://opds-spec.org/auth/oauth/password":
        case "http://opds-spec.org/auth/oauth/password/apiapp": {

            const html = encodeURIComponent_RFC3986(
                htmlLoginTemplate(
                    `${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/`,
                    auth.labels?.login,
                    auth.labels?.password,
                    auth.title,
                    auth.logo?.url,
                    auth.register?.url,
                    auth.help,
                    auth.nonce,
                    auth.qop,
                    auth.algorithm,
                    auth.realm,
                ),
            );
            browserUrl = `data:text/html;charset=utf-8,${html}`;
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

    const authentication = doc.Authentication.find((v) => AUTHENTICATION_TYPE.includes(v.Type as any));

    const links = Array.isArray(authentication.Links)
        ? authentication.Links.reduce((pv, cv) => {

            const rel = (cv.Rel || [])
                .reduce((pvRel, cvRel) => pvRel || LINK_TYPE.find((v) => v === cvRel) || "", "") as TLinkType;

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

function createOpdsAuthenticationModalWin(url: string): BrowserWindow | undefined {

    const libWin = tryCatchSync(() => getLibraryWindowFromDi(), filename_);
    if (!libWin || libWin.isDestroyed() || libWin.webContents.isDestroyed()) {
        debug("no lib win !!");
        return undefined;
    }

    const libWinBound = libWin.getBounds();
    const win = new BrowserWindow(
        {
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

    const handler = () => win.close();
    globalShortcut.register("esc", handler);
    win.on("close", () => {
        globalShortcut.unregister("esc");
    });

    win.once("ready-to-show", () => {
        win.show();
    });

    win.loadURL(url);

    const willNavigate = (navUrl: string | undefined | null) => {

        if (!navUrl) {
            debug("willNavigate ==> nil: ", navUrl);
            return;
        }

        if (/^https?:\/\//.test(navUrl)) { // ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc.

            debug("willNavigate ==> EXTERNAL: ", win.webContents.getURL(), " *** ", navUrl);
            setTimeout(async () => {
                await shell.openExternal(navUrl);
            }, 0);

            return;
        }

        debug("willNavigate ==> noop: ", navUrl);
    };

    win.webContents.setWindowOpenHandler((details: HandlerDetails) => {
        debug("BrowserWindow.webContents.setWindowOpenHandler (always DENY): ", win.webContents.id, " --- ", details.url, " === ", win.webContents.getURL());

        // willNavigate(details.url);

        return { action: "deny" };
    });

    win.webContents.on("will-navigate", (details: ElectronEvent<WebContentsWillNavigateEventParams>, url: string) => {
        debug("BrowserWindow.webContents.on('will-navigate') (always PREVENT?): ", win.webContents.id, " --- ", details.url?.substring(0, 500), " *** ", url?.substring(0, 500), " === ", win.webContents.getURL()?.substring(0, 500));

        if (details.url?.startsWith(`${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/`)) {
            debug(`${URL_PROTOCOL_OPDS}://${URL_HOST_OPDS_AUTH}/ ==> PASS: `, details.url?.substring(0, 500));
            return;
        }
        if (details.url === win.webContents.getURL()) {
            debug("same URL ==> PASS: ", details.url?.substring(0, 500));
            return;
        }

        details.preventDefault();
        willNavigate(details.url);
    });

    return win;
}

interface IParseRequestFromCustomProtocol<T = string> {
    url: URL;
    method: "GET" | "POST";
    data: {
        [key in T & string]?: string;
    };
}
function parseRequestFromCustomProtocol(req: Electron.ProtocolRequest)
    : IParseRequestFromCustomProtocol<TLabelName | TDigestInfo> | undefined {

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
                    return undefined;
                }

                const implicitAuthData = getImplicitAuthData();

                // Only validate the Id if it is present in the response
                // This should ensure backwards compatibility with existing OPDS Authentication Providers
                // who may be omitting it
                if (data.id && implicitAuthData.authenticationDocumentId && data.id !== implicitAuthData.authenticationDocumentId) {
                    debug("WARNING: OAuth 2.0 implicit grant flow contained an id but it did not match the id in the OPDS Authentication Document", "expected:", implicitAuthData.authenticationDocumentId, "actual:", data.id);
                    return undefined;
                    // see https://github.com/edrlab/thorium-reader/pull/2510
                }
                else {
                    debug("OAuth 2.0 implicit grant flow does not contain an id (search param OR auth doc), validation IGNORED and bypassed to ensure legacy compatibility with OPDS OAuth 2.0 servers", implicitAuthData.authenticationDocumentId, "actual:", data.id);
                }

                 if (data.state !== implicitAuthData.nonce) {
                    debug("OAuth 2.0 implicit grant flow response state parameter is not equal to the nonce sent", "expected:", implicitAuthData.nonce, "value=", data.state);
                    debug("state nonce verification IGNORED and bypassed to ensure legacy compatibility with OPDS OAuth 2.0 servers");
                    // TODO: improve this and enable the state verification

                    // https://auth0.com/docs/secure/attack-protection/state-parameters
                    // https://github.com/edrlab/thorium-reader/issues/2506
                } else {
                    debug("OAuth 2.0 implicit grant flow response parameters VERIFIED and CORRECT");
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

const AvatarIcon = `<svg width="12" height="11" viewBox="0 0 12 11" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.9857 9.84375C10.343 8.7158 9.33948 7.83692 8.13664 7.3486C8.7348 6.89997 9.17665 6.27451 9.39959 5.56082C9.62253 4.84712 9.61526 4.08137 9.37882 3.37204C9.14237 2.6627 8.68874 2.04574 8.08217 1.60855C7.47559 1.17135 6.74684 0.936096 5.99914 0.936096C5.25143 0.936096 4.52268 1.17135 3.91611 1.60855C3.30953 2.04574 2.8559 2.6627 2.61945 3.37204C2.38301 4.08137 2.37574 4.84712 2.59868 5.56082C2.82162 6.27451 3.26347 6.89997 3.86164 7.3486C2.65879 7.83692 1.65525 8.7158 1.01257 9.84375C0.972751 9.90779 0.946209 9.97917 0.934526 10.0537C0.922844 10.1282 0.926258 10.2042 0.944568 10.2774C0.962877 10.3505 0.995706 10.4193 1.0411 10.4795C1.0865 10.5397 1.14354 10.5901 1.20884 10.6279C1.27413 10.6656 1.34634 10.6898 1.42117 10.6991C1.49601 10.7083 1.57194 10.7024 1.64446 10.6818C1.71697 10.6611 1.78459 10.626 1.84329 10.5787C1.902 10.5314 1.95058 10.4727 1.98617 10.4063C2.83554 8.93813 4.33554 8.0625 5.99914 8.0625C7.66273 8.0625 9.16273 8.9386 10.0121 10.4063C10.0892 10.5303 10.2115 10.6194 10.3532 10.6549C10.4948 10.6903 10.6447 10.6693 10.7712 10.5962C10.8976 10.5232 10.9907 10.4038 11.0307 10.2634C11.0707 10.123 11.0546 9.9725 10.9857 9.84375ZM3.56164 4.5C3.56164 4.01791 3.70459 3.54665 3.97243 3.1458C4.24026 2.74496 4.62095 2.43253 5.06634 2.24805C5.51174 2.06356 6.00184 2.01529 6.47467 2.10934C6.9475 2.20339 7.38182 2.43554 7.72271 2.77643C8.0636 3.11732 8.29575 3.55164 8.3898 4.02447C8.48385 4.4973 8.43558 4.9874 8.25109 5.43279C8.0666 5.87819 7.75418 6.25887 7.35334 6.52671C6.95249 6.79455 6.48123 6.9375 5.99914 6.9375C5.3529 6.93676 4.73334 6.67971 4.27638 6.22275C3.81943 5.7658 3.56238 5.14624 3.56164 4.5Z" fill="#2D2D2D"/>
</svg>`;

const PasswordIcon = `<svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.25 1.51562V8.26562C1.25 8.41481 1.19074 8.55788 1.08525 8.66337C0.979758 8.76886 0.836684 8.82812 0.6875 8.82812C0.538316 8.82812 0.395242 8.76886 0.289752 8.66337C0.184263 8.55788 0.125 8.41481 0.125 8.26562V1.51562C0.125 1.36644 0.184263 1.22337 0.289752 1.11788C0.395242 1.01239 0.538316 0.953125 0.6875 0.953125C0.836684 0.953125 0.979758 1.01239 1.08525 1.11788C1.19074 1.22337 1.25 1.36644 1.25 1.51562ZM5.12797 3.89219L4.4375 4.11625V3.39062C4.4375 3.24144 4.37824 3.09837 4.27275 2.99288C4.16726 2.88739 4.02418 2.82812 3.875 2.82812C3.72582 2.82812 3.58274 2.88739 3.47725 2.99288C3.37176 3.09837 3.3125 3.24144 3.3125 3.39062V4.11625L2.62203 3.89219C2.55126 3.86729 2.47623 3.85681 2.40135 3.86134C2.32647 3.86588 2.25325 3.88535 2.18601 3.91861C2.11877 3.95186 2.05885 3.99823 2.0098 4.05499C1.96074 4.11174 1.92354 4.17774 1.90037 4.24909C1.8772 4.32044 1.86854 4.39571 1.87489 4.47045C1.88125 4.5452 1.90249 4.61792 1.93737 4.68434C1.97224 4.75076 2.02006 4.80953 2.07799 4.85719C2.13592 4.90485 2.2028 4.94045 2.27469 4.96187L2.96469 5.18641L2.53813 5.77328C2.45042 5.894 2.41426 6.04461 2.43759 6.19199C2.46093 6.33936 2.54186 6.47143 2.66258 6.55914C2.78329 6.64685 2.93391 6.68301 3.08128 6.65967C3.22866 6.63633 3.36073 6.5554 3.44844 6.43469L3.875 5.84781L4.30156 6.43469C4.38927 6.5554 4.52134 6.63633 4.66872 6.65967C4.81609 6.68301 4.96671 6.64685 5.08742 6.55914C5.20814 6.47143 5.28907 6.33936 5.31241 6.19199C5.33574 6.04461 5.29958 5.894 5.21187 5.77328L4.78531 5.18641L5.47531 4.96187C5.5472 4.94045 5.61408 4.90485 5.67201 4.85719C5.72994 4.80953 5.77776 4.75076 5.81263 4.68434C5.84751 4.61792 5.86875 4.5452 5.87511 4.47045C5.88146 4.39571 5.8728 4.32044 5.84963 4.24909C5.82646 4.17774 5.78926 4.11174 5.7402 4.05499C5.69115 3.99823 5.63123 3.95186 5.56399 3.91861C5.49675 3.88535 5.42353 3.86588 5.34865 3.86134C5.27377 3.85681 5.19874 3.86729 5.12797 3.89219ZM10.3367 4.25313C10.2906 4.11129 10.19 3.99359 10.0571 3.9259C9.92417 3.85822 9.76982 3.84609 9.62797 3.89219L8.9375 4.11625V3.39062C8.9375 3.24144 8.87824 3.09837 8.77275 2.99288C8.66726 2.88739 8.52418 2.82812 8.375 2.82812C8.22582 2.82812 8.08274 2.88739 7.97725 2.99288C7.87176 3.09837 7.8125 3.24144 7.8125 3.39062V4.11625L7.12203 3.89219C7.05126 3.86729 6.97623 3.85681 6.90135 3.86134C6.82647 3.86588 6.75325 3.88535 6.68601 3.91861C6.61877 3.95186 6.55885 3.99823 6.5098 4.05499C6.46074 4.11174 6.42354 4.17774 6.40037 4.24909C6.3772 4.32044 6.36854 4.39571 6.37489 4.47045C6.38125 4.5452 6.40249 4.61792 6.43737 4.68434C6.47224 4.75076 6.52006 4.80953 6.57799 4.85719C6.63592 4.90485 6.7028 4.94045 6.77469 4.96187L7.46469 5.18641L7.03813 5.77328C6.95042 5.894 6.91426 6.04461 6.93759 6.19199C6.96093 6.33936 7.04186 6.47143 7.16258 6.55914C7.28329 6.64685 7.43391 6.68301 7.58128 6.65967C7.72866 6.63633 7.86073 6.5554 7.94844 6.43469L8.375 5.84781L8.80156 6.43469C8.84499 6.49446 8.89977 6.54509 8.96276 6.58369C9.02576 6.6223 9.09574 6.64811 9.16872 6.65967C9.24169 6.67123 9.31623 6.6683 9.38807 6.65105C9.45991 6.6338 9.52765 6.60257 9.58742 6.55914C9.64719 6.51571 9.69783 6.46094 9.73643 6.39794C9.77503 6.33494 9.80085 6.26496 9.8124 6.19199C9.82396 6.11901 9.82103 6.04448 9.80378 5.97264C9.78653 5.90079 9.7553 5.83305 9.71187 5.77328L9.28531 5.18641L9.97531 4.96187C10.0456 4.93907 10.1107 4.90265 10.1669 4.8547C10.2231 4.80674 10.2693 4.74818 10.3028 4.68236C10.3364 4.61654 10.3567 4.54476 10.3625 4.47111C10.3683 4.39747 10.3595 4.32339 10.3367 4.25313Z" fill="currentColor"/>
</svg>`;

const AddIcon = "<svg xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:cc=\"http://creativecommons.org/ns#\" xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:sodipodi=\"http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd\" xmlns:inkscape=\"http://www.inkscape.org/namespaces/inkscape\" width=\"14\" height=\"14\" viewBox=\"0 0 14 14\" version=\"1.1\" id=\"svg6\" sodipodi:docname=\"add-alone.svg\" inkscape:version=\"0.92.4 (33fec40, 2019-01-16)\"> <metadata id=\"metadata12\"> <rdf:RDF> <cc:Work rdf:about=\"\"> <dc:format>image/svg+xml</dc:format> <dc:type df:resource=\"http://purl.org/dc/dcmitype/StillImage\" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <defs id=\"defs10\" /> <sodipodi:namedview pagecolor=\"#ffffff\" bordercolor=\"#666666\" borderopacity=\"1\" objecttolerance=\"10\" gridtolerance=\"10\" guidetolerance=\"10\" inkscape:pageopacity=\"0\" inkscape:pageshadow=\"2\" inkscape:window-width=\"640\" inkscape:window-height=\"480\" id=\"namedview8\" showgrid=\"false\" fit-margin-top=\"0\" fit-margin-left=\"0\" fit-margin-right=\"0\" fit-margin-bottom=\"0\" inkscape:zoom=\"9.8333333\" inkscape:cx=\"7\" inkscape:cy=\"7\" inkscape:window-x=\"720\" inkscape:window-y=\"196\" inkscape:window-maximized=\"0\" inkscape:current-layer=\"svg6\" /> <path d=\"M 14,8 H 8 v 6 H 6 V 8 H 0 V 6 H 6 V 0 h 2 v 6 h 6 z\" id=\"path2\" inkscape:connector-curvature=\"0\" /> <path d=\"M -5,-5 H 19 V 19 H -5 Z\" id=\"path4\" inkscape:connector-curvature=\"0\" style=\"fill:none\" /> </svg>";

const LoginIcon = `<svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
<path d="M5.64414 5.04819L4.08164 6.61069C3.99358 6.69875 3.87415 6.74823 3.74961 6.74823C3.62507 6.74823 3.50564 6.69875 3.41758 6.61069C3.32952 6.52263 3.28005 6.4032 3.28005 6.27866C3.28005 6.15413 3.32952 6.03469 3.41758 5.94663L4.17969 5.1853H0.9375C0.81318 5.1853 0.693951 5.13592 0.606044 5.04801C0.518136 4.9601 0.46875 4.84087 0.46875 4.71655C0.46875 4.59223 0.518136 4.473 0.606044 4.3851C0.693951 4.29719 0.81318 4.2478 0.9375 4.2478H4.17969L3.41836 3.48569C3.37476 3.44209 3.34017 3.39033 3.31657 3.33336C3.29297 3.27639 3.28083 3.21533 3.28083 3.15366C3.28083 3.02913 3.3303 2.90969 3.41836 2.82163C3.50642 2.73357 3.62585 2.6841 3.75039 2.6841C3.87493 2.6841 3.99436 2.73357 4.08242 2.82163L5.64492 4.38413C5.68857 4.42773 5.72318 4.47952 5.74678 4.53652C5.77037 4.59353 5.78247 4.65463 5.7824 4.71632C5.78233 4.77802 5.77008 4.83909 5.74635 4.89604C5.72263 4.95299 5.68789 5.0047 5.64414 5.04819ZM7.5 0.810303H5.3125C5.18818 0.810303 5.06895 0.859689 4.98104 0.947596C4.89314 1.0355 4.84375 1.15473 4.84375 1.27905C4.84375 1.40337 4.89314 1.5226 4.98104 1.61051C5.06895 1.69842 5.18818 1.7478 5.3125 1.7478H7.34375V7.6853H5.3125C5.18818 7.6853 5.06895 7.73469 4.98104 7.8226C4.89314 7.9105 4.84375 8.02973 4.84375 8.15405C4.84375 8.27837 4.89314 8.3976 4.98104 8.48551C5.06895 8.57342 5.18818 8.6228 5.3125 8.6228H7.5C7.7072 8.6228 7.90591 8.54049 8.05243 8.39398C8.19894 8.24747 8.28125 8.04875 8.28125 7.84155V1.59155C8.28125 1.38435 8.19894 1.18564 8.05243 1.03913C7.90591 0.892613 7.7072 0.810303 7.5 0.810303Z" fill="currenColor"/>
</svg>`;

const htmlLoginTemplate = (
    urlToSubmit = "",
    loginLabel = getTranslator().translate("catalog.opds.auth.username"),
    passLabel = getTranslator().translate("catalog.opds.auth.password"),
    title: string | undefined,
    logoUrl?: string,
    registerUrl?: string,
    help?: string[],
    nonce?: string,
    qop?: string,
    algorithm?: string,
    realm?: string,
) => {
    if (!title) { // includes empty string
        title = getTranslator().translate("catalog.opds.auth.login");
    }

    return `
    <html lang="en">

    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <meta name="description" content="">
        <meta name="author" content="">

        <title>${DOMPurify.sanitize(title)}</title>

        <!-- Custom styles for this template -->
        <style>
        body {
                font: 13px/20px Nunito, "Lucida Grande", Tahoma, Verdana, sans-serif;
                font-weight: 400;
                color: #404040;
                background: #ECF2FD;
                width: 100vw;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
            }

            .login {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: white;
                border-radius: 20px;
                margin: auto;
                width: 60vw;
                max-width: 700px;
                min-height: 35vh;
                height: fit-content;
                padding: 20px 40px;
                position: relative;
                gap: 50px;
                flex-wrap: wrap;
                overflow: hidden;

                @media only screen and (max-width: 1000px) {
                    flex-direction: column;
                }
            }

            .container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                flex: 1;
                flex-wrap: wrap;
                width: 100%;
            }

            .presentation {
                display: flex;
                flex-direction: column;
                max-height: 45vh;
                justify-content: start;
                width: 100%;
            }

            .presentation h1 {
                line-height: 40px;
                font-size: 30px;
                font-weight: bold;
                color: #555;
                width: fit-content;
                padding-right: 30px;
                border-bottom: 1px solid #e5e5e5;
            }

            .content_wrapper {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 50px;

                @media only screen and (max-width: 1000px) {
                    gap: unset;
                }
            }

            .content_informations {
                display: flex;
                flex-direction: column;
                align-items: start;
                gap: 10px;
            }

            .logo {
                max-height: 200px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                flex: 1;

                @media only screen and (max-width: 1000px) {
                    // display: none;
                    position: absolute;
                    transform-origin: top right;
                    right: 40px;
                    top: 20px;
                    max-height: 75px;
                    max-width: 150px;
                }

                @media only screen and (max-width: 600px) {
                    display: none;
                }
            }

            .login form {
                flex: 2;
                border-bottom: 1px solid #e5e5e5;
                width: fit-content;
                align-items: end;
                justify-content: center;
                display: flex;
                flex-direction: column;

                @media only screen and (max-width: 1000px) {
                    border: none;
                    align-items: start;
                }
            }

            .login p {
                margin: 0;
                position: relative;
                max-width: 400px;
                width: 100%;
            }

            .login p:has(input[name=login]) {
                margin: 20px 0 10px;
            }

            .login p:has(input[name=password]):has(+ .register_button) {
                margin: 10px 0 0;
            }

            .login p:has(input[name=password]) {
                margin: 10px 0;
            }

            .login p label {
                position: absolute;
                top: -8px;
                left: 20px;
                background-color: white;
                padding: 0 5px;
            }

            .login p svg {
                height: 20px;
                fill: black;
                transform: translate(-50%, -50%);
                position: absolute;
                top: 50%;
                left: 20px;
            }

            .login p:first-child {
                margin-top: 0;
            }

            .login input[type=text], .login input[type=password] {
                width: 100%;
                height: 35px;
                border: 1px solid black;
                border-radius: 5px;
            }

            .login .submit {
                text-align: right;
                // position: absolute;
                bottom: 20px;
                right: 40px;
                display: flex;
                align-items: center;
                gap: 10px;
                justify-content: end;
                width: 100%;
                max-width: 400px;
            }

            .submit_button {
                position: relative;
                display: flex;
                align-items: center;
                gap: 5px;
                padding: 0;
            }

            .submit_button label {
                position: absolute;
                transform: translate(-50%, -50%);
                top: 50%;
                left: 10px;
            }

            .submit_button label svg {
                height: 15px;
                width: 15px;
                fill: white;
                transition: 200ms linear;
            }

            .register_button {
                display: flex;
                align-items: center;
                gap: 5px;
                width: 100%;
                max-width: 400px;
                text-decoration: none;
                color: #1053C8;
                margin: 5px 5px 10px;
            }

            .register_button svg {
                height: 12px;
                fill: #1053C8;
            }

            .help_links {
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 5px;
                gap: 10px;
                width: fit-content;
                position: relative;

                @media only screen and (max-width: 1000px) {
                    position: absolute;
                    flex-direction: row;
                    bottom: -30px;
                    left: 10px;
                }
            }

            .help_links a {
                color: #1053C8;
            }

            .help_links a:visited {
                color: #1053C8;
            }

            :-moz-placeholder {
                color: #c9c9c9 !important;
                font-size: 13px;
            }

            ::-webkit-input-placeholder {
                color: #ccc;
                font-size: 13px;
            }

            input {
                font-family: 'Lucida Grande', Tahoma, Verdana, sans-serif;
                font-size: 14px;
            }

            input[type=text], input[type=password] {
                margin: 5px;
                padding: 0 10px 0 25px;
                width: 300px;
                height: 34px;
                color: #404040;
                background: white;
                border: 1px solid;
                border-color: #c4c4c4 #d1d1d1 #d4d4d4;
                border-radius: 2px;
                -moz-outline-radius: 3px;
            }

            input[type=text]:focus, input[type=password]:focus {
                border-color: #1053C8;
                outline-color: #1053C8;
                outline-offset: 0;
            }

            input[type=submit] {
                padding: 0 18px;
                height: 29px;
                font-size: 14px;
                color: white;
                background: #1053C8;
                border-radius: 5px;
                border: 1px solid transparent;
                -webkit-box-sizing: content-box;
                -moz-box-sizing: content-box;
                box-sizing: content-box;
                padding: 0 10px 0 20px;
                transition: 200ms;
                display: flex;
                align-items: center;
                gap: 5px;
                cursor: pointer;
            }

            input[type=submit] > svg {
                height: 15px;
                fill: white;
            }

            input[type=button] {
                padding: 0 18px;
                height: 29px;
                font-size: 14px;
                color: #1053C8;
                background: #ECF2FD;
                border: 1px solid #1053C8;
                border-radius: 5px;
                -webkit-box-sizing: content-box;
                -moz-box-sizing: content-box;
                box-sizing: content-box;
                padding: 0 1em;
                transition: 200ms;
                cursor: pointer;
            }

            input[type=submit]:hover {
                background: #ECF2FD;
                border-color: #1053C8;
                color: #1053C8;
            }

            input[type=submit]:hover + label svg {
                fill: #1053C8;
            }

            input[type=button]:hover {
                background: white;
            }

            .lt-ie9 input[type=text], .lt-ie9 input[type=password] {
                line-height: 34px;
            }
        </style>
        </head>

        <body class="text-center">
            <div class="login">
                <div class="container">
                    <div class="presentation">
                        <h1>${DOMPurify.sanitize(title)}</h1>
                    </div>
                    <div class="content_wrapper">
                    ${(logoUrl || help.length > 0) ?
                        `<div class="content_informations">
                            ${logoUrl ? `<img class="logo" src="${DOMPurify.sanitize(logoUrl)}" alt="login logo">` : ""}
                            <div class="help_links">
                                ${help ? `${help.map((v) => { const vv = DOMPurify.sanitize(v); return `<a href=${vv}>${vv}</a>`; }).join("")}` : ""}
                            </div>
                        </div>`
                        : ""}
                        <form method="post" action="${DOMPurify.sanitize(urlToSubmit)}" style="align-items: ${!(logoUrl || help.length > 0) ? "center" : "end"}">
                            <p>
                                <input type="text" name="login" value="" required>
                                    ${AvatarIcon}
                                </input>
                                <label for="login">${DOMPurify.sanitize(loginLabel)}</label>
                            </p>
                            <p>
                                <input type="password" name="password" value="" required>
                                    ${PasswordIcon}
                                </input>
                                <label for="password">${DOMPurify.sanitize(passLabel)}</label>
                            </p>
                            ${registerUrl ? `<a href="${DOMPurify.sanitize(registerUrl)}" target="_blank" class="register_button">
                                ${AddIcon}
                                ${getTranslator().translate("catalog.opds.auth.register")}
                            </a>` : ""}
                            <p><input hidden type="text" name="nonce" value="${DOMPurify.sanitize(nonce)}"></p>
                            <p><input hidden type="text" name="qop" value="${DOMPurify.sanitize(qop)}"></p>
                            <p><input hidden type="text" name="algorithm" value="${DOMPurify.sanitize(algorithm)}"></p>
                            <p><input hidden type="text" name="realm" value="${DOMPurify.sanitize(realm)}"></p>
                            <div class="submit">
                                <input type="button" name="cancel" value="${getTranslator().translate("catalog.opds.auth.cancel")}" onClick="window.location.href='${DOMPurify.sanitize(urlToSubmit)}';">
                                <div class="submit_button">
                                    <input type="submit" name="commit" value="${getTranslator().translate("catalog.opds.auth.login")}">
                                    <label for="commit">${LoginIcon}</label>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </body>

    </html>`;
};
