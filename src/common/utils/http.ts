// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { RequestInit, Response } from "node-fetch";

export type THttpOptions = RequestInit & { timeout?: number, abortController?: AbortController };
export type THttpResponse = Response;

export interface IHttpGetResult<TData> {
    readonly url: string | URL;
    readonly isFailure: boolean;
    readonly isSuccess: boolean;
    readonly isNetworkError?: boolean;
    readonly isTimeout?: boolean;
    readonly isAbort?: boolean;
    readonly timeoutConnect?: boolean;
    readonly responseUrl?: string;
    readonly statusCode?: number;
    readonly statusMessage?: string;
    contentType?: string;
    // cookies?: string;
    body?: NodeJS.ReadableStream;
    response?: THttpResponse;
    data?: TData;
}

export type THttpGetResultAfterCallback<TData> = Omit<IHttpGetResult<TData>, "body" | "response">;

export type THttpGetCallback<T> =
    (result: IHttpGetResult<T>) =>
        THttpGetResultAfterCallback<T> | Promise<THttpGetResultAfterCallback<T>>;
