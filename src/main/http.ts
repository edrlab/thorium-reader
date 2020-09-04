// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as https from "https";
import fetch from "node-fetch";
import { AbortSignal as IAbortSignal } from "node-fetch/externals";
import {
    IHttpGetResult, THttpGetCallback, THttpOptions, THttpResponse,
} from "readium-desktop/common/utils/http";
import { IS_DEV } from "readium-desktop/preprocessor-directives";

import { diMainGet } from "./di";

// Logger
const debug = debug_("readium-desktop:main#saga/api/publication/importFromLinkService");

export async function request(
    url: string | URL,
    options: THttpOptions,
    locale = "en-US",
): Promise<THttpResponse> {

    const headers = {
        ...options.headers,
        "user-agent": "readium-desktop",
        "accept-language": `${locale},en-US;q=0.7,en;q=0.5`,
    };
    options.headers = headers;

    // https://github.com/node-fetch/node-fetch#custom-agent
    // httpAgent doesn't works // err: Protocol "http:" not supported. Expected "https:
    // this a nodeJs issues !
    //
    // const httpAgent = new http.Agent({
    //     timeout: options.timeout || 30000,
    // });
    // options.agent = (parsedURL: URL) => {
    //     if (parsedURL.protocol === "http:") {
    //           return httpAgent;
    //     } else {
    //           return httpsAgent;
    //     }
    // };
    if (!options.agent && url.toString().startsWith("https:")) {
        const httpsAgent = new https.Agent({
            timeout: options.timeout || 30000,
            rejectUnauthorized: IS_DEV ? false : true,
        });
        options.agent = httpsAgent;

    }

    const response = await fetch(url, options);

    debug(url);
    debug(response.ok);
    debug(response.status);
    debug(response.statusText);

    return response;
}

export async function httpGet<TData = undefined>(
    url: string | URL,
    options: THttpOptions = {},
    callback?: THttpGetCallback<TData>,
): Promise<IHttpGetResult<TData>> {

    let result: IHttpGetResult<TData> = {
        isFailure: true,
        isSuccess: false,
        url,
    };

    // options.signal = new AbortSignal();
    options.method = "GET";

    let locale = "en-US";
    try {
        const store = diMainGet("store");
        locale = store.getState().i18n.locale;
    } catch {
        // ignore
    }

    try {
        const response = await request(url, options, locale);

        result = {
            isAbort: false,
            isNetworkError: false,
            isTimeout: false,
            isFailure: !response.ok/*response.status < 200 || response.status >= 300*/,
            isSuccess: response.ok/*response.status >= 200 && response.status < 300*/,
            url,
            responseUrl: response.url,
            statusCode: response.status,
            statusMessage: response.statusText,
            body: response.body,
            response,
            data: undefined,
            contentType: response.headers.get("Content-Type"),
        };
    } catch (err) {

        const errStr = err instanceof Error ? err.toString() : err;

        if (err.name === "AbortError") {
            result = {
                isAbort: true,
                isNetworkError: false,
                isTimeout: false,
                isFailure: true,
                isSuccess: false,
                url,
            };
        } else if (errStr.includes("timeout")) { // err.name === "FetchError"
            result = {
                isAbort: false,
                isNetworkError: true,
                isTimeout: true,
                isFailure: true,
                isSuccess: false,
                url,
                statusMessage: errStr,
            };
        } else { // err.name === "FetchError"
            result = {
                isAbort: false,
                isNetworkError: true,
                isTimeout: false,
                isFailure: true,
                isSuccess: false,
                url,
                statusMessage: errStr,
            };
        }

    } finally {

        if (callback) {
            result = await Promise.resolve(callback(result));

            // remove for IPC sync
            delete result.body;
            delete result.response;
        }
    }

    return result;
}

// fetch checks the class name
// https://github.com/node-fetch/node-fetch/blob/b7076bb24f75be688d8fc8b175f41b341e853f2b/src/utils/is.js#L78
export class AbortSignal implements IAbortSignal {

    public aborted: boolean;
    private listenerArray: any[];

    constructor() {
        this.listenerArray = [];
        this.aborted = false;
    }

    // public get aborted() {
    //     return this._aborted;
    // }

    public addEventListener(_type: "abort", listener: (a: any[]) => any) {
        this.listenerArray.push(listener);
    }

    public removeEventListener(_type: "abort", listener: (a: any[]) => any) {
        const index = this.listenerArray.findIndex((v) => v === listener);
        if (index > -1) {
            this.listenerArray = [...this.listenerArray.slice(0, index), ...this.listenerArray.slice(index + 1)];
        }
    }

    public dispatchEvent() {
        this.listenerArray.forEach((v) => v());
        return this.aborted = true;
    }
}
