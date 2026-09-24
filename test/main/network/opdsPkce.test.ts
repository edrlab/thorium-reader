// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ChildProcess, spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";

import { describe, expect, test } from "@jest/globals";

import {
    IOpdsPkceCallback,
    OPDS_AUTHORIZATION_CODE_PKCE_TYPE,
    OPDS_OAUTH_CLIENT_ID,
    OPDS_OAUTH_REDIRECT_URI,
    createOpdsPkceCodeChallenge,
    createOpdsPkceRefreshTokenRequest,
    createOpdsPkceTokenRequest,
    createOpdsPkceTransaction,
    exchangeOpdsPkceAuthorizationCode,
    getSafeOpdsAuthUrlForLog,
    parseOpdsPkceTokenResponse,
    validateOpdsPkceCallback,
} from "readium-desktop/main/network/opdsPkce";
import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";

describe("OPDS Authorization Code with PKCE", () => {
    test("generates the RFC 7636 S256 reference challenge", () => {
        const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
        expect(createOpdsPkceCodeChallenge(verifier)).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
    });

    test("redacts OAuth parameters from logged URLs", () => {
        expect(
            getSafeOpdsAuthUrlForLog("opds://authorize/?code=authorization-code&state=state-value#access_token=token"),
        ).toBe("opds://authorize/");
        expect(getSafeOpdsAuthUrlForLog("data:text/html,secret-content")).toBe("data:[redacted]");
    });

    test("creates exactly the proposed shared-client authorization request", () => {
        const transaction = createOpdsPkceTransaction(
            {
                authorizationUrl: "https://login.example/authorize",
                tokenUrl: "https://login.example/token",
            },
            1000,
        );
        const url = new URL(transaction.authorizationRequestUrl);

        expect(transaction.codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(transaction.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(Object.fromEntries(url.searchParams)).toEqual({
            response_type: "code",
            client_id: OPDS_OAUTH_CLIENT_ID,
            redirect_uri: OPDS_OAUTH_REDIRECT_URI,
            code_challenge: createOpdsPkceCodeChallenge(transaction.codeVerifier),
            code_challenge_method: "S256",
            state: transaction.state,
        });
        expect(transaction.authorizationRequestUrl).not.toContain(transaction.codeVerifier);
        expect(() =>
            createOpdsPkceTransaction({
                authorizationUrl: "http://login.example/authorize",
                tokenUrl: "http://login.example/token",
            }),
        ).toThrow(/HTTPS/);
        expect(() =>
            createOpdsPkceTransaction({
                authorizationUrl: "http://127.0.0.1/authorize",
                tokenUrl: "http://127.0.0.1/token",
            }),
        ).toThrow(/HTTPS/);
        expect(() =>
            createOpdsPkceTransaction({
                allowInsecureLoopback: true,
                authorizationUrl: "http://127.0.0.1/authorize",
                tokenUrl: "http://127.0.0.1/token",
            }),
        ).not.toThrow();
        expect(() =>
            createOpdsPkceTransaction({
                authorizationUrl: "https://login.example/authorize",
                tokenUrl: "",
            }),
        ).toThrow(/links are required/);
    });

    test("validates callback state, errors, code, and transaction age", () => {
        const transaction = createOpdsPkceTransaction(
            {
                authorizationUrl: "https://login.example/authorize",
                tokenUrl: "https://login.example/token",
            },
            1000,
        );
        const validCallback: IOpdsPkceCallback = {
            code: "authorization-code",
            state: transaction.state,
        };

        expect(validateOpdsPkceCallback(validCallback, transaction, 2000)).toBe("authorization-code");
        expect(() => validateOpdsPkceCallback({ ...validCallback, state: "wrong" }, transaction, 2000)).toThrow(
            /state/,
        );
        expect(() => validateOpdsPkceCallback({ state: transaction.state }, transaction, 2000)).toThrow(/code/);
        expect(() =>
            validateOpdsPkceCallback(
                {
                    error: "access_denied",
                    state: transaction.state,
                },
                transaction,
                2000,
            ),
        ).toThrow(/access_denied/);
        expect(() => validateOpdsPkceCallback(validCallback, transaction, 5 * 60 * 1000 + 1001)).toThrow(/expired/);
    });

    test("builds the proposed token request and parses the token response", () => {
        const transaction = createOpdsPkceTransaction({
            authorizationUrl: "https://login.example/authorize",
            tokenUrl: "https://login.example/token",
        });
        const request = new URLSearchParams(createOpdsPkceTokenRequest(transaction, "code-value"));

        expect(Object.fromEntries(request)).toEqual({
            grant_type: "authorization_code",
            code: "code-value",
            redirect_uri: OPDS_OAUTH_REDIRECT_URI,
            client_id: OPDS_OAUTH_CLIENT_ID,
            code_verifier: transaction.codeVerifier,
        });
        expect(request.has("client_secret")).toBe(false);
        expect(
            parseOpdsPkceTokenResponse({
                access_token: "access-token",
                refresh_token: "refresh-token",
                token_type: "bearer",
                expires_in: 600,
            }),
        ).toEqual({
            accessToken: "access-token",
            refreshToken: "refresh-token",
            tokenType: "bearer",
        });
        expect(Object.fromEntries(new URLSearchParams(createOpdsPkceRefreshTokenRequest("refresh-token")))).toEqual({
            grant_type: "refresh_token",
            refresh_token: "refresh-token",
            client_id: OPDS_OAUTH_CLIENT_ID,
        });
        expect(() => parseOpdsPkceTokenResponse({ error: "invalid_grant" })).toThrow(/invalid_grant/);
    });

    test("completes the minimal flow against the local test server", async () => {
        const serverPath = resolve(__dirname, "../../../projects/opds-pkce-test-server/server.mjs");
        const server = spawn(process.execPath, [serverPath, "0"], {
            stdio: ["ignore", "pipe", "pipe"],
        });

        try {
            const origin = await waitForServerOrigin(server);
            const unauthorizedResponse = await fetch(`${origin}/opds/v2/catalog`);
            expect(unauthorizedResponse.status).toBe(401);
            const authenticationDocument = (await unauthorizedResponse.json()) as {
                id: string;
                authentication: Array<{
                    type: string;
                    links: Array<{ rel: string; href: string }>;
                }>;
            };
            const parsedDocument = TaJsonDeserialize(authenticationDocument, OPDSAuthenticationDoc);
            expect(parsedDocument.Authentication[0].Type).toBe(OPDS_AUTHORIZATION_CODE_PKCE_TYPE);
            expect(Object.keys(authenticationDocument.authentication[0]).sort()).toEqual(["links", "type"]);

            const authentication = authenticationDocument.authentication[0];
            const authorizationUrl = authentication.links.find((link) => link.rel === "authenticate")?.href;
            const tokenUrl = authentication.links.find((link) => link.rel === "refresh")?.href;
            expect(authorizationUrl).toBeDefined();
            expect(tokenUrl).toBeDefined();

            const transaction = createOpdsPkceTransaction({
                allowInsecureLoopback: true,
                authorizationUrl: authorizationUrl || "",
                tokenUrl: tokenUrl || "",
            });
            expect((await fetch(transaction.authorizationRequestUrl)).status).toBe(200);

            const authorizationParams = new URL(transaction.authorizationRequestUrl).searchParams;
            authorizationParams.set("decision", "approve");
            const authorizationResponse = await fetch(`${origin}/authorize`, {
                body: authorizationParams,
                method: "POST",
                redirect: "manual",
            });
            expect(authorizationResponse.status).toBe(303);
            const callbackUrl = new URL(authorizationResponse.headers.get("location"));
            expect([...callbackUrl.searchParams.keys()].sort()).toEqual(["code", "state"]);

            const callback = Object.fromEntries(callbackUrl.searchParams) as IOpdsPkceCallback;
            const token = await exchangeOpdsPkceAuthorizationCode(transaction, callback, async (url, body) => {
                const response = await fetch(url, {
                    body,
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    method: "POST",
                });
                return response.json();
            });
            expect(token.accessToken).toBeTruthy();
            expect(token.refreshToken).toBeTruthy();

            const catalogResponse = await fetch(`${origin}/opds/v2/catalog`, {
                headers: { Authorization: `Bearer ${token.accessToken}` },
            });
            expect(catalogResponse.status).toBe(200);
        } finally {
            await stopServer(server);
        }
    }, 15000);
});

function waitForServerOrigin(server: ChildProcess): Promise<string> {
    return new Promise((resolveOrigin, rejectOrigin) => {
        let stdout = "";
        let stderr = "";
        const timeout = setTimeout(() => {
            rejectOrigin(new Error(`Timed out waiting for the OPDS PKCE test server. ${stderr}`));
        }, 5000);

        server.stderr?.on("data", (chunk) => {
            stderr += chunk.toString();
        });
        server.stdout?.on("data", (chunk) => {
            stdout += chunk.toString();
            const match = /OPDS PKCE test server: (http:\/\/127\.0\.0\.1:\d+)\//.exec(stdout);
            if (match) {
                clearTimeout(timeout);
                resolveOrigin(match[1]);
            }
        });
        server.once("error", (error) => {
            clearTimeout(timeout);
            rejectOrigin(error);
        });
        server.once("exit", (code) => {
            if (!stdout.includes("OPDS PKCE test server:")) {
                clearTimeout(timeout);
                rejectOrigin(new Error(`OPDS PKCE test server exited with ${code}. ${stderr}`));
            }
        });
    });
}

async function stopServer(server: ChildProcess): Promise<void> {
    if (server.exitCode !== null || server.signalCode !== null) {
        return;
    }
    server.kill();
    await once(server, "exit");
}
