// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const AUTHENTICATION_TYPE = "http://opds-spec.org/auth/oauth/authorization-code-pkce";
export const CLIENT_ID = "http://opds-spec.org/auth/client";
export const REDIRECT_URI = "opds://authorize/";

const HOST = "127.0.0.1";
const DEFAULT_PORT = 49152;
const AUTHORIZATION_CODE_TTL_MS = 2 * 60 * 1000;
const ACCESS_TOKEN_TTL_MS = 10 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 60 * 60 * 1000;
const MAX_FORM_BODY_BYTES = 16 * 1024;
const PKCE_VERIFIER_REGEXP = /^[A-Za-z0-9\-._~]{43,128}$/;

function randomToken() {
    return randomBytes(32).toString("base64url");
}

export function createCodeChallenge(codeVerifier) {
    return createHash("sha256").update(codeVerifier, "ascii").digest("base64url");
}

function constantTimeEqual(left, right) {
    const leftBuffer = Buffer.from(left, "ascii");
    const rightBuffer = Buffer.from(right, "ascii");
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function sendJson(response, statusCode, value, headers = {}) {
    const body = `${JSON.stringify(value, undefined, 2)}\n`;
    response.writeHead(statusCode, {
        "Cache-Control": "no-store",
        "Content-Length": Buffer.byteLength(body),
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        ...headers,
    });
    response.end(body);
}

function sendOAuthError(response, statusCode, error, errorDescription) {
    sendJson(response, statusCode, {
        error,
        error_description: errorDescription,
    });
}

function sendHtml(response, body) {
    response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Length": Buffer.byteLength(body),
        "Content-Security-Policy":
            "default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
    });
    response.end(body);
}

async function readForm(request) {
    let body = "";
    let byteLength = 0;
    for await (const chunk of request) {
        byteLength += chunk.length;
        if (byteLength > MAX_FORM_BODY_BYTES) {
            throw new Error("Form body is too large");
        }
        body += chunk.toString("utf8");
    }
    return new URLSearchParams(body);
}

function redirectUriWithParams(params) {
    const url = new URL(REDIRECT_URI);
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, value);
        }
    }
    return url.toString();
}

function authorizationRequestError(params) {
    if (params.get("response_type") !== "code") {
        return "response_type must be code";
    }
    if (params.get("client_id") !== CLIENT_ID) {
        return "client_id is missing or unsupported";
    }
    if (params.get("redirect_uri") !== REDIRECT_URI) {
        return "redirect_uri is missing or unsupported";
    }
    if (!params.get("state")) {
        return "state is required";
    }
    if (params.get("code_challenge_method") !== "S256") {
        return "code_challenge_method must be S256";
    }
    if (!/^[A-Za-z0-9_-]{43}$/.test(params.get("code_challenge") || "")) {
        return "code_challenge must be a SHA-256 base64url value";
    }
    return undefined;
}

