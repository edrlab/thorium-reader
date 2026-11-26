import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash, createVerify, generateKeyPairSync } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pipeline } from "node:stream/promises";
import { crc32 } from "node:zlib";
import * as yauzl from "yauzl";
import { ZipFile } from "yazl";
import type { ICustomizationManifest } from "readium-desktop/common/readium/customization/manifest";

async function readEntries(file: string): Promise<Map<string, Buffer>> {
    return new Promise((resolve, reject) => {
        yauzl.open(file, { lazyEntries: true }, (error, zip) => {
            if (error) return reject(error);
            const entries = new Map<string, Buffer>();
            zip.on("error", reject);
            zip.on("end", () => resolve(entries));
            zip.on("entry", (entry: yauzl.Entry) => {
                zip.openReadStream(entry, (streamError, stream) => {
                    if (streamError) return reject(streamError);
                    const chunks: Buffer[] = [];
                    stream.on("error", reject);
                    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
                    stream.on("end", () => {
                        entries.set(entry.fileName, Buffer.concat(chunks));
                        zip.readEntry();
                    });
                });
            });
            zip.readEntry();
        });
    });
}

async function writeEntries(file: string, entries: Map<string, Buffer>) {
    const zip = new ZipFile();
    for (const [name, data] of entries) zip.addBuffer(data, name, { compress: false });
    const completion = pipeline(zip.outputStream, fs.createWriteStream(file));
    zip.end();
    await completion;
}

