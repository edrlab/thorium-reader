import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { getOpdsBookshelfUrl } from "readium-desktop/main/services/opdsBookshelf";
import { getAuthenticationToken, httpGet } from "readium-desktop/main/network/http";

jest.mock("readium-desktop/main/network/http", () => ({
    getAuthenticationToken: jest.fn(),
    httpGet: jest.fn(),
}));

describe("OPDS bookshelf discovery", () => {
    beforeEach(() => jest.resetAllMocks());
    it("resolves a relative shelf without requesting the profile", async () => {
        jest.mocked(httpGet).mockResolvedValue({
            responseUrl: "https://example.org/auth/login",
            response: {
                json: async () => ({
                    links: [
                        { rel: "profile", href: "/personal", type: "application/opds-profile+json" },
                        { rel: "http://opds-spec.org/shelf", href: "../loans", type: "application/opds+json" },
                    ],
                }),
            },
        } as Awaited<ReturnType<typeof httpGet>>);
        expect(await getOpdsBookshelfUrl("https://example.org/catalog", "https://example.org/auth")).toBe(
            "https://example.org/loans",
        );
        expect(httpGet).toHaveBeenCalledTimes(1);
    });
    it("falls back to browsing the authentication endpoint when no shelf is available", async () => {
        jest.mocked(httpGet).mockRejectedValue(new Error("offline"));
        expect(await getOpdsBookshelfUrl("https://example.org/catalog", "https://example.org/auth")).toBe(
            "https://example.org/auth",
        );
    });
    it("does not request a document without an authentication URL", async () => {
        expect(await getOpdsBookshelfUrl("https://example.org/catalog")).toBe("https://example.org/catalog");
        expect(getAuthenticationToken).toHaveBeenCalledTimes(1);
        expect(httpGet).not.toHaveBeenCalled();
    });
});
