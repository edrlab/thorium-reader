import http from "node:http";
import https from "node:https";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import path from "node:path";

import selfsigned from "selfsigned";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_HTTP_PORT = 4873;
const DEFAULT_HTTPS_PORT = 4874;
const DEFAULT_TIMEOUT_MS = 90_000;

const OPDS_CONTENT_TYPE = "application/opds+json; charset=utf-8";

const listen = (server, port, host) => new Promise((resolve, reject) => {
    const onError = (error) => {
        server.off("listening", onListening);
        reject(error);
    };
    const onListening = () => {
        server.off("error", onError);
        resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
});

const close = (server) => new Promise((resolve, reject) => {
    if (!server.listening) {
        resolve();
        return;
    }

    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections?.();
});

const getPort = (server) => {
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Unable to determine the broken OPDS server port.");
    }
    return address.port;
};

const send = (response, statusCode, contentType, body, headers = {}) => {
    response.writeHead(statusCode, {
        "access-control-allow-origin": "*",
        "cache-control": "no-store",
        "content-type": contentType,
        ...headers,
    });
    response.end(body);
};

const createOpds2Feed = (baseUrl) => ({
    metadata: {
        title: "Thorium broken OPDS test catalog",
        modified: new Date(0).toISOString(),
        numberOfItems: 1,
    },
    links: [
        {
            rel: "self",
            href: `${baseUrl}/opds2`,
            type: "application/opds+json",
        },
    ],
    publications: [
        {
            metadata: {
                identifier: "urn:thorium:test:broken-opds",
                title: "Broken OPDS test publication",
                language: "en",
            },
            links: [
                {
                    rel: "http://opds-spec.org/acquisition",
                    href: `${baseUrl}/publication.epub`,
                    type: "application/epub+zip",
                },
            ],
        },
    ],
});

const createOpds1Feed = (baseUrl) => `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>urn:thorium:test:broken-opds</id>
  <title>Thorium broken OPDS test catalog</title>
  <updated>1970-01-01T00:00:00Z</updated>
  <link rel="self" href="${baseUrl}/opds1" type="application/atom+xml;profile=opds-catalog" />
  <entry>
    <id>urn:thorium:test:broken-opds:publication</id>
    <title>Broken OPDS test publication</title>
    <updated>1970-01-01T00:00:00Z</updated>
    <link rel="http://opds-spec.org/acquisition" href="${baseUrl}/publication.epub" type="application/epub+zip" />
  </entry>
</feed>`;

const createTestCertificates = async () => {
    const notBeforeDate = new Date(Date.now() - 60_000);
    const notAfterDate = new Date(Date.now() + (24 * 60 * 60 * 1000));
    const authority = await selfsigned.generate(
        [{ name: "commonName", value: "Thorium broken OPDS test CA" }],
        {
            algorithm: "sha256",
            notBeforeDate,
            notAfterDate,
            extensions: [
                { name: "basicConstraints", cA: true, critical: true },
                { name: "keyUsage", keyCertSign: true, cRLSign: true, critical: true },
            ],
        },
    );
    const server = await selfsigned.generate(
        [{ name: "commonName", value: "localhost" }],
        {
            algorithm: "sha256",
            notBeforeDate,
            notAfterDate,
            ca: {
                key: authority.private,
                cert: authority.cert,
            },
            extensions: [
                { name: "basicConstraints", cA: false, critical: true },
                {
                    name: "keyUsage",
                    digitalSignature: true,
                    keyEncipherment: true,
                    critical: true,
                },
                {
                    name: "subjectAltName",
                    altNames: [
                        { type: 2, value: "localhost" },
                        { type: 7, ip: "127.0.0.1" },
                        { type: 7, ip: "::1" },
                    ],
                },
            ],
        },
    );

    return {
        caCertificate: authority.cert,
        certificate: `${server.cert}\n${authority.cert}`,
        privateKey: server.private,
    };
};

