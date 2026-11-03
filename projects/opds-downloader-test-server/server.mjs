import { createServer } from "node:http";

// No fixtures or dependencies: chapters are valid XHTML padded with spaces.
function positiveInteger(name, fallback, max) {
    const value = Number(process.env[name] ?? fallback);
    if (!Number.isInteger(value) || value < 1 || value > max) {
        throw new Error(`${name} must be an integer between 1 and ${max}`);
    }
    return value;
}

const port = positiveInteger("PORT", 4875, 65535);
const resourceCount = positiveInteger("RESOURCE_COUNT", 6, 100);
const resourceMiB = positiveInteger("RESOURCE_MIB", 2, 1024);
const chunkDelayMs = positiveInteger("CHUNK_DELAY_MS", 250, 60000);
const chunk = Buffer.alloc(32 * 1024, " ");
const baseUrl = `http://127.0.0.1:${port}`;
const manifestType = "application/webpub+json";
let activeTransfers = 0;

function metadata(book) {
    return {
        "@type": "http://schema.org/Book",
        identifier: `urn:thorium:slow-download:${book}`,
        title: `Slow download ${book}`,
        language: "en",
    };
}

function chapterSize(index) {
    return (resourceMiB + index - 1) * 1024 * 1024;
}

function send(request, response, type, body) {
    const buffer = Buffer.from(body);
    response.writeHead(200, { "Content-Type": type, "Content-Length": buffer.length });
    response.end(request.method === "HEAD" ? undefined : buffer);
}

const server = createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" }).end();
        return;
    }
    const pathname = new URL(request.url, baseUrl).pathname;
    if (pathname === "/" || pathname === "/opds.json") {
        send(request, response, "application/opds+json", JSON.stringify({
            metadata: { title: "Slow RWPM downloads", numberOfItems: 3 },
            links: [{ rel: "self", href: `${baseUrl}/opds.json`, type: "application/opds+json" }],
            publications: [1, 2, 3].map((book) => ({
                metadata: metadata(book),
                links: [{
                    rel: "http://opds-spec.org/acquisition/open-access",
                    href: `${baseUrl}/books/${book}/manifest.json`,
                    type: manifestType,
                    title: `Download slow publication ${book}`,
                }],
            })),
        }));
        return;
    }

    const route = /^\/books\/([1-3])\/(manifest\.json|chapter-(\d+)\.xhtml|style\.css)$/.exec(pathname);
    if (!route) {
        response.writeHead(404).end();
        return;
    }
    const [, book, filename, chapter] = route;
    if (filename === "manifest.json") {
        send(request, response, manifestType, JSON.stringify({
            "@context": "https://readium.org/webpub-manifest/context.jsonld",
            metadata: metadata(book),
            links: [{ rel: "self", href: `${baseUrl}${pathname}`, type: manifestType }],
            readingOrder: Array.from({ length: resourceCount }, (_, index) => ({
                href: `chapter-${index + 1}.xhtml`,
                type: "application/xhtml+xml",
                title: `Chapter ${index + 1}`,
                length: chapterSize(index + 1),
            })),
            resources: [{ href: "style.css", type: "text/css" }],
        }));
        return;
    }
    if (filename === "style.css") {
        send(request, response, "text/css", "body { font-family: sans-serif; }\n");
        return;
    }
    const index = Number(chapter);
    if (index < 1 || index > resourceCount) {
        response.writeHead(404).end();
        return;
    }

    const prefix = Buffer.from(`<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" lang="en"><head><title>Chapter ${index}</title><link rel="stylesheet" href="style.css"/></head><body><h1>Slow download ${book}, chapter ${index}</h1><p>Fake content for downloader testing.</p><!--`);
    const suffix = Buffer.from("--></body></html>");
    const length = chapterSize(index);
    response.writeHead(200, { "Content-Type": "application/xhtml+xml", "Content-Length": length });
    if (request.method === "HEAD") {
        response.end();
        return;
    }

    const started = Date.now();
    activeTransfers++;
    console.log(`START ${pathname} (${length / 1024 / 1024} MiB), active=${activeTransfers}`);
    let remaining = length - prefix.length - suffix.length;
    let timer;
    response.on("close", () => {
        clearTimeout(timer);
        activeTransfers--;
        console.log(`${response.writableFinished ? "DONE" : "ABORT"} ${pathname} (${((Date.now() - started) / 1000).toFixed(1)}s), active=${activeTransfers}`);
    });
    response.on("error", () => response.destroy());
    function writeChunk() {
        if (response.destroyed) return;
        const size = Math.min(chunk.length, remaining);
        remaining -= size;
        // The write callback waits for backpressure before scheduling more bytes.
        response.write(chunk.subarray(0, size), () => {
            if (response.destroyed) return;
            if (remaining === 0) response.end(suffix);
            else timer = setTimeout(writeChunk, chunkDelayMs);
        });
    }
    response.write(prefix);
    timer = setTimeout(writeChunk, chunkDelayMs);
});

server.listen(port, "127.0.0.1", () => {
    console.log(`Add this OPDS catalog in Thorium: ${baseUrl}/opds.json`);
    console.log(`3 publications, each with ${resourceCount} slow chapters (${resourceMiB}–${resourceMiB + resourceCount - 1} MiB), 32 KiB every ${chunkDelayMs} ms.`);
    console.log("Download several publications to test parallel batches. Ctrl+C stops the server.");
});
server.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
});
