// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import validator from "validator";
import { getOpenUrlWithOpdsSchemeEventChannel, getOpenUrlWithThoriumSchemeEventChannel } from "../event";

export const isOpenUrl = (url: string): boolean => {

    const urlIsValid = validator.isURL(url, {
        protocols: ["http", "https", "opds", "thorium"],
    });
    return urlIsValid;
};

export const setOpenUrl = (url: string): void => {

    // OR: if (new URL(url).protocol === "opds:")
    if (url.startsWith("opds://")) {
        const openUrl = url.replace("opds://", "http://"); // HTTP to HTTPS redirect should be handled by the server

        const buf = getOpenUrlWithOpdsSchemeEventChannel();
        buf.put(openUrl);
    }

    // OR: if (new URL(url).protocol === "thorium:")
    else if (url.startsWith("thorium://")) {
        const openUrl = url.replace("thorium://", "http://"); // HTTP to HTTPS redirect should be handled by the server

        const buf = getOpenUrlWithThoriumSchemeEventChannel();
        buf.put(openUrl);
    }

    // only from the CLI we accept http/https protocols 
    else if (url.startsWith("http://") || url.startsWith("https://")) {
        const openUrl = url;

        const buf = getOpenUrlWithThoriumSchemeEventChannel();
        buf.put(openUrl);
    }

    else {
        process.stderr.write("Cannot open URL with this protocol");
    }
};
