import { beforeEach, expect, jest, test } from "@jest/globals";
import { ContentType } from "readium-desktop/utils/contentType";
import { readOpdsBrowserLinks, opdsBrowserLinksFromView } from "readium-desktop/common/models/opdsBrowserOptions";

jest.mock("readium-desktop/main/network/http", () => ({ getAuthenticationToken: jest.fn(), httpGet: jest.fn(), deleteAuthenticationToken: jest.fn() }));
jest.mock("readium-desktop/main/network/fetch", () => ({ removeCookiesFromHost: jest.fn() }));
jest.mock("readium-desktop/main/services/opdsAuthenticated", () => ({ isOpdsAuthenticated: jest.fn() }));
import { getAuthenticationToken, httpGet, deleteAuthenticationToken } from "readium-desktop/main/network/http";
import { removeCookiesFromHost } from "readium-desktop/main/network/fetch";
import { isOpdsAuthenticated } from "readium-desktop/main/services/opdsAuthenticated";
import { getOpdsBrowserOptions } from "readium-desktop/main/services/opdsBrowserOptions";
import { logoutOpdsCatalog } from "readium-desktop/main/services/opdsLogout";

const token = jest.mocked(getAuthenticationToken);
const get = jest.mocked(httpGet);
const authenticated = jest.mocked(isOpdsAuthenticated);
const catalog = "https://example.org/catalog";
const current = "https://example.org/shelf";
const response = (data: unknown, type = ContentType.Opds2, url = catalog, success = true) => ({
    isSuccess: success, contentType: type, responseUrl: url, response: { json: async () => data },
}) as Awaited<ReturnType<typeof httpGet>>;
beforeEach(() => { jest.resetAllMocks(); authenticated.mockResolvedValue(false); });

test("resolves advertised relations, both shelf aliases and relative redirected URLs", () => {
    expect(readOpdsBrowserLinks([
        { rel: ["related", "http://opds-spec.org/shelf"], href: "../shelf", type: ContentType.Opds2 },
        { rel: "shelf", href: "/other-shelf" },
        { rel: "http://opds-spec.org/wishlist", href: "/wishlist" },
        { rel: "http://opds-spec.org/history", href: "history" },
        { rel: "profile", href: "https://accounts.example.org/user", type: ContentType.Html },
        { rel: "profile", href: "javascript:alert(1)" },
    ], "https://example.org/redirect/catalog")).toEqual({
        shelf: { url: current, type: ContentType.Opds2 },
        wishlist: { url: "https://example.org/wishlist" },
        history: { url: "https://example.org/redirect/history" },
        profile: { url: "https://accounts.example.org/user", type: ContentType.Html },
    });
    expect(readOpdsBrowserLinks([{ rel: "shelf", href: "/loans" }], catalog).shelf.url).toBe("https://example.org/loans");
    expect(readOpdsBrowserLinks([null, {}, { rel: "profile", href: "file:///private" }], catalog)).toEqual({});
    expect(readOpdsBrowserLinks(undefined, catalog)).toEqual({});
});

test("converted feeds omit missing destinations so navigation can preserve discovered links", () => {
    const links = opdsBrowserLinksFromView({ wishlist: [{ url: "https://example.org/wishlist" }],
        profile: [{ url: "file:///private" }] } as never);
    expect(links).toEqual({ wishlist: { url: "https://example.org/wishlist" } });
    expect(opdsBrowserLinksFromView()).toEqual({});
});

test("discovers global links from root and authentication without fetching personal profile data", async () => {
    token.mockResolvedValue({ accessToken: "secret", opdsAuthenticationUrl: "https://example.org/auth" });
    get.mockResolvedValueOnce(response({ links: [{ rel: "http://opds-spec.org/wishlist", href: "/wishlist" }] }));
    get.mockResolvedValueOnce(response({ links: [
        { rel: "shelf", href: "../shelf", type: ContentType.Opds2 },
        { rel: "http://opds-spec.org/history", href: "../history" },
        { rel: "profile", href: "../profile", type: ContentType.OpdsProfile },
    ] }, ContentType.Opds2Auth, "https://example.org/auth/document", false));
    const options = await getOpdsBrowserOptions(catalog, current);
    expect(options.authenticated).toBe(true);
    expect(Object.keys(options.links).sort()).toEqual(["history", "profile", "shelf", "wishlist"]);
    expect(options.links.shelf.url).toBe(current);
    expect(get.mock.calls.map(call => call[0])).toEqual([catalog, "https://example.org/auth"]);
    expect(authenticated).not.toHaveBeenCalled();
});

test.each(["authenticate", "http://opds-spec.org/auth/document"])("follows %s and verifies a cookie-authenticated shelf", async rel => {
    get.mockResolvedValueOnce(response({ links: [{ rel, href: "/auth" }] }));
    get.mockResolvedValueOnce(response({ links: [{ rel: "shelf", href: "/loans" }] }, ContentType.Opds2Auth));
    authenticated.mockResolvedValue(true);
    expect((await getOpdsBrowserOptions(catalog, current)).authenticated).toBe(true);
    expect(authenticated).toHaveBeenCalledWith(new URL(current), "https://example.org/loans");
});

test("uses the current feed's advertised shelf if root metadata is unavailable", async () => {
    get.mockRejectedValue(new Error("offline"));
    expect(await getOpdsBrowserOptions(catalog, current, undefined, current)).toEqual({ catalogUrl: catalog, links: {}, authenticated: false });
    expect(authenticated).toHaveBeenCalledWith(new URL(current), current);
});

test("discovery failures do not hide an authenticated session's logout", async () => {
    token.mockResolvedValue({ accessToken: "secret" });
    get.mockRejectedValue(new Error("offline"));
    expect(await getOpdsBrowserOptions(catalog, current)).toEqual({ catalogUrl: catalog, links: {}, authenticated: true });
});

test("rejects unsafe URLs and preserves APIAPP credential isolation", async () => {
    await expect(getOpdsBrowserOptions(catalog, "file:///private")).rejects.toThrow();
    token.mockResolvedValue({ accessToken: "secret" });
    const apiapp = "apiapp://123:apiapp:https://example.org/library";
    expect((await getOpdsBrowserOptions(apiapp, apiapp)).authenticated).toBe(true);
    expect(token.mock.calls.at(-1)[0].host).toBe("apiapploans.org.edrlab.thoriumreader.break.123.break.example.org");
    expect(get).not.toHaveBeenCalled();
});

test("logout clears catalog and redirected feed credentials, with ports excluded from cookie domains", async () => {
    await logoutOpdsCatalog("https://example.org:8080/root", "https://shelf.example.org:8443/loans");
    expect(jest.mocked(removeCookiesFromHost).mock.calls).toEqual([["example.org"], ["shelf.example.org"]]);
    expect(jest.mocked(deleteAuthenticationToken).mock.calls).toEqual([["example.org:8080"], ["shelf.example.org:8443"]]);
});

test("logout deduplicates a host and supports APIAPP catalogs", async () => {
    await logoutOpdsCatalog(catalog, current);
    expect(deleteAuthenticationToken).toHaveBeenCalledTimes(1);
    await logoutOpdsCatalog("apiapp://123:apiapp:https://example.org/library");
    expect(deleteAuthenticationToken).toHaveBeenLastCalledWith("apiapploans.org.edrlab.thoriumreader.break.123.break.example.org");
});
