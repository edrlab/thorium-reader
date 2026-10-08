import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import { after, before, test } from "node:test";

import { startBrokenOpdsServer } from "./server.mjs";

let server;

const request = (url, options = {}) => new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    const requestHandle = client.get(url, options, (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve({
            body: Buffer.concat(chunks).toString("utf8"),
            headers: response.headers,
            statusCode: response.statusCode,
        }));
    });
    requestHandle.on("error", reject);
});

before(async () => {
    server = await startBrokenOpdsServer({
        httpPort: 0,
        httpsPort: 0,
        log: () => undefined,
    });
});

after(async () => {
    await server.stop();
});

test("serves a valid OPDS 2 feed over HTTP", async () => {
    const result = await request(`${server.urls.http}/opds2`);

    assert.equal(result.statusCode, 200);
    assert.match(result.headers["content-type"], /^application\/opds\+json/);
    assert.equal(JSON.parse(result.body).metadata.title, "Thorium broken OPDS test catalog");
});

test("serves HTTPS when the private test CA is explicitly trusted", async () => {
    const result = await request(`${server.urls.https}/opds2`, {
        ca: server.caCertificate,
    });

    assert.equal(result.statusCode, 200);
    assert.equal(JSON.parse(result.body).publications.length, 1);
});

test("rejects the HTTPS certificate by default", async () => {
    await assert.rejects(
        request(`${server.urls.https}/opds2`),
        (error) => typeof error.code === "string" && error.code.length > 0,
    );
});

test("produces a real protocol error when HTTPS is attempted on the HTTP port", async () => {
    await assert.rejects(
        request(`https://${server.host}:${server.httpPort}/opds2`, {
            rejectUnauthorized: false,
        }),
    );
});

test("can reset a live connection", async () => {
    await assert.rejects(request(`${server.urls.http}/reset`));
});
