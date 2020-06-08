// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { diMainGet } from "readium-desktop/main/di";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { JsonMap } from "readium-desktop/typings/json";
import * as request from "request";
import { Url } from "url";

const debug = debug_("readium-desktop:common:utils:http");

type TRequestCoreOptionsRequiredUriUrl = request.CoreOptions & request.RequiredUriUrl;
type TRequestCoreOptionsOptionalUriUrl = request.CoreOptions & request.OptionalUriUrl;

export interface IHttpGetResult<TBody, TData> {
    readonly isFailure: boolean;
    readonly isSuccess: boolean;
    readonly isTimeout: boolean;
    readonly url: string | Url;
    readonly timeoutConnect?: boolean;
    readonly responseUrl?: string;
    readonly statusCode?: number;
    readonly statusMessage?: string;
    readonly contentType?: string;
    readonly body?: TBody;
    data?: TData;
}

type THttpGetCallback<T1, T2> =
    (result: IHttpGetResult<T1, T2>) =>
        IHttpGetResult<T1, T2> | Promise<IHttpGetResult<T1, T2>>;

/**
 * @param url url of your GET request
 * @param options request options
 * @param callback callback to set data from body
 * @returns body of url response. 'String' type returned in many cases except for options.json = true
 */
export async function httpGet<TBody extends JsonMap | string = string , TData = string>(
    url: string | Url,
    options?: TRequestCoreOptionsOptionalUriUrl,
    callback?: THttpGetCallback<TBody, TData>,
): Promise<IHttpGetResult<TBody, TData>> {
    options = options || {} as TRequestCoreOptionsOptionalUriUrl;
    options.headers = options.headers || {};

    const headerFromOptions: request.Headers = {};
    for (const [key, value] of Object.entries(options.headers)) {
        Object.assign(headerFromOptions, {
            [key.toLowerCase()]: value,
        });
    }

    const store = diMainGet("store");
    const locale = store.getState().i18n.locale;
    const headers: request.Headers = Object.assign(headerFromOptions, {
                "user-agent": "readium-desktop",
                "accept-language": `${locale},en-US;q=0.7,en;q=0.5`,
            });
    const requestOptions: TRequestCoreOptionsRequiredUriUrl = Object.assign(
        {},
        options,
        {
            url,
            method: "GET",
            encoding: undefined,
            headers,
            agentOptions: {
                rejectUnauthorized: IS_DEV ? false : true,
            },
        },
    );

    debug("HTTP REQUEST:");
    debug(requestOptions);

    const result: IHttpGetResult<TBody, TData> =
        await new Promise((resolve, reject) => {
            request(requestOptions, (err, response) => {

                debug("HTTP RESPONSE:");
                if (err) {
                    debug(err);
                    if (err.code === "ETIMEDOUT") {
                        resolve({
                            isTimeout: true,
                            timeoutConnect: err.connect,
                            isFailure: true,
                            isSuccess: false,
                            url: requestOptions.url,
                        });
                    }
                    reject(err);
                    return ;
                }
                if (response) {
                    debug(response.statusCode);
                    debug(response.statusMessage);
                    debug(response.url);
                    debug(response.body?.substr ? response.body.substr(0, 800) : response.body);
                }
                resolve({
                    isTimeout: false,
                    isFailure: response.statusCode < 200 || response.statusCode >= 300,
                    isSuccess: response.statusCode >= 200 && response.statusCode < 300,
                    url: requestOptions.url,
                    responseUrl: response.url,
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage,
                    body: response.body,
                    data: callback ? undefined : response.body,
                    contentType: response.caseless.get("Content-Type"),
                });
            });
        });

    if (callback) {
        return (await Promise.all([callback(result)]))[0];
    }
    return result;
}
