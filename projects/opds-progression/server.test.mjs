import assert from "node:assert/strict";
import { test } from "node:test";

import {
    closeOpdsProgressionServer,
    EPUB_MEDIA_TYPE,
    OPDS_MEDIA_TYPE,
    PROGRESSION_MEDIA_TYPE,
    PROGRESSION_RELATION,
    startOpdsProgressionServer,
} from "./server.mjs";

test("OPDS progression fixture server contract", async (context) => {
    const server = await startOpdsProgressionServer(0);
    context.after(async () => closeOpdsProgressionServer(server));

    const address = server.address();
    assert.equal(typeof address, "object");
    assert.ok(address);
    const baseUrl = `http://127.0.0.1:${address.port}`;

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

        const rangeResponse = await fetch(epubUrl, {
            headers: {
                Range: "bytes=0-3",
            },
        });
        assert.equal(rangeResponse.status, 206);
        assert.equal(rangeResponse.headers.get("content-range")?.startsWith("bytes 0-3/"), true);
        assert.deepEqual(Array.from(new Uint8Array(await rangeResponse.arrayBuffer())), [0x50, 0x4b, 0x03, 0x04]);

        const invalidRangeResponse = await fetch(epubUrl, {
            headers: {
                Range: "bytes=999999999-",
            },
        });
        assert.equal(invalidRangeResponse.status, 416);
    });

    await context.test("requires the OPDS progression Accept header", async () => {
        const response = await fetch(`${baseUrl}/progression/accessible-epub-3`);
        assert.equal(response.status, 406);
        assert.equal((await response.text()).includes(PROGRESSION_MEDIA_TYPE), true);
    });

    await context.test("serves a float-only progression document and records the request", async () => {
        const response = await fetch(`${baseUrl}/progression/accessible-epub-3`, {
            headers: {
                Accept: PROGRESSION_MEDIA_TYPE,
            },
        });
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

        const stateResponse = await fetch(`${baseUrl}/__test/state`);
        const state = await stateResponse.json();
        assert.equal(state.requests.progressionGetCount, 2);
        assert.equal(state.requests.lastAccept, PROGRESSION_MEDIA_TYPE);
    });

    await context.test("updates progression state and rejects invalid floats", async () => {
        const invalidResponse = await fetch(`${baseUrl}/__test/state`, {
            body: JSON.stringify({ progression: 1.01 }),
            headers: { "Content-Type": "application/json" },
            method: "PUT",
        });
        assert.equal(invalidResponse.status, 400);

        const modified = "2040-01-02T03:04:05.000Z";
        const updateResponse = await fetch(`${baseUrl}/__test/state`, {
            body: JSON.stringify({
                modified,
                progression: 0.875,
                title: "Final-quarter midpoint",
            }),
            headers: { "Content-Type": "application/json" },
            method: "PUT",
        });
        assert.equal(updateResponse.status, 200);

        const response = await fetch(`${baseUrl}/progression/accessible-epub-3`, {
            headers: { Accept: PROGRESSION_MEDIA_TYPE },
        });
        const progression = await response.json();
        assert.equal(progression.modified, modified);
        assert.equal(progression.progression, 0.875);
        assert.equal(progression.title, "Final-quarter midpoint");
        assert.equal(Object.prototype.hasOwnProperty.call(progression, "references"), false);
    });

    await context.test("can simulate an empty successful progression response", async () => {
        const updateResponse = await fetch(`${baseUrl}/__test/state`, {
            body: JSON.stringify({ empty: true }),
            headers: { "Content-Type": "application/json" },
            method: "PUT",
        });
        assert.equal(updateResponse.status, 200);

        const response = await fetch(`${baseUrl}/progression/accessible-epub-3`, {
            headers: { Accept: PROGRESSION_MEDIA_TYPE },
        });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("content-type"), PROGRESSION_MEDIA_TYPE);
        assert.equal(await response.text(), "");
    });

    await context.test("keeps the progression resource GET-only and can reset state", async () => {
        const putResponse = await fetch(`${baseUrl}/progression/accessible-epub-3`, {
            body: "{}",
            method: "PUT",
        });
        assert.equal(putResponse.status, 405);
        assert.equal(putResponse.headers.get("allow"), "GET");

        const resetResponse = await fetch(`${baseUrl}/__test/reset`, { method: "POST" });
        assert.equal(resetResponse.status, 200);
        const state = await resetResponse.json();
        assert.equal(state.empty, false);
        assert.equal(state.progression, 0.625);
        assert.equal(state.requests.progressionGetCount, 0);
    });
});
