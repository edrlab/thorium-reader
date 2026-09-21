// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";

import {
    AUTHENTICATION_TYPE,
    TOKEN_ENDPOINT_REL,
    createCodeChallenge,
    startPkceTestServer,
} from "./server.mjs";

const clientId = "http://opds-spec.org/auth/client";
const redirectUri = "opds://authorize/";
let app;

before(async () => {
    app = await startPkceTestServer({
        clientId,
        port: 0,
        redirectUri,
    });
});

after(async () => {
    await app.close();
});

function newPkceTransaction() {
    const verifier = randomBytes(32).toString("base64url");
    return {
        challenge: createCodeChallenge(verifier),
        state: randomBytes(16).toString("base64url"),
        verifier,
    };
}

async function authorize(transaction, decision = "approve") {
    const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "opds",
        state: transaction.state,
        code_challenge: transaction.challenge,
        code_challenge_method: "S256",
    });
    const authorizeUrl = `${app.origin}/authorize?${params}`;
    const pageResponse = await fetch(authorizeUrl);
    assert.equal(pageResponse.status, 200);
    assert.match(await pageResponse.text(), /Authorize the PKCE test client/);

    params.set("decision", decision);
    const response = await fetch(`${app.origin}/authorize`, {
        body: params,
        method: "POST",
        redirect: "manual",
    });
    assert.equal(response.status, 303);
    const location = response.headers.get("location");
    assert.ok(location);
    return new URL(location);
}

async function exchangeCode(code, verifier) {
    return fetch(`${app.origin}/token`, {
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: clientId,
            redirect_uri: redirectUri,
            code,
            code_verifier: verifier,
        }),
        method: "POST",
    });
}

test("exposes the OPDS authentication document and OAuth metadata", async () => {
    const protectedResponse = await fetch(`${app.origin}/opds/v2/catalog`);
    assert.equal(protectedResponse.status, 401);
    assert.match(protectedResponse.headers.get("content-type"), /^application\/opds-authentication\+json/);
    assert.match(protectedResponse.headers.get("link"), /opds-spec\.org\/auth\/document/);

    const document = await protectedResponse.json();
    assert.equal(document.authentication[0].type, AUTHENTICATION_TYPE);
    assert.equal(document.authentication[0].client_id, clientId);
    assert.equal(document.authentication[0].redirect_uri, redirectUri);
    assert.deepEqual(document.authentication[0].code_challenge_methods_supported, ["S256"]);
    assert.equal(
        document.authentication[0].links.find((link) => link.rel === TOKEN_ENDPOINT_REL)?.href,
        `${app.origin}/token`,
    );

    const metadataResponse = await fetch(`${app.origin}/.well-known/oauth-authorization-server`);
    assert.equal(metadataResponse.status, 200);
    const metadata = await metadataResponse.json();
    assert.equal(metadata.issuer, app.origin);
    assert.equal(metadata.authorization_endpoint, `${app.origin}/authorize`);
    assert.equal(metadata.token_endpoint, `${app.origin}/token`);
    assert.equal(metadata.authorization_response_iss_parameter_supported, true);
    assert.deepEqual(metadata.code_challenge_methods_supported, ["S256"]);
});

test("rejects unsupported or malformed authorization requests", async () => {
    const response = await fetch(`${app.origin}/authorize?response_type=token`);
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, "invalid_request");
});

test("returns an OAuth access_denied callback", async () => {
    const transaction = newPkceTransaction();
    const callback = await authorize(transaction, "deny");
    assert.equal(callback.origin, "null");
    assert.equal(callback.protocol, "opds:");
    assert.equal(callback.searchParams.get("error"), "access_denied");
    assert.equal(callback.searchParams.get("iss"), app.origin);
    assert.equal(callback.searchParams.get("state"), transaction.state);
});

test("invalidates a code after a failed PKCE verification", async () => {
    const transaction = newPkceTransaction();
    const callback = await authorize(transaction);
    const code = callback.searchParams.get("code");
    assert.ok(code);

    const wrongVerifier = randomBytes(32).toString("base64url");
    const failedResponse = await exchangeCode(code, wrongVerifier);
    assert.equal(failedResponse.status, 400);
    assert.equal((await failedResponse.json()).error, "invalid_grant");

    const retryResponse = await exchangeCode(code, transaction.verifier);
    assert.equal(retryResponse.status, 400);
    assert.equal((await retryResponse.json()).error, "invalid_grant");
});

test("exchanges a valid code once and accepts the resulting bearer token", async () => {
    const transaction = newPkceTransaction();
    const callback = await authorize(transaction);
    const code = callback.searchParams.get("code");
    assert.ok(code);
    assert.equal(callback.searchParams.get("state"), transaction.state);
    assert.equal(callback.searchParams.get("id"), `${app.origin}/auth`);
    assert.equal(callback.searchParams.get("iss"), app.origin);

    const tokenResponse = await exchangeCode(code, transaction.verifier);
    assert.equal(tokenResponse.status, 200);
    assert.match(tokenResponse.headers.get("cache-control"), /no-store/);
    const tokenDocument = await tokenResponse.json();
    assert.equal(tokenDocument.token_type, "Bearer");
    assert.equal(tokenDocument.scope, "opds");
    assert.ok(tokenDocument.access_token);
    assert.ok(tokenDocument.refresh_token);

    const reuseResponse = await exchangeCode(code, transaction.verifier);
    assert.equal(reuseResponse.status, 400);
    assert.equal((await reuseResponse.json()).error, "invalid_grant");

    const catalogResponse = await fetch(`${app.origin}/opds/v2/catalog`, {
        headers: {
            Authorization: `Bearer ${tokenDocument.access_token}`,
        },
    });
    assert.equal(catalogResponse.status, 200);
    assert.match(catalogResponse.headers.get("content-type"), /^application\/opds\+json/);
    const catalog = await catalogResponse.json();
    assert.equal(catalog.metadata.title, "Thorium PKCE Test Catalog");
    assert.equal(catalog.publications[0].metadata.title, "PKCE authentication succeeded");

    const publicationResponse = await fetch(`${app.origin}/publication.txt`, {
        headers: {
            Authorization: `Bearer ${tokenDocument.access_token}`,
        },
    });
    assert.equal(publicationResponse.status, 200);
    assert.match(await publicationResponse.text(), /Authorization Code \+ PKCE/);

    const refreshResponse = await fetch(`${app.origin}/token`, {
        body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: clientId,
            refresh_token: tokenDocument.refresh_token,
        }),
        method: "POST",
    });
    assert.equal(refreshResponse.status, 200);
    assert.ok((await refreshResponse.json()).access_token);
});