const createRequestHandler = ({
    caCertificate,
    getHttpBaseUrl,
    log,
    protocol,
    timers,
}) => (request, response) => {
    const host = request.headers.host || "localhost";
    const baseUrl = `${protocol}://${host}`;
    const requestUrl = new URL(request.url || "/", baseUrl);

    log(`[${protocol.toUpperCase()}] ${request.method} ${requestUrl.pathname}${requestUrl.search}`);

    if (requestUrl.pathname === "/health") {
        send(response, 200, "application/json; charset=utf-8", JSON.stringify({ ok: true }));
        return;
    }

    if (requestUrl.pathname === "/__test-ca.pem") {
        send(response, 200, "application/x-pem-file", caCertificate);
        return;
    }

    if (requestUrl.pathname === "/opds2") {
        send(response, 200, OPDS_CONTENT_TYPE, JSON.stringify(createOpds2Feed(baseUrl), undefined, 2));
        return;
    }

    if (requestUrl.pathname === "/opds1") {
        send(
            response,
            200,
            "application/atom+xml;profile=opds-catalog; charset=utf-8",
            createOpds1Feed(baseUrl),
        );
        return;
    }

    if (requestUrl.pathname === "/malformed") {
        send(response, 200, OPDS_CONTENT_TYPE, "{ this is not valid JSON");
        return;
    }

    if (requestUrl.pathname === "/wrong-content-type") {
        send(response, 200, "text/plain; charset=utf-8", JSON.stringify(createOpds2Feed(baseUrl)));
        return;
    }

    if (requestUrl.pathname === "/empty") {
        response.writeHead(204, { "cache-control": "no-store" });
        response.end();
        return;
    }

    if (requestUrl.pathname === "/reset") {
        request.socket.destroy();
        return;
    }

    if (requestUrl.pathname === "/timeout") {
        const requestedDelayRaw = requestUrl.searchParams.get("ms");
        const requestedDelay = requestedDelayRaw === null ? Number.NaN : Number(requestedDelayRaw);
        const delay = Number.isFinite(requestedDelay) && requestedDelay >= 0
            ? requestedDelay
            : DEFAULT_TIMEOUT_MS;
        const timer = setTimeout(() => {
            timers.delete(timer);
            if (!response.destroyed) {
                send(response, 200, OPDS_CONTENT_TYPE, JSON.stringify(createOpds2Feed(baseUrl)));
            }
        }, delay);
        timers.add(timer);
        response.once("close", () => {
            clearTimeout(timer);
            timers.delete(timer);
        });
        return;
    }

    if (requestUrl.pathname === "/redirect-loop") {
        response.writeHead(302, { location: `${baseUrl}/redirect-loop` });
        response.end();
        return;
    }

    if (requestUrl.pathname === "/redirect-to-http") {
        response.writeHead(302, { location: `${getHttpBaseUrl()}/opds2` });
        response.end();
        return;
    }

    if (requestUrl.pathname.startsWith("/status/")) {
        const statusCode = Number(requestUrl.pathname.slice("/status/".length));
        const safeStatusCode = Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599
            ? statusCode
            : 500;
        send(
            response,
            safeStatusCode,
            "application/json; charset=utf-8",
            JSON.stringify({ error: `Intentional HTTP ${safeStatusCode}` }),
        );
        return;
    }

    send(response, 200, "application/json; charset=utf-8", JSON.stringify({
        name: "Thorium broken OPDS test server",
        endpoints: {
            validOpds2: "/opds2",
            validOpds1: "/opds1",
            malformedOpds2: "/malformed",
            wrongContentType: "/wrong-content-type",
            emptyResponse: "/empty",
            connectionReset: "/reset",
            delayedResponse: "/timeout?ms=90000",
            redirectLoop: "/redirect-loop",
            httpsToHttpRedirect: "/redirect-to-http",
            httpError: "/status/500",
            testCaCertificate: "/__test-ca.pem",
        },
    }, undefined, 2));
};

const trackSockets = (server, sockets) => {
    server.on("connection", (socket) => {
        sockets.add(socket);
        socket.once("close", () => sockets.delete(socket));
    });
};

