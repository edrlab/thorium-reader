// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    createHash,
    randomBytes,
    timingSafeEqual,
} from "node:crypto";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const AUTHENTICATION_TYPE = "http://opds-spec.org/auth/oauth/authorization-code-pkce";

const DEFAULT_CLIENT_ID = "http://opds-spec.org/auth/client";
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 49152;
const DEFAULT_REDIRECT_URI = "opds://authorize/";
const AUTHORIZATION_CODE_TTL_MS = 2 * 60 * 1000;
const ACCESS_TOKEN_TTL_SECONDS = 10 * 60;
const REFRESH_TOKEN_TTL_MS = 60 * 60 * 1000;
const MAX_FORM_BODY_BYTES = 16 * 1024;

function base64Url(buffer) {
    return buffer.toString("base64url");
}

export function createCodeChallenge(codeVerifier) {
    return base64Url(createHash("sha256").update(codeVerifier, "ascii").digest());
}

function randomToken(byteLength = 32) {
    return base64Url(randomBytes(byteLength));
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
        ...headers,
    });
    response.end(body);
}

function sendHtml(response, statusCode, body) {
    response.writeHead(statusCode, {
        "Cache-Control": "no-store",
        "Content-Length": Buffer.byteLength(body),
        "Content-Security-Policy": "default-src 'none'; form-action 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
    });
    response.end(body);
}

function sendOAuthError(response, statusCode, error, errorDescription) {
    sendJson(response, statusCode, {
        error,
        error_description: errorDescription,
    });
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

function redirectUriWithParams(redirectUri, params) {
    const url = new URL(redirectUri);
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
            url.searchParams.set(key, value);
        }
    }
    return url.toString();
}

function authorizeRequestError(params, config) {
    if (params.get("response_type") !== "code") {
        return "response_type must be code";
    }
    if (params.get("client_id") !== config.clientId) {
        return "client_id is missing or unsupported";
    }
    if (params.get("redirect_uri") !== config.redirectUri) {
        return "redirect_uri is missing or unsupported";
    }
    if (!params.get("state")) {
        return "state is required by this test server";
    }
    if (params.get("code_challenge_method") !== "S256") {
        return "code_challenge_method must be S256";
    }
    if (!/^[A-Za-z0-9_-]{43}$/.test(params.get("code_challenge") || "")) {
        return "code_challenge must be a 43-character base64url SHA-256 value";
    }

    return undefined;
}

