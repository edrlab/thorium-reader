import { describe, expect, it } from "@jest/globals";
import { formatImportDiagnostics } from "readium-desktop/main/tools/importDiagnostics";
import { getTranslator, setLocale } from "readium-desktop/common/services/translator";
import { DownloadCancelled, DownloadFailure, checkDownloadResponse } from "readium-desktop/main/tools/downloadFailure";
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

    it("removes explicit URL credentials while preserving queries and fragments", () => {
        const source = "https://user:password@example.org:8443/book?page=2&token=secret#chapter";
        const text = formatImportDiagnostics("Safe message", undefined, source);
        expect(text).toContain("Source: https://example.org:8443/book?page=2&token=secret#chapter");
        expect(text).not.toContain("user:password");
        expect(formatImportDiagnostics("Safe", undefined, "https://[invalid")).toContain("[invalid URL]");
    });

    it("copies stack text unchanged instead of applying pattern-based redaction", () => {
        const error = new Error("Authorization: Basic example-token https://user:password@example.org/book?token=abc'def");
        expect(formatImportDiagnostics("Safe", error)).toContain(error.stack);
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
        expect(text).toContain("URL: https://example.org/private?secret=1");
        expect(text).not.toContain("Unavailable");
        expect(text).toContain("HTTP status: 503");
        expect(text).toContain(original.stack);
        expect(text).not.toContain("secret-header");
        expect(text).not.toContain("secret-body");
        expect(JSON.stringify(data)).not.toContain("Connection reset");
    });

    it("handles circular causes, missing stacks, thrown strings, and unknown values", () => {
        const cyclic = new Error("Circular");
        Object.defineProperty(cyclic, "cause", { value: cyclic });
        expect(formatImportDiagnostics("Safe", cyclic)).toBe(`Safe\n\n${cyclic.stack}`);
        expect(formatImportDiagnostics("Safe", { name: "CustomError", message: "No stack" })).toContain("CustomError: No stack");
        expect(formatImportDiagnostics("Safe", "Thrown string")).toContain("Thrown string");
        expect(formatImportDiagnostics("Safe", { password: "do not serialize" })).toBe("Safe");
        expect(() => formatImportDiagnostics("Safe", null)).not.toThrow();
    });

    it("bounds diagnostic length and cause depth", () => {
        expect(formatImportDiagnostics("Safe", new Error("x".repeat(100000))).length).toBeLessThanOrEqual(24000);
        let error = new Error("Deepest");
        for (let n = 0; n < 10; n++) error = new Error(`Level ${n}`, { cause: error });
        const text = formatImportDiagnostics("Safe", error);
        expect(text.match(/Caused by:/g)).toHaveLength(5);
        expect(text.endsWith("Caused by:")).toBe(false);
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


it("includes only the final HTTP URL and numeric status from a response", () => {
    const data = { url: "https://origin.example/book", responseUrl: "https://user:password@cdn.example/book?key=123#part",
        statusCode: 403, statusMessage: "Do not copy server-provided text", response: { body: "Do not copy body" } };
    const text = formatImportDiagnostics("Safe", data);
    expect(text).toBe("Safe\n\nURL: https://cdn.example/book?key=123#part\n\nHTTP status: 403");
});


it("localizes diagnostic labels and download errors in French while retaining native stacks", async () => {
    await setLocale("fr");
    try {
        const native = new Error("Native parser error");
        const failure = new DownloadFailure("network", "https://example.org/book", native);
        expect(failure.message).toBe("Le téléchargement a échoué.");
        expect(new DownloadCancelled().message).toBe(getTranslator().translate("message.download.cancelled"));
        const text = formatImportDiagnostics("Échec", failure, "https://[invalid");
        expect(text).toContain("Source : [URL invalide]");
        expect(text).toContain("Catégorie : network");
        expect(text).toContain("Causé par :");
        expect(text).toContain(native.stack);
        expect(formatImportDiagnostics("Échec", { statusCode: 503 })).toContain("Statut HTTP : 503");
        expect(formatImportDiagnostics("Échec", new Error("x".repeat(30000))).length).toBeLessThanOrEqual(24000);
    } finally {
        await setLocale("en");
    }
});

it("uses English fallback for empty diagnostic translations", async () => {
    await setLocale("de");
    try {
        expect(formatImportDiagnostics("Failed", { statusCode: 503 }, "/books/book.epub"))
            .toBe("Failed\n\nSource: /books/book.epub\n\nHTTP status: 503");
        expect(new DownloadFailure("network", "https://example.org").message).toBe("Download failed.");
    } finally {
        await setLocale("en");
    }
});


it("silently omits unknown causes and truncates diagnostics without markers", () => {
    const error = new Error("Failure", { cause: { privateValue: "Do not copy" } });
    expect(formatImportDiagnostics("Safe", error)).toBe(`Safe\n\n${error.stack}`);
    const long = formatImportDiagnostics("Safe", new Error("x".repeat(30000)));
    expect(long).toHaveLength(24000);
    expect(long).not.toContain("[diagnostics truncated]");
    expect(formatImportDiagnostics("Safe", { stack: "", cause: "" })).toBe("Safe");
});
