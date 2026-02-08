// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as express from "express";

import { mediaOverlayURLParam } from "@r2-shared-js/parser/epub";

import { URL_SIGNED_EXPIRY_QUERY_PARAM_NAME } from "./url-signed-expiry";

export const URL_PARAM_SESSION_INFO = "r2_SESSION_INFO";

// export const _lcpPass64 = "lcpPass64";
export const _pathBase64 = "pathBase64";
export const _asset = "asset";
export const _jsonPath = "jsonPath";
export const _urlEncoded = "urlEncoded";

export const _show = "show";
export const _authResponse = "authResponse";
export const _authRequest = "authRequest";
export const _authRefresh = "authRefresh";

export interface IRequestPayloadExtension extends express.Request {
    lcpPass64: string;
    pathBase64: string;
    asset: string;
    jsonPath: string;
    urlEncoded: string;
    [mediaOverlayURLParam]: string;
}

export interface IRequestQueryParams {
    show: string;
    canonical: string;
    authResponse: string;
    authRequest: string;
    authRefresh: string;
    [mediaOverlayURLParam]: string;
    [URL_PARAM_SESSION_INFO]: string;
    [URL_SIGNED_EXPIRY_QUERY_PARAM_NAME]: string;

    // express.Request.query is the return type of qs.parse by default
    // (https://expressjs.com/en/api.html#app-settings-property).
    // export interface Query { [key: string]: string | string[] | Query | Query[]; }
    [key: string]: string;
}
