// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { BrowserWindow, globalShortcut } from "electron";
import { Headers } from "node-fetch";
import {
    OPDSAuthenticationDoc,
} from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-authentication-doc";
import { ToastType } from "readium-desktop/common/models/toast";
import { authActions, historyActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { takeSpawnLeadingChannel } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { callTyped, forkTyped, takeTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { diMainGet, getLibraryWindowFromDi } from "readium-desktop/main/di";
import {
    getOpdsAuthenticationChannel, TOpdsAuthenticationChannel,
} from "readium-desktop/main/event";
import { cleanCookieJar } from "readium-desktop/main/network/fetch";
import {
    CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN, httpPost,
    httpSetToConfigRepoOpdsAuthenticationToken, IOpdsAuthenticationToken,
} from "readium-desktop/main/network/http";
import { ContentType } from "readium-desktop/utils/contentType";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
import { all, call, cancel, delay, join, put, race } from "redux-saga/effects";

import { getOpdsRequestCustomProtocolEventChannel, ODPS_AUTH_SCHEME } from "./getEventChannel";

// Logger
const filename_ = "readium-desktop:main:saga:auth";
const debug = debug_(filename_);
debug("_");

type TLinkType = "refresh" | "authenticate";
type TLabelName = "login" | "password";
type TAuthenticationType = "http://opds-spec.org/auth/oauth/password"
    | "http://opds-spec.org/auth/oauth/implicit"
    | "http://opds-spec.org/auth/basic"
    | "http://opds-spec.org/auth/local";

const AUTHENTICATION_TYPE: TAuthenticationType[] = [
    "http://opds-spec.org/auth/oauth/password",
    "http://opds-spec.org/auth/oauth/implicit",
    "http://opds-spec.org/auth/basic",
    "http://opds-spec.org/auth/local",
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
                debug("no valid base url");
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
            yield* callTyped(httpSetToConfigRepoOpdsAuthenticationToken, authCredentials);

            const task = yield* forkTyped(function*() {

                const parsedRequest = yield* takeTyped(opdsRequestFromCustomProtocol);
                return parseRequestFromCustomProtocol(parsedRequest);
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

                    return;

                } else {
                    const opdsCustomProtocolRequestParsed = task.result();
                    if (opdsCustomProtocolRequestParsed) {

                        const [, err] = yield* callTyped(opdsSetAuthCredentials,
                            opdsCustomProtocolRequestParsed,
                            authCredentials,
                            authParsed.authenticationType,
                        );

                        if (err instanceof Error) {
                            debug(err.message);

                            return;

                        } else {
                            yield put(historyActions.refresh.build());
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

    const configDoc = yield* callTyped(() => diMainGet("config-repository"));

    const docs = yield* callTyped(() => configDoc.findAll());

    if (Array.isArray(docs)) {
        for (const doc of docs) {

            if (doc.identifier.startsWith(CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN)) {

                debug("delete", doc.identifier);
                yield call(() => configDoc.delete(doc.identifier));
            }
        }
    }

    yield put(toastActions.openRequest.build(ToastType.Success, "👍"));
    debug("End of wipping auth data");
}

export function saga() {

    const opdsAuthChannel = getOpdsAuthenticationChannel();
    const opdsRequestChannel = getOpdsRequestCustomProtocolEventChannel();

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
    ]);
}

// -----

async function opdsSetAuthCredentials(
    opdsCustomProtocolRequestParsed: IParseRequestFromCustomProtocol<TLabelName>,
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
                    accessToken: Buffer.from(`${data.login}:${data.password}`).toString("base64"),
                    refreshToken: undefined,
                    tokenType: "basic",
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
                        }

                        const { authenticateUrl } = authCredentials || {};
                        if (!authenticateUrl) {
                            return [, new Error("unable to retrieve the authenticate url !!")];
                        }

                        const headers = new Headers();
                        headers.set("Content-Type", ContentType.Json);

                        const { data: postData } = await httpPost<IOpdsAuthenticationToken>(
                            authenticateUrl,
                            {
                                body: JSON.stringify(payload),
                                headers,
                            },
                            async (res) => {
                                if (res.isSuccess) {

                                    const _data = await res.response.json();
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
                    await httpSetToConfigRepoOpdsAuthenticationToken(newCredentials);

                    return [, undefined];
                }
                // newCredentials maybe an opds feed

                return [, new Error("no accessToken received")];
            }
        }

        if (method === "GET") {

            const newCredentials = {
                ...authCredentials,
                id: searchParams?.get("id") || authCredentials.id || undefined,
                tokenType: searchParams?.get("token_type") || authCredentials.tokenType || "Bearer",
                refreshToken: searchParams?.get("refresh_token") || undefined,
                accessToken: searchParams?.get("access_token") || undefined,
            };

            newCredentials.tokenType =
                newCredentials.tokenType.charAt(0).toUpperCase() + newCredentials.tokenType.slice(1);

            if (typeof newCredentials.accessToken === "string") {

                debug("new opds authentication credentials");
                await httpSetToConfigRepoOpdsAuthenticationToken(newCredentials);

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

        case "http://opds-spec.org/auth/local":
        case "http://opds-spec.org/auth/basic":
        case "http://opds-spec.org/auth/oauth/password": {

            const html = encodeURIComponent(
                htmlLoginTemplate(
                    "opds://authorize",
                    auth.labels?.login,
                    auth.labels?.password,
                    auth.logo?.url,
                    auth.title,
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

                const [l] = viewConvert.convertLinkToView([cv], baseUrl);

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
                debug(v);
                return (v.Rel || []).includes("logo");
            })
            : undefined;
        if (ln) {
            const [linkView] = viewConvert.convertLinkToView([ln], baseUrl);
            return linkView;
        }
        return undefined;

    }, filename_);

    return {
        title: doc.Title || "",
        id: doc.Id || "",
        authenticationType: authentication.Type as TAuthenticationType,
        links,
        labels,
        logo,
    };
}

function createOpdsAuthenticationModalWin(url: string): BrowserWindow | undefined {

    const libWin = tryCatchSync(() => getLibraryWindowFromDi(), filename_);
    if (!libWin) {
        debug("no lib win !!");
        return undefined;
    }

    const win = new BrowserWindow(
        {
            width: 800,
            height: 600,
            parent: libWin,
            modal: true,
            show: false,
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
function parseRequestFromCustomProtocol(req: Electron.Request)
    : IParseRequestFromCustomProtocol<TLabelName> | undefined {

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

        if (urlProtocol !== `${ODPS_AUTH_SCHEME}:`) {
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
                    debug("data", data);

                    const keyValue = data.split("&");
                    const values = tryCatchSync(
                        () => keyValue.reduce(
                            (pv, cv) =>
                                ({
                                    ...pv,
                                    [cv.split("=")[0]]: cv.split("=")[1],
                                }),
                            {},
                        ),
                        filename_,
                    ) || {};
                    debug(values);

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

                return {
                    url: urlParsed,
                    method: "GET",
                    data: {},
                };
            }
        }
    }

    return undefined;
}

// tslint:disable-next-line: max-line-length
const htmlLoginTemplate = (urlToSubmit: string = "", loginLabel = "login", passLabel = "password", logoUrl?: string, title?: string) => `
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>Sign in</title>

    <!-- Bootstrap core CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/css/bootstrap.min.css" rel="stylesheet">

    <!-- Custom styles for this template -->
    <style>
        html,
        body {
        height: 100%;
        }

        body {
        display: -ms-flexbox;
        display: -webkit-box;
        display: flex;
        -ms-flex-align: center;
        -ms-flex-pack: center;
        -webkit-box-align: center;
        align-items: center;
        -webkit-box-pack: center;
        justify-content: center;
        padding-top: 40px;
        padding-bottom: 40px;
        background-color: #f5f5f5;
        }

        .form-signin {
        width: 100%;
        max-width: 330px;
        padding: 15px;
        margin: 0 auto;
        }

        .form-signin .checkbox {
        font-weight: 400;
        }

        .form-signin .form-control {
        position: relative;
        box-sizing: border-box;
        height: auto;
        padding: 10px;
        font-size: 16px;
        }

        .form-signin .form-control:focus {
        z-index: 2;
        }

        .form-signin input[type="login"] {
        margin-bottom: -1px;
        border-bottom-right-radius: 0;
        border-bottom-left-radius: 0;
        }

        .form-signin input[type="password"] {
        margin-bottom: 10px;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        }
    </style>
    </head>

    <body class="text-center">
    <form class="form-signin" action="${urlToSubmit}" method="post">
        ${logoUrl ? `<img class="mb-4" src="${logoUrl}" alt="login logo">` : ``}
        ${title ? `<h4 class="h4 mb-4 font-weight-normal">${title}</h4>` : ``}
        <!--<img class="mb-4" src="https://getbootstrap.com/docs/4.0/assets/brand/bootstrap-solid.svg" alt="" width="72"
        height="72">!-->
        <h1 class="h3 mb-3 font-weight-normal">Please sign in</h1>
        <label for="inputLogin" class="sr-only">${loginLabel}</label>
        <input name="login" id="inputUsername" class="form-control" placeholder="${loginLabel}" required autofocus>
        <!-- <input type="email" name="email" id="inputEmail" class="form-control" placeholder="Email address" required autofocus> -->
        <label for="inputPassword" class="sr-only">${passLabel}</label>
        <input type="password" name="password" id="inputPassword" class="form-control" placeholder="${passLabel}" required>
        <!--<div class="checkbox mb-3">
        <label>
            <input type="checkbox" value="remember-me"> Remember me
        </label>!-->
        </div>
        <button class="btn btn-lg btn-primary btn-block" type="submit">Sign in</button>
    </form>
</body>

</html>`;
