import { describe, expect, it, jest, beforeEach } from "@jest/globals";

jest.mock("readium-desktop/main/network/http", () => ({
    getAuthenticationToken: jest.fn(), httpGet: jest.fn(),
}));

import { getAuthenticationToken, httpGet } from "readium-desktop/main/network/http";
import { getOpdsUserProfile } from "readium-desktop/main/services/opdsUserProfile";
import { parseOpdsUserProfile } from "readium-desktop/common/models/opdsUserProfile";

const token = jest.mocked(getAuthenticationToken);
const get = jest.mocked(httpGet);
const result = (contentType: string, data: unknown, responseUrl: string) => ({
    isSuccess: true, contentType, responseUrl,
    response: { json: async () => data },
}) as unknown as Awaited<ReturnType<typeof httpGet>>;

describe("OPDS user profile", () => {
    beforeEach(() => { jest.resetAllMocks(); });

    it("discovers the profile through authentication and resolves redirected relative URLs", async () => {
        token.mockResolvedValue({ accessToken: "token", opdsAuthenticationUrl: "https://example.com/auth" });
        get.mockResolvedValueOnce(result("application/opds-authentication+json", {
            links: [{ rel: ["profile"], href: "../profile", type: "application/opds-profile+json" }],
        }, "https://example.com/auth/document"));
        get.mockResolvedValueOnce(result("application/opds-profile+json; charset=utf-8", {
            name: "Jane", email: "jane@example.com", loans: { total: 10, available: 0 },
            holds: { available: 2 }, links: [{ rel: "edit", href: "edit", type: "text/html" }],
        }, "https://example.com/user/profile"));
        expect(await getOpdsUserProfile("https://example.com/catalog")).toEqual({
            name: "Jane", email: "jane@example.com", loans: { total: 10, available: 0 },
            holds: { available: 2 }, editUrl: "https://example.com/user/edit",
        });
        expect(get).toHaveBeenLastCalledWith("https://example.com/profile", {
            headers: { Accept: "application/opds-profile+json" },
        });
    });

    it("does not fetch personal information when logged out", async () => {
        token.mockResolvedValue(undefined);
        expect(await getOpdsUserProfile("https://example.com/catalog")).toBeUndefined();
        expect(get).not.toHaveBeenCalled();
    });
    it("returns the actual bookshelf even when there is no profile document", async () => {
        token.mockResolvedValue({ accessToken: "token", opdsAuthenticationUrl: "https://example.com/auth" });
        get.mockResolvedValueOnce(result("application/opds-authentication+json", {
            links: [{ rel: "http://opds-spec.org/shelf", href: "/loans", type: "application/opds+json" }],
        }, "https://example.com/auth"));
        expect(await getOpdsUserProfile("https://example.com/catalog")).toEqual({ bookshelfUrl: "https://example.com/loans" });
    });

    it("supports a cookie-authenticated bookshelf without an access token", async () => {
        token.mockResolvedValue(undefined);
        get.mockResolvedValueOnce(result("application/opds+json", {
            links: [{ rel: "profile", href: "/profile", type: "application/opds-profile+json" }],
        }, "https://example.com/shelf"));
        get.mockResolvedValueOnce(result("application/opds-profile+json", { name: "Jane" }, "https://example.com/profile"));
        expect(await getOpdsUserProfile("https://example.com/catalog", "https://example.com/shelf")).toEqual({ name: "Jane" });
    });

    it("uses the saved catalog endpoint and accepts an authentication document returned with 401", async () => {
        token.mockResolvedValue({ accessToken: "token" });
        get.mockResolvedValueOnce({ ...result("application/opds-authentication+json", {
            links: [{ rel: "profile", href: "/profile", type: "application/opds-profile+json" }],
        }, "https://example.com/shelf"), isSuccess: false, statusCode: 401 });
        get.mockResolvedValueOnce(result("application/opds-profile+json", { name: "Jane" }, "https://example.com/profile"));
        expect(await getOpdsUserProfile("https://example.com/catalog", "https://example.com/shelf")).toEqual({ name: "Jane" });
        expect(get).toHaveBeenNthCalledWith(1, "https://example.com/shelf");
    });

    it("does not follow unsafe profile discovery links", async () => {
        token.mockResolvedValue({ accessToken: "token", opdsAuthenticationUrl: "https://example.com/auth" });
        get.mockResolvedValueOnce(result("application/opds-authentication+json", {
            links: [{ rel: "profile", href: "file:///private/profile", type: "application/opds-profile+json" }],
        }, "https://example.com/auth"));
        expect(await getOpdsUserProfile("https://example.com/catalog")).toBeUndefined();
        expect(get).toHaveBeenCalledTimes(1);
    });

    it("handles missing discovery links and network failures", async () => {
        token.mockResolvedValue({ accessToken: "token", opdsAuthenticationUrl: "https://example.com/auth" });
        get.mockResolvedValueOnce(result("application/opds-authentication+json", {}, "https://example.com/auth"));
        expect(await getOpdsUserProfile("https://example.com/catalog")).toBeUndefined();
        get.mockRejectedValueOnce(new Error("offline"));
        expect(await getOpdsUserProfile("https://example.com/catalog")).toBeUndefined();
    });

    it("rejects a profile served with an unrelated media type", async () => {
        token.mockResolvedValue({ accessToken: "token", opdsAuthenticationUrl: "https://example.com/auth" });
        get.mockResolvedValueOnce(result("application/opds-authentication+json", {
            links: [{ rel: "profile", href: "/profile", type: "application/opds-profile+json" }],
        }, "https://example.com/auth"));
        get.mockResolvedValueOnce(result("text/html", { name: "Jane" }, "https://example.com/profile"));
        expect(await getOpdsUserProfile("https://example.com/catalog")).toBeUndefined();
    });

    it("accepts optional fields and ignores invalid counts and unsafe edit links", () => {
        expect(parseOpdsUserProfile({}, "https://example.com")).toEqual({});
        expect(parseOpdsUserProfile([], "https://example.com")).toBeUndefined();
        expect(parseOpdsUserProfile({ name: 42, loans: { total: -1, available: 1.5 },
            links: [{ rel: "edit", href: "javascript:alert(1)", type: "text/html" }],
        }, "https://example.com")).toEqual({ loans: {} });
    });
});
