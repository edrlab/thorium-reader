import Ajv from "ajv";
import addFormats from "ajv-formats";
import { createHash, createPrivateKey, createPublicKey, createSign, createVerify, KeyObject } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import * as fs from "node:fs/promises";
import { constants } from "node:fs";
import * as path from "node:path";
import { pipeline } from "node:stream/promises";
import { crc32 } from "node:zlib";
import { ZipFile } from "yazl";

import type { ICustomizationManifest, ICustomizationLink } from "readium-desktop/common/readium/customization/manifest";
import { customizationManifestJsonSchemaMinimal } from "readium-desktop/common/readium/customization/profile.schema";
import { readProfileArchive } from "#profile-cli/zip";

const signatureAlgorithm = "https://www.w3.org/2008/xmlsec/namespaces.html#ECKeyValue";
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile<ICustomizationManifest>(customizationManifestJsonSchemaMinimal);

function validateManifest(data: unknown): ICustomizationManifest {
    if (!validate(data)) {
        throw new Error(`Invalid manifest.json: ${ajv.errorsText(validate.errors)}`);
    }
    if (data.version !== 1) {
        throw new Error("Unsupported manifest version: expected 1");
    }
    return data;
}

function resourcePaths(manifest: ICustomizationManifest): string[] {
    const publications = (manifest.publications || []) as Array<{
        images?: ICustomizationLink[];
        links?: ICustomizationLink[];
    }>;
    const links = [
        ...(manifest.images || []),
        ...(manifest.links || []),
        ...publications.flatMap((publication) => [...(publication.images || []), ...(publication.links || [])]),
    ];
    const resources = new Set<string>();
    for (const link of links) {
        const href = link?.href;
        if (typeof href !== "string" || !href) {
            throw new Error("Every profile resource must have a nonempty href");
        }
        if (href.includes("\\") || href.includes("\0") || /^[a-z]:/i.test(href)) {
            throw new Error(`Invalid local resource path: ${href}`);
        }
        if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//") || href.startsWith("#")) {
            continue;
        }
        const normalized = path.posix.normalize(href);
        if (
            path.posix.isAbsolute(normalized) ||
            normalized === ".." ||
            normalized.startsWith("../") ||
            normalized === "." ||
            normalized === "manifest.json"
        ) {
            throw new Error(`Invalid local resource path: ${href}`);
        }
        resources.add(normalized);
    }
    return [...resources].sort();
}

function checkKey(key: KeyObject) {
    if (key.asymmetricKeyType !== "ec" || key.asymmetricKeyDetails?.namedCurve !== "secp521r1") {
        throw new Error("Expected an EC P-521 (secp521r1) PEM key");
    }
}

export async function readPublicKey(file: string) {
    const key = createPublicKey(await fs.readFile(file));
    checkKey(key);
    return key;
}

export async function verifyProfile(input: string, publicKey: KeyObject) {
    const { manifest: data, contentHash, entries } = await readProfileArchive(input);
    const manifest = validateManifest(data);
    const signature = manifest.signature;
    const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();
    if (!signature || typeof signature.value !== "string" || !/^(?:[a-f0-9]{2})+$/i.test(signature.value)) {
        throw new Error("Missing or invalid profile signature");
    }
    if (typeof signature.key !== "string" || signature.key.trim() !== publicPem.trim()) {
        throw new Error("Profile public key does not match the supplied public key");
    }
    if (signature.algorithm !== signatureAlgorithm) {
        throw new Error("Unsupported profile signature algorithm");
    }
    const verify = createVerify("SHA256");
    verify.update(JSON.stringify({ ...manifest, signature: undefined }));
    verify.end();
    if (!verify.verify(publicKey, signature.value, "hex")) {
        throw new Error("Invalid manifest signature");
    }
    if (manifest.contentHash !== contentHash) {
        throw new Error("Profile contentHash does not match archive resources");
    }
    const missing = resourcePaths(manifest).filter((resource) => !entries.has(resource));
    if (missing.length) {
        throw new Error(`Missing local profile resources:\n${missing.join("\n")}`);
    }
}

export async function packProfile(input: string, output: string, privateKeyFile: string, publicKeyFile: string) {
    const publicKey = await readPublicKey(publicKeyFile);
    const privateKey = createPrivateKey(await fs.readFile(privateKeyFile));
    checkKey(privateKey);
    const publicDer = publicKey.export({ type: "spki", format: "der" });
    const derivedDer = createPublicKey(privateKey).export({ type: "spki", format: "der" });
    if (!publicDer.equals(derivedDer)) {
        throw new Error("Private and public keys do not match");
    }

    const inputDirectory = await fs.realpath(input);
    const manifest = validateManifest(
        JSON.parse(await fs.readFile(path.join(inputDirectory, "manifest.json"), "utf8")),
    );
    const resources: Array<{ file: string; entry: string }> = [];
    const missing: string[] = [];
    for (const entry of resourcePaths(manifest)) {
        const file = path.resolve(inputDirectory, ...entry.split("/"));
        let real: string;
        try {
            real = await fs.realpath(file);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
                throw error;
            }
            missing.push(entry);
            continue;
        }
        const relative = path.relative(inputDirectory, real);
        if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
            throw new Error(`Resource resolves outside the profile directory: ${entry}`);
        }
        if (!(await fs.stat(real)).isFile()) {
            throw new Error(`Resource is not a regular file: ${entry}`);
        }
        resources.push({ file: real, entry });
    }
    if (missing.length) {
        throw new Error(`Missing local profile resources:\n${missing.join("\n")}`);
    }

    // Preserve the contentHash format expected by existing Thorium readers.
    const hash = createHash("sha1").update("|");
    for (const resource of resources) {
        let checksum = 0;
        for await (const chunk of createReadStream(resource.file)) {
            checksum = crc32(chunk as Buffer, checksum);
        }
        hash.update(`${checksum.toString(16)}|`);
    }
    manifest.contentHash = hash.digest("hex");
    manifest.signature = undefined;
    const sign = createSign("SHA256");
    sign.update(JSON.stringify(manifest));
    sign.end();
    manifest.signature = {
        key: publicKey.export({ type: "spki", format: "pem" }).toString(),
        value: sign.sign(privateKey, "hex"),
        algorithm: signatureAlgorithm,
    };

    const outputFile = path.resolve(output);
    if (path.extname(outputFile).toLowerCase() !== ".thorium") {
        throw new Error("Output filename must have the .thorium extension");
    }
    const temporaryDirectory = await fs.mkdtemp(path.join(path.dirname(outputFile), ".thorium-profile-"));
    const temporaryFile = path.join(temporaryDirectory, "profile.thorium");
    try {
        const zip = new ZipFile();
        const stream = createWriteStream(temporaryFile, { flags: "wx" });
        zip.on("error", (error: Error) => stream.destroy(error));
        for (const resource of resources) {
            zip.addFile(resource.file, resource.entry);
        }
        zip.addBuffer(Buffer.from(JSON.stringify(manifest, undefined, 4)), "manifest.json");
        const completion = pipeline(zip.outputStream, stream);
        zip.end();
        await completion;
        await verifyProfile(temporaryFile, publicKey);
        await fs.copyFile(temporaryFile, outputFile, constants.COPYFILE_EXCL);
    } finally {
        await fs.rm(temporaryDirectory, { recursive: true, force: true });
    }
    return outputFile;
}
