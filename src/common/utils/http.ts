// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { container } from "readium-desktop/main/di";
import { RootState } from "readium-desktop/main/redux/states";
import { Store } from "redux";
import * as request from "request";
import { promisify } from "util";

/**
 * @param url url of your GET request
 * @param options request options
 * @returns body of url response. 'String' type returned in many cases except for options.json = true
 */
export async function httpGet(url: string, options?: request.CoreOptions): Promise<string | any> {
    options = options || {};
    options.headers = options.headers || {};

    const headerFromOptions = {};
    for (const [key, value] of Object.entries(options.headers)) {
        Object.assign(headerFromOptions, {
            [key.toLowerCase()]: value,
        });
    }

    const store = container.get("store") as Store<RootState>;
    const locale = store.getState().i18n.locale;
    const headers = Object.assign(headerFromOptions, {
                "user-agent": "readium-desktop",
                "accept-language": `${locale},en-US;q=0.7,en;q=0.5`,
            });
    const requestOptions = Object.assign(
        {},
        options,
        {
            url,
            method: "GET",
            encoding: undefined,
            headers,
        },
    );
    const response = await promisify<request.CoreOptions, request.Response>(request)(requestOptions);
    if (!response) {
        throw new Error(`No HTTP response?! ${url}`);
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
        const b = response.body ? JSON.stringify(response.body) : "";
        throw new Error(`HTTP response status code: ${url} => ${response.statusCode} => ${b}`);
    }
    if (!response.body) {
        throw new Error(`HTTP no body?! ${url} => ${response.statusCode}`);
    }
    return response.body;
}
