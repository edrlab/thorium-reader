// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as https from "https";
import fetch from "node-fetch";
import { AbortSignal as IAbortSignal } from "node-fetch/externals";
import {
    IHttpGetResult, THttpGetCallback, THttpOptions, THttpResponse,
} from "readium-desktop/common/utils/http";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { setTimeout } from "timers";

import { diMainGet } from "./di";

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

    if (!options.agent) {
        const agent = new https.Agent({
            rejectUnauthorized: IS_DEV ? false : true,
        });
        options.agent = agent;
    }

    const res = await fetch(url, options);

    return res;
}

export async function httpGet<TData = any>(
    url: string | URL,
    options: THttpOptions = {},
    timeout = 30000,
    callback?: THttpGetCallback<TData>,
): Promise<IHttpGetResult<TData>> {

    let result: IHttpGetResult<TData>;

    const signal = new AbortSignal();

    options.signal = signal;
    options.method = "GET";

    let locale = "en-US";
    try {
        const store = diMainGet("store");
        locale = store.getState().i18n.locale;
    } catch {
        // ignore
    }

    let timeoutId: NodeJS.Timeout;
    if (timeout) {
        timeoutId = setTimeout(() => {
            signal.dispatchEvent();
        }, timeout);
    }

    let response: THttpResponse;
    try {
        response = await request(url, options, locale);
    } catch (err) {

        clearTimeout(timeoutId);

        if (err.name === "AbortError") {
            result =  {
                isTimeout: true,
                isFailure: true,
                isSuccess: false,
                url,
            };
        } else {
            throw err;
        }
    }

    result = {
        isTimeout: false,
        isFailure: !response.ok/*response.status < 200 || response.status >= 300*/,
        isSuccess: response.ok/*response.status >= 200 && response.status < 300*/,
        url,
        responseUrl: response.url,
        statusCode: response.status,
        statusMessage: response.statusText,
        body: response.body,
        response,
        data: callback ? undefined : await response.json(),
        contentType: response.headers.get("Content-Type"),
    };

    if (callback) {
        result = await Promise.resolve(callback(result));

        // remove for IPC sync
        delete result.body;
        delete result.response;
    }

    clearTimeout(timeoutId);

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
