import { beforeEach, describe, expect, it, jest } from "@jest/globals";
jest.mock("readium-desktop/main/network/http", () => ({ httpGetWithAuth: jest.fn() }));
import { httpGetWithAuth } from "readium-desktop/main/network/http";
import { findDeeplinkCatalog } from "readium-desktop/main/services/opdsCatalogUrl";

const get = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const http = "http://example.com/catalog";
const https = "https://example.com/catalog";
const feed = (url: string) => ({ identifier: "existing", title: "Custom title", url, favorite: true });
const response = (responseUrl: string, contentType = "application/opds+json") => ({ responseUrl, contentType, isSuccess: true });

describe("catalog deeplink identity", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(httpGetWithAuth).mockReturnValue(get as unknown as ReturnType<typeof httpGetWithAuth>);
    });
    it("reuses exact matches without making a request", async () => {
        const existing = feed(https);
        expect(await findDeeplinkCatalog(https, [existing])).toEqual({ url: https, feed: existing });
        expect(get).not.toHaveBeenCalled();
    });
    it("matches an opds URL converted to HTTP against an HTTPS badge catalog", async () => {
        const existing = feed(https);
        get.mockResolvedValue(response(https));
        expect(await findDeeplinkCatalog(http, [existing])).toEqual({ url: https, feed: existing });
    });
    it("matches an HTTPS badge against a legacy HTTP catalog after verifying its redirect", async () => {
        const existing = feed(http);
        get.mockResolvedValue(response(https));
        expect(await findDeeplinkCatalog(https, [existing])).toEqual({ url: http, feed: existing });
        expect(get).toHaveBeenNthCalledWith(2, http);
    });
    it("stores the redirect destination for new catalogs", async () => {
        get.mockResolvedValue(response(https));
        expect(await findDeeplinkCatalog(http, [])).toEqual({ url: https });
    });
    it("keeps genuinely separate HTTP and HTTPS endpoints distinct", async () => {
        get.mockImplementation(async (url) => response(String(url)));
        expect(await findDeeplinkCatalog(https, [feed(http)])).toEqual({ url: https });
    });
    it("does not canonicalize to HTML login pages", async () => {
        get.mockResolvedValue(response("https://example.com/login", "text/html"));
        expect(await findDeeplinkCatalog(http, [])).toEqual({ url: http });
    });
    it("keeps offline links addable without guessing protocol equivalence", async () => {
        get.mockRejectedValue(new Error("offline"));
        expect(await findDeeplinkCatalog(http, [feed(https)])).toEqual({ url: http });
    });
    it("does not replace a protected catalog with a separate authentication endpoint", async () => {
        get.mockResolvedValue(response("https://example.com/auth", "application/opds-authentication+json"));
        expect(await findDeeplinkCatalog(http, [])).toEqual({ url: http });
    });
    it("allows an HTTP to HTTPS upgrade returning an authentication challenge for the same resource", async () => {
        get.mockResolvedValue({ ...response(https, "application/opds-authentication+json"), isSuccess: false });
        expect(await findDeeplinkCatalog(http, [feed(https)])).toEqual({ url: https, feed: feed(https) });
    });
    it("does not canonicalize failed feed responses", async () => {
        get.mockResolvedValue({ ...response(https), isSuccess: false });
        expect(await findDeeplinkCatalog(http, [])).toEqual({ url: http });
    });
    it("preserves distinct paths and query parameters", async () => {
        get.mockResolvedValue(response(https + "?shelf=1"));
        expect(await findDeeplinkCatalog(http + "?shelf=1", [feed(https)])).toEqual({ url: https + "?shelf=1" });
    });
});
