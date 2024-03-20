// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { IS_DEV } from "readium-desktop/preprocessor-directives";
import * as debug_ from "debug";
import { BrowserWindow, globalShortcut } from "electron";
import { Headers } from "node-fetch";
import { ToastType } from "readium-desktop/common/models/toast";
import { authActions, historyActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery, takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { takeSpawnLeadingChannel } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { diMainGet, getLibraryWindowFromDi } from "readium-desktop/main/di";
import {
    getOpdsAuthenticationChannel, TOpdsAuthenticationChannel,
} from "readium-desktop/main/event";
import { cleanCookieJar } from "readium-desktop/main/network/fetch";
import {
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

import { getOpdsRequestCustomProtocolEventChannel, getOpdsRequestMediaCustomProtocolEventChannel, OPDS_AUTH_SCHEME, OPDS_MEDIA_SCHEME, TregisterHttpProtocolHandler} from "./getEventChannel";
import { initClientSecretToken } from "./apiapp";
import { digestAuthentication } from "readium-desktop/utils/digest";
import isURL from "validator/lib/isURL";

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
                    a: delay(60000),
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

    const schemePrefix = OPDS_MEDIA_SCHEME + "://0.0.0.0/";
    if (request && request.url.startsWith(schemePrefix)) {
        const b64 = decodeURIComponent(request.url.slice(schemePrefix.length));
        const url = Buffer.from(b64, "base64").toString("utf-8");
        if (!isURL(url)) {
            debug("opdsRequestMedia failed not a valid url", url);
            return ;
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
    if (host === "authorize") {

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

function getHtmlAuthenticationUrl(auth: IOPDSAuthDocParsed) {

    let browserUrl: string;
    switch (auth.authenticationType) {

        case "http://opds-spec.org/auth/oauth/implicit": {

            browserUrl = auth.links?.authenticate?.url;
            break;
        }

        case "http://librarysimplified.org/authtype/SAML-2.0": {
            browserUrl = `${
                auth.links?.authenticate?.url
            }&redirect_uri=${encodeURIComponent_RFC3986("opds://authorize")}`;
            break;
        }

        case "http://opds-spec.org/auth/local":
        case "http://opds-spec.org/auth/basic":
        case "http://opds-spec.org/auth/digest":
        case "http://opds-spec.org/auth/oauth/password":
        case "http://opds-spec.org/auth/oauth/password/apiapp": {

            const html = encodeURIComponent_RFC3986(
                htmlLoginTemplate(
                    "opds://authorize",
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

        debug("opds authentication doc is not an instance of the model");
        return undefined;
    }

    if (!doc.Authentication) {

        debug("no authentication data in the opds authentication doc");
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
    if (!libWin) {
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
                devTools: IS_DEV, // this does not automatically open devtools, just enables them (see Electron API openDevTools())
                nodeIntegration: false,
                contextIsolation: false,
                nodeIntegrationInWorker: false,
                sandbox: false,
                webSecurity: true,
                webviewTag: false,
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

    // tslint:disable-next-line: no-floating-promises
    win.loadURL(url);

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

        if (urlProtocol !== `${OPDS_AUTH_SCHEME}:`) {
            debug("bad opds protocol !!", urlProtocol);
            return undefined;
        }

        if (method === "POST") {
            if (host === "authorize") {

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
            if (host === "authorize") {
                const urlSearchParam = url.replace("#", "?");
                const urlObject = new URL(urlSearchParam);
                const data: Record<string, string> = {};
                for (const [key, value] of urlObject.searchParams) {
                    data[key] = value;
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

// tslint:disable-next-line: max-line-length
const htmlLoginTemplate = (
    urlToSubmit = "",
    loginLabel = "login",
    passLabel = "password",
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
        title = diMainGet("translator").translate("catalog.opds.auth.login");
    }

    return `
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>${title}</title>

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
        }

        .login {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: white;
            border-radius: 20px;
            margin: auto;
            width: 60vw;
            min-height: 45vh;
            height: fit-content;
            padding: 20px 40px;
            position: relative;
            gap: 50px;
            flex-wrap: wrap;

            @media only screen and (max-width: 700px) {
                flex-direction: column;
            }
        }

        .presentation {
            display: flex;
            flex-direction: column;
            max-height: 45vh;
            justify-content: start;

            @media only screen and (max-width: 700px) {
                flex-direction: row;
                gap: 20px;
            }
        }

        .presentation h1 {
            line-height: 40px;
            font-size: 30px;
            font-weight: bold;
            color: #555;
            max-width: 50%;
        }

        .logo {
            max-height: 200px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
        }

        .help_links {
            display: flex;
            justify-content: center;
            padding: 5px;
            gap: 10px;
            width: fit-content;
            position: absolute;
            bottom: 20px;
        }

        .help_links a {
            color: #1053C8;
        }
        
        .help_links a:visited {
            color: #1053C8;
        }

        .login form {
            max-width: 50%;
        }

        .login p {
            margin: 20px 0 0;
        }

        .login p:first-child {
            margin-top: 0;
        }

        .login input[type=text], .login input[type=password] {
            max-width: 350px;
            height: 35px;
        }

        .login p.submit {
            text-align: right;
            position: absolute;
            bottom: 20px;
            right: 40px;
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
            padding: 0 10px;
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
            border-radius: 15px;
            border: 1px solid transparent;
            -webkit-box-sizing: content-box;
            -moz-box-sizing: content-box;
            box-sizing: content-box;
            padding: 0 1em;
            transition: 200ms;
        }

        input[type=button] {
            padding: 0 18px;
            height: 29px;
            font-size: 14px;
            color: #1053C8;
            background: transparent;
            border: none;
            -webkit-box-sizing: content-box;
            -moz-box-sizing: content-box;
            box-sizing: content-box;
            padding: 0 1em;
            transition: 200ms;
        }

        input[type=submit]:hover, {
            background: #ECF2FD;
            border-color: #1053C8;
        }

        input[type=button]:hover {
            background: white;
        }

        .register_button {
            display: block;
            width: fit-content;
            text-decoration: none;
            color: #1053C8;
            margin: 10px 5px 5px;
        }

        .lt-ie9 input[type=text], .lt-ie9 input[type=password] {
            line-height: 34px;
        }

        .container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex: 1;
            margin: 10px;
            flex-wrap: wrap;
        }
    </style>
    </head>

    <body class="text-center">
        <div class="login">
            <div class="container">
                <div class="presentation">
                    ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="login logo">` : ""}
                    <h1>${title}</h1>
                </div>
                <form method="post" action="${urlToSubmit}">
                    <p><input type="text" name="login" value="" placeholder="${loginLabel}"></p>
                    <p><input type="password" name="password" value="" placeholder="${passLabel}"></p>
                    ${registerUrl ? `<a href="${registerUrl}" target="_blank" class="register_button">${diMainGet("translator").translate("catalog.opds.auth.register")}</a>` : ""}
                    <p><input hidden type="text" name="nonce" value="${nonce}"></p>
                    <p><input hidden type="text" name="qop" value="${qop}"></p>
                    <p><input hidden type="text" name="algorithm" value="${algorithm}"></p>
                    <p><input hidden type="text" name="realm" value="${realm}"></p>
                    <p class="submit">
                        <input type="button" name="cancel" value="${diMainGet("translator").translate("catalog.opds.auth.cancel")}" onClick="window.location.href='${urlToSubmit}';">
                        <input type="submit" name="commit" value="${diMainGet("translator").translate("catalog.opds.auth.login")}">
                    </p>
                </form>
            </div>
            <div class="help_links">
                ${help ? `${help.map((v) => `<a href=${v}>${v}</a>`).join("|")}` : ""}
            </div>
        </div>
    </body>

</html>`;
};
