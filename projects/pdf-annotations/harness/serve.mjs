import { createReadStream, statSync } from "node:fs";
import { access, constants } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const harnessDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(harnessDir, "../../..");
const port = Number(process.argv[2]) || 4173;

const mimeTypes = new Map([
    [".bcmap", "application/octet-stream"],
    [".css", "text/css; charset=utf-8"],
    [".ftl", "text/plain; charset=utf-8"],
    [".gif", "image/gif"],
    [".html", "text/html; charset=utf-8"],
    [".icc", "application/octet-stream"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".js", "application/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".map", "application/json; charset=utf-8"],
    [".mjs", "application/javascript; charset=utf-8"],
    [".pdf", "application/pdf"],
    [".png", "image/png"],
    [".svg", "image/svg+xml"],
    [".wasm", "application/wasm"],
    [".webp", "image/webp"],
]);

function resolveRequestPath(pathname) {
    const pathFromRoot = pathname === "/"
        ? "/projects/pdf-annotations/harness/standalone.html"
        : pathname;
    const decodedPath = decodeURIComponent(pathFromRoot);
    const normalizedPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
    const absolutePath = resolve(join(repoRoot, normalizedPath));
    const rootWithSeparator = repoRoot.endsWith(sep) ? repoRoot : `${repoRoot}${sep}`;

    if (absolutePath !== repoRoot && !absolutePath.startsWith(rootWithSeparator)) {
        return undefined;
    }

    return absolutePath;
}

function parseRange(rangeHeader, fileSize) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || "");
    if (!match) {
        return undefined;
    }

    const startText = match[1];
    const endText = match[2];
    let start = startText ? Number(startText) : 0;
    let end = endText ? Number(endText) : fileSize - 1;

    if (!startText && endText) {
        const suffixLength = Number(endText);
        start = Math.max(fileSize - suffixLength, 0);
        end = fileSize - 1;
    }

    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start < 0) {
        return undefined;
    }

    return {
        end: Math.min(end, fileSize - 1),
        start,
    };
}

const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const filePath = resolveRequestPath(url.pathname);

    if (!filePath) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    try {
        await access(filePath, constants.R_OK);
    } catch {
        response.writeHead(404);
        response.end("Not found");
        return;
    }

    const stats = statSync(filePath);
    if (!stats.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
    }

    const contentType = mimeTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream";
    const range = parseRange(request.headers.range, stats.size);

    if (range) {
        response.writeHead(206, {
            "Accept-Ranges": "bytes",
            "Content-Length": range.end - range.start + 1,
            "Content-Range": `bytes ${range.start}-${range.end}/${stats.size}`,
            "Content-Type": contentType,
        });
        createReadStream(filePath, range).pipe(response);
        return;
    }

    response.writeHead(200, {
        "Accept-Ranges": "bytes",
        "Content-Length": stats.size,
        "Content-Type": contentType,
    });
    createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
    console.log(`PDF annotation harness: http://127.0.0.1:${port}/projects/pdf-annotations/harness/standalone.html`);
    console.log(`Serving repository root: ${repoRoot}`);
});
