import { createReadStream } from "node:fs";
import { access, constants, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const OPDS_MEDIA_TYPE = "application/opds+json";
export const EPUB_MEDIA_TYPE = "application/epub+zip";
export const PROGRESSION_MEDIA_TYPE = "application/opds-progression+json";
export const PROGRESSION_RELATION = "http://opds-spec.org/progression";

const projectDirectory = dirname(fileURLToPath(import.meta.url));
const epubFileName = "accessible_epub_3.epub";
const epubPath = join(projectDirectory, "fixtures", epubFileName);
const defaultPort = Number(process.argv[2]) || 4873;
const publicationIdentifier = "urn:isbn:9781449328030";
const jsonResponseBody = Symbol("jsonResponseBody");
const device = Object.freeze({
    id: "urn:uuid:f2438195-3b7c-4ea8-a8cf-668d624c11e5",
    name: "Thorium OPDS Progression Test Server",
});

function defaultProgressionState() {
    return {
        delayMs: 0,
        empty: false,
        modified: new Date().toISOString(),
        progression: 0.625,
        title: "Remote reading position",
    };
}

function createRequestState() {
    return {
        lastAccept: undefined,
        lastRequestAt: undefined,
        progressionGetCount: 0,
    };
}

function sendBuffer(request, response, statusCode, contentType, body, extraHeaders = {}) {
    response.writeHead(statusCode, {
        "Cache-Control": "no-store",
        "Content-Length": body.length,
        "Content-Type": contentType,
        ...extraHeaders,
    });
    if (request.method === "HEAD") {
        response.end();
        return;
    }
    if (contentType.split(";", 1)[0] === PROGRESSION_MEDIA_TYPE) {
        response[jsonResponseBody] = body.toString("utf8");
    }
    response.end(body);
}

function sendJson(request, response, statusCode, value, extraHeaders = {}) {
    const body = Buffer.from(`${JSON.stringify(value, undefined, 2)}\n`, "utf8");
    sendBuffer(request, response, statusCode, "application/json; charset=utf-8", body, extraHeaders);
}

function sendText(request, response, statusCode, text, extraHeaders = {}) {
    sendBuffer(request, response, statusCode, "text/plain; charset=utf-8", Buffer.from(text, "utf8"), extraHeaders);
}

function createFeed() {
    return {
        metadata: {
            title: "Thorium OPDS Progression Test Catalog",
            modified: "2026-09-30T00:00:00Z",
            numberOfItems: 1,
        },
        links: [
            {
                href: "catalog.json",
                rel: "self",
                type: OPDS_MEDIA_TYPE,
            },
        ],
        publications: [
            {
                metadata: {
                    "@type": "http://schema.org/Book",
                    title: "Accessible EPUB 3",
                    identifier: publicationIdentifier,
                    language: "en",
                    modified: "2023-07-04T16:01:25Z",
                    author: [
                        {
                            name: "Matt Garrish",
                        },
                    ],
                    accessibilityFeature: ["alternativeText", "readingOrder", "tableOfContents"],
                    accessibilityHazard: ["none"],
                    accessibilitySummary:
                        "This EPUB Publication meets the requirements of the EPUB Accessibility specification with conformance to WCAG 2.0 Level AA. The publication is screen reader friendly.",
                },
                links: [
                    {
                        href: `../../assets/${epubFileName}`,
                        rel: "http://opds-spec.org/acquisition/open-access",
                        type: EPUB_MEDIA_TYPE,
                    },
                    {
                        href: "../../progression/accessible-epub-3",
                        rel: PROGRESSION_RELATION,
                        type: PROGRESSION_MEDIA_TYPE,
                    },
                ],
            },
        ],
    };
}

function parseRange(rangeHeader, fileSize) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || "");
    if (!match || (!match[1] && !match[2])) {
        return undefined;
    }

    let start;
    let end;
    if (!match[1]) {
        const suffixLength = Number(match[2]);
        if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
            return undefined;
        }
        start = Math.max(fileSize - suffixLength, 0);
        end = fileSize - 1;
    } else {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : fileSize - 1;
    }

    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= fileSize) {
        return undefined;
    }

    return {
        end: Math.min(end, fileSize - 1),
        start,
    };
}

async function serveEpub(request, response) {
    const fileStats = await stat(epubPath);
    const rangeHeader = request.headers.range;
    const range = rangeHeader ? parseRange(rangeHeader, fileStats.size) : undefined;

    if (rangeHeader && !range) {
        response.writeHead(416, {
            "Accept-Ranges": "bytes",
            "Content-Range": `bytes */${fileStats.size}`,
        });
        response.end();
        return;
    }

    const headers = {
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${epubFileName}"`,
        "Content-Type": EPUB_MEDIA_TYPE,
    };

    if (range) {
        response.writeHead(206, {
            ...headers,
            "Content-Length": range.end - range.start + 1,
            "Content-Range": `bytes ${range.start}-${range.end}/${fileStats.size}`,
        });
        if (request.method === "HEAD") {
            response.end();
            return;
        }
        createReadStream(epubPath, range).pipe(response);
        return;
    }

    response.writeHead(200, {
        ...headers,
        "Content-Length": fileStats.size,
    });
    if (request.method === "HEAD") {
        response.end();
        return;
    }
    createReadStream(epubPath).pipe(response);
}

