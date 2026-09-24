// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";

import { AUTHENTICATION_TYPE, CLIENT_ID, REDIRECT_URI, createCodeChallenge, startPkceTestServer } from "./server.mjs";

let app;

before(async () => {
    app = await startPkceTestServer({ port: 0 });
});

after(async () => {
    await app.close();
});

function newPkceTransaction() {
    const verifier = randomBytes(32).toString("base64url");
    return {
        challenge: createCodeChallenge(verifier),
        state: randomBytes(32).toString("base64url"),
        verifier,
    };
}

function authorizationParams(transaction) {
    return new URLSearchParams({
        response_type: "code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code_challenge: transaction.challenge,
        code_challenge_method: "S256",
        state: transaction.state,
    });
}

async function authorize(transaction, decision = "approve") {
    const params = authorizationParams(transaction);
    const pageResponse = await fetch(`${app.origin}/authorize?${params}`);
    assert.equal(pageResponse.status, 200);
    assert.match(await pageResponse.text(), /Authorize the PKCE test client/);

    params.set("decision", decision);
    const response = await fetch(`${app.origin}/authorize`, {
        body: params,
        method: "POST",
        redirect: "manual",
    });
    assert.equal(response.status, 303);
    return new URL(response.headers.get("location"));
}

function exchangeCode(code, verifier, extra = {}) {
    return fetch(`${app.origin}/token`, {
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            client_id: CLIENT_ID,
            code_verifier: verifier,
            ...extra,
        }),
        method: "POST",
    });
}

test("advertises only the proposed OPDS PKCE fields", async () => {
    const response = await fetch(`${app.origin}/opds/v2/catalog`);
    assert.equal(response.status, 401);
    assert.match(response.headers.get("content-type"), /^application\/opds-authentication\+json/);

    const document = await response.json();
    assert.deepEqual(Object.keys(document.authentication[0]).sort(), ["links", "type"]);
    assert.equal(document.authentication[0].type, AUTHENTICATION_TYPE);
    assert.deepEqual(document.authentication[0].links, [
        { rel: "authenticate", href: `${app.origin}/authorize` },
        { rel: "refresh", href: `${app.origin}/token` },
    ]);

    for (const removedPath of ["/.well-known/oauth-authorization-server", "/health", "/publication.txt"]) {
        assert.equal((await fetch(`${app.origin}${removedPath}`)).status, 404);
    }
});

test("requires the fixed client, redirect URI, and S256", async () => {
    const transaction = newPkceTransaction();
    const params = authorizationParams(transaction);

    params.set("client_id", "other-client");
    assert.equal((await fetch(`${app.origin}/authorize?${params}`)).status, 400);
    params.set("client_id", CLIENT_ID);

    params.set("redirect_uri", "https://attacker.example/callback");
    assert.equal((await fetch(`${app.origin}/authorize?${params}`)).status, 400);
    params.set("redirect_uri", REDIRECT_URI);

    params.set("code_challenge_method", "plain");
    assert.equal((await fetch(`${app.origin}/authorize?${params}`)).status, 400);
});

test("returns denial with the original state", async () => {
    const transaction = newPkceTransaction();
    const callback = await authorize(transaction, "deny");
    assert.equal(callback.protocol, "opds:");
    assert.equal(callback.searchParams.get("error"), "access_denied");
    assert.equal(callback.searchParams.get("state"), transaction.state);
    assert.equal(callback.searchParams.has("iss"), false);
});

test("invalidates a code after failed PKCE verification", async () => {
    const transaction = newPkceTransaction();
    const code = (await authorize(transaction)).searchParams.get("code");
    assert.ok(code);

    const wrongVerifier = randomBytes(32).toString("base64url");
    assert.equal((await exchangeCode(code, wrongVerifier)).status, 400);
    assert.equal((await exchangeCode(code, transaction.verifier)).status, 400);
});

test("exchanges a code, protects the catalog, and refreshes at the same endpoint", async () => {
    const transaction = newPkceTransaction();
    const callback = await authorize(transaction);
    const code = callback.searchParams.get("code");
    assert.ok(code);
    assert.equal(callback.searchParams.get("state"), transaction.state);
    assert.deepEqual([...callback.searchParams.keys()].sort(), ["code", "state"]);

    const secretResponse = await exchangeCode(code, transaction.verifier, { client_secret: "secret" });
    assert.equal(secretResponse.status, 401);

    const retryTransaction = newPkceTransaction();
    const retryCode = (await authorize(retryTransaction)).searchParams.get("code");
    assert.ok(retryCode);
    const tokenResponse = await exchangeCode(retryCode, retryTransaction.verifier);
    assert.equal(tokenResponse.status, 200);
    assert.match(tokenResponse.headers.get("cache-control"), /no-store/);
    const token = await tokenResponse.json();
    assert.ok(token.access_token);
    assert.ok(token.refresh_token);
    assert.equal(token.token_type, "Bearer");

    const catalogResponse = await fetch(`${app.origin}/opds/v2/catalog`, {
        headers: { Authorization: `Bearer ${token.access_token}` },
    });
    assert.equal(catalogResponse.status, 200);
    assert.match(catalogResponse.headers.get("content-type"), /^application\/opds\+json/);

    const refreshResponse = await fetch(`${app.origin}/token`, {
        body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: CLIENT_ID,
            refresh_token: token.refresh_token,
        }),
        method: "POST",
    });
    assert.equal(refreshResponse.status, 200);
    assert.ok((await refreshResponse.json()).access_token);
});
