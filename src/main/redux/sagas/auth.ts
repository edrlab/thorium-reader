// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { BrowserWindow } from "electron";
import {
    OPDSAuthenticationDoc,
} from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-authentication-doc";
import { takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { diMainGet } from "readium-desktop/main/di";
import {
    getOpdsAuthenticationChannel, TOpdsAuthenticationChannel,
} from "readium-desktop/main/event";
import {
    httpSetToConfigRepoOpdsAuthenticationToken, IOpdsAuthenticationToken,
} from "readium-desktop/main/network/http";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
import { all } from "redux-saga/effects";
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

    // readium-desktop:main/http TypeError: Only HTTP(S) protocols are supported
    // const response = yield* callTyped(() => httpGet("opds://authorize?test=123"));
    // debug(typeof response);
    // const res = response.response;
    // debug("response", res);

    // launch an auth browserWindow

    yield* callTyped(async () => {

        let win: BrowserWindow;

        try {
            win = new BrowserWindow({
                width: 800,
                height: 600,
            });

            // win.hide();

            await Promise.race([
                win.loadURL(`opds://authorize`),
                new Promise<void>((resolve) => setTimeout(() => resolve(), 7000)),

            ]);

            return ;

        } finally {

            debug("finally");

            if (win) {

                win.close();
            }

        }
    });

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
                return;
            }

            const urlParsed = tryCatchSync(() => new URL(url), filename_);
            if (!urlParsed) {
                debug("authentication: can't parse the opds:// request url", url);
                return;
            }

            const { protocol: urlProtocol, host, searchParams } = urlParsed;

            if (urlProtocol !== ODPS_AUTH_SCHEME) {
                debug("bad opds protocol !!");
                return;
            }

            if (host === "authorize") {

                const authCredentials: IOpdsAuthenticationToken = {
                    id: searchParams?.get("id") || undefined,
                    tokenType: searchParams?.get("token_type") || "Bearer",
                    refreshToken: searchParams?.get("refresh_token") || undefined,
                    accessToken: searchParams?.get("token_type") || undefined,
                };

                yield* callTyped(httpSetToConfigRepoOpdsAuthenticationToken, authCredentials);
            }
        }
}

export function saga() {

    const opdsAuthChannel = getOpdsAuthenticationChannel();

    const opdsRequestChannel = getOpdsRequestCustomProtocolEventChannel();

    return all([
        takeSpawnEveryChannel(
            opdsAuthChannel,
            opdsAuthFlow,
            (e) => debug("redux OPDS authentication channel error", e),
        ),
        takeSpawnEveryChannel(
            opdsRequestChannel,
            opdsRequestEvent,
            (e) => debug("opds request opds://", e),
        ),
    ]);
}
