import { describe, expect, it } from "@jest/globals";
import { formatImportDiagnostics } from "readium-desktop/main/tools/importDiagnostics";
import { DownloadFailure, checkDownloadResponse } from "readium-desktop/main/tools/downloadFailure";
import type { IHttpGetResult } from "readium-desktop/common/utils/http";

describe("import clipboard diagnostics", () => {
    it("includes original nested stacks and the full file path as source", () => {
        const cause = new Error("Original failure");
        const error = new Error("Import failed", { cause });
        const text = formatImportDiagnostics("Safe message", error, "/private/books/book.epub");
        expect(text).toContain("Source: /private/books/book.epub");
        expect(formatImportDiagnostics("Safe", error, "C:\\private\\books\\book.epub"))
            .toContain("Source: C:\\private\\books\\book.epub");
        expect(text).toContain(error.stack);
        expect(text).toContain(cause.stack);
    });

    it("keeps URL paths, non-sensitive queries and fragments while redacting credentials and license data", () => {
        const error = new Error("Request https://user:password@example.org:8443/book?page=2&token=secret#chapter Authorization: Bearer credential");
        const text = formatImportDiagnostics("Safe message", error);
        for (const secret of ["user:password", "token=secret", "credential"]) expect(text).not.toContain(secret);
        expect(text).toContain("https://example.org:8443/book?page=2&token=%5Bredacted%5D#chapter");
        const license = formatImportDiagnostics("Safe message", new Error('LCP license malformed: {"email":"private@example.org"}'));
        expect(license).not.toContain("private@example.org");
        expect(license).toContain("[license data omitted]");
    });

    it("retains HTTP status and the non-enumerable original transport stack without dumping a response", () => {
        const original = new Error("Connection reset");
        const data = { isSuccess: false, isNetworkError: true, statusCode: 503, statusMessage: "Unavailable",
            url: "https://example.org/private?secret=1", response: { headers: { authorization: "secret-header" }, body: "secret-body" } };
        Object.defineProperty(data, "cause", { value: original, enumerable: false });
        let error: unknown;
        try { checkDownloadResponse(data as unknown as IHttpGetResult<unknown>, data.url); } catch (failure) { error = failure; }
        const text = formatImportDiagnostics("Safe message", error, data.url);
        expect(error).toBeInstanceOf(DownloadFailure);
        expect(text).toContain("Category: network");
        expect(text).toContain("Request URL: https://example.org/private?secret=%5Bredacted%5D");
        expect(text).toContain("HTTP status: 503");
        expect(text).toContain(original.stack);
        expect(text).not.toContain("secret-header");
        expect(text).not.toContain("secret-body");
        expect(JSON.stringify(data)).not.toContain("Connection reset");
    });

    it("handles circular causes, missing stacks, thrown strings, and unknown values", () => {
        const cyclic = new Error("Circular");
        Object.defineProperty(cyclic, "cause", { value: cyclic });
        expect(formatImportDiagnostics("Safe", cyclic)).toContain("[circular cause omitted]");
        expect(formatImportDiagnostics("Safe", { name: "CustomError", message: "No stack" })).toContain("CustomError: No stack");
        expect(formatImportDiagnostics("Safe", "Thrown string")).toContain("Thrown string");
        expect(formatImportDiagnostics("Safe", { password: "do not serialize" })).not.toContain("do not serialize");
        expect(() => formatImportDiagnostics("Safe", null)).not.toThrow();
    });

    it("bounds diagnostic length and cause depth", () => {
        expect(formatImportDiagnostics("Safe", new Error("x".repeat(100000))).length).toBeLessThanOrEqual(24000);
        let error = new Error("Deepest");
        for (let n = 0; n < 10; n++) error = new Error(`Level ${n}`, { cause: error });
        const text = formatImportDiagnostics("Safe", error);
        expect(text).toContain("[cause depth limit reached]");
        expect(text).not.toContain("Deepest");
    });

    it("does not fail if diagnostic properties have throwing getters", () => {
        const error = Object.create(null);
        Object.defineProperty(error, "stack", { get: () => { throw new Error("getter failed"); } });
        expect(() => formatImportDiagnostics("Safe", error)).not.toThrow();
    });
});


it("includes the failing resource URL alongside the original local import path", () => {
    const source = "https://cdn.example.org:8443/resources/chapter.xhtml?page=2#part";
    const text = formatImportDiagnostics("Safe", new DownloadFailure("network", source), "/books/license.lcpl");
    expect(text).toContain("Source: /books/license.lcpl");
    expect(text).toContain(`Download source: ${source}`);
});
