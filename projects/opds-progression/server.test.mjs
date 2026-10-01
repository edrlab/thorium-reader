import assert from "node:assert/strict";
import { test } from "node:test";

import {
    closeOpdsProgressionServer,
    EPUB_MEDIA_TYPE,
    OPDS_MEDIA_TYPE,
    PROBLEM_MEDIA_TYPE,
    PROGRESSION_MEDIA_TYPE,
    PROGRESSION_RELATION,
    startOpdsProgressionServer,
} from "./server.mjs";

const INVALID_PAYLOAD_PROBLEM_TYPE = "https://registry.opds.io/error#progression-invalid-payload";
const LOCKED_PROBLEM_TYPE = "https://registry.opds.io/error#progression-locked";
const STALE_PROBLEM_TYPE = "https://registry.opds.io/error#progression-date";

test("OPDS progression fixture server contract", async (context) => {
    const server = await startOpdsProgressionServer(0);
    context.after(async () => closeOpdsProgressionServer(server));

    const address = server.address();
    assert.equal(typeof address, "object");
    assert.ok(address);
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const progressionUrl = `${baseUrl}/progression/accessible-epub-3`;

    const getState = async () => {
        const response = await fetch(`${baseUrl}/__test/state`);
        assert.equal(response.status, 200);
        return response.json();
    };

    const updateState = async (update) => {
        const response = await fetch(`${baseUrl}/__test/state`, {
            body: JSON.stringify(update),
            headers: { "Content-Type": "application/json" },
            method: "PUT",
        });
        assert.equal(response.status, 200);
        return response.json();
    };

    const putProgression = (document, headers = {}) =>
        fetch(progressionUrl, {
            body: typeof document === "string" ? document : JSON.stringify(document),
            headers: {
                Accept: PROGRESSION_MEDIA_TYPE,
                "Content-Type": PROGRESSION_MEDIA_TYPE,
                ...headers,
            },
            method: "PUT",
        });

    const assertProblem = async (response, status, type, title) => {
        assert.equal(response.status, status);
        assert.equal(response.headers.get("content-type")?.startsWith(PROBLEM_MEDIA_TYPE), true);
        const problem = await response.json();
        assert.equal(problem.type, type);
        assert.equal(problem.title, title);
        return problem;
    };

    await context.test("serves an OPDS 2 feed with relative acquisition and progression links", async () => {
        const response = await fetch(`${baseUrl}/opds/v2/catalog.json`);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("content-type")?.startsWith(OPDS_MEDIA_TYPE), true);

        const feed = await response.json();
        assert.equal(feed.publications.length, 1);
        assert.equal(feed.publications[0].metadata.identifier, "urn:isbn:9781449328030");
        assert.equal(feed.publications[0].metadata.title, "Accessible EPUB 3");
        const links = feed.publications[0].links;
        const acquisition = links.find((link) => link.type === EPUB_MEDIA_TYPE);
        const progression = links.find((link) => link.rel === PROGRESSION_RELATION);

        assert.deepEqual(acquisition, {
            href: "../../assets/accessible_epub_3.epub",
            rel: "http://opds-spec.org/acquisition/open-access",
            type: EPUB_MEDIA_TYPE,
        });
        assert.deepEqual(progression, {
            href: "../../progression/accessible-epub-3",
            rel: PROGRESSION_RELATION,
            type: PROGRESSION_MEDIA_TYPE,
        });
        assert.equal(new URL(acquisition.href, response.url).pathname, "/assets/accessible_epub_3.epub");
        assert.equal(new URL(progression.href, response.url).pathname, "/progression/accessible-epub-3");
    });

    await context.test("serves the offline EPUB as a full download and a byte range", async () => {
        const epubUrl = `${baseUrl}/assets/accessible_epub_3.epub`;
        const headResponse = await fetch(epubUrl, { method: "HEAD" });
        assert.equal(headResponse.status, 200);
        assert.equal(headResponse.headers.get("content-type"), EPUB_MEDIA_TYPE);
        assert.equal(headResponse.headers.get("accept-ranges"), "bytes");
        assert.equal(headResponse.headers.get("content-disposition"), 'attachment; filename="accessible_epub_3.epub"');
        assert.ok(Number(headResponse.headers.get("content-length")) > 1_000);

        const fullResponse = await fetch(epubUrl);
        assert.equal(fullResponse.status, 200);
        const epub = Buffer.from(await fullResponse.arrayBuffer());
        const firstEntryNameLength = epub.readUInt16LE(26);
        const firstEntryExtraLength = epub.readUInt16LE(28);
        const firstEntrySize = epub.readUInt32LE(22);
        const firstEntryDataOffset = 30 + firstEntryNameLength + firstEntryExtraLength;
        assert.equal(epub.readUInt32LE(0), 0x04034b50);
        assert.equal(epub.readUInt16LE(8), 0, "the first ZIP entry must be stored without compression");
        assert.equal(epub.subarray(30, 30 + firstEntryNameLength).toString("utf8"), "mimetype");
        assert.equal(
            epub.subarray(firstEntryDataOffset, firstEntryDataOffset + firstEntrySize).toString("ascii"),
            EPUB_MEDIA_TYPE,
        );
        assert.equal(epub.includes(Buffer.from("META-INF/container.xml")), true);
        assert.equal(epub.includes(Buffer.from("EPUB/package.opf")), true);

        const rangeResponse = await fetch(epubUrl, { headers: { Range: "bytes=0-3" } });
        assert.equal(rangeResponse.status, 206);
        assert.equal(rangeResponse.headers.get("content-range")?.startsWith("bytes 0-3/"), true);
        assert.deepEqual(Array.from(new Uint8Array(await rangeResponse.arrayBuffer())), [0x50, 0x4b, 0x03, 0x04]);

        const invalidRangeResponse = await fetch(epubUrl, { headers: { Range: "bytes=999999999-" } });
        assert.equal(invalidRangeResponse.status, 416);
    });

    await context.test("requires the OPDS progression Accept header for GET", async () => {
        const response = await fetch(progressionUrl);
        const problem = await assertProblem(response, 406, "about:blank", "Not Acceptable");
        assert.equal(problem.detail.includes(PROGRESSION_MEDIA_TYPE), true);
    });

    await context.test("serves a float-only progression document and records GET telemetry", async () => {
        const response = await fetch(progressionUrl, { headers: { Accept: PROGRESSION_MEDIA_TYPE } });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("content-type")?.startsWith(PROGRESSION_MEDIA_TYPE), true);

        const progression = await response.json();
        assert.equal(progression.progression, 0.625);
        assert.equal(Number.isFinite(Date.parse(progression.modified)), true);
        assert.deepEqual(progression.device, {
            id: "urn:uuid:f2438195-3b7c-4ea8-a8cf-668d624c11e5",
            name: "Thorium OPDS Progression Test Server",
        });
        assert.equal(Object.prototype.hasOwnProperty.call(progression, "references"), false);

        const state = await getState();
        assert.equal(state.requests.progressionGetCount, 2);
        assert.equal(state.requests.lastAccept, PROGRESSION_MEDIA_TYPE);
        assert.equal(Number.isFinite(Date.parse(state.requests.lastRequestAt)), true);
    });

    await context.test("requires PUT response and request media types", async () => {
        const document = {
            modified: "2099-01-01T00:00:00.000Z",
            device: { id: "urn:uuid:4f6da6f7-b592-483d-ac7c-42b80fbeb6dc", name: "Thorium test" },
            progression: 0.25,
        };

        const missingAccept = await putProgression(document, { Accept: "*/*" });
        await assertProblem(missingAccept, 406, "about:blank", "Not Acceptable");

        const wrongContentType = await putProgression(document, { "Content-Type": "application/json" });
        await assertProblem(wrongContentType, 415, INVALID_PAYLOAD_PROBLEM_TYPE, "Unsupported Media Type");

        const state = await getState();
        assert.equal(state.requests.progressionPutCount, 2);
        assert.equal(state.requests.lastPutAccept, PROGRESSION_MEDIA_TYPE);
        assert.equal(state.requests.lastPutContentType, "application/json");
        assert.equal(state.requests.lastPutStatus, 415);
    });

    await context.test("returns the standard 400 Problem Details for malformed or incomplete documents", async () => {
        const device = { id: "urn:uuid:4f6da6f7-b592-483d-ac7c-42b80fbeb6dc", name: "Thorium test" };
        const invalidDocuments = [
            "{not-json",
            {},
            { modified: "2099-01-01T00:00:00.000Z", progression: 0.25 },
            { modified: "not-a-date", device, progression: 0.25 },
            { modified: "2099-01-01T00:00:00", device, progression: 0.25 },
            { modified: "2099-01-01T00:00:00.000Z", device: { id: "not a URI", name: "Thorium" }, progression: 0.25 },
            { modified: "2099-01-01T00:00:00.000Z", device, progression: 1.01 },
            { modified: "2099-01-01T00:00:00.000Z", device, progression: 0.25, references: [] },
        ];

        for (const document of invalidDocuments) {
            const response = await putProgression(document);
            const problem = await assertProblem(
                response,
                400,
                INVALID_PAYLOAD_PROBLEM_TYPE,
                "Progression could not be updated due to an invalid payload.",
            );
            assert.equal(typeof problem.detail, "string");
            assert.ok(problem.detail.length > 0);
        }

        const state = await getState();
        assert.equal(state.progression, 0.625);
        assert.equal(state.requests.lastPutStatus, 400);
    });

    await context.test("creates and persists the first uploaded float-only document", async () => {
        await updateState({ empty: true, locked: false });
        const uploaded = {
            title: "Uploaded reading position",
            modified: "2099-01-01T00:00:00.0001Z",
            device: {
                id: "urn:uuid:4f6da6f7-b592-483d-ac7c-42b80fbeb6dc",
                name: "Thorium on test device",
            },
            progression: 0.25,
        };

        const response = await putProgression(uploaded, {
            "Content-Type": `${PROGRESSION_MEDIA_TYPE}; charset=utf-8`,
        });
        assert.equal(response.status, 201);
        assert.equal(response.headers.get("content-type")?.startsWith(PROGRESSION_MEDIA_TYPE), true);
        assert.deepEqual(await response.json(), uploaded);

        const getResponse = await fetch(progressionUrl, { headers: { Accept: PROGRESSION_MEDIA_TYPE } });
        assert.equal(getResponse.status, 200);
        assert.deepEqual(await getResponse.json(), uploaded);

        const state = await getState();
        assert.equal(state.empty, false);
        assert.equal(state.progression, uploaded.progression);
        assert.equal(state.modified, uploaded.modified);
        assert.deepEqual(state.device, uploaded.device);
        assert.equal(state.requests.lastPutStatus, 201);
        assert.equal(state.requests.lastPutContentType, `${PROGRESSION_MEDIA_TYPE}; charset=utf-8`);
        assert.deepEqual(state.requests.lastPutBody, uploaded);
        assert.equal(Number.isFinite(Date.parse(state.requests.lastPutAt)), true);
    });

    await context.test("orders RFC 3339 timestamps at full fractional precision", async () => {
        const newerWithinTheMillisecond = {
            modified: "2099-01-01T00:00:00.0002Z",
            device: {
                id: "urn:uuid:4f6da6f7-b592-483d-ac7c-42b80fbeb6dc",
                name: "Thorium precise clock",
            },
            progression: 0.5,
        };

        const response = await putProgression(newerWithinTheMillisecond);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), newerWithinTheMillisecond);

        const equivalentInstant = {
            ...newerWithinTheMillisecond,
            modified: "2099-01-01T01:00:00.0002+01:00",
            progression: 0.6,
        };
        const conflictResponse = await putProgression(equivalentInstant);
        await assertProblem(
            conflictResponse,
            409,
            STALE_PROBLEM_TYPE,
            "A more recent progression point is already available.",
        );

        const state = await getState();
        assert.equal(state.modified, newerWithinTheMillisecond.modified);
        assert.equal(state.progression, newerWithinTheMillisecond.progression);

        const leapSecond = {
            ...newerWithinTheMillisecond,
            modified: "2099-06-30T23:59:60Z",
            progression: 0.65,
        };
        const leapSecondResponse = await putProgression(leapSecond);
        assert.equal(leapSecondResponse.status, 200);

        const afterLeapSecond = {
            ...leapSecond,
            modified: "2099-07-01T00:00:00Z",
            progression: 0.7,
        };
        const afterLeapSecondResponse = await putProgression(afterLeapSecond);
        assert.equal(afterLeapSecondResponse.status, 200);
        assert.deepEqual(await afterLeapSecondResponse.json(), afterLeapSecond);
    });

    await context.test("replaces an existing document with a newer client document", async () => {
        const replacement = {
            modified: "2100-01-01T00:00:00.000Z",
            device: {
                id: "https://reader.example.test/device/2",
                name: "Thorium replacement device",
            },
            progression: 0.75,
        };

        const response = await putProgression(replacement);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), replacement);

        const state = await getState();
        assert.equal(state.title, undefined);
        assert.equal(state.progression, replacement.progression);
        assert.deepEqual(state.device, replacement.device);
        assert.equal(state.requests.lastPutStatus, 200);
    });

    await context.test("accepts an exact replay of the stored document idempotently", async () => {
        const replay = {
            modified: "2100-01-01T00:00:00.000Z",
            device: {
                id: "https://reader.example.test/device/2",
                name: "Thorium replacement device",
            },
            progression: 0.75,
        };

        const response = await putProgression(replay);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), replay);

        const state = await getState();
        assert.equal(state.modified, replay.modified);
        assert.equal(state.progression, replay.progression);
        assert.deepEqual(state.device, replay.device);
        assert.equal(state.requests.lastPutStatus, 200);
        assert.deepEqual(state.requests.lastPutBody, replay);
    });

    await context.test("rejects a different document with the stored timestamp", async () => {
        const conflicting = {
            modified: "2100-01-01T00:00:00.000Z",
            device: {
                id: "https://reader.example.test/device/2",
                name: "Thorium replacement device",
            },
            progression: 0.8,
        };

        const response = await putProgression(conflicting);
        await assertProblem(response, 409, STALE_PROBLEM_TYPE, "A more recent progression point is already available.");

        const state = await getState();
        assert.equal(state.modified, "2100-01-01T00:00:00.000Z");
        assert.equal(state.progression, 0.75);
        assert.equal(state.requests.lastPutStatus, 409);
        assert.deepEqual(state.requests.lastPutBody, conflicting);
    });

    await context.test("rejects a stale upload with the standard 409 Problem Details", async () => {
        const stale = {
            modified: "2099-12-31T23:59:59.000Z",
            device: { id: "urn:uuid:4f6da6f7-b592-483d-ac7c-42b80fbeb6dc", name: "Stale Thorium" },
            progression: 0.1,
        };
        const response = await putProgression(stale);
        await assertProblem(response, 409, STALE_PROBLEM_TYPE, "A more recent progression point is already available.");

        const state = await getState();
        assert.equal(state.modified, "2100-01-01T00:00:00.000Z");
        assert.equal(state.progression, 0.75);
        assert.equal(state.requests.lastPutStatus, 409);
        assert.deepEqual(state.requests.lastPutBody, stale);
    });

    await context.test("rejects uploads while locked with the standard 403 Problem Details", async () => {
        await updateState({ locked: true });
        const candidate = {
            modified: "2101-01-01T00:00:00.000Z",
            device: { id: "urn:uuid:4f6da6f7-b592-483d-ac7c-42b80fbeb6dc", name: "Locked Thorium" },
            progression: 0.9,
        };
        const response = await putProgression(candidate);
        await assertProblem(
            response,
            403,
            LOCKED_PROBLEM_TYPE,
            "Progression can no longer be updated for this publication.",
        );

        const state = await getState();
        assert.equal(state.locked, true);
        assert.equal(state.modified, "2100-01-01T00:00:00.000Z");
        assert.equal(state.progression, 0.75);
        assert.equal(state.requests.lastPutStatus, 403);
    });

    await context.test("can simulate an empty successful GET response", async () => {
        await updateState({ empty: true, locked: false });
        const response = await fetch(progressionUrl, { headers: { Accept: PROGRESSION_MEDIA_TYPE } });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("content-type"), PROGRESSION_MEDIA_TYPE);
        assert.equal(await response.text(), "");
    });

    await context.test("advertises GET and PUT and can reset all state and telemetry", async () => {
        const postResponse = await fetch(progressionUrl, { method: "POST" });
        assert.equal(postResponse.status, 405);
        assert.equal(postResponse.headers.get("allow"), "GET, PUT");
        assert.equal(postResponse.headers.get("content-type")?.startsWith(PROBLEM_MEDIA_TYPE), true);

        const resetResponse = await fetch(`${baseUrl}/__test/reset`, { method: "POST" });
        assert.equal(resetResponse.status, 200);
        const state = await resetResponse.json();
        assert.equal(state.empty, false);
        assert.equal(state.locked, false);
        assert.equal(state.progression, 0.625);
        assert.deepEqual(state.device, {
            id: "urn:uuid:f2438195-3b7c-4ea8-a8cf-668d624c11e5",
            name: "Thorium OPDS Progression Test Server",
        });
        assert.equal(state.requests.progressionGetCount, 0);
        assert.equal(state.requests.progressionPutCount, 0);
        assert.equal(state.requests.lastPutStatus, undefined);
    });
});
