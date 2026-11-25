import { createHash } from "node:crypto";
import { on } from "node:events";
import { Readable } from "node:stream";
import { crc32 } from "node:zlib";
import * as yauzl from "yauzl";

export async function readProfileArchive(file: string) {
    const zip = await new Promise<yauzl.ZipFile>((resolve, reject) => {
        yauzl.open(file, { lazyEntries: true, autoClose: false, strictFileNames: true }, (error, archive) => {
            if (error) reject(error);
            else resolve(archive);
        });
    });
    const entries = new Set<string>();
    const hash = createHash("sha1").update("|");
    let manifest: unknown;
    const iterator = on(zip, "entry", { close: ["end"] });
    try {
        zip.readEntry();
        for await (const event of iterator) {
            const [entry] = event as [yauzl.Entry];
            if (entries.has(entry.fileName)) {
                throw new Error(`Duplicate ZIP entry: ${entry.fileName}`);
            }
            entries.add(entry.fileName);
            if (entry.fileName === "manifest.json" && entry.uncompressedSize > 16 * 1024 * 1024) {
                throw new Error("manifest.json exceeds 16 MiB");
            }
            const stream = await new Promise<Readable>((resolve, reject) => {
                zip.openReadStream(entry, (error, readable) => {
                    if (error) reject(error);
                    else resolve(readable);
                });
            });
            let checksum = 0;
            const buffers: Buffer[] = [];
            for await (const chunk of stream) {
                const buffer = chunk as Buffer;
                checksum = crc32(buffer, checksum);
                if (entry.fileName === "manifest.json") buffers.push(buffer);
            }
            if (checksum !== entry.crc32) {
                throw new Error(`ZIP resource CRC32 mismatch: ${entry.fileName}`);
            }
            if (entry.fileName === "manifest.json") {
                manifest = JSON.parse(Buffer.concat(buffers).toString("utf8"));
            } else {
                hash.update(`${entry.crc32.toString(16)}|`);
            }
            zip.readEntry();
        }
    } finally {
        zip.close();
    }
    if (!entries.has("manifest.json")) {
        throw new Error("Archive has no manifest.json");
    }
    return { manifest, contentHash: hash.digest("hex"), entries };
}
