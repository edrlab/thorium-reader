// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { container } from "readium-desktop/main/di";
import { RootState } from "readium-desktop/main/redux/states";
import { JsonMap } from "readium-desktop/typings/json";
import { Store } from "redux";
import * as request from "request";
import { promisify } from "util";

type TRequestCoreOptionsRequiredUriUrl = request.CoreOptions & request.RequiredUriUrl;
type TRequestCoreOptionsOptionalUriUrl = request.CoreOptions & request.OptionalUriUrl;

/**
 * @param url url of your GET request
 * @param options request options
 * @returns body of url response. 'String' type returned in many cases except for options.json = true
 */
// tslint:disable-next-line: max-line-length
export async function httpGet<T extends JsonMap | string = string>(url: string, options?: TRequestCoreOptionsOptionalUriUrl): Promise<T> {
    options = options || {} as TRequestCoreOptionsOptionalUriUrl;
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
    ) as TRequestCoreOptionsRequiredUriUrl;

    const promisifiedRequest = promisify<TRequestCoreOptionsRequiredUriUrl, request.Response>(request);
    const response = await promisifiedRequest(requestOptions);

    if (!response) {
        throw new Error(`HTTP no response for ${url}`);
    } else if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(`HTTP error ${response.statusCode} for ${url}`);
    } else if (!response.body) {
        throw new Error(`HTTP no body with error ${response.statusCode} for ${url}`);
    }
    return response.body;
}
