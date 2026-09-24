// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { createHash, randomBytes } from "node:crypto";

export const OPDS_AUTHORIZATION_CODE_PKCE_TYPE =
    "http://opds-spec.org/auth/oauth/authorization-code-pkce";
export const OPDS_OAUTH_CLIENT_ID = "http://opds-spec.org/auth/client";
export const OPDS_OAUTH_REDIRECT_URI = "opds://authorize/";

const PKCE_TRANSACTION_MAX_AGE_MS = 5 * 60 * 1000;
const PKCE_VERIFIER_REGEXP = /^[A-Za-z0-9\-._~]{43,128}$/;

function assertSecureOAuthEndpoint(value: string, name: string, allowInsecureLoopback: boolean): URL {
    const url = new URL(value);
    const isLoopbackHttp = url.protocol === "http:" &&
        (url.hostname === "localhost" || url.hostname === "[::1]" || /^127(?:\.\d{1,3}){3}$/.test(url.hostname));
    if (url.protocol !== "https:" && !(allowInsecureLoopback && isLoopbackHttp)) {
        const exception = allowInsecureLoopback ? ", except on a loopback address" : "";
        throw new Error(`The PKCE ${name} must use HTTPS${exception}.`);
    }
    return url;
}

export interface IOpdsPkceConfiguration {
    allowInsecureLoopback?: boolean;
    authorizationUrl: string;
    tokenUrl: string;
}

export interface IOpdsPkceTransaction extends IOpdsPkceConfiguration {
    authorizationRequestUrl: string;
    clientId: typeof OPDS_OAUTH_CLIENT_ID;
    codeVerifier: string;
    createdAt: number;
    redirectUri: typeof OPDS_OAUTH_REDIRECT_URI;
    state: string;
}

export interface IOpdsPkceCallback {
    code?: string;
    error?: string;
    error_description?: string;
    state?: string;
}

export interface IOpdsPkceTokenResponse {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
}

export type TOpdsPkceTokenPost = (url: string, body: string) => Promise<unknown>;

export function createOpdsPkceCodeChallenge(codeVerifier: string): string {
    if (!PKCE_VERIFIER_REGEXP.test(codeVerifier)) {
        throw new Error("The PKCE code verifier must contain 43 to 128 RFC 7636 unreserved characters.");
    }

    return createHash("sha256")
        .update(codeVerifier, "ascii")
        .digest("base64url");
}

export function createOpdsPkceTransaction(
    configuration: IOpdsPkceConfiguration,
    createdAt = Date.now(),
): IOpdsPkceTransaction {
    if (!configuration.authorizationUrl || !configuration.tokenUrl) {
        throw new Error("The PKCE authenticate and refresh links are required.");
    }

    const authorizationUrl = assertSecureOAuthEndpoint(
        configuration.authorizationUrl,
        "authorization endpoint",
        !!configuration.allowInsecureLoopback,
    );
    assertSecureOAuthEndpoint(
        configuration.tokenUrl,
        "token endpoint",
        !!configuration.allowInsecureLoopback,
    );

    const codeVerifier = randomBytes(32).toString("base64url");
    const state = randomBytes(32).toString("base64url");
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", OPDS_OAUTH_CLIENT_ID);
    authorizationUrl.searchParams.set("redirect_uri", OPDS_OAUTH_REDIRECT_URI);
    authorizationUrl.searchParams.set("code_challenge", createOpdsPkceCodeChallenge(codeVerifier));
    authorizationUrl.searchParams.set("code_challenge_method", "S256");
    authorizationUrl.searchParams.set("state", state);

    return {
        ...configuration,
        authorizationRequestUrl: authorizationUrl.toString(),
        clientId: OPDS_OAUTH_CLIENT_ID,
        codeVerifier,
        createdAt,
        redirectUri: OPDS_OAUTH_REDIRECT_URI,
        state,
    };
}

export function validateOpdsPkceCallback(
    callback: IOpdsPkceCallback,
    transaction: IOpdsPkceTransaction,
    now = Date.now(),
): string {
    if (now - transaction.createdAt > PKCE_TRANSACTION_MAX_AGE_MS) {
        throw new Error("The PKCE authorization transaction has expired.");
    }
    if (!callback.state || callback.state !== transaction.state) {
        throw new Error("The OAuth callback state does not match the PKCE transaction.");
    }
    if (callback.error) {
        const description = callback.error_description ? `: ${callback.error_description}` : "";
        throw new Error(`OAuth authorization failed (${callback.error})${description}`);
    }
    if (!callback.code) {
        throw new Error("The OAuth callback does not contain an authorization code.");
    }

    return callback.code;
}

export function createOpdsPkceTokenRequest(
    transaction: IOpdsPkceTransaction,
    authorizationCode: string,
): string {
    return new URLSearchParams({
        grant_type: "authorization_code",
        code: authorizationCode,
        redirect_uri: transaction.redirectUri,
        client_id: transaction.clientId,
        code_verifier: transaction.codeVerifier,
    }).toString();
}

export function createOpdsPkceRefreshTokenRequest(refreshToken: string, clientId = OPDS_OAUTH_CLIENT_ID): string {
    return new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
    }).toString();
}

export function parseOpdsPkceTokenResponse(value: unknown): IOpdsPkceTokenResponse {
    if (!value || typeof value !== "object") {
        throw new Error("The OAuth token endpoint returned an invalid response.");
    }

    const response = value as Record<string, unknown>;
    if (typeof response.error === "string") {
        const description = typeof response.error_description === "string"
            ? `: ${response.error_description}`
            : "";
        throw new Error(`OAuth token exchange failed (${response.error})${description}`);
    }
    if (typeof response.access_token !== "string" || !response.access_token) {
        throw new Error("The OAuth token endpoint did not return an access_token.");
    }

    return {
        accessToken: response.access_token,
        refreshToken: typeof response.refresh_token === "string" ? response.refresh_token : undefined,
        tokenType: typeof response.token_type === "string" && response.token_type
            ? response.token_type
            : "Bearer",
    };
}

export async function exchangeOpdsPkceAuthorizationCode(
    transaction: IOpdsPkceTransaction,
    callback: IOpdsPkceCallback,
    postToken: TOpdsPkceTokenPost,
): Promise<IOpdsPkceTokenResponse> {
    const authorizationCode = validateOpdsPkceCallback(callback, transaction);
    const response = await postToken(
        transaction.tokenUrl,
        createOpdsPkceTokenRequest(transaction, authorizationCode),
    );
    return parseOpdsPkceTokenResponse(response);
}
