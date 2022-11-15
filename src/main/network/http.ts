// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import timeoutSignal from "timeout-signal";
import * as debug_ from "debug";
import { promises as fsp } from "fs";
import * as http from "http";
import * as https from "https";
import { AbortError, Headers, RequestInit, Response } from "node-fetch";
import {
    IHttpGetResult, THttpGetCallback, THttpOptions, THttpResponse,
} from "readium-desktop/common/utils/http";
import { decryptPersist, encryptPersist } from "readium-desktop/main/fs/persistCrypto";
import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { tryCatch, tryCatchSync } from "readium-desktop/utils/tryCatch";

import { diMainGet, opdsAuthFilePath } from "../di";
import { fetchWithCookie } from "./fetch";
import { digestAuthentication, parseDigestString} from "readium-desktop/utils/digest";

// Logger
const filename_ = "readium-desktop:main/http";
const debug = debug_(filename_);

const DEFAULT_HTTP_TIMEOUT = 30000;

let authenticationToken: Record<string, IOpdsAuthenticationToken> = {};

// Redirect now handled internally, see https://github.com/valeriangalliat/fetch-cookie/blob/master/CHANGELOG.md#200---2022-02-17
//
// // https://github.com/node-fetch/node-fetch/blob/master/src/utils/is-redirect.js
// const redirectStatus = new Set([301, 302, 303, 307, 308]);
// /**
//  * Redirect code matching
//  *
//  * @param {number} code - Status code
//  * @return {boolean}
//  */
// const isRedirect = (code: number) => {
//     return redirectStatus.has(code);
// };

// 20 is fetch-cookie's default
// https://github.com/valeriangalliat/fetch-cookie#max-redirects
const MAX_FOLLOW_REDIRECT = 20;

export const httpSetHeaderAuthorization =
    (type: string, credentials: string) => `${type} ${credentials}`;

export const CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN = "CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN";
// tslint:disable-next-line: variable-name
const CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN_fn =
    (host: string) => `${CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN}.${Buffer.from(host).toString("base64")}`;

export interface IOpdsAuthenticationToken {
    id?: string;
    opdsAuthenticationUrl?: string; // application/opds-authentication+json
    refreshUrl?: string;
    authenticateUrl?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    password?: string; // digest only
}

let authenticationTokenInitialized = false;
const authenticationTokenInit = async () => {

    if (authenticationTokenInitialized) {
        return;
    }

    const data = await tryCatch(() => fsp.readFile(opdsAuthFilePath), "");
    let docsFS: string | undefined;
    if (data) {
        try {
            docsFS = decryptPersist(data, CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN, opdsAuthFilePath);
        } catch (_err) {
            docsFS = undefined;
        }
    }

    let docs: Record<string, IOpdsAuthenticationToken>;
    const isValid = typeof docsFS === "string" && (
        docs = JSON.parse(docsFS),
        typeof docs === "object" &&
        Object.entries(docs)
            .reduce((pv, [k, v]) =>
                pv &&
                k.startsWith(CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN)
                && typeof v === "object", true));

    if (!docs || !isValid) {
        docs = {};
    }

    authenticationToken = docs;
    authenticationTokenInitialized = true;

};

export const httpSetAuthenticationToken =
    async (data: IOpdsAuthenticationToken) => {
        if (!data.opdsAuthenticationUrl) {
            throw new Error("no opdsAutenticationUrl !!");
        }

        await authenticationTokenInit();

        const url = new URL(data.opdsAuthenticationUrl);
        const { host } = url;
        // do not risk showing plaintext access/refresh tokens in console / command line shell
        debug("SET opds authentication credentials for", host); // data

        const id = CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN_fn(host);
        const res = authenticationToken[id] = data;

        await persistJson();

        return res;
    };

const persistJson = () => tryCatch(() => {
    if (!authenticationToken) return Promise.resolve();
    const encrypted = encryptPersist(JSON.stringify(authenticationToken), CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN, opdsAuthFilePath);
    return fsp.writeFile(opdsAuthFilePath, encrypted);
}, "");

export const absorbDBToJson = async () => {
    await authenticationTokenInit();
    await persistJson();
};

export const getAuthenticationToken =
    async (url: URL, method = "GET") => {

        await authenticationTokenInit();

        const id = CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN_fn(url.host);
        const auth = authenticationToken[id];
        if (auth?.accessToken?.includes("nonce=") && auth?.accessToken?.includes("uri=")) {

            const data = parseDigestString(auth.accessToken);
            auth.accessToken = digestAuthentication({
                ...data,
                uri: new URL(url).pathname,
                password: auth.password,
                method: method.toUpperCase(),
            });
        }
        return auth;
    };