export const startBrokenOpdsServer = async ({
    host = DEFAULT_HOST,
    httpPort = DEFAULT_HTTP_PORT,
    httpsPort = DEFAULT_HTTPS_PORT,
    log = console.log,
} = {}) => {
    const certificates = await createTestCertificates();
    const timers = new Set();
    const sockets = new Set();

    let actualHttpPort;
    const getHttpBaseUrl = () => `http://${host}:${actualHttpPort}`;
    const commonHandlerOptions = {
        caCertificate: certificates.caCertificate,
        getHttpBaseUrl,
        log,
        timers,
    };
    const httpServer = http.createServer(createRequestHandler({
        ...commonHandlerOptions,
        protocol: "http",
    }));
    const httpsServer = https.createServer(
        {
            cert: certificates.certificate,
            key: certificates.privateKey,
        },
        createRequestHandler({
            ...commonHandlerOptions,
            protocol: "https",
        }),
    );

    trackSockets(httpServer, sockets);
    trackSockets(httpsServer, sockets);

    httpServer.on("clientError", (error, socket) => {
        log(`[HTTP CLIENT ERROR] ${error.code || error.message}`);
        socket.destroy();
    });
    httpsServer.on("tlsClientError", (error) => {
        log(`[HTTPS TLS ERROR] ${error.code || error.message}`);
    });

    try {
        await listen(httpServer, httpPort, host);
        actualHttpPort = getPort(httpServer);
        await listen(httpsServer, httpsPort, host);
    } catch (error) {
        for (const socket of sockets) {
            socket.destroy();
        }
        await Promise.allSettled([close(httpServer), close(httpsServer)]);
        throw error;
    }

    const actualHttpsPort = getPort(httpsServer);
    let stopped = false;

    return {
        caCertificate: certificates.caCertificate,
        host,
        httpPort: actualHttpPort,
        httpsPort: actualHttpsPort,
        urls: {
            http: `http://${host}:${actualHttpPort}`,
            https: `https://${host}:${actualHttpsPort}`,
            opdsHttpFallback: `opds://${host}:${actualHttpPort}/opds2`,
            opdsInvalidCertificate: `opds://${host}:${actualHttpsPort}/opds2`,
        },
        async stop() {
            if (stopped) {
                return;
            }
            stopped = true;
            for (const timer of timers) {
                clearTimeout(timer);
            }
            timers.clear();
            for (const socket of sockets) {
                socket.destroy();
            }
            await Promise.all([close(httpServer), close(httpsServer)]);
        },
    };
};

const parsePort = (rawValue, optionName) => {
    const value = Number(rawValue);
    if (!Number.isInteger(value) || value < 0 || value > 65_535) {
        throw new Error(`${optionName} must be an integer between 0 and 65535.`);
    }
    return value;
};

const isMainModule = process.argv[1]
    && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMainModule) {
    const { values } = parseArgs({
        options: {
            host: { type: "string", default: DEFAULT_HOST },
            "http-port": { type: "string", default: String(DEFAULT_HTTP_PORT) },
            "https-port": { type: "string", default: String(DEFAULT_HTTPS_PORT) },
        },
    });
    const server = await startBrokenOpdsServer({
        host: values.host,
        httpPort: parsePort(values["http-port"], "--http-port"),
        httpsPort: parsePort(values["https-port"], "--https-port"),
    });

    console.log("");
    console.log("Thorium broken OPDS test server is running:");
    console.log(`  HTTP catalog / HTTPS-first fallback: ${server.urls.opdsHttpFallback}`);
    console.log(`  Untrusted TLS certificate:          ${server.urls.opdsInvalidCertificate}`);
    console.log(`  HTTP endpoint list:                 ${server.urls.http}/`);
    console.log(`  HTTPS endpoint list:                ${server.urls.https}/`);
    console.log("");
    console.log("Press Ctrl+C to stop.");

    let stopping = false;
    const shutdown = async () => {
        if (stopping) {
            return;
        }
        stopping = true;
        await server.stop();
    };

    process.once("SIGINT", async () => {
        await shutdown();
        process.exit(0);
    });
    process.once("SIGTERM", async () => {
        await shutdown();
        process.exit(0);
    });
}
