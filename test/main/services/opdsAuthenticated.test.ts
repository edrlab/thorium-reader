import { beforeEach, describe, expect, it, jest } from "@jest/globals";
jest.mock("readium-desktop/main/network/http", () => ({ getAuthenticationToken: jest.fn(), httpGet: jest.fn() }));
import { getAuthenticationToken, httpGet } from "readium-desktop/main/network/http";
import { isOpdsAuthenticated } from "readium-desktop/main/services/opdsAuthenticated";
const token = jest.mocked(getAuthenticationToken);
const get = jest.mocked(httpGet);
const catalog = new URL("https://example.com/catalog");
const shelf = "https://example.com/shelf";
const response = (isSuccess: boolean, contentType: string, data: unknown) => ({
    isSuccess, contentType, response: { json: async () => data },
}) as Awaited<ReturnType<typeof httpGet>>;
describe("catalog authentication state", () => {
    beforeEach(() => jest.resetAllMocks());
    it("recognizes cookie authentication from a successful bookshelf feed", async () => {
        get.mockResolvedValue(response(true, "application/opds+json; charset=utf-8", { metadata: { title: "Loans" }, publications: [] }));
        expect(await isOpdsAuthenticated(catalog, shelf)).toBe(true);
    });
    it.each([
        response(false, "application/opds-authentication+json", { authentication: [] }),
        response(true, "application/opds-authentication+json", { authentication: [] }),
        response(true, "text/html", {}),
        response(true, "application/opds+json", { authentication: [] }),
    ])("does not mistake login pages or challenges for authenticated feeds", async (result) => {
        get.mockResolvedValue(result);
        expect(await isOpdsAuthenticated(catalog, shelf)).toBe(false);
    });
    it("keeps token authentication working without a network request", async () => {
        token.mockResolvedValue({ accessToken: "token" });
        expect(await isOpdsAuthenticated(catalog, shelf)).toBe(true);
        expect(get).not.toHaveBeenCalled();
    });
    it("verifies the shelf advertised by an authentication document for cookie sessions", async () => {
        get.mockResolvedValueOnce(response(true, "application/opds-authentication+json", {
            links: [{ rel: "http://opds-spec.org/shelf", href: "/loans" }],
        }));
        get.mockResolvedValueOnce(response(true, "application/opds+json", { metadata: { title: "Loans" } }));
        expect(await isOpdsAuthenticated(catalog, shelf)).toBe(true);
        expect(get).toHaveBeenLastCalledWith("https://example.com/loans");
    });
    it("handles expired cookies and offline endpoints", async () => {
        get.mockRejectedValue(new Error("offline"));
        expect(await isOpdsAuthenticated(catalog, shelf)).toBe(false);
    });
});