function acceptsProgression(request) {
    return (request.headers.accept || "")
        .split(",")
        .map((entry) => entry.split(";", 1)[0].trim().toLowerCase())
        .includes(PROGRESSION_MEDIA_TYPE);
}

function progressionDocument(state) {
    return {
        ...(state.title ? { title: state.title } : {}),
        modified: state.modified,
        device,
        progression: state.progression,
    };
}

function publicState(state, requests) {
    return {
        delayMs: state.delayMs,
        empty: state.empty,
        modified: state.modified,
        progression: state.progression,
        title: state.title,
        requests: {
            lastAccept: requests.lastAccept,
            lastRequestAt: requests.lastRequestAt,
            progressionGetCount: requests.progressionGetCount,
        },
    };
}

function readJsonBody(request, maximumBytes = 16 * 1024) {
    return new Promise((resolveBody, rejectBody) => {
        const chunks = [];
        let length = 0;

        request.on("data", (chunk) => {
            length += chunk.length;
            if (length > maximumBytes) {
                rejectBody(new Error("Request body is too large"));
                request.destroy();
                return;
            }
            chunks.push(chunk);
        });
        request.on("end", () => {
            try {
                const text = Buffer.concat(chunks).toString("utf8");
                resolveBody(text ? JSON.parse(text) : {});
            } catch {
                rejectBody(new Error("Request body is not valid JSON"));
            }
        });
        request.on("error", rejectBody);
    });
}

