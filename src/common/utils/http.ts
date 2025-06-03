// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// @ts-ignore TS1479
import { RequestInit, Response } from "node-fetch";

import { IProblemDetailsResultView } from "../views/problemDetails";

// maxRedirect:
// https://github.com/valeriangalliat/fetch-cookie#max-redirects
export type THttpOptions = RequestInit & { maxRedirect?: number, timeout?: number, abortController?: AbortController };
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
    response?: Partial<THttpResponse>;
    data?: TData;
}

export type THttpGetResultAfterCallback<TData> = Omit<IHttpGetResult<TData>, "body" | "response">;

export type THttpGetCallback<T> =
    (result: IHttpGetResult<T>) =>
        THttpGetResultAfterCallback<T> | Promise<THttpGetResultAfterCallback<T>>;


export async function parseProblemDetails(response: Partial<Response> | undefined): Promise<IProblemDetailsResultView> {
    const json = await response?.json();
    const {
        type,
        title,
        status,
        detail,
        instance,
    } = json as IProblemDetailsResultView;
    return {
        type: typeof type === "string" ? type : undefined,
        title: typeof title === "string" ? title : undefined,
        status: typeof status === "number" ? status : undefined,
        detail: typeof detail === "string" ? detail : undefined,
        instance: typeof instance === "string" ? instance : undefined,
    };
}
