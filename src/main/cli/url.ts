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


    if (url.startsWith("opds")) {
        const openUrl = url.replace("opds", "https");

        const buf = getOpenUrlWithOpdsSchemeEventChannel();
        buf.put(openUrl);
    }
    if (url.startsWith("thorium")) {
        const openUrl = url.replace("thorium", "https");

        const buf = getOpenUrlWithThoriumSchemeEventChannel();
        buf.put(openUrl);
    }

};
