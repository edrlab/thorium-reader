import { createReadStream } from "node:fs";
import { access, constants, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const OPDS_MEDIA_TYPE = "application/opds+json";
export const EPUB_MEDIA_TYPE = "application/epub+zip";
export const PROGRESSION_MEDIA_TYPE = "application/opds-progression+json";
export const PROGRESSION_RELATION = "http://opds-spec.org/progression";
export const PROBLEM_MEDIA_TYPE = "application/problem+json";

const INVALID_PAYLOAD_PROBLEM_TYPE = "https://registry.opds.io/error#progression-invalid-payload";
const LOCKED_PROBLEM_TYPE = "https://registry.opds.io/error#progression-locked";
const STALE_PROBLEM_TYPE = "https://registry.opds.io/error#progression-date";

const projectDirectory = dirname(fileURLToPath(import.meta.url));
const epubFileName = "accessible_epub_3.epub";
const epubPath = join(projectDirectory, "fixtures", epubFileName);
const defaultPort = Number(process.argv[2]) || 4873;
const publicationIdentifier = "urn:isbn:9781449328030";
const jsonResponseBody = Symbol("jsonResponseBody");
const defaultDevice = Object.freeze({
    id: "urn:uuid:f2438195-3b7c-4ea8-a8cf-668d624c11e5",
    name: "Thorium OPDS Progression Test Server",
});

function defaultProgressionState() {
    return {
        device: defaultDevice,
        delayMs: 0,
        empty: false,
        locked: false,
        modified: new Date().toISOString(),
        progression: 0.625,
        title: "Remote reading position",
    };
}

function createRequestState() {
    return {
        lastAccept: undefined,
        lastRequestAt: undefined,
        lastPutAccept: undefined,
        lastPutAt: undefined,
        lastPutBody: undefined,
        lastPutContentType: undefined,
        lastPutStatus: undefined,
        progressionGetCount: 0,
        progressionPutCount: 0,
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

function sendProblem(request, response, statusCode, type, title, detail, extraHeaders = {}) {
    const body = Buffer.from(
        `${JSON.stringify(
            {
                type,
                title,
                ...(detail ? { detail } : {}),
            },
            undefined,
            2,
        )}\n`,
        "utf8",
    );
    sendBuffer(request, response, statusCode, `${PROBLEM_MEDIA_TYPE}; charset=utf-8`, body, extraHeaders);
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

function hasProgressionContentType(request) {
    return (request.headers["content-type"] || "").split(";", 1)[0].trim().toLowerCase() === PROGRESSION_MEDIA_TYPE;
}

function progressionDocument(state) {
    return {
        ...(state.title ? { title: state.title } : {}),
        modified: state.modified,
        device: state.device,
        progression: state.progression,
    };
}

function isSameProgressionDocument(left, right) {
    return (
        left.modified === right.modified &&
        left.progression === right.progression &&
        left.title === right.title &&
        left.device.id === right.device.id &&
        left.device.name === right.device.name
    );
}

function publicState(state, requests) {
    return {
        device: state.device,
        delayMs: state.delayMs,
        empty: state.empty,
        locked: state.locked,
        modified: state.modified,
        progression: state.progression,
        title: state.title,
        requests: {
            lastAccept: requests.lastAccept,
            lastRequestAt: requests.lastRequestAt,
            lastPutAccept: requests.lastPutAccept,
            lastPutAt: requests.lastPutAt,
            lastPutBody: requests.lastPutBody,
            lastPutContentType: requests.lastPutContentType,
            lastPutStatus: requests.lastPutStatus,
            progressionGetCount: requests.progressionGetCount,
            progressionPutCount: requests.progressionPutCount,
        },
    };
}

function readJsonBody(request, maximumBytes = 16 * 1024) {
    return new Promise((resolveBody, rejectBody) => {
        const chunks = [];
        let length = 0;
        let tooLarge = false;

        request.on("data", (chunk) => {
            if (tooLarge) {
                return;
            }
            length += chunk.length;
            if (length > maximumBytes) {
                tooLarge = true;
                chunks.length = 0;
                return;
            }
            chunks.push(chunk);
        });
        request.on("end", () => {
            if (tooLarge) {
                rejectBody(new Error("Request body is too large"));
                return;
            }
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

const RFC3339_DATE_TIME_PATTERN =
    /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])[Tt]([01]\d|2[0-3]):([0-5]\d):([0-5]\d|60)(?:\.(\d+))?([Zz]|([+-])([01]\d|2[0-3]):([0-5]\d))$/;

function isValidModified(value) {
    if (typeof value !== "string") {
        return false;
    }

    const match = RFC3339_DATE_TIME_PATTERN.exec(value);
    if (!match) {
        return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day > daysInMonth[month - 1]) {
        return false;
    }

    if (Number(match[6]) < 60) {
        return true;
    }
    // Match ajv-formats' RFC 3339 leap-second validation, which is also used
    // by Thorium's progression document parser.
    const offsetDirection = match[9] === "-" ? -1 : 1;
    const utcMinute = Number(match[5]) - Number(match[11] || 0) * offsetDirection;
    const utcHour = Number(match[4]) - Number(match[10] || 0) * offsetDirection - (utcMinute < 0 ? 1 : 0);
    return (utcHour === 23 || utcHour === -1) && (utcMinute === 59 || utcMinute === -1);
}

function compareModified(left, right) {
    const parseInstant = (value) => {
        const match = RFC3339_DATE_TIME_PATTERN.exec(value);
        if (!match) {
            throw new Error("Cannot compare an invalid modified timestamp");
        }
        const date = new Date(0);
        date.setUTCFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        date.setUTCHours(Number(match[4]), Number(match[5]), Number(match[6]), 0);
        const offsetDirection = match[9] === "-" ? -1 : 1;
        const offsetSeconds = match[9] ? offsetDirection * (Number(match[10]) * 60 * 60 + Number(match[11]) * 60) : 0;
        return {
            fraction: match[7] || "",
            leapSecond: Number(match[6]) === 60,
            seconds: BigInt(date.getTime() / 1000 - offsetSeconds),
        };
    };

    const leftInstant = parseInstant(left);
    const rightInstant = parseInstant(right);
    if (leftInstant.seconds !== rightInstant.seconds) {
        return leftInstant.seconds < rightInstant.seconds ? -1 : 1;
    }
    if (leftInstant.leapSecond !== rightInstant.leapSecond) {
        return leftInstant.leapSecond ? -1 : 1;
    }
    const fractionLength = Math.max(leftInstant.fraction.length, rightInstant.fraction.length);
    const leftFraction = leftInstant.fraction.padEnd(fractionLength, "0");
    const rightFraction = rightInstant.fraction.padEnd(fractionLength, "0");
    if (leftFraction === rightFraction) {
        return 0;
    }
    return leftFraction < rightFraction ? -1 : 1;
}

function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
}

function validateDevice(value) {
    if (!isObject(value)) {
        throw new Error("device must be an object");
    }
    if (typeof value.id !== "string" || !value.id.trim()) {
        throw new Error("device.id must be a non-empty URI");
    }
    try {
        new URL(value.id);
    } catch {
        throw new Error("device.id must be a valid URI");
    }
    if (typeof value.name !== "string" || !value.name.trim()) {
        throw new Error("device.name must be a non-empty string");
    }

    return {
        id: value.id,
        name: value.name,
    };
}

function validateProgressionDocument(value) {
    if (!isObject(value)) {
        throw new Error("The progression document must be a JSON object");
    }
    if (hasOwn(value, "references")) {
        throw new Error("references are not supported by this float-only MVP");
    }
    if (!isValidModified(value.modified)) {
        throw new Error("modified must be an ISO 8601 date-time");
    }
    const device = validateDevice(value.device);
    if (
        typeof value.progression !== "number" ||
        !Number.isFinite(value.progression) ||
        value.progression < 0 ||
        value.progression > 1
    ) {
        throw new Error("progression must be a finite number between 0 and 1");
    }
    if (hasOwn(value, "title") && typeof value.title !== "string") {
        throw new Error("title must be a string when present");
    }

    return {
        device,
        empty: false,
        modified: value.modified,
        progression: value.progression,
        title: value.title,
    };
}

function applyStateUpdate(currentState, update) {
    if (!isObject(update)) {
        throw new Error("State update must be a JSON object");
    }

    const nextState = { ...currentState };
    const changesDocument = hasOwn(update, "progression") || hasOwn(update, "title") || hasOwn(update, "device");

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

    if (hasOwn(update, "empty")) {
        if (typeof update.empty !== "boolean") {
            throw new Error("empty must be a boolean");
        }
        nextState.empty = update.empty;
    }

    if (hasOwn(update, "locked")) {
        if (typeof update.locked !== "boolean") {
            throw new Error("locked must be a boolean");
        }
        nextState.locked = update.locked;
    }

    if (hasOwn(update, "device")) {
        nextState.device = validateDevice(update.device);
    }

    if (hasOwn(update, "modified")) {
        if (!isValidModified(update.modified)) {
            throw new Error("modified must be an ISO 8601 date-time");
        }
        nextState.modified = update.modified;
    } else if (changesDocument && !nextState.empty) {
        nextState.modified = new Date().toISOString();
    }

    if (hasOwn(update, "title")) {
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
                if (request.method === "GET") {
                    requests.progressionGetCount += 1;
                    requests.lastAccept = request.headers.accept;
                    requests.lastRequestAt = new Date().toISOString();

                    if (!acceptsProgression(request)) {
                        sendProblem(
                            request,
                            response,
                            406,
                            "about:blank",
                            "Not Acceptable",
                            `Send Accept: ${PROGRESSION_MEDIA_TYPE}`,
                        );
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

                if (request.method === "PUT") {
                    requests.progressionPutCount += 1;
                    requests.lastPutAccept = request.headers.accept;
                    requests.lastPutAt = new Date().toISOString();
                    requests.lastPutBody = undefined;
                    requests.lastPutContentType = request.headers["content-type"];

                    if (!acceptsProgression(request)) {
                        requests.lastPutStatus = 406;
                        request.resume();
                        sendProblem(
                            request,
                            response,
                            406,
                            "about:blank",
                            "Not Acceptable",
                            `Send Accept: ${PROGRESSION_MEDIA_TYPE}`,
                        );
                        return;
                    }

                    if (!hasProgressionContentType(request)) {
                        requests.lastPutStatus = 415;
                        request.resume();
                        sendProblem(
                            request,
                            response,
                            415,
                            INVALID_PAYLOAD_PROBLEM_TYPE,
                            "Unsupported Media Type",
                            `Send Content-Type: ${PROGRESSION_MEDIA_TYPE}`,
                        );
                        return;
                    }

                    let candidate;
                    try {
                        requests.lastPutBody = await readJsonBody(request);
                        candidate = validateProgressionDocument(requests.lastPutBody);
                    } catch (error) {
                        requests.lastPutStatus = 400;
                        sendProblem(
                            request,
                            response,
                            400,
                            INVALID_PAYLOAD_PROBLEM_TYPE,
                            "Progression could not be updated due to an invalid payload.",
                            error instanceof Error ? error.message : "Invalid progression document",
                        );
                        return;
                    }

                    if (state.locked) {
                        requests.lastPutStatus = 403;
                        sendProblem(
                            request,
                            response,
                            403,
                            LOCKED_PROBLEM_TYPE,
                            "Progression can no longer be updated for this publication.",
                        );
                        return;
                    }

                    if (
                        !state.empty &&
                        compareModified(candidate.modified, state.modified) <= 0 &&
                        !isSameProgressionDocument(candidate, state)
                    ) {
                        requests.lastPutStatus = 409;
                        sendProblem(
                            request,
                            response,
                            409,
                            STALE_PROBLEM_TYPE,
                            "A more recent progression point is already available.",
                        );
                        return;
                    }

                    const statusCode = state.empty ? 201 : 200;
                    state = {
                        ...candidate,
                        locked: state.locked,
                    };
                    requests.lastPutStatus = statusCode;
                    const body = Buffer.from(`${JSON.stringify(progressionDocument(state), undefined, 2)}\n`, "utf8");
                    sendBuffer(request, response, statusCode, `${PROGRESSION_MEDIA_TYPE}; charset=utf-8`, body);
                    return;
                }

                sendProblem(request, response, 405, "about:blank", "Method Not Allowed", undefined, {
                    Allow: "GET, PUT",
                });
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
