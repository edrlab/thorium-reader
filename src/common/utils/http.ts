// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { app } from "electron";
import { container } from "readium-desktop/main/di";
import { RootState } from "readium-desktop/main/redux/states";
import { Store } from "redux";
import * as request from "request";
import { promisify } from "util";

export type httpResponse = request.Response;

export function httpGet(url: string, options?: request.CoreOptions): Promise<request.Response> {

    const store = container.get("store") as Store<RootState>;
    const locale = store.getState().i18n.locale;
    const requestOptions = Object.assign(
        {},
        { url },
        {
            headers: {
                "User-Agent": "readium-desktop",
                "Accept-Language": `${locale},en-US;q=0.7,en;q=0.5`,
            },
        },
        options,
    );
    return promisify<request.CoreOptions, request.Response>(request)(requestOptions);
}