function authorizationPage(params) {
    const hiddenFields = [
        "response_type",
        "client_id",
        "redirect_uri",
        "state",
        "code_challenge",
        "code_challenge_method",
    ]
        .map((name) => `<input type="hidden" name="${name}" value="${escapeHtml(params.get(name) || "")}">`)
        .join("\n");

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>OPDS PKCE test authorization</title>
</head>
<body>
    <h1>Authorize the PKCE test client?</h1>
    <p>This local test server does not ask for credentials.</p>
    <form method="post" action="/authorize">
        ${hiddenFields}
        <button type="submit" name="decision" value="approve">Authorize</button>
        <button type="submit" name="decision" value="deny">Deny</button>
    </form>
</body>
</html>`;
}

function getBearerToken(request) {
    return /^Bearer\s+(.+)$/i.exec(request.headers.authorization || "")?.[1];
}

export function createPkceTestServer({ port = DEFAULT_PORT } = {}) {
    const authorizationCodes = new Map();
    const accessTokens = new Map();
    const refreshTokens = new Map();
    let server;

    const getOrigin = () => {
        const address = server.address();
        if (!address || typeof address === "string") {
            throw new Error("PKCE test server is not listening");
        }
        return `http://${HOST}:${address.port}`;
    };

    const authenticationDocument = () => ({
        id: `${getOrigin()}/auth`,
        title: "Thorium PKCE Test Catalog",
        authentication: [
            {
                type: AUTHENTICATION_TYPE,
                links: [
                    { rel: "authenticate", href: `${getOrigin()}/authorize` },
                    { rel: "refresh", href: `${getOrigin()}/token` },
                ],
            },
        ],
    });

    const pruneExpiredValues = () => {
        const now = Date.now();
        for (const values of [authorizationCodes, accessTokens, refreshTokens]) {
            for (const [key, value] of values) {
                const expiresAt = typeof value === "number" ? value : value.expiresAt;
                if (expiresAt <= now) {
                    values.delete(key);
                }
            }
        }
    };

    const unauthorized = (response) => {
        sendJson(response, 401, authenticationDocument(), {
            "Content-Type": "application/opds-authentication+json; charset=utf-8",
            Link: `<${getOrigin()}/auth>; rel="http://opds-spec.org/auth/document"; type="application/opds-authentication+json"`,
            "WWW-Authenticate": 'Bearer realm="Thorium PKCE Test Catalog"',
        });
    };

    const issueTokens = () => {
        const accessToken = randomToken();
        const refreshToken = randomToken();
        accessTokens.set(accessToken, Date.now() + ACCESS_TOKEN_TTL_MS);
        refreshTokens.set(refreshToken, Date.now() + REFRESH_TOKEN_TTL_MS);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: "Bearer",
        };
    };

    server = createServer(async (request, response) => {
        pruneExpiredValues();
        const origin = getOrigin();
        const url = new URL(request.url || "/", origin);

        try {
            if (request.method === "GET" && url.pathname === "/auth") {
                sendJson(response, 200, authenticationDocument(), {
                    "Content-Type": "application/opds-authentication+json; charset=utf-8",
                });
                return;
            }

            if (request.method === "GET" && url.pathname === "/authorize") {
                const error = authorizationRequestError(url.searchParams);
                if (error) {
                    sendOAuthError(response, 400, "invalid_request", error);
                    return;
                }
                sendHtml(response, authorizationPage(url.searchParams));
                return;
            }

            if (request.method === "POST" && url.pathname === "/authorize") {
                const params = await readForm(request);
                const error = authorizationRequestError(params);
                if (error) {
                    sendOAuthError(response, 400, "invalid_request", error);
                    return;
                }

                if (params.get("decision") !== "approve") {
                    response.writeHead(303, {
                        "Cache-Control": "no-store",
                        Location: redirectUriWithParams({
                            error: "access_denied",
                            error_description: "The test user denied the authorization request.",
                            state: params.get("state"),
                        }),
                    });
                    response.end();
                    return;
                }

                const code = randomToken();
                authorizationCodes.set(code, {
                    challenge: params.get("code_challenge"),
                    expiresAt: Date.now() + AUTHORIZATION_CODE_TTL_MS,
                });
                response.writeHead(303, {
                    "Cache-Control": "no-store",
                    Location: redirectUriWithParams({ code, state: params.get("state") }),
                });
                response.end();
                return;
            }

            if (request.method === "POST" && url.pathname === "/token") {
                const params = await readForm(request);
                if (params.get("client_secret")) {
                    sendOAuthError(response, 401, "invalid_client", "The shared OPDS client does not use a secret.");
                    return;
                }

                if (params.get("grant_type") === "authorization_code") {
                    const code = params.get("code") || "";
                    const record = authorizationCodes.get(code);
                    authorizationCodes.delete(code);
                    if (!record || record.expiresAt <= Date.now()) {
                        sendOAuthError(response, 400, "invalid_grant", "The authorization code is invalid or expired.");
                        return;
                    }
                    if (params.get("client_id") !== CLIENT_ID || params.get("redirect_uri") !== REDIRECT_URI) {
                        sendOAuthError(response, 400, "invalid_grant", "The client_id or redirect_uri does not match.");
                        return;
                    }
                    const verifier = params.get("code_verifier") || "";
                    if (
                        !PKCE_VERIFIER_REGEXP.test(verifier) ||
                        !constantTimeEqual(createCodeChallenge(verifier), record.challenge)
                    ) {
                        sendOAuthError(response, 400, "invalid_grant", "PKCE verification failed.");
                        return;
                    }
                    sendJson(response, 200, issueTokens());
                    return;
                }

                if (params.get("grant_type") === "refresh_token") {
                    const refreshToken = params.get("refresh_token") || "";
                    const expiresAt = refreshTokens.get(refreshToken);
                    if (!expiresAt || expiresAt <= Date.now() || params.get("client_id") !== CLIENT_ID) {
                        refreshTokens.delete(refreshToken);
                        sendOAuthError(response, 400, "invalid_grant", "The refresh token is invalid or expired.");
                        return;
                    }
                    const accessToken = randomToken();
                    accessTokens.set(accessToken, Date.now() + ACCESS_TOKEN_TTL_MS);
                    sendJson(response, 200, {
                        access_token: accessToken,
                        token_type: "Bearer",
                    });
                    return;
                }

                sendOAuthError(response, 400, "unsupported_grant_type", "Use authorization_code or refresh_token.");
                return;
            }

            if (request.method === "GET" && url.pathname === "/opds/v2/catalog") {
                const token = getBearerToken(request);
                const expiresAt = token ? accessTokens.get(token) : undefined;
                if (!expiresAt || expiresAt <= Date.now()) {
                    if (token) {
                        accessTokens.delete(token);
                    }
                    unauthorized(response);
                    return;
                }
                sendJson(
                    response,
                    200,
                    {
                        metadata: { title: "Thorium PKCE Test Catalog" },
                        links: [{ rel: "self", href: `${origin}/opds/v2/catalog`, type: "application/opds+json" }],
                    },
                    {
                        "Content-Type": "application/opds+json; charset=utf-8",
                    },
                );
                return;
            }

            sendJson(response, 404, { error: "not_found" });
        } catch (error) {
            if (!response.headersSent) {
                sendOAuthError(
                    response,
                    400,
                    "invalid_request",
                    error instanceof Error ? error.message : String(error),
                );
            } else {
                response.destroy(error instanceof Error ? error : new Error(String(error)));
            }
        }
    });

    return {
        listen: () =>
            new Promise((resolveListen, rejectListen) => {
                server.once("error", rejectListen);
                server.listen(port, HOST, () => {
                    server.off("error", rejectListen);
                    resolveListen({
                        close: () =>
                            new Promise((resolveClose, rejectClose) => {
                                server.close((error) => (error ? rejectClose(error) : resolveClose()));
                            }),
                        origin: getOrigin(),
                    });
                });
            }),
    };
}

export async function startPkceTestServer(options) {
    return createPkceTestServer(options).listen();
}

const directRun = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (directRun) {
    const port = process.argv[2] === undefined ? DEFAULT_PORT : Number.parseInt(process.argv[2], 10);
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
        throw new Error("The port must be an integer between 0 and 65535.");
    }
    const app = await startPkceTestServer({ port });
    process.stdout.write(`OPDS PKCE test server: ${app.origin}/opds/v2/catalog\n`);
}
