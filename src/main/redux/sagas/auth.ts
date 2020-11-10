// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { BrowserWindow, globalShortcut } from "electron";
import {
    OPDSAuthenticationDoc,
} from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-authentication-doc";
import { ToastType } from "readium-desktop/common/models/toast";
import { authActions, historyActions, toastActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery, takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { takeSpawnLeadingChannel } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { diMainGet, getLibraryWindowFromDi } from "readium-desktop/main/di";
import {
    getOpdsAuthenticationChannel, TOpdsAuthenticationChannel,
} from "readium-desktop/main/event";
import { cleanCookieJar } from "readium-desktop/main/network/fetch";
import {
    CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN,
    getConfigRepoOpdsAuthenticationToken,
    httpSetToConfigRepoOpdsAuthenticationToken, IOpdsAuthenticationToken,
} from "readium-desktop/main/network/http";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
import { channel } from "redux-saga";
import { all, call, delay, put, race, take } from "redux-saga/effects";
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

const opdsAuthDoneChannel = channel<IOpdsAuthenticationToken | undefined>();

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
        const ln = Array.isArray(authentication.Links)
            ? authentication.Links.find((v) => (v.Rel || []).includes("logo"))
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

function* opdsAuthFlow(opdsAuth: TOpdsAuthenticationChannel) {

    const [doc, baseUrl] = opdsAuth;
    debug("opds authenticate flow");
    debug("typeof doc", typeof doc);

    const authParsed = yield* callTyped(
        () => tryCatchSync(() => opdsAuthDocConverter(doc, baseUrl), filename_));
    if (!authParsed) {

        debug("authentication doc parsing error");
        return;
    }

    debug("authentication doc parsed", authParsed);

    const authCredentials: IOpdsAuthenticationToken = {
        id: authParsed?.id || undefined,
        opdsAuthenticationUrl: baseUrl,
        tokenType: "Bearer",
        refreshUrl: authParsed?.links?.refresh?.url || undefined,
        authenticateUrl: authParsed?.links?.authenticate?.url || undefined,
    };

    debug("authentication credential config", authCredentials);
    yield* callTyped(httpSetToConfigRepoOpdsAuthenticationToken, authCredentials);

    // test opds://

    let browserUrl: string;
    switch (authParsed.authenticationType) {

        case "http://opds-spec.org/auth/oauth/implicit": {

            browserUrl = authCredentials.authenticateUrl;
            break;
        }

        default: {

            debug("authentication method not found", authParsed.authenticationType);
            return;
        }
    }

    // readium-desktop:main/http TypeError: Only HTTP(S) protocols are supported
    // const response = yield* callTyped(() => httpGet("opds://authorize?test=123"));
    // debug(typeof response);
    // const res = response.response;
    // debug("response", res);

    // launch an auth browserWindow

    debug("Browser URL", browserUrl);

    const libWin = getLibraryWindowFromDi();
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

    // tslint:disable-next-line: no-empty
    opdsAuthDoneChannel.flush(() => {});

    try {

        // tslint:disable-next-line: no-floating-promises
        win.loadURL(browserUrl);
        const { c } = yield race({
            b: delay(60000),
            c: take(opdsAuthDoneChannel),
            d: call(
                async () =>
                    new Promise<void>((resolve) => win.on("close", () => resolve())),
            ),
        });

        const authorizeCred: IOpdsAuthenticationToken = c;
        if (authorizeCred) {
            if (
                typeof authorizeCred === "object"
                && authorizeCred.accessToken
            ) {

                const { authenticateUrl } = authCredentials;
                const { hostname } = new URL(authenticateUrl);
                const cred = yield* callTyped(getConfigRepoOpdsAuthenticationToken, hostname);
                if (cred) {
                    const newCred = { ...cred, ...authorizeCred };

                    debug("new opds authentication credentials");

                    yield* callTyped(httpSetToConfigRepoOpdsAuthenticationToken, newCred);

                    // debug("REFRESH the page");
                    yield put(historyActions.refresh.build());
                }
            }
        }

        return;

    } finally {

        debug("finally");

        if (win) {

            win.close();
        }
    }

    // wait opds://authorize for implicit or opds://signin for other

    // close the window

    // refresh the opds browser view

}

function* opdsRequestEvent(req: Electron.Request) {

    debug("########");
    debug("########");
    debug("odps:// request:", req);
    debug("########");
    debug("########");

    if (typeof req === "object") {
        const { method, url } = req;

        if (method !== "GET") {
            debug("not a GET method !!");
            return;
        }

        const urlParsed = tryCatchSync(() => new URL(url), filename_);
        if (!urlParsed) {
            debug("authentication: can't parse the opds:// request url", url);
            return;
        }

        const { protocol: urlProtocol, host, searchParams } = urlParsed;

        if (urlProtocol !== `${ODPS_AUTH_SCHEME}:`) {
            debug("bad opds protocol !!", urlProtocol);
            return;
        }

        if (host === "authorize") {

            const authCredentials: IOpdsAuthenticationToken = {
                id: searchParams?.get("id") || undefined,
                tokenType: searchParams?.get("token_type") || "Bearer",
                refreshToken: searchParams?.get("refresh_token") || undefined,
                accessToken: searchParams?.get("access_token") || undefined,
            };

            authCredentials.tokenType =
                authCredentials.tokenType.charAt(0).toUpperCase() + authCredentials.tokenType.slice(1);

            opdsAuthDoneChannel.put(authCredentials);

            return;
        }
    }

    opdsAuthDoneChannel.put(undefined);
}

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
            opdsAuthFlow,
            (e) => debug("redux OPDS authentication channel error", e),
        ),
        takeSpawnEveryChannel(
            opdsRequestChannel,
            opdsRequestEvent,
            (e) => debug("opds request opds://", e),
        ),
        takeSpawnEvery(
            authActions.wipeData.ID,
            opdsAuthWipeData,
            (e) => debug("opds authentication data wipping error", e),
        ),
    ]);
}