export const deleteAuthenticationToken = async (host: string) => {
    await authenticationTokenInit();

    const id = CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN_fn(host);
    delete authenticationToken[id];

    const encrypted = encryptPersist(JSON.stringify(authenticationToken), CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN, opdsAuthFilePath);
    return fsp.writeFile(opdsAuthFilePath, encrypted);

};

export const wipeAuthenticationTokenStorage = async () => {
    // authenticationTokenInitialized = false;
    authenticationToken = {};
    const encrypted = encryptPersist(JSON.stringify(authenticationToken), CONFIGREPOSITORY_OPDS_AUTHENTICATION_TOKEN, opdsAuthFilePath);
    return fsp.writeFile(opdsAuthFilePath, encrypted);
};

export async function httpFetchRawResponse(
    url: string | URL,
    options: THttpOptions = {},
    // redirectCounter = 0,
    locale = tryCatchSync(() => diMainGet("store")?.getState()?.i18n?.locale, filename_) || "en-US",
): Promise<THttpResponse> {

    url = new URL(url);
    if (url.host.startsWith("apiapploans.org.edrlab.thoriumreader")) {
        const [, idGln, host] = url.host.split(".break.");

        debug("http fetch dilicom api app server ", idGln, url.toString());
        url.host = host;
    }

    options.headers = options.headers instanceof Headers
        ? options.headers
        : new Headers(options.headers || {});
    (options.headers as Headers).set("user-agent", "readium-desktop");
    (options.headers as Headers).set("accept-language", `${locale},en-US;q=0.7,en;q=0.5`);

    // Redirect now handled internally, see https://github.com/valeriangalliat/fetch-cookie/blob/master/CHANGELOG.md#200---2022-02-17
    //
    // options.redirect = "manual"; // handle cookies

    // https://github.com/node-fetch/node-fetch#custom-agent
    // httpAgent doesn't works // err: Protocol "http:" not supported. Expected "https:
    // https://github.com/edrlab/thorium-reader/issues/1323#issuecomment-911772951
    const httpsAgent = new https.Agent({
        timeout: options.timeout || DEFAULT_HTTP_TIMEOUT,
        rejectUnauthorized: IS_DEV ? false : true,
    });
    const httpAgent = new http.Agent({
        timeout: options.timeout || DEFAULT_HTTP_TIMEOUT,
    });
    options.agent = (parsedURL: URL) => {
        if (parsedURL.protocol === "http:") {
            return httpAgent;
        } else {
            return httpsAgent;
        }
    };

    // if (!options.agent && url.toString().startsWith("https:")) {
    //     const httpsAgent = new https.Agent({
    //         timeout: options.timeout || DEFAULT_HTTP_TIMEOUT,
    //         rejectUnauthorized: IS_DEV ? false : true,
    //     });
    //     options.agent = httpsAgent;
    // }
    options.timeout = options.timeout || DEFAULT_HTTP_TIMEOUT;

    options.maxRedirect = MAX_FOLLOW_REDIRECT;

    let timeSignal: AbortSignal | undefined;
    let timeout: NodeJS.Timeout | undefined;
    if (!options.signal) {
        timeSignal = timeoutSignal(options.timeout);
        options.signal = timeSignal;
        (options.signal as any).__abortReasonTimeout = true;
    } else if (options.abortController) {
        timeout = setTimeout(() => {
            timeout = undefined;
            if (options.abortController?.signal) {
                (options.abortController.signal as any).__abortReasonTimeout = true;
            }
            // normally implied: options.signal === options.abortController.signal (see downloader.ts)
            // ... but just in case another signal is configured:
            if (options.signal) {
                (options.signal as any).__abortReasonTimeout = true;
            }
            if (options.abortController && !options.abortController.signal?.aborted) {
                try {
                    options.abortController.abort();
                } catch {}
            }
        }, options.timeout);
    } else {
        // TODO: handle signal without our own downloader.ts AbortController?
        // (probably not needed as we control the full fetch lifecycle, there are no such occurences in our codebase)
        // const controller = new AbortController();
        // timeout = setTimeout(() => {
        //     timeout = undefined;
        //     if (controller?.signal) {
        //         (controller.signal as any).__abortReasonTimeout = true;
        //     }
        //     // propagate the timeout state to any other existing signal,
        //     // so we can test in the fetch catch() / promise rejection
        //     if (options.signal) {
        //         (options.signal as any).__abortReasonTimeout = true;
        //     }
        //     if (controller) {
        //         try {
        //             controller.abort(); // not bound to fetch, so does nothing!
        //         } catch {}
        //     }
        // }, options.timeout);
    }

    let response: Response;
    try {
        response = await fetchWithCookie(url.toString(), options);
    } finally {
        // FIXED in https://github.com/node-fetch/timeout-signal/releases/tag/v2.0.0
        // // module-level weakmap of timeouts,
        // // see https://github.com/node-fetch/timeout-signal/blob/main/index.js
        // if (timeSignal) {
        //     try {
        //         timeoutSignal.clear(timeSignal);
        //     } catch {}
        // }

        // our local, closure-level timeout
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
    }

    debug("fetch URL:", `${url}`);
    debug("Method", options.method);
    debug("Request headers :");
    debug(options.headers);
    debug("###");
    debug("OK: ", response.ok);
    debug("status code :", response.status);
    debug("status text :", response.statusText);

    // Redirect now handled internally, see https://github.com/valeriangalliat/fetch-cookie/blob/master/CHANGELOG.md#200---2022-02-17
    //
    // // manual Redirect to handle cookies
    // // https://github.com/node-fetch/node-fetch/blob/0d35ddbf7377a483332892d2b625ec8231fa6181/src/index.js#L129
    // if (isRedirect(response.status)) {

    //     const location = response.headers.get("Location");
    //     debug("Redirect", response.status, "to: ", location);

    //     if (location) {
    //         const locationUrl = resolve(response.url, location);

    //         if (redirectCounter > FOLLOW_REDIRECT_COUNTER) {
    //             throw new Error(`maximum redirect reached at: ${url}`);
    //         }

    //         if (
    //             response.status === 303 ||
    //             ((response.status === 301 || response.status === 302) && options.method === "POST")
    //         ) {
    //             options.method = "GET";
    //             options.body = undefined;
    //             if (options.headers) {
    //                 if (!(options.headers instanceof Headers)) {
    //                     options.headers = new Headers(options.headers);
    //                 }
    //                 (options.headers as Headers).delete("content-length");
    //             }
    //         }

    //         return await httpFetchRawResponse(locationUrl, options, redirectCounter + 1, locale);
    //     } else {
    //         debug("No location URL to redirect");
    //     }
    // }

    // ALTERNATIVELY, Promise.race()
    //
    // See: https://github.com/simonplend/how-to-cancel-an-http-request-in-node-js/blob/main/example-node-fetch.mjs
    //
    // import { setTimeout } from "node:timers/promises";
    // const cancelRequest = new AbortController();
    // const cancelTimeout = new AbortController();
    // const fetchWithCookieResponsePromise = async () => {
    //     try {
    //         // response
    //     } finally {
    //         cancelTimeout.abort();
    //     }
    // }
    // const timeoutPromise = async () => {
    //     try {
    //         await setTimeout(options.timeout, undefined, { signal: cancelTimeout.signal });
    //         cancelRequest.abort();
    //     } catch (_err) {
    //         return;
    //     }
    //     throw new Error(`HTTP fetch request timeout ${options.timeout}ms`);
    // };
    // return Promise.race([fetchWithCookieResponsePromise, timeoutPromise()]);
    return response;
}

