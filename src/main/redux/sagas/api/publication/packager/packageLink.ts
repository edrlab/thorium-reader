// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import fetch from "node-fetch";
import { callTyped } from "readium-desktop/common/redux/sagas/typed-saga";
import { SagaGenerator } from "typed-redux-saga";
import { httpGet } from "readium-desktop/main/http";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/packager/packageLink");

export function* packageFromLink(
    url: URL,
    isHtml: boolean,
): SagaGenerator<string | undefined> {

    try {
        const data = yield* callTyped(httpGet, url);
        const { response, isSuccess } = data;

        let rawData: string;
        if (isSuccess) {
            rawData = yield* callTyped(() => response.text());

        } else {
            debug("error to fetch", url.toString(), data);
            throw new Error("error to fetch " + url.toString());
        }

        if (isHtml) {

        } else {

        }

    } catch (e) {
        debug("can't fetch url", url.toString());

    }

}
