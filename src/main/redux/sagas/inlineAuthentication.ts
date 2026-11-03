// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { authActions, historyActions, toastActions } from "readium-desktop/common/redux/actions";
import { ToastType } from "readium-desktop/common/models/toast";
import { getTranslator } from "readium-desktop/common/services/translator";
import { httpPost, httpSetAuthenticationToken, IOpdsAuthenticationToken } from "readium-desktop/main/network/http";
import { call as callTyped, put as putTyped } from "typed-redux-saga/macro";

import { browse } from "./api/browser/browse";
import { THttpGetBrowserResultView } from "readium-desktop/common/views/browser";

export function* submitInlineAuthentication(action: authActions.submit.TAction) {
    const { credentialsUrl, login, password, options } = action.payload;
    let failed = true;
    let result: THttpGetBrowserResultView | undefined;
    try {
        const url = new URL(credentialsUrl);
        if (url.protocol !== "https:" && url.protocol !== "http:") {
            throw new Error("Invalid credentials URL");
        }
        const authenticationType = options?.authenticationType || "http://opds-spec.org/auth/basic";
        if (authenticationType === "http://opds-spec.org/auth/basic") {
            yield* callTyped(httpSetAuthenticationToken, {
                opdsAuthenticationUrl: credentialsUrl,
                authenticateUrl: credentialsUrl,
                tokenType: "Basic",
                accessToken: Buffer.from(login + ":" + password).toString("base64"),
            });
            const response = yield* callTyped(browse, credentialsUrl);
            if (!response.isSuccess) {
                throw new Error("Authentication rejected");
            }
            result = response;
        } else if (authenticationType === "http://opds-spec.org/auth/local"
            || authenticationType === "http://opds-spec.org/auth/oauth/password") {
            const endpoint = new URL(options.oauthUrl);
            if (endpoint.protocol !== "https:" && endpoint.protocol !== "http:") {
                throw new Error("Invalid authentication endpoint");
            }
            const body = new URLSearchParams({ username: login, password });
            if (authenticationType === "http://opds-spec.org/auth/oauth/password") {
                body.set("grant_type", "password");
            }
            const response = yield* callTyped(() => httpPost<IOpdsAuthenticationToken>(endpoint.toString(), {
                body: body.toString(), headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }, async result => {
                if (result.isSuccess) {
                    const token = await result.response.json() as { access_token?: string; refresh_token?: string; token_type?: string };
                    if (token && typeof token.access_token === "string" && token.access_token) {
                        const tokenType = typeof token.token_type === "string" && token.token_type ? token.token_type : "Bearer";
                        result.data = {
                            accessToken: token.access_token,
                            refreshToken: typeof token.refresh_token === "string" ? token.refresh_token : undefined,
                            tokenType: tokenType.charAt(0).toUpperCase() + tokenType.slice(1),
                        };
                    }
                }
                return result;
            }));
            if (!response.isSuccess || !response.data?.accessToken) {
                throw new Error("Authentication rejected");
            }
            yield* callTyped(httpSetAuthenticationToken, {
                ...response.data,
                id: options.authenticationId,
                opdsAuthenticationUrl: credentialsUrl,
                authenticateUrl: endpoint.toString(),
                refreshUrl: options.oauthRefreshUrl,
            });
        } else {
            throw new Error("Unsupported inline authentication method");
        }
        failed = false;
    } catch {
        yield* putTyped(toastActions.openRequest.build(ToastType.Error,
            getTranslator().translate("message.notifications.authenticationFailed")));
    } finally {
        yield* putTyped(authActions.submitted.build(credentialsUrl, failed, result));
    }
    if (!failed) {
        yield* putTyped(historyActions.refresh.build());
    }
}
