// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { createHash, randomBytes } from "node:crypto";

export const OPDS_AUTHORIZATION_CODE_PKCE_TYPE =
    "http://opds-spec.org/auth/oauth/authorization-code-pkce";
export const OPDS_AUTHORIZATION_CODE_TOKEN_REL =
    "http://opds-spec.org/auth/oauth/token";

const PKCE_TRANSACTION_MAX_AGE_MS = 5 * 60 * 1000;
const PKCE_VERIFIER_REGEXP = /^[A-Za-z0-9\-._~]{43,128}$/;

function assertSecureOAuthEndpoint(value: string, name: string): URL {
    const url = new URL(value);
    const isLoopbackHttp = url.protocol === "http:" &&
        (url.hostname === "localhost" || url.hostname === "[::1]" || /^127(?:\.\d{1,3}){3}$/.test(url.hostname));
    if (url.protocol !== "https:" && !isLoopbackHttp) {
        throw new Error(`The PKCE ${name} must use HTTPS, except on a loopback address.`);
    }
    return url;
}

export interface IOpdsPkceConfiguration {
    authenticationDocumentId?: string;
    authorizationUrl: string;
    clientId: string;
    redirectUri: string;
    scope?: string;
    tokenUrl: string;
    issuer?: string;
    application?: string;
    applicationVersion?: string;
}

export interface IOpdsPkceAuthorizationServerConfiguration {
    authorizationServerMetadataUrl: string;
    expectedAuthorizationUrl?: string;
    expectedIssuer: string;
    expectedTokenUrl?: string;
}

export interface IOpdsPkceAuthorizationServerMetadata {
    authorizationEndpoint: string;
    issuer: string;
    tokenEndpoint: string;
}

export interface IOpdsPkceTransaction extends IOpdsPkceConfiguration {
    authorizationRequestUrl: string;
    codeVerifier: string;
    createdAt: number;
    state: string;
}

export interface IOpdsPkceCallback {
    code?: string;
    error?: string;
    error_description?: string;
    id?: string;
    iss?: string;
    state?: string;
}

export interface IOpdsPkceTokenResponse {
    accessToken: string;
    expiresIn?: number;
    refreshToken?: string;
    scope?: string;
    tokenType: string;
}

export type TOpdsPkceTokenPost = (url: string, body: string) => Promise<unknown>;
export type TOpdsPkceMetadataGet = (url: string) => Promise<unknown>;

export function getSafeOpdsAuthUrlForLog(value: string): string {
    try {
        const url = new URL(value);
        if (url.protocol === "data:") {
            return "data:[redacted]";
        }
        return `${url.protocol}//${url.host}${url.pathname}`;
    } catch {
        return "[invalid URL]";
    }
}

function assertMatchingEndpoint(actual: URL, expected: string | undefined, name: string) {
    if (expected && actual.href !== assertSecureOAuthEndpoint(expected, name).href) {
        throw new Error(`The PKCE ${name} does not match the authorization server metadata.`);
    }
}

