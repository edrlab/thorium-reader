// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

// Logger
const filename = "readium-desktop:main:cli:url";
const debug = debug_(filename);

// import validator from "validator";
import { getOpenUrlWithOpdsSchemeEventChannel, getOpenUrlWithThoriumSchemeEventChannel } from "../event";
import { URL_PROTOCOL_APP_HANDLER_OPDS, URL_PROTOCOL_APP_HANDLER_THORIUM } from "readium-desktop/common/streamerProtocol";

export const isOpenUrl = (url: string): boolean => {

    // const urlIsValid = validator.isURL(url, {
    //     protocols: ["http", "https", URL_PROTOCOL_APP_HANDLER_OPDS, URL_PROTOCOL_APP_HANDLER_THORIUM],
    // });

    let urlIsValid = false;

    try {
        const _url = new URL(url);
        if (["http:", "https:", `${URL_PROTOCOL_APP_HANDLER_OPDS}:`, `${URL_PROTOCOL_APP_HANDLER_THORIUM}:`].some((v) => v === _url.protocol)) {
            urlIsValid = true;
        }
    } catch {
        // ignore
    }
    return urlIsValid;
};

export const setOpenUrl = (url: string): void => {

    // OR: if (new URL(url).protocol === `${URL_PROTOCOL_APP_HANDLER_OPDS}:`)
    if (url.startsWith(`${URL_PROTOCOL_APP_HANDLER_OPDS}://`)) {
        debug("OPEN URL WITH OPDS scheme");
        const openUrl = url.replace(`${URL_PROTOCOL_APP_HANDLER_OPDS}://`, "http://"); // HTTP to HTTPS redirect should be handled by the server

        debug("OPEN URL =", openUrl);

        const buf = getOpenUrlWithOpdsSchemeEventChannel();
        buf.put(openUrl);
    }

    // OR: if (new URL(url).protocol === `${URL_PROTOCOL_APP_HANDLER_THORIUM}:`)
    else if (url.startsWith(`${URL_PROTOCOL_APP_HANDLER_THORIUM}://`)) {

        debug("OPEN URL WITH thorium scheme");
        const buf = getOpenUrlWithThoriumSchemeEventChannel();

        debug("OPEN URL =", url);
        buf.put(url);
    }

    // only from the CLI we accept http/https protocols
    else if (/^https?:\/\//.test(url)) {
        debug("OPEN URL WITH http(s) scheme");

        const buf = getOpenUrlWithThoriumSchemeEventChannel();
        debug("OPEN URL =", url);
        buf.put(url);
    }

    else {
        process.stderr.write("Cannot open URL with this protocol");
    }
};