function authorizationPage(params) {
    const hiddenFields = [
        "response_type",
        "client_id",
        "redirect_uri",
        "scope",
        "state",
        "code_challenge",
        "code_challenge_method",
    ].map((name) => `<input type="hidden" name="${name}" value="${escapeHtml(params.get(name) || "")}">`).join("\n");

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Thorium OPDS PKCE test authorization</title>
    <style>
        body { background: #f4f4f4; color: #222; font: 16px/1.5 system-ui, sans-serif; margin: 0; }
        main { background: white; border-radius: 0.5rem; box-shadow: 0 0.25rem 1rem #0002; margin: 10vh auto; max-width: 38rem; padding: 2rem; }
        code { overflow-wrap: anywhere; }
        .actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
        button { border: 0; border-radius: 0.3rem; cursor: pointer; font: inherit; padding: 0.65rem 1rem; }
        button[value="approve"] { background: #176b3a; color: white; }
        button[value="deny"] { background: #ddd; color: #222; }
    </style>
</head>
<body>
<main>
    <h1>Authorize the PKCE test client?</h1>
    <p>This local development server does not ask for real credentials.</p>
    <dl>
        <dt>Client</dt><dd><code>${escapeHtml(params.get("client_id"))}</code></dd>
        <dt>Scope</dt><dd><code>${escapeHtml(params.get("scope") || "opds")}</code></dd>
        <dt>Redirect</dt><dd><code>${escapeHtml(params.get("redirect_uri"))}</code></dd>
    </dl>
    <form method="post" action="/authorize">
        ${hiddenFields}
        <div class="actions">
            <button type="submit" name="decision" value="approve">Authorize</button>
            <button type="submit" name="decision" value="deny">Deny</button>
        </div>
    </form>
</main>
</body>
</html>`;
}

function indexPage(origin, config) {
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>OPDS PKCE test server</title>
    <style>body { font: 16px/1.5 system-ui, sans-serif; margin: 2rem auto; max-width: 52rem; padding: 0 1rem; } code { overflow-wrap: anywhere; }</style>
</head>
<body>
    <h1>OPDS Authorization Code + PKCE test server</h1>
    <p>Add this protected catalog to the client under test:</p>
    <p><code>${escapeHtml(`${origin}/opds/v2/catalog`)}</code></p>
    <ul>
        <li><a href="/auth">OPDS Authentication Document</a></li>
        <li><a href="/.well-known/oauth-authorization-server">OAuth Authorization Server Metadata</a></li>
        <li><a href="/health">Health and in-memory object counts</a></li>
    </ul>
    <p>Expected client ID: <code>${escapeHtml(config.clientId)}</code></p>
    <p>Expected redirect URI: <code>${escapeHtml(config.redirectUri)}</code></p>
</body>
</html>`;
}

function getBearerToken(request) {
    const authorization = request.headers.authorization || "";
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    return match?.[1];
}

export function createPkceTestServer(options = {}) {
    const config = {
        clientId: options.clientId || DEFAULT_CLIENT_ID,
        host: options.host || DEFAULT_HOST,
        port: options.port ?? DEFAULT_PORT,
        redirectUri: options.redirectUri || DEFAULT_REDIRECT_URI,
    };
    const authorizationCodes = new Map();
    const accessTokens = new Map();
    const refreshTokens = new Map();
    let server;

    const getOrigin = () => {
        const address = server.address();
        if (!address || typeof address === "string") {
            throw new Error("PKCE test server is not listening");
        }
        return `http://${config.host}:${address.port}`;
    };

    const pruneExpiredValues = () => {
        const now = Date.now();
        for (const [code, record] of authorizationCodes) {
            if (record.expiresAt <= now) {
                authorizationCodes.delete(code);
            }
        }
        for (const [token, record] of accessTokens) {
            if (record.expiresAt <= now) {
                accessTokens.delete(token);
            }
        }
        for (const [token, record] of refreshTokens) {
            if (record.expiresAt <= now) {
                refreshTokens.delete(token);
            }
        }
    };

    const authenticationDocument = () => {
        const origin = getOrigin();
        return {
            id: `${origin}/auth`,
            title: "Thorium PKCE Test Catalog",
            description: "Local test service for the OAuth 2.0 Authorization Code flow with PKCE.",
            authentication: [
                {
                    type: AUTHENTICATION_TYPE,
                    links: [
                        {
                            rel: "authenticate",
                            href: `${origin}/authorize`,
                            type: "text/html",
                        },
                        {
                            rel: "token",
                            href: `${origin}/token`,
                            type: "application/json",
                        },
                        {
                            rel: "refresh",
                            href: `${origin}/token`,
                            type: "application/json",
                        },
                    ],
                    authorization_server: `${origin}/.well-known/oauth-authorization-server`,
                    issuer: origin,
                    client_id: config.clientId,
                    redirect_uri: config.redirectUri,
                    scope: "opds",
                    code_challenge_methods_supported: ["S256"],
                },
            ],
            links: [
                {
                    rel: "help",
                    href: `${origin}/`,
                    type: "text/html",
                },
            ],
        };
    };

    const unauthorized = (response) => {
        const origin = getOrigin();
        sendJson(response, 401, authenticationDocument(), {
            "Content-Type": "application/opds-authentication+json; charset=utf-8",
            Link: `<${origin}/auth>; rel="http://opds-spec.org/auth/document"; type="application/opds-authentication+json"`,
            "WWW-Authenticate": "Bearer realm=\"Thorium PKCE Test Catalog\"",
        });
    };

    const authorizedTokenRecord = (request) => {
        const token = getBearerToken(request);
        if (!token) {
            return undefined;
        }
        const record = accessTokens.get(token);
        if (!record || record.expiresAt <= Date.now()) {
            accessTokens.delete(token);
            return undefined;
        }
        return record;
    };

    const issueTokens = (record) => {
        const accessToken = randomToken();
        const refreshToken = randomToken();
        const now = Date.now();
        const tokenRecord = {
            clientId: record.clientId,
            expiresAt: now + ACCESS_TOKEN_TTL_SECONDS * 1000,
            scope: record.scope,
            subject: "pkce-test-user",
        };
        accessTokens.set(accessToken, tokenRecord);
        refreshTokens.set(refreshToken, {
            ...tokenRecord,
            expiresAt: now + REFRESH_TOKEN_TTL_MS,
        });
        return {
            access_token: accessToken,
            expires_in: ACCESS_TOKEN_TTL_SECONDS,
            refresh_token: refreshToken,
            scope: record.scope,
            token_type: "Bearer",
        };
    };

    server = createServer(async (request, response) => {
        pruneExpiredValues();
        const origin = getOrigin();
        const url = new URL(request.url || "/", origin);

        try {
            if (request.method === "GET" && url.pathname === "/") {
                sendHtml(response, 200, indexPage(origin, config));
                return;
            }

            if (request.method === "GET" && url.pathname === "/health") {
                sendJson(response, 200, {
                    status: "ok",
                    active_authorization_codes: authorizationCodes.size,
                    active_access_tokens: accessTokens.size,
                    active_refresh_tokens: refreshTokens.size,
                });
                return;
            }

            if (request.method === "GET" && url.pathname === "/auth") {
                sendJson(response, 200, authenticationDocument(), {
                    "Content-Type": "application/opds-authentication+json; charset=utf-8",
                });
                return;
            }

            if (request.method === "GET" && url.pathname === "/.well-known/oauth-authorization-server") {
                sendJson(response, 200, {
                    issuer: origin,
                    authorization_endpoint: `${origin}/authorize`,
                    token_endpoint: `${origin}/token`,
                    response_types_supported: ["code"],
                    grant_types_supported: ["authorization_code", "refresh_token"],
                    token_endpoint_auth_methods_supported: ["none"],
                    code_challenge_methods_supported: ["S256"],
                    authorization_response_iss_parameter_supported: true,
                    scopes_supported: ["opds"],
                });
                return;
            }

            if (request.method === "GET" && url.pathname === "/authorize") {
                const validationError = authorizeRequestError(url.searchParams, config);
                if (validationError) {
                    sendOAuthError(response, 400, "invalid_request", validationError);
                    return;
                }
                sendHtml(response, 200, authorizationPage(url.searchParams));
                return;
            }

            if (request.method === "POST" && url.pathname === "/authorize") {
                const params = await readForm(request);
                const validationError = authorizeRequestError(params, config);
                if (validationError) {
                    sendOAuthError(response, 400, "invalid_request", validationError);
                    return;
                }

                if (params.get("decision") !== "approve") {
                    response.writeHead(303, {
                        "Cache-Control": "no-store",
                        Location: redirectUriWithParams(config.redirectUri, {
                            error: "access_denied",
                            error_description: "The test user denied the authorization request.",
                            iss: origin,
                            state: params.get("state"),
                        }),
                    });
                    response.end();
                    return;
                }

                const code = randomToken();
                authorizationCodes.set(code, {
                    challenge: params.get("code_challenge"),
                    clientId: config.clientId,
                    expiresAt: Date.now() + AUTHORIZATION_CODE_TTL_MS,
                    redirectUri: config.redirectUri,
                    scope: params.get("scope") || "opds",
                });
                response.writeHead(303, {
                    "Cache-Control": "no-store",
                    Location: redirectUriWithParams(config.redirectUri, {
                        code,
                        id: `${origin}/auth`,
                        iss: origin,
                        state: params.get("state"),
                    }),
                });
                response.end();
                return;
            }

            if (request.method === "POST" && url.pathname === "/token") {
                const params = await readForm(request);
                if (params.get("client_secret")) {
                    sendOAuthError(response, 401, "invalid_client", "This public-client test server does not accept a client_secret.");
                    return;
                }

                if (params.get("grant_type") === "authorization_code") {
                    const code = params.get("code") || "";
                    const record = authorizationCodes.get(code);
                    authorizationCodes.delete(code);

                    if (!record || record.expiresAt <= Date.now()) {
                        sendOAuthError(response, 400, "invalid_grant", "The authorization code is invalid, expired, or already used.");
                        return;
                    }
                    if (params.get("client_id") !== record.clientId || params.get("redirect_uri") !== record.redirectUri) {
                        sendOAuthError(response, 400, "invalid_grant", "The client_id or redirect_uri does not match the authorization request.");
                        return;
                    }

                    const verifier = params.get("code_verifier") || "";
                    if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) {
                        sendOAuthError(response, 400, "invalid_grant", "The code_verifier is malformed.");
                        return;
                    }
                    if (!constantTimeEqual(createCodeChallenge(verifier), record.challenge)) {
                        sendOAuthError(response, 400, "invalid_grant", "PKCE verification failed.");
                        return;
                    }

                    sendJson(response, 200, issueTokens(record));
                    return;
                }

                if (params.get("grant_type") === "refresh_token") {
                    const refreshToken = params.get("refresh_token") || "";
                    const record = refreshTokens.get(refreshToken);
                    if (!record || record.expiresAt <= Date.now() || params.get("client_id") !== record.clientId) {
                        refreshTokens.delete(refreshToken);
                        sendOAuthError(response, 400, "invalid_grant", "The refresh token is invalid or expired.");
                        return;
                    }

                    const accessToken = randomToken();
                    accessTokens.set(accessToken, {
                        ...record,
                        expiresAt: Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000,
                    });
                    sendJson(response, 200, {
                        access_token: accessToken,
                        expires_in: ACCESS_TOKEN_TTL_SECONDS,
                        scope: record.scope,
                        token_type: "Bearer",
                    });
                    return;
                }

                sendOAuthError(response, 400, "unsupported_grant_type", "Use authorization_code or refresh_token.");
                return;
            }

            if (request.method === "GET" && url.pathname === "/callback") {
                const outcome = url.searchParams.has("error") ? "Authorization denied" : "Authorization callback received";
                sendHtml(response, 200, `<!doctype html><html lang="en"><meta charset="utf-8"><title>${outcome}</title><body><h1>${outcome}</h1><p>You can close this browser tab.</p></body></html>`);
                return;
            }

            if (request.method === "GET" && url.pathname === "/opds/v2/catalog") {
                if (!authorizedTokenRecord(request)) {
                    unauthorized(response);
                    return;
                }

                sendJson(response, 200, {
                    metadata: {
                        title: "Thorium PKCE Test Catalog",
                        modified: new Date().toISOString(),
                        numberOfItems: 1,
                    },
                    links: [
                        {
                            rel: "self",
                            href: `${origin}/opds/v2/catalog`,
                            type: "application/opds+json",
                        },
                        {
                            rel: "start",
                            href: `${origin}/opds/v2/catalog`,
                            type: "application/opds+json",
                        },
                    ],
                    publications: [
                        {
                            metadata: {
                                identifier: "urn:thorium:pkce-test-publication",
                                title: "PKCE authentication succeeded",
                                modified: "2026-01-01T00:00:00Z",
                                language: "en",
                            },
                            links: [
                                {
                                    rel: "http://opds-spec.org/acquisition/open-access",
                                    href: `${origin}/publication.txt`,
                                    type: "text/plain",
                                },
                            ],
                        },
                    ],
                }, {
                    "Content-Type": "application/opds+json; charset=utf-8",
                });
                return;
            }

            if (request.method === "GET" && url.pathname === "/publication.txt") {
                if (!authorizedTokenRecord(request)) {
                    unauthorized(response);
                    return;
                }
                const body = "Thorium successfully used an access token obtained with Authorization Code + PKCE.\n";
                response.writeHead(200, {
                    "Cache-Control": "no-store",
                    "Content-Disposition": "attachment; filename=pkce-authentication-succeeded.txt",
                    "Content-Length": Buffer.byteLength(body),
                    "Content-Type": "text/plain; charset=utf-8",
                });
                response.end(body);
                return;
            }

            sendJson(response, 404, {
                error: "not_found",
            });
        } catch (error) {
            sendJson(response, error.message === "Form body is too large" ? 413 : 500, {
                error: "server_error",
                error_description: error.message,
            });
        }
    });

    const listen = () => new Promise((resolveListen, rejectListen) => {
        const onError = (error) => rejectListen(error);
        server.once("error", onError);
        server.listen(config.port, config.host, () => {
            server.off("error", onError);
            resolveListen();
        });
    });

    const close = () => new Promise((resolveClose, rejectClose) => {
        server.close((error) => {
            if (error) {
                rejectClose(error);
                return;
            }
            resolveClose();
        });
    });

    return {
        close,
        config,
        get origin() {
            return getOrigin();
        },
        listen,
        server,
    };
}

export async function startPkceTestServer(options = {}) {
    const app = createPkceTestServer(options);
    await app.listen();
    return app;
}

function installShutdownHandlers(app) {
    let closing = false;
    const shutdown = async (signal) => {
        if (closing) {
            return;
        }
        closing = true;
        console.log(`OPDS PKCE test server shutting down: ${signal}`);
        try {
            await app.close();
            process.exit(0);
        } catch (error) {
            console.error("OPDS PKCE test server shutdown failed", error);
            process.exit(1);
        }
    };
    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
    const cliPort = Number(process.argv[2]);
    const app = await startPkceTestServer({
        clientId: process.env.OPDS_PKCE_CLIENT_ID || DEFAULT_CLIENT_ID,
        host: DEFAULT_HOST,
        port: Number.isInteger(cliPort) && cliPort >= 0
            ? cliPort
            : Number(process.env.OPDS_PKCE_PORT) || DEFAULT_PORT,
        redirectUri: process.env.OPDS_PKCE_REDIRECT_URI || DEFAULT_REDIRECT_URI,
    });
    console.log(`OPDS PKCE test server: ${app.origin}/`);
    console.log(`Protected OPDS 2 catalog: ${app.origin}/opds/v2/catalog`);
    console.log(`Redirect URI: ${app.config.redirectUri}`);
    installShutdownHandlers(app);
}