export async function loadOpdsPkceAuthorizationServerMetadata(
    configuration: IOpdsPkceAuthorizationServerConfiguration,
    getMetadata: TOpdsPkceMetadataGet,
): Promise<IOpdsPkceAuthorizationServerMetadata> {
    const metadataUrl = assertSecureOAuthEndpoint(
        configuration.authorizationServerMetadataUrl,
        "authorization server metadata URL",
    );
    const expectedIssuerUrl = assertSecureOAuthEndpoint(configuration.expectedIssuer, "issuer");
    if (expectedIssuerUrl.search || expectedIssuerUrl.hash) {
        throw new Error("The PKCE issuer must not contain a query or fragment.");
    }
    if (metadataUrl.origin !== expectedIssuerUrl.origin) {
        throw new Error("The PKCE authorization server metadata URL must have the same origin as the issuer.");
    }

    const value = await getMetadata(metadataUrl.href);
    if (!value || typeof value !== "object") {
        throw new Error("The OAuth authorization server returned invalid metadata.");
    }

    const metadata = value as Record<string, unknown>;
    if (typeof metadata.issuer !== "string" || metadata.issuer !== configuration.expectedIssuer) {
        throw new Error("The OAuth authorization server metadata issuer does not match.");
    }
    if (metadata.authorization_response_iss_parameter_supported !== true) {
        throw new Error("The OAuth authorization server must support the authorization response iss parameter.");
    }
    if (!Array.isArray(metadata.code_challenge_methods_supported) ||
        !metadata.code_challenge_methods_supported.includes("S256")) {
        throw new Error("The OAuth authorization server does not support PKCE S256.");
    }
    if (typeof metadata.authorization_endpoint !== "string" ||
        typeof metadata.token_endpoint !== "string") {
        throw new Error("The OAuth authorization server metadata is missing its endpoints.");
    }

    const authorizationEndpoint = assertSecureOAuthEndpoint(
        metadata.authorization_endpoint,
        "authorization endpoint",
    );
    const tokenEndpoint = assertSecureOAuthEndpoint(metadata.token_endpoint, "token endpoint");
    assertMatchingEndpoint(
        authorizationEndpoint,
        configuration.expectedAuthorizationUrl,
        "authorization endpoint",
    );
    assertMatchingEndpoint(tokenEndpoint, configuration.expectedTokenUrl, "token endpoint");

    return {
        authorizationEndpoint: authorizationEndpoint.href,
        issuer: metadata.issuer,
        tokenEndpoint: tokenEndpoint.href,
    };
}

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
        throw new Error("The PKCE authorization and token endpoints are required.");
    }
    if (!configuration.clientId || !configuration.redirectUri) {
        throw new Error("The PKCE client_id and redirect_uri are required.");
    }

    const authorizationUrl = assertSecureOAuthEndpoint(configuration.authorizationUrl, "authorization endpoint");
    assertSecureOAuthEndpoint(configuration.tokenUrl, "token endpoint");
    new URL(configuration.redirectUri);

    const codeVerifier = randomBytes(32).toString("base64url");
    const state = randomBytes(32).toString("base64url");
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", configuration.clientId);
    authorizationUrl.searchParams.set("redirect_uri", configuration.redirectUri);
    authorizationUrl.searchParams.set("code_challenge", createOpdsPkceCodeChallenge(codeVerifier));
    authorizationUrl.searchParams.set("code_challenge_method", "S256");
    authorizationUrl.searchParams.set("state", state);
    if (configuration.scope) {
        authorizationUrl.searchParams.set("scope", configuration.scope);
    }
    if (configuration.application) {
        authorizationUrl.searchParams.set("application", configuration.application);
    }
    if (configuration.applicationVersion) {
        authorizationUrl.searchParams.set("application_version", configuration.applicationVersion);
    }

    return {
        ...configuration,
        authorizationRequestUrl: authorizationUrl.toString(),
        codeVerifier,
        createdAt,
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
    if (transaction.issuer) {
        if (!callback.iss) {
            throw new Error("The OAuth callback does not contain the expected issuer.");
        }
        if (callback.iss !== transaction.issuer) {
            throw new Error("The OAuth callback issuer does not match.");
        }
    }
    if (callback.error) {
        const description = callback.error_description ? `: ${callback.error_description}` : "";
        throw new Error(`OAuth authorization failed (${callback.error})${description}`);
    }
    if (callback.id && transaction.authenticationDocumentId &&
        callback.id !== transaction.authenticationDocumentId) {
        throw new Error("The OAuth callback authentication document identifier does not match.");
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
        client_id: transaction.clientId,
        redirect_uri: transaction.redirectUri,
        code: authorizationCode,
        code_verifier: transaction.codeVerifier,
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
        expiresIn: typeof response.expires_in === "number" ? response.expires_in : undefined,
        refreshToken: typeof response.refresh_token === "string" ? response.refresh_token : undefined,
        scope: typeof response.scope === "string" ? response.scope : undefined,
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
