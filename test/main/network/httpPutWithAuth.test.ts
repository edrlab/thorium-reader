// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as fs from "node:fs";

jest.mock("timeout-signal", () => ({
    __esModule: true,
    default: () => new AbortController().signal,
}));

jest.mock("node-fetch", () => {
    class Headers {
        private readonly values = new Map<string, string>();

        constructor(initial?: Headers | Record<string, string>) {
            if (initial instanceof Headers) {
                for (const [key, value] of initial.values) {
                    this.values.set(key, value);
                }
            } else if (initial) {
                for (const [key, value] of Object.entries(initial)) {
                    this.set(key, value);
                }
            }
        }

        public delete(key: string) {
            this.values.delete(key.toLowerCase());
        }

        public get(key: string) {
            return this.values.get(key.toLowerCase()) || null;
        }

        public raw() {
            return Object.fromEntries([...this.values].map(([key, value]) => [key, [value]]));
        }

        public set(key: string, value: string) {
            this.values.set(key.toLowerCase(), value);
        }
    }

    class AbortError extends Error {}

    return { AbortError, Headers };
});

function mockDiFactory() {
    return {
        diMainGet: () => {
            throw new Error("No store in this isolated test");
        },
        opdsAuthFilePath: "thorium-http-put-auth-test.json",
    };
}

jest.mock("readium-desktop/main/di", mockDiFactory);
jest.mock("../../../src/main/di", mockDiFactory);

jest.mock("readium-desktop/main/network/fetch", () => ({
    fetchWithCookie: jest.fn(),
}));

jest.mock("../../../src/main/network/proxy-agent", () => ({
    ProxyAgent: class ProxyAgent {
        public readonly options: Record<string, unknown>;

        constructor(options: Record<string, unknown>) {
            this.options = options;
        }
    },
}));

import {
    getAuthenticationToken,
    httpPut,
    httpPutWithAuth,
    httpSetAuthenticationToken,
    wipeAuthenticationTokenStorage,
} from "readium-desktop/main/network/http";
import { fetchWithCookie } from "readium-desktop/main/network/fetch";

const fetchWithCookieMock = jest.mocked(fetchWithCookie);
const url = "https://example.org/publications/1/progression";

const response = (
    status: number,
    value: unknown = {},
    responseUrl = url,
    extraHeaders: Record<string, string> = {},
) => {
    const body = JSON.stringify(value);
    const headers = new Map<string, string>([
        ["content-type", "application/json"],
        ...Object.entries(extraHeaders).map(([key, headerValue]) => [key.toLowerCase(), headerValue] as const),
    ]);
    return {
        body: undefined,
        headers: {
            get: (key: string) => headers.get(key.toLowerCase()) || null,
            raw: () => Object.fromEntries([...headers].map(([key, headerValue]) => [key, [headerValue]])),
        },
        json: async () => value,
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 401 ? "Unauthorized" : "OK",
        text: async () => body,
        url: responseUrl,
    } as unknown as Awaited<ReturnType<typeof fetchWithCookie>>;
};

