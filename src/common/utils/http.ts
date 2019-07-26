// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { app } from "electron";
import * as request from "request";
import { promisify } from "util";

export type httpResponse = request.Response;

export function httpGet(url: string, options?: request.CoreOptions): Promise<request.Response> {
    const requestOptions = Object.assign(
        {},
        { url },
        {
            headers: {
                "User-Agent": "readium-desktop",
                "Accept-Language": `${app.getLocale() || "en-US"},en-US;q=0.7,en;q=0.5`,
            },
        },
        options,
    );
    return promisify<request.CoreOptions, request.Response>(request)(requestOptions);
}
