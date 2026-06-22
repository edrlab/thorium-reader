import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import {
    computeFileSha256,
    fileSha256MatchesExpectedHash,
    ISha256FileHash,
    normalizeSha256HashForComparison,
} from "readium-desktop/main/tools/fileIntegrity";

describe("fileIntegrity", () => {
    let dir: string;
    let filePath: string;

    beforeAll(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), "thorium-file-integrity-"));
        filePath = path.join(dir, "sample.bin");
        fs.writeFileSync(filePath, "thorium-lcp-publication-update");
    });

    afterAll(() => {
        fs.rmSync(dir, { force: true, recursive: true });
    });

    it("computes SHA-256 hashes in supported encodings", async () => {
        const digest = crypto.createHash("sha256")
            .update("thorium-lcp-publication-update")
            .digest();

        await expect(computeFileSha256(filePath)).resolves.toEqual({
            base64: digest.toString("base64"),
            base64url: digest.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
            base64urlWithPadding: digest.toString("base64").replace(/\+/g, "-").replace(/\//g, "_"),
            hex: digest.toString("hex"),
        });
    });

    it("matches hex, base64, base64url, and prefixed SHA-256 hashes", async () => {
        const actualHash = await computeFileSha256(filePath);

        expect(fileSha256MatchesExpectedHash(actualHash.hex.toUpperCase(), actualHash)).toBe(true);
        expect(fileSha256MatchesExpectedHash(actualHash.base64, actualHash)).toBe(true);
        expect(fileSha256MatchesExpectedHash(actualHash.base64url, actualHash)).toBe(true);
        expect(fileSha256MatchesExpectedHash(actualHash.base64urlWithPadding, actualHash)).toBe(true);
        expect(fileSha256MatchesExpectedHash(`sha256-${actualHash.base64}`, actualHash)).toBe(true);
        expect(fileSha256MatchesExpectedHash("nope", actualHash)).toBe(false);
    });

    it("accepts missing expected hashes as no integrity constraint", async () => {
        const actualHash = await computeFileSha256(filePath);

        expect(fileSha256MatchesExpectedHash(undefined, actualHash)).toBe(true);
        expect(fileSha256MatchesExpectedHash("", actualHash)).toBe(true);
        expect(fileSha256MatchesExpectedHash("   ", actualHash)).toBe(true);
    });

    it("normalizes hex hashes case-insensitively without changing base64 case", () => {
        expect(normalizeSha256HashForComparison("ABCD")).toBe("ABCD");
        expect(normalizeSha256HashForComparison("A".repeat(64))).toBe("a".repeat(64));
    });

    it("strips supported SHA-256 prefixes before comparing hashes", () => {
        const hex = "A".repeat(64);
        const normalizedHex = "a".repeat(64);

        expect(normalizeSha256HashForComparison(` sha256-${hex} `)).toBe(normalizedHex);
        expect(normalizeSha256HashForComparison(`sha256=${hex}`)).toBe(normalizedHex);
        expect(normalizeSha256HashForComparison(`sha256:${hex}`)).toBe(normalizedHex);
        expect(normalizeSha256HashForComparison(`sha-256-${hex}`)).toBe(normalizedHex);
        expect(normalizeSha256HashForComparison(`sha-256=${hex}`)).toBe(normalizedHex);
        expect(normalizeSha256HashForComparison(`sha-256:${hex}`)).toBe(normalizedHex);
        expect(normalizeSha256HashForComparison("sha256-")).toBeUndefined();
    });

    it("keeps base64 comparisons case-sensitive", () => {
        const actualHash: ISha256FileHash = {
            base64: "AbCdEf+/=",
            base64url: "AbCdEf-_",
            base64urlWithPadding: "AbCdEf-_=",
            hex: "0".repeat(64),
        };

        expect(fileSha256MatchesExpectedHash("AbCdEf+/=", actualHash)).toBe(true);
        expect(fileSha256MatchesExpectedHash("abcdef+/=", actualHash)).toBe(false);
    });
});