describe("authenticated HTTP PUT", () => {
    let readFileSpy: jest.SpiedFunction<typeof fs.promises.readFile>;
    let writeFileSpy: jest.SpiedFunction<typeof fs.promises.writeFile>;

    beforeAll(() => {
        (globalThis as any).__TH__IS_DEV__ = false;
        readFileSpy = jest.spyOn(fs.promises, "readFile").mockRejectedValue(new Error("not found"));
        writeFileSpy = jest.spyOn(fs.promises, "writeFile").mockResolvedValue();
    });

    beforeEach(async () => {
        fetchWithCookieMock.mockReset();
        await wipeAuthenticationTokenStorage();
        await httpSetAuthenticationToken({
            accessToken: "old-access-token",
            opdsAuthenticationUrl: "https://example.org/authentication",
            tokenType: "Bearer",
        });
    });

    afterAll(() => {
        readFileSpy.mockRestore();
        writeFileSpy.mockRestore();
    });

    it("adds OPDS authentication without changing legacy httpPut", async () => {
        fetchWithCookieMock.mockResolvedValueOnce(response(200)).mockResolvedValueOnce(response(200));

        await httpPutWithAuth(url, { body: "authenticated" });
        await httpPut(url, { body: "legacy" });

        const authenticatedOptions = fetchWithCookieMock.mock.calls[0][1];
        const legacyOptions = fetchWithCookieMock.mock.calls[1][1];
        expect(authenticatedOptions?.method).toBe("put");
        expect((authenticatedOptions?.headers as { get: (key: string) => string | null }).get("Authorization")).toBe(
            "Bearer old-access-token",
        );
        expect(legacyOptions?.method).toBe("put");
        expect((legacyOptions?.headers as { get: (key: string) => string | null }).get("Authorization")).toBeNull();
    });

    it("does not send credentials sourced from HTTPS on an initial HTTP request", async () => {
        const insecureUrl = "http://example.org/publications/1/progression";
        fetchWithCookieMock.mockResolvedValueOnce(response(200, {}, insecureUrl));

        const result = await httpPutWithAuth(insecureUrl, { body: "progression" });

        expect(result.statusCode).toBe(200);
        expect(fetchWithCookieMock).toHaveBeenCalledTimes(1);
        const headers = fetchWithCookieMock.mock.calls[0][1]?.headers as {
            get: (key: string) => string | null;
        };
        expect(headers.get("Authorization")).toBeNull();
        await expect(getAuthenticationToken(new URL(url), "PUT")).resolves.toMatchObject({
            accessToken: "old-access-token",
        });
    });

    it("refreshes an expired token and retries the PUT", async () => {
        await httpSetAuthenticationToken({
            accessToken: "expired-access-token",
            opdsAuthenticationUrl: "https://example.org/authentication",
            refreshToken: "refresh-token",
            refreshUrl: "https://example.org/token",
            tokenType: "Bearer",
        });
        fetchWithCookieMock
            .mockResolvedValueOnce(response(401))
            .mockResolvedValueOnce(
                response(200, {
                    access_token: "new-access-token",
                    refresh_token: "new-refresh-token",
                }),
            )
            .mockResolvedValueOnce(response(200));

        const progressionMediaType = "application/opds-progression+json";
        const result = await httpPutWithAuth(url, {
            body: "progression",
            headers: {
                Accept: progressionMediaType,
                "Content-Type": progressionMediaType,
            },
        });

        expect(result.statusCode).toBe(200);
        expect(fetchWithCookieMock).toHaveBeenCalledTimes(3);
        expect(fetchWithCookieMock.mock.calls[0][1]?.method).toBe("put");
        expect(fetchWithCookieMock.mock.calls[1][1]?.method).toBe("post");
        expect(fetchWithCookieMock.mock.calls[2][1]?.method).toBe("put");
        for (const requestIndex of [0, 2]) {
            const options = fetchWithCookieMock.mock.calls[requestIndex][1];
            const headers = options?.headers as { get: (key: string) => string | null };
            expect(options?.body).toBe("progression");
            expect(headers.get("Accept")).toBe(progressionMediaType);
            expect(headers.get("Content-Type")).toBe(progressionMediaType);
        }
        expect(
            (
                fetchWithCookieMock.mock.calls[2][1]?.headers as {
                    get: (key: string) => string | null;
                }
            ).get("Authorization"),
        ).toBe("Bearer new-access-token");
    });

    it("does not send a refresh token from HTTPS provenance to an HTTP endpoint", async () => {
        await httpSetAuthenticationToken({
            accessToken: "expired-access-token",
            opdsAuthenticationUrl: "https://example.org/authentication",
            refreshToken: "must-not-leak",
            refreshUrl: "http://example.org/token",
            tokenType: "Bearer",
        });
        fetchWithCookieMock.mockResolvedValueOnce(response(401)).mockResolvedValueOnce(response(200));

        const result = await httpPutWithAuth(url, { body: "progression" });

        expect(result.statusCode).toBe(200);
        expect(fetchWithCookieMock).toHaveBeenCalledTimes(2);
        expect(fetchWithCookieMock.mock.calls.map(([requestUrl]) => String(requestUrl))).toEqual([url, url]);
        expect(fetchWithCookieMock.mock.calls.map(([, options]) => options?.method)).toEqual(["put", "put"]);
        expect(
            fetchWithCookieMock.mock.calls.some(([, options]) => String(options?.body).includes("must-not-leak")),
        ).toBe(false);
    });

    it("does not follow a refresh-token POST redirect", async () => {
        const refreshUrl = "https://example.org/token";
        const insecureRefreshUrl = "http://example.org/token";
        await httpSetAuthenticationToken({
            accessToken: "expired-access-token",
            opdsAuthenticationUrl: "https://example.org/authentication",
            refreshToken: "refresh-token",
            refreshUrl,
            tokenType: "Bearer",
        });
        fetchWithCookieMock
            .mockResolvedValueOnce(response(401))
            .mockResolvedValueOnce(response(307, {}, refreshUrl, { Location: insecureRefreshUrl }))
            .mockResolvedValueOnce(response(200));

        const result = await httpPutWithAuth(url, { body: "progression" });

        expect(result.statusCode).toBe(200);
        expect(fetchWithCookieMock).toHaveBeenCalledTimes(3);
        expect(fetchWithCookieMock.mock.calls.map(([requestUrl]) => String(requestUrl))).toEqual([
            url,
            refreshUrl,
            url,
        ]);
        expect(fetchWithCookieMock.mock.calls[1][1]).toMatchObject({
            method: "post",
            redirect: "manual",
        });
        expect(fetchWithCookieMock.mock.calls.some(([requestUrl]) => String(requestUrl) === insecureRefreshUrl)).toBe(
            false,
        );
    });

    it("retries a redirected PUT with credentials stored for the final host", async () => {
        const finalUrl = "https://progress.example.org/publications/1/progression";
        const progressionMediaType = "application/opds-progression+json";
        await wipeAuthenticationTokenStorage();
        await httpSetAuthenticationToken({
            accessToken: "redirect-access-token",
            opdsAuthenticationUrl: "https://progress.example.org/authentication",
            tokenType: "Bearer",
        });
        const observedCookies: Array<string | null> = [];
        fetchWithCookieMock
            .mockImplementationOnce(async (_requestUrl, options) => {
                const headers = options?.headers as { get: (key: string) => string | null };
                observedCookies.push(headers.get("Cookie"));
                return response(307, {}, url, { Location: finalUrl });
            })
            .mockImplementationOnce(async (_requestUrl, options) => {
                const headers = options?.headers as { get: (key: string) => string | null };
                observedCookies.push(headers.get("Cookie"));
                return response(200, {}, finalUrl);
            });

        const result = await httpPutWithAuth(url, {
            body: "progression",
            headers: {
                Accept: progressionMediaType,
                Cookie: "source-session=must-not-leak",
                "Content-Type": progressionMediaType,
            },
        });

        expect(result.statusCode).toBe(200);
        expect(fetchWithCookieMock).toHaveBeenCalledTimes(2);
        expect(String(fetchWithCookieMock.mock.calls[0][0])).toBe(url);
        expect(String(fetchWithCookieMock.mock.calls[1][0])).toBe(finalUrl);
        const redirectedOptions = fetchWithCookieMock.mock.calls[1][1];
        const redirectedHeaders = redirectedOptions?.headers as {
            get: (key: string) => string | null;
        };
        expect(redirectedOptions?.method).toBe("put");
        expect(redirectedOptions?.body).toBe("progression");
        expect(redirectedHeaders.get("Accept")).toBe(progressionMediaType);
        expect(redirectedHeaders.get("Cookie")).toBeNull();
        expect(redirectedHeaders.get("Content-Type")).toBe(progressionMediaType);
        expect(redirectedHeaders.get("Authorization")).toBe("Bearer redirect-access-token");
        expect(observedCookies).toEqual(["source-session=must-not-leak", null]);
    });

    it("does not add OPDS credentials to a redirected legacy PUT", async () => {
        const finalUrl = "https://progress.example.org/publications/1/progression";
        await wipeAuthenticationTokenStorage();
        await httpSetAuthenticationToken({
            accessToken: "must-not-leak",
            opdsAuthenticationUrl: "https://progress.example.org/authentication",
            tokenType: "Bearer",
        });
        fetchWithCookieMock.mockResolvedValueOnce(response(401, {}, finalUrl));

        const result = await httpPut(url, { body: "legacy" });

        expect(result.statusCode).toBe(401);
        expect(fetchWithCookieMock).toHaveBeenCalledTimes(1);
        const headers = fetchWithCookieMock.mock.calls[0][1]?.headers as {
            get: (key: string) => string | null;
        };
        expect(headers.get("Authorization")).toBeNull();
    });

    it("keeps original-host credentials when redirected-host authentication fails", async () => {
        const finalUrl = "https://progress.example.org/publications/1/progression";
        await httpSetAuthenticationToken({
            accessToken: "final-expired-token",
            opdsAuthenticationUrl: "https://progress.example.org/authentication",
            tokenType: "Bearer",
        });
        fetchWithCookieMock
            .mockResolvedValueOnce(response(307, {}, url, { Location: finalUrl }))
            .mockResolvedValueOnce(response(401, {}, finalUrl))
            .mockResolvedValueOnce(response(401, {}, finalUrl));

        const result = await httpPutWithAuth(url, { body: "progression" });

        expect(result.statusCode).toBe(401);
        expect(fetchWithCookieMock).toHaveBeenCalledTimes(3);
        expect(fetchWithCookieMock.mock.calls.map(([requestUrl]) => String(requestUrl))).toEqual([
            url,
            finalUrl,
            finalUrl,
        ]);
        await expect(getAuthenticationToken(new URL(url), "PUT")).resolves.toMatchObject({
            accessToken: "old-access-token",
        });
        await expect(getAuthenticationToken(new URL(finalUrl), "PUT")).resolves.toBeUndefined();
    });

    it("handles a redirect chain that returns to an earlier authentication owner only once", async () => {
        const middleUrl = "https://middle.example.org/publications/1/progression";
        const finalUrl = "https://example.org/publications/1/progression-final";
        const observedRequests: Array<{ authorization: string | null; url: string }> = [];
        const observe = (
            requestUrl: Parameters<typeof fetchWithCookie>[0],
            options: Parameters<typeof fetchWithCookie>[1],
        ) => {
            const headers = options?.headers as { get: (key: string) => string | null };
            observedRequests.push({
                authorization: headers.get("Authorization"),
                url: String(requestUrl),
            });
        };
        fetchWithCookieMock
            .mockImplementationOnce(async (requestUrl, options) => {
                observe(requestUrl, options);
                return response(307, {}, url, { Location: middleUrl });
            })
            .mockImplementationOnce(async (requestUrl, options) => {
                observe(requestUrl, options);
                return response(307, {}, middleUrl, { Location: finalUrl });
            })
            .mockImplementationOnce(async (requestUrl, options) => {
                observe(requestUrl, options);
                return response(401, {}, finalUrl);
            })
            .mockImplementationOnce(async (requestUrl, options) => {
                observe(requestUrl, options);
                return response(401, {}, finalUrl);
            });

        const result = await httpPutWithAuth(url, { body: "progression" });

        expect(result.statusCode).toBe(401);
        expect(observedRequests).toEqual([
            { authorization: "Bearer old-access-token", url },
            { authorization: null, url: middleUrl },
            { authorization: "Bearer old-access-token", url: finalUrl },
            { authorization: null, url: finalUrl },
        ]);
        await expect(getAuthenticationToken(new URL(url), "PUT")).resolves.toBeUndefined();
    });

    it("does not follow an authenticated PUT redirect from HTTPS to HTTP", async () => {
        const downgradeUrl = "http://example.org/publications/1/progression";
        fetchWithCookieMock.mockResolvedValueOnce(response(307, {}, url, { Location: downgradeUrl }));

        const result = await httpPutWithAuth(url, { body: "progression" });

        expect(result.statusCode).toBe(307);
        expect(fetchWithCookieMock).toHaveBeenCalledTimes(1);
        expect(String(fetchWithCookieMock.mock.calls[0][0])).toBe(url);
    });

    it("does not replay an authenticated PUT body after a 303 redirect", async () => {
        const redirectUrl = "https://example.org/authentication-result";
        fetchWithCookieMock.mockResolvedValueOnce(response(303, {}, url, { Location: redirectUrl }));

        const result = await httpPutWithAuth(url, { body: "progression" });

        expect(result.statusCode).toBe(303);
        expect(fetchWithCookieMock).toHaveBeenCalledTimes(1);
        expect(String(fetchWithCookieMock.mock.calls[0][0])).toBe(url);
    });

    it("bounds redirect loops even when every hop has stored credentials", async () => {
        const alternateUrl = "https://example.org/publications/1/progression-alternate";
        fetchWithCookieMock.mockImplementation(async (requestUrl) => {
            const currentUrl = String(requestUrl);
            const nextUrl = currentUrl === url ? alternateUrl : url;
            return response(307, {}, currentUrl, { Location: nextUrl });
        });

        const result = await httpPutWithAuth(url, { body: "progression" });

        expect(result.statusCode).toBe(307);
        // Twenty redirects means the initial request plus twenty followed hops.
        expect(fetchWithCookieMock).toHaveBeenCalledTimes(21);
    });

    it("handles a same-origin redirected 401 once without restarting the original PUT", async () => {
        const finalUrl = "https://example.org/publications/1/progression-final";
        const observedRequests: Array<{ authorization: string | null; url: string }> = [];
        const observe = (
            requestUrl: Parameters<typeof fetchWithCookie>[0],
            options: Parameters<typeof fetchWithCookie>[1],
        ) => {
            const headers = options?.headers as { get: (key: string) => string | null };
            observedRequests.push({
                authorization: headers.get("Authorization"),
                url: String(requestUrl),
            });
        };
        fetchWithCookieMock
            .mockImplementationOnce(async (requestUrl, options) => {
                observe(requestUrl, options);
                return response(307, {}, url, { Location: finalUrl });
            })
            .mockImplementationOnce(async (requestUrl, options) => {
                observe(requestUrl, options);
                return response(401, {}, finalUrl);
            })
            .mockImplementationOnce(async (requestUrl, options) => {
                observe(requestUrl, options);
                return response(401, {}, finalUrl);
            });

        const result = await httpPutWithAuth(url, { body: "progression" });

        expect(result.statusCode).toBe(401);
        expect(observedRequests).toEqual([
            { authorization: "Bearer old-access-token", url },
            { authorization: "Bearer old-access-token", url: finalUrl },
            { authorization: null, url: finalUrl },
        ]);
    });
});