describe("standalone customization profile CLI", () => {
    let root: string;
    let cli: string;
    let privateKeyFile: string;
    let publicKeyFile: string;
    let publicPem: string;
    let otherPublicKeyFile: string;
    let directory: string;
    let input: string;
    let output: string;
    let manifest: ICustomizationManifest;

    beforeAll(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), "thorium-profile-standalone-"));
        cli = path.join(root, "thorium-profile.cjs");
        execFileSync(process.execPath, [path.resolve("projects/customization-profile-cli/build.mjs"), cli]);
        fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ type: "module" }));
        const pair = generateKeyPairSync("ec", {
            namedCurve: "secp521r1",
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
            publicKeyEncoding: { type: "spki", format: "pem" },
        });
        publicPem = pair.publicKey;
        privateKeyFile = path.join(root, "private key.pem");
        publicKeyFile = path.join(root, "public key.pem");
        fs.writeFileSync(privateKeyFile, pair.privateKey);
        fs.writeFileSync(publicKeyFile, pair.publicKey);
        otherPublicKeyFile = path.join(root, "other-public.pem");
        fs.writeFileSync(
            otherPublicKeyFile,
            generateKeyPairSync("ec", {
                namedCurve: "secp521r1",
            }).publicKey.export({ type: "spki", format: "pem" }),
        );
    });

    beforeEach(() => {
        directory = fs.mkdtempSync(path.join(root, "case-"));
        input = path.join(directory, "profile with spaces");
        fs.mkdirSync(input);
        output = path.join(directory, "signed profile.thorium");
        manifest = JSON.parse(
            fs.readFileSync(path.resolve("test/customization/profile/thorium_university_press/manifest.json"), "utf8"),
        );
        manifest.images = [];
        manifest.links = [];
        manifest.publications = [];
    });

    afterAll(() => {
        if (root) fs.rmSync(root, { recursive: true, force: true });
    });

    function run(...args: string[]) {
        return spawnSync(process.execPath, [cli, ...args], {
            cwd: directory,
            encoding: "utf8",
            timeout: 10000,
            env: {
                ...process.env,
                NODE_PATH: "",
                NODE_OPTIONS: "",
                __TH__CUSTOMIZATION_PROFILE_PRIVATE_KEY__: "must not be used",
                __TH__CUSTOMIZATION_PROFILE_PUB_KEY__: "must not be used",
            },
        });
    }

    function pack(destination = output) {
        fs.writeFileSync(path.join(input, "manifest.json"), JSON.stringify(manifest));
        return run(
            "pack",
            "--input",
            input,
            "--output",
            destination,
            "--private-key",
            privateKeyFile,
            "--public-key",
            publicKeyFile,
        );
    }

    it("runs outside the repository and produces a reader-compatible signed archive", async () => {
        fs.mkdirSync(path.join(input, "images"));
        const resource = Buffer.from("<svg>é</svg>");
        fs.writeFileSync(path.join(input, "images", "café logo.svg"), resource);
        fs.writeFileSync(path.join(input, "unreferenced.txt"), "unused");
        manifest.images = [{ href: "./images/café logo.svg" }];
        manifest.links = [{ href: "https://example.org/catalog", properties: {} }];

        const result = pack();
        expect(result.stderr).toBe("");
        expect(result.status).toBe(0);
        expect(result.stdout).toContain(`OUTPUT= ${output}`);
        const entries = await readEntries(output);
        expect([...entries.keys()]).toEqual(["images/café logo.svg", "manifest.json"]);
        expect(entries.get("images/café logo.svg")).toEqual(resource);
        const signed = JSON.parse(entries.get("manifest.json").toString("utf8")) as ICustomizationManifest;
        expect(signed.signature.key).toBe(publicPem);
        const verifier = createVerify("SHA256");
        verifier.update(JSON.stringify({ ...signed, signature: undefined }));
        verifier.end();
        expect(verifier.verify(publicPem, signed.signature.value, "hex")).toBe(true);
        expect(signed.contentHash).toBe(
            createHash("sha1")
                .update(`|${crc32(resource).toString(16)}|`)
                .digest("hex"),
        );
        const verified = run("verify", "--input", output, "--public-key", publicKeyFile);
        expect(verified.stderr).toBe("");
        expect(verified.status).toBe(0);
        expect(verified.stdout).toContain("VERIFIED=");
    });

    it("signs manifest-only profiles using the existing empty-resource hash", async () => {
        expect(pack().status).toBe(0);
        const entries = await readEntries(output);
        const signed = JSON.parse(entries.get("manifest.json").toString("utf8")) as ICustomizationManifest;
        expect(signed.contentHash).toBe(createHash("sha1").update("|").digest("hex"));
        expect(run("verify", "--input", output, "--public-key", publicKeyFile).status).toBe(0);
    });

    it("rejects mismatched keys without producing an archive", () => {
        fs.writeFileSync(path.join(input, "manifest.json"), JSON.stringify(manifest));
        const result = run(
            "pack",
            "--input",
            input,
            "--output",
            output,
            "--private-key",
            privateKeyFile,
            "--public-key",
            otherPublicKeyFile,
        );
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("keys do not match");
        expect(fs.existsSync(output)).toBe(false);
    });

    it("reports missing profile and publication resources before writing output", () => {
        manifest.images = [{ href: "./images/logo.svg" }];
        manifest.links = [{ href: "./screens/help.html", properties: {} }];
        manifest.publications = [{ images: [{ href: "books/cover.png" }], links: [{ href: "./books/book.epub" }] }];
        const result = pack();
        expect(result.status).toBe(1);
        for (const file of ["images/logo.svg", "screens/help.html", "books/cover.png", "books/book.epub"]) {
            expect(result.stderr).toContain(file);
        }
        expect(fs.existsSync(output)).toBe(false);
    });

    it.each(["../outside.svg", "./../outside.svg", "/absolute.svg", "images\\logo.svg", "C:/outside.svg"])(
        "rejects a nonportable or escaping resource path: %s",
        (href) => {
            manifest.images = [{ href }];
            const result = pack();
            expect(result.status).toBe(1);
            expect(result.stderr).toContain("Invalid local resource path");
            expect(fs.existsSync(output)).toBe(false);
        },
    );

    it("preserves an existing destination and reports output errors with exit code 1", () => {
        fs.writeFileSync(output, "existing profile");
        const existing = pack();
        expect(existing.status).toBe(1);
        expect(existing.stdout).not.toContain("OUTPUT=");
        expect(fs.readFileSync(output, "utf8")).toBe("existing profile");
        expect(pack(path.join(directory, "missing", "profile.thorium")).status).toBe(1);
        expect(fs.readdirSync(directory).filter((name) => name.startsWith(".thorium-profile-"))).toEqual([]);
    });

    it("rejects unsupported manifest versions and invalid manifest JSON", () => {
        manifest.version = 2;
        const result = pack();
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("Unsupported manifest version");
        fs.writeFileSync(path.join(input, "manifest.json"), "{");
        expect(
            run(
                "pack",
                "--input",
                input,
                "--output",
                output,
                "--private-key",
                privateKeyFile,
                "--public-key",
                publicKeyFile,
            ).status,
        ).toBe(1);
        expect(fs.existsSync(output)).toBe(false);
    });

    it.each([
        ["pack", "--signed=tru"],
        ["pack", "--input", ".", "--output", "profile.thorium"],
        ["verify", "--input", "profile.thorium"],
        ["unknown", "--input", ".", "--public-key", "key.pem"],
    ])("rejects invalid or incomplete arguments: %j", (...args) => {
        expect(run(...args).status).toBe(1);
    });

    it("verifies against the supplied trusted public key", () => {
        expect(pack().status).toBe(0);
        const result = run("verify", "--input", output, "--public-key", otherPublicKeyFile);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("does not match the supplied public key");
    });

    it("rejects altered manifest signatures and changed resource contents", async () => {
        fs.writeFileSync(path.join(input, "logo.svg"), "original resource");
        manifest.images = [{ href: "./logo.svg" }];
        expect(pack().status).toBe(0);
        const original = await readEntries(output);
        const changedManifest = new Map(original);
        const signed = JSON.parse(original.get("manifest.json").toString("utf8")) as ICustomizationManifest;
        signed.description = "tampered description";
        changedManifest.set("manifest.json", Buffer.from(JSON.stringify(signed)));
        const tampered = path.join(directory, "tampered.thorium");
        await writeEntries(tampered, changedManifest);
        expect(run("verify", "--input", tampered, "--public-key", publicKeyFile).stderr).toContain(
            "Invalid manifest signature",
        );

        const changedResource = new Map(original);
        changedResource.set("logo.svg", Buffer.from("modified resource"));
        await writeEntries(tampered, changedResource);
        const result = run("verify", "--input", tampered, "--public-key", publicKeyFile);
        expect(result.status).toBe(1);
        expect(result.stderr).toContain("contentHash");

        const damaged = fs.readFileSync(tampered);
        const index = damaged.indexOf(Buffer.from("modified resource"));
        expect(index).toBeGreaterThan(0);
        damaged[index] ^= 1;
        fs.writeFileSync(tampered, damaged);
        const corrupt = run("verify", "--input", tampered, "--public-key", publicKeyFile);
        expect(corrupt.status).toBe(1);
        expect(corrupt.stderr).toContain("CRC32 mismatch");
    });

    it("accepts an existing profile produced by the legacy signer", async () => {
        const fixture = path.resolve(
            "test/customization/profile/Thorium-University-Press_2025-12-02T7-37-37Z_prod_signed.thorium",
        );
        const entries = await readEntries(fixture);
        const signed = JSON.parse(entries.get("manifest.json").toString("utf8")) as ICustomizationManifest;
        const keyFile = path.join(directory, "legacy-public.pem");
        fs.writeFileSync(keyFile, signed.signature.key);
        const result = run("verify", "--input", fixture, "--public-key", keyFile);
        expect(result.stderr).toBe("");
        expect(result.status).toBe(0);
    });
});
