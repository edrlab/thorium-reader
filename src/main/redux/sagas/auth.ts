// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";
import { OPDSAuthenticationDoc } from "r2-opds-js/dist/es6-es2015/src/opds/opds2/opds2-authentication-doc";
import { takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { IOpdsLinkView } from "readium-desktop/common/views/opds";
import { diMainGet } from "readium-desktop/main/di";
import { getOpdsAuthenticationChannel, TOpdsAuthenticationChannel } from "readium-desktop/main/event";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";

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
                .reduce((pvRel, cvRel) => pvRel || LINK_TYPE.find(cvRel as any) || "", "") as TLinkType;
            if (
                rel
                && typeof cv.Href === "string"
            ) {

                const l = viewConvert.convertLinkToView([cv], baseUrl);

                return { ...pv, [rel]: l };
            }

            return pv;

        }, {} as IOPDSAuthDocParsed["links"])
        : undefined;

    const labels: IOPDSAuthDocParsed["labels"] = {};
    if (typeof authentication.Labels?.Login === "string") {
        labels.login = authentication.Labels?.Login;
    }
    if (typeof authentication.Labels?.Password === "string") {
        labels.password = authentication.Labels?.Password;
    }
    const logo = tryCatchSync(() => {
        const convert = diMainGet("opds-feed-view-converter");
        const ln = Array.isArray(authentication.Links)
            ? authentication.Links.find((v) => (v.Rel || []).includes("logo"))
            : undefined;
        if (ln) {
            const [linkView] = convert.convertLinkToView([ln], baseUrl);
            return linkView;
        }
        return undefined;

    }, "");

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

    const auth = tryCatchSync(() => opdsAuthDocConverter(doc, baseUrl), filename_);
    if (!auth) {

        debug("authentication doc parsing error");
        return;
    }

    // launch an auth browserWindow

    // wait opds://authorize for implicit or opds://signin for other

    // close the window

    // refresh the opds browser view

}

export function saga() {

    const opdsAuthChannel = getOpdsAuthenticationChannel();

    return takeSpawnEveryChannel(
        opdsAuthChannel,
        opdsAuthFlow,
        (e) => debug("redux OPDS authentication channel error", e),
    );
}