function isValidModified(value) {
    return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

function applyStateUpdate(currentState, update) {
    if (!update || typeof update !== "object" || Array.isArray(update)) {
        throw new Error("State update must be a JSON object");
    }

    const nextState = { ...currentState };

    if (Object.prototype.hasOwnProperty.call(update, "delayMs")) {
        if (!Number.isInteger(update.delayMs) || update.delayMs < 0 || update.delayMs > 120000) {
            throw new Error("delayMs must be an integer between 0 and 120000");
        }
        nextState.delayMs = update.delayMs;
    }

    if (Object.prototype.hasOwnProperty.call(update, "progression")) {
        if (
            typeof update.progression !== "number" ||
            !Number.isFinite(update.progression) ||
            update.progression < 0 ||
            update.progression > 1
        ) {
            throw new Error("progression must be a finite number between 0 and 1");
        }
        nextState.progression = update.progression;
        nextState.empty = false;
    }

    if (Object.prototype.hasOwnProperty.call(update, "empty")) {
        if (typeof update.empty !== "boolean") {
            throw new Error("empty must be a boolean");
        }
        nextState.empty = update.empty;
    }

    if (Object.prototype.hasOwnProperty.call(update, "modified")) {
        if (!isValidModified(update.modified)) {
            throw new Error("modified must be an ISO 8601 date-time");
        }
        nextState.modified = update.modified;
    } else if (!nextState.empty && ("progression" in update || "title" in update || "empty" in update)) {
        nextState.modified = new Date().toISOString();
    }

    if (Object.prototype.hasOwnProperty.call(update, "title")) {
        if (
            update.title !== undefined &&
            update.title !== null &&
            (typeof update.title !== "string" || !update.title.trim())
        ) {
            throw new Error("title must be a non-empty string or null");
        }
        nextState.title = typeof update.title === "string" ? update.title.trim() : undefined;
    }

    return nextState;
}

function logRequestResponse(event, { jsonBody, ...details }) {
    console.log(`${event} ${JSON.stringify(details)}`);
    if (jsonBody !== undefined) {
        console.log(jsonBody || "(empty JSON body)");
    }
}

export function createOpdsProgressionServer({ log = logRequestResponse } = {}) {
    let state = defaultProgressionState();
    let requests = createRequestState();
    let nextRequestId = 0;

    return createServer(async (request, response) => {
        const requestId = ++nextRequestId;
        const startedAt = performance.now();
        const path = new URL(request.url || "/", "http://127.0.0.1").pathname;
        const requestDetails = {
            requestId,
            method: request.method,
            path,
            accept: request.headers.accept,
            range: request.headers.range,
        };
        log("OPDS request", requestDetails);
        let loggedCompletion = false;
        const logCompletion = (outcome) => {
            if (loggedCompletion) {
                return;
            }
            loggedCompletion = true;
            log("OPDS response", {
                requestId,
                method: request.method,
                path,
                outcome,
                statusCode: response.headersSent ? response.statusCode : undefined,
                elapsedMs: Math.round(performance.now() - startedAt),
                ...(response[jsonResponseBody] !== undefined ? { jsonBody: response[jsonResponseBody] } : {}),
            });
        };
        response.once("finish", () => logCompletion("finished"));
        response.once("close", () => logCompletion(response.writableFinished ? "finished" : "aborted"));
        const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

        try {
            if (url.pathname === "/" && request.method === "GET") {
                sendJson(request, response, 200, {
                    catalog: "/opds/v2/catalog.json",
                    progression: "/progression/accessible-epub-3",
                    state: "/__test/state",
                });
                return;
            }

            if (url.pathname === "/opds/v2/catalog.json" && (request.method === "GET" || request.method === "HEAD")) {
                const feedBody = Buffer.from(`${JSON.stringify(createFeed(), undefined, 2)}\n`, "utf8");
                sendBuffer(request, response, 200, `${OPDS_MEDIA_TYPE}; charset=utf-8`, feedBody);
                return;
            }

            if (url.pathname === `/assets/${epubFileName}` && (request.method === "GET" || request.method === "HEAD")) {
                await serveEpub(request, response);
                return;
            }

            if (url.pathname === "/progression/accessible-epub-3") {
                if (request.method !== "GET") {
                    sendText(request, response, 405, "Only GET is supported by this retrieval MVP.\n", {
                        Allow: "GET",
                    });
                    return;
                }

                requests.progressionGetCount += 1;
                requests.lastAccept = request.headers.accept;
                requests.lastRequestAt = new Date().toISOString();

                if (!acceptsProgression(request)) {
                    sendText(request, response, 406, `Send Accept: ${PROGRESSION_MEDIA_TYPE}\n`);
                    return;
                }

                // Freeze the response at request time so concurrent test controls
                // cannot change the document already being retrieved.
                const responseState = { ...state };
                if (responseState.delayMs > 0) {
                    await new Promise((resolveDelay) => {
                        const finish = () => {
                            clearTimeout(timer);
                            response.off("close", finish);
                            resolveDelay();
                        };
                        const timer = setTimeout(finish, responseState.delayMs);
                        response.once("close", finish);
                    });
                }
                if (response.destroyed) {
                    return;
                }

                if (responseState.empty) {
                    sendBuffer(request, response, 200, PROGRESSION_MEDIA_TYPE, Buffer.alloc(0));
                    return;
                }

                const body = Buffer.from(`${JSON.stringify(progressionDocument(responseState), undefined, 2)}\n`, "utf8");
                sendBuffer(request, response, 200, `${PROGRESSION_MEDIA_TYPE}; charset=utf-8`, body);
                return;
            }

            if (url.pathname === "/__test/state" && request.method === "GET") {
                sendJson(request, response, 200, publicState(state, requests));
                return;
            }

            if (url.pathname === "/__test/state" && request.method === "PUT") {
                try {
                    state = applyStateUpdate(state, await readJsonBody(request));
                    sendJson(request, response, 200, publicState(state, requests));
                } catch (error) {
                    sendJson(request, response, 400, {
                        error: error instanceof Error ? error.message : "Invalid state update",
                    });
                }
                return;
            }

            if (url.pathname === "/__test/reset" && request.method === "POST") {
                state = defaultProgressionState();
                requests = createRequestState();
                sendJson(request, response, 200, publicState(state, requests));
                return;
            }

            sendText(request, response, 404, "Not found\n");
        } catch (error) {
            if (!response.headersSent) {
                sendJson(request, response, 500, {
                    error: error instanceof Error ? error.message : "Unexpected server error",
                });
            } else {
                response.destroy(error instanceof Error ? error : undefined);
            }
        }
    });
}

export async function startOpdsProgressionServer(port = defaultPort, options = {}) {
    await access(epubPath, constants.R_OK);
    const server = createOpdsProgressionServer(options);

    return new Promise((resolveStart, rejectStart) => {
        const onError = (error) => rejectStart(error);
        server.once("error", onError);
        server.listen(port, "127.0.0.1", () => {
            server.off("error", onError);
            const address = server.address();
            const activePort = typeof address === "object" && address ? address.port : port;
            console.log(`OPDS progression catalog: http://127.0.0.1:${activePort}/opds/v2/catalog.json`);
            resolveStart(server);
        });
    });
}

export function closeOpdsProgressionServer(server) {
    return new Promise((resolveClose, rejectClose) => {
        server.close((error) => {
            if (error) {
                rejectClose(error);
                return;
            }
            resolveClose();
        });
    });
}

export function installServerShutdown(server) {
    let closing = false;
    const shutdown = async (signal) => {
        if (closing) {
            return;
        }
        closing = true;
        console.log(`OPDS progression server shutting down: ${signal}`);
        try {
            await closeOpdsProgressionServer(server);
            process.exit(0);
        } catch (error) {
            console.error("Unable to stop OPDS progression server", error);
            process.exit(1);
        }
    };

    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
    const server = await startOpdsProgressionServer(defaultPort);
    installServerShutdown(server);
}