const handleCallback =
    async <T = undefined>(res: IHttpGetResult<T>, callback: THttpGetCallback<T>) => {
        if (callback) {
            res = await Promise.resolve(callback(res));

            // remove for IPC sync
            res.body = undefined;
            res.response = undefined;
        }
        return res;
    };

export async function httpFetchFormattedResponse<TData = undefined>(
    url: string | URL,
    options?: THttpOptions,
    callback?: THttpGetCallback<TData>,
    locale?: string,
): Promise<IHttpGetResult<TData>> {

    let result: IHttpGetResult<TData> = {
        isFailure: true,
        isSuccess: false,
        url,
    };

    try {
        const response = await httpFetchRawResponse(url, options, locale);

        debug("Response headers :");
        debug({ ...response.headers.raw() });
        debug("###");

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
            // cookies: response.headers.get("Set-Cookie"),
        };
    } catch (err) {

        const errStr = err.toString();

        debug("### HTTP FETCH ERROR ###");
        debug(errStr);
        debug("url: ", url);
        debug("options: ", options);

        if (errStr.includes("timeout") || (options?.signal as any)?.__abortReasonTimeout) { // err.name === "FetchError"
            result = {
                isAbort: false,
                isNetworkError: true,
                isTimeout: true,
                isFailure: true,
                isSuccess: false,
                url,
                statusMessage: errStr,
            };
        } else if (err.name === "AbortError" || err instanceof AbortError) {
            result = {
                isAbort: true,
                isNetworkError: false,
                isTimeout: false,
                isFailure: true,
                isSuccess: false,
                url,
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

        debug("HTTP FAIL RESUlT");
        debug(result);
        debug("#################");

    } finally {
        result = await handleCallback(result, callback);
    }

    return result;
}

export const httpGetWithAuth =
    (enableAuth = true): typeof httpFetchFormattedResponse =>
        async (...arg) => {

            const [_url, _options, _callback, ..._arg] = arg;

            const options = _options || {};
            options.method = "get";

            // const response = await httpFetchFormattedResponse(
            //     _url,
            //     options,
            //     enableAuth ? undefined : _callback,
            //     ..._arg,
            // );

            if (enableAuth) {
                // response.statusCode === 401

                // enableAuth always activate on httpGet request
                // means that on each request the acessToken is returned and not only for the 401 http response
                // specific to 'librarySimplified' server implementation

                const url = _url instanceof URL ? _url : new URL(_url);

                const auth = await getAuthenticationToken(url, options.method.toUpperCase());

                if (
                    typeof auth === "object"
                    && auth.accessToken
                ) {
                    // We have an authentication token for this host.
                    // We should use it by default
                    // Because we won't always get a 401 response that will ask us to use it.
                    return httpGetUnauthorized(auth)(_url, options, _callback, ..._arg);
                }

                // return await handleCallback(response, _callback);
            }

            // return response;
            return httpFetchFormattedResponse(
                _url,
                options,
                _callback,
                ..._arg,
            );

        };

export const httpGet = httpGetWithAuth(true);

const httpGetUnauthorized =
    (auth: IOpdsAuthenticationToken, enableRefresh = true): typeof httpFetchFormattedResponse =>
        async (...arg) => {

            const [_url, _options, _callback, ..._arg] = arg;

            const url = _url instanceof URL ? _url : new URL(_url);
            const options = _options || {};

            const { accessToken, tokenType } = auth;

            options.headers = options.headers instanceof Headers
                ? options.headers
                : new Headers(options.headers || {});

            (options.headers as Headers).set("Authorization", httpSetHeaderAuthorization(tokenType || "Bearer", accessToken));

            const response = await httpGetWithAuth(false)(
                url,
                options,
                enableRefresh ? undefined : _callback,
                ..._arg,
            );

            // HTTP status code Bad Request?
            // this works, but may be a flase flag with some auth servers, so better do nothing
            // if (response.statusCode === 400) {
            //     // Most likely because of a incorrect Authorization header => server rejects (e.g. Basic vs. Digest switch in Calibre OPDS server)
            //     await deleteAuthenticationToken(url.host);
            //     (options.headers as Headers).delete("Authorization");
            //     const responseWithoutAuth = await httpGetWithAuth(
            //         false,
            //     )(url, options, _callback, ..._arg);
            //     return responseWithoutAuth || response;
            // }

            if (enableRefresh) {
                if (response.statusCode === 401) {
                    if (auth.refreshUrl && auth.refreshToken) {
                        const responseAfterRefresh = await httpGetUnauthorizedRefresh(
                            auth,
                        )(url, options, _callback, ..._arg);
                        return responseAfterRefresh || response;
                    } else {
                        // Most likely because of a wrong access token.
                        // In some cases the returned content won't launch a new authentication process
                        // It's safer to just delete the access token and start afresh now.
                        await deleteAuthenticationToken(url.host);
                        (options.headers as Headers).delete("Authorization");
                        const responseWithoutAuth = await httpGetWithAuth(
                            false,
                        )(url, options, _callback, ..._arg);
                        return responseWithoutAuth || response;
                    }
                } else {
                    return await handleCallback(response, _callback);
                }
            }
            return response;
        };

const httpGetUnauthorizedRefresh =
    (auth: IOpdsAuthenticationToken): typeof httpFetchFormattedResponse | undefined =>
        async (...arg) => {

            const { refreshToken, refreshUrl } = auth;
            const options: RequestInit = {};
            options.headers = options.headers instanceof Headers
                ? options.headers
                : new Headers(options.headers || {});
            (options.headers as Headers).set("Content-Type", "application/json");

            options.body = JSON.stringify({
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            });

            const httpPostResponse = await httpPost(refreshUrl, options);
            if (httpPostResponse.isSuccess) {
                const jsonDataResponse: any = await httpPostResponse.response.json();

                const newRefreshToken = typeof jsonDataResponse?.refresh_token === "string"
                    ? jsonDataResponse.refresh_token
                    : undefined;
                auth.refreshToken = newRefreshToken || auth.refreshToken;

                const newAccessToken = typeof jsonDataResponse?.access_token === "string"
                    ? jsonDataResponse.access_token
                    : undefined;
                auth.accessToken = newAccessToken || auth.accessToken;

                const httpGetResponse = await httpGetUnauthorized(auth, false)(...arg);

                if (httpGetResponse.statusCode !== 401) {

                    debug("authenticate with the new access_token");
                    debug("saved it into db");
                    await httpSetAuthenticationToken(auth);
                }
                return httpGetResponse;
            }

            return undefined;
        };

export const httpPost: typeof httpFetchFormattedResponse =
    async (...arg) => {

        let [, options] = arg;

        options = options || {};
        options.method = "post";
        arg[1] = options;

        // do not risk showing plaintext password in console / command line shell
        // debug("Body:");
        // debug(options.body);

        return httpFetchFormattedResponse(...arg);
    };
