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
    createOpdsPkceCodeChallenge,
    createOpdsPkceTokenRequest,
    createOpdsPkceTransaction,
    exchangeOpdsPkceAuthorizationCode,
    getSafeOpdsAuthUrlForLog,
    loadOpdsPkceAuthorizationServerMetadata,
    parseOpdsPkceTokenResponse,
    validateOpdsPkceCallback,
} from "readium-desktop/main/network/opdsPkce";
import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { TaJsonDeserialize } from "@r2-lcp-js/serializable";

const clientId = "http://opds-spec.org/auth/client";
const redirectUri = "opds://authorize/";

describe("OPDS Authorization Code + PKCE", () => {
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

    test("creates a public-client authorization request without exposing the verifier", () => {
        const transaction = createOpdsPkceTransaction(
            {
                authenticationDocumentId: "https://catalog.example/auth",
                authorizationUrl: "https://login.example/authorize?audience=opds",
                clientId,
                redirectUri,
                scope: "opds",
                tokenUrl: "https://login.example/token",
            },
            1000,
        );
        const url = new URL(transaction.authorizationRequestUrl);

        expect(transaction.codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(transaction.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(url.searchParams.get("audience")).toBe("opds");
        expect(url.searchParams.get("response_type")).toBe("code");
        expect(url.searchParams.get("client_id")).toBe(clientId);
        expect(url.searchParams.get("redirect_uri")).toBe(redirectUri);
        expect(url.searchParams.get("code_challenge_method")).toBe("S256");
        expect(url.searchParams.get("code_challenge")).toBe(createOpdsPkceCodeChallenge(transaction.codeVerifier));
        expect(transaction.authorizationRequestUrl).not.toContain(transaction.codeVerifier);
        expect(() =>
            createOpdsPkceTransaction({
                authorizationUrl: "http://login.example/authorize",
                clientId,
                redirectUri,
                tokenUrl: "http://login.example/token",
            }),
        ).toThrow(/HTTPS/);
    });

    test("binds authorization and token endpoints to validated issuer metadata", async () => {
        const metadataUrl = "https://login.example/.well-known/oauth-authorization-server";
        const metadataDocument = {
            issuer: "https://login.example",
            authorization_endpoint: "https://login.example/authorize",
            token_endpoint: "https://login.example/token",
            authorization_response_iss_parameter_supported: true,
            code_challenge_methods_supported: ["S256"],
        };
        const configuration = {
            authorizationServerMetadataUrl: metadataUrl,
            expectedAuthorizationUrl: metadataDocument.authorization_endpoint,
            expectedIssuer: metadataDocument.issuer,
            expectedTokenUrl: metadataDocument.token_endpoint,
        };

        await expect(
            loadOpdsPkceAuthorizationServerMetadata(configuration, async (url) => {
                expect(url).toBe(metadataUrl);
                return metadataDocument;
            }),
        ).resolves.toEqual({
            authorizationEndpoint: metadataDocument.authorization_endpoint,
            issuer: metadataDocument.issuer,
            tokenEndpoint: metadataDocument.token_endpoint,
        });
        await expect(
            loadOpdsPkceAuthorizationServerMetadata(
                { ...configuration, expectedTokenUrl: "https://attacker.example/token" },
                async () => metadataDocument,
            ),
        ).rejects.toThrow(/does not match/);
        await expect(
            loadOpdsPkceAuthorizationServerMetadata(
                { ...configuration, authorizationServerMetadataUrl: "https://attacker.example/metadata" },
                async () => metadataDocument,
            ),
        ).rejects.toThrow(/same origin/);
        await expect(
            loadOpdsPkceAuthorizationServerMetadata(configuration, async () => ({
                ...metadataDocument,
                authorization_response_iss_parameter_supported: false,
            })),
        ).rejects.toThrow(/iss parameter/);
    });

    test("validates state, document identity, issuer, errors, and expiry", () => {
        const transaction = createOpdsPkceTransaction(
            {
                authenticationDocumentId: "https://catalog.example/auth",
                authorizationUrl: "https://login.example/authorize",
                clientId,
                issuer: "https://login.example",
                redirectUri,
                tokenUrl: "https://login.example/token",
            },
            1000,
        );
        const validCallback: IOpdsPkceCallback = {
            code: "authorization-code",
            id: transaction.authenticationDocumentId,
            iss: transaction.issuer,
            state: transaction.state,
        };

        expect(validateOpdsPkceCallback(validCallback, transaction, 2000)).toBe("authorization-code");
        expect(() => validateOpdsPkceCallback({ ...validCallback, state: "wrong" }, transaction, 2000)).toThrow(
            /state/,
        );
        expect(() =>
            validateOpdsPkceCallback({ ...validCallback, id: "https://other.example/auth" }, transaction, 2000),
        ).toThrow(/identifier/);
        expect(() =>
            validateOpdsPkceCallback({ ...validCallback, iss: "https://other.example" }, transaction, 2000),
        ).toThrow(/issuer/);
        expect(() => validateOpdsPkceCallback({ ...validCallback, iss: undefined }, transaction, 2000)).toThrow(
            /expected issuer/,
        );
        expect(() =>
            validateOpdsPkceCallback(
                { error: "access_denied", iss: transaction.issuer, state: transaction.state },
                transaction,
                2000,
            ),
        ).toThrow(/access_denied/);
        expect(() => validateOpdsPkceCallback(validCallback, transaction, 5 * 60 * 1000 + 1001)).toThrow(/expired/);
    });

    test("builds the authorization-code token request and parses the token response", () => {
        const transaction = createOpdsPkceTransaction({
            authorizationUrl: "https://login.example/authorize",
            clientId,
            redirectUri,
            tokenUrl: "https://login.example/token",
        });
        const request = new URLSearchParams(createOpdsPkceTokenRequest(transaction, "code-value"));

        expect(request.get("grant_type")).toBe("authorization_code");
        expect(request.get("client_id")).toBe(clientId);
        expect(request.get("redirect_uri")).toBe(redirectUri);
        expect(request.get("code")).toBe("code-value");
        expect(request.get("code_verifier")).toBe(transaction.codeVerifier);
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
            expiresIn: 600,
            refreshToken: "refresh-token",
            scope: undefined,
            tokenType: "bearer",
        });
        expect(() => parseOpdsPkceTokenResponse({ error: "invalid_grant" })).toThrow(/invalid_grant/);
    });

    test("completes the flow against the real local authorization server", async () => {
        const serverPath = resolve(__dirname, "../../../projects/opds-pkce-test-server/server.mjs");
        const server = spawn(process.execPath, [serverPath, "0"], {
            env: {
                ...process.env,
                OPDS_PKCE_REDIRECT_URI: redirectUri,
            },
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
                    client_id: string;
                    authorization_server: string;
                    redirect_uri: string;
                    issuer: string;
                    scope: string;
                    links: Array<{ rel: string; href: string }>;
                }>;
            };
            const parsedAuthenticationDocument = TaJsonDeserialize(authenticationDocument, OPDSAuthenticationDoc);
            expect(parsedAuthenticationDocument.Authentication[0].AdditionalJSON.client_id).toBe(clientId);
            expect(
                parsedAuthenticationDocument.Authentication[0].Links.some((link) => link.Rel.includes("token")),
            ).toBe(true);
            const authentication = authenticationDocument.authentication[0];
            expect(authentication.type).toBe(OPDS_AUTHORIZATION_CODE_PKCE_TYPE);
            const authorizationUrl = authentication.links.find((link) => link.rel === "authenticate")?.href;
            const tokenUrl = authentication.links.find((link) => link.rel === "token")?.href;
            expect(authorizationUrl).toBeDefined();
            expect(tokenUrl).toBeDefined();

            const metadata = await loadOpdsPkceAuthorizationServerMetadata(
                {
                    authorizationServerMetadataUrl: authentication.authorization_server,
                    expectedAuthorizationUrl: authorizationUrl,
                    expectedIssuer: authentication.issuer,
                    expectedTokenUrl: tokenUrl,
                },
                async (metadataUrl) => {
                    const response = await fetch(metadataUrl);
                    expect(response.status).toBe(200);
                    return response.json();
                },
            );

            const transaction = createOpdsPkceTransaction({
                authenticationDocumentId: authenticationDocument.id,
                authorizationUrl: metadata.authorizationEndpoint,
                clientId: authentication.client_id,
                issuer: metadata.issuer,
                redirectUri: authentication.redirect_uri,
                scope: authentication.scope,
                tokenUrl: metadata.tokenEndpoint,
            });
            const authorizationPage = await fetch(transaction.authorizationRequestUrl);
            expect(authorizationPage.status).toBe(200);

            const authorizationParams = new URL(transaction.authorizationRequestUrl).searchParams;
            authorizationParams.set("decision", "approve");
            const authorizationResponse = await fetch(`${origin}/authorize`, {
                body: authorizationParams,
                method: "POST",
                redirect: "manual",
            });
            expect(authorizationResponse.status).toBe(303);
            const callbackUrl = new URL(authorizationResponse.headers.get("location"));
            expect(callbackUrl.searchParams.get("iss")).toBe(metadata.issuer);
            const callback = Object.fromEntries(callbackUrl.searchParams) as IOpdsPkceCallback;
            const token = await exchangeOpdsPkceAuthorizationCode(transaction, callback, async (url, body) => {
                const response = await fetch(url, {
                    body,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    method: "POST",
                });
                return response.json();
            });

            expect(token.accessToken).toBeTruthy();
            expect(token.refreshToken).toBeTruthy();
            const catalogResponse = await fetch(`${origin}/opds/v2/catalog`, {
                headers: {
                    Authorization: `Bearer ${token.accessToken}`,
                },
            });
            expect(catalogResponse.status).toBe(200);
            const catalog = (await catalogResponse.json()) as { metadata: { title: string } };
            expect(catalog.metadata.title).toBe("Thorium PKCE Test Catalog");
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
