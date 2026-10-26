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
        opdsAuthFilePath: "thorium-http-get-auth-test.json",
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
    httpGet,
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

describe("authenticated HTTP GET redirects", () => {
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

    it("preserves original credentials when the redirected host remains unauthorized", async () => {
        const destination = "https://other.example.org/book";
        await httpSetAuthenticationToken({
            accessToken: "destination-token",
            opdsAuthenticationUrl: "https://other.example.org/authentication",
            tokenType: "Bearer",
        });
        fetchWithCookieMock
            .mockResolvedValueOnce(response(401, {}, destination))
            .mockResolvedValueOnce(response(401, {}, destination))
            .mockResolvedValueOnce(response(401, {}, destination));

        const result = await httpGet(url);

        expect(result.statusCode).toBe(401);
        expect(fetchWithCookieMock).toHaveBeenCalledTimes(3);
        await expect(getAuthenticationToken(new URL(url), "GET")).resolves.toMatchObject({
            accessToken: "old-access-token",
        });
        expect((await getAuthenticationToken(new URL(destination), "GET"))?.accessToken).toBeFalsy();
    });

    it("does not retry with stored credentials after an HTTPS to HTTP redirect", async () => {
        const destination = "http://other.example.org/book";
        await httpSetAuthenticationToken({
            accessToken: "destination-token",
            opdsAuthenticationUrl: "http://other.example.org/authentication",
            tokenType: "Bearer",
        });
        fetchWithCookieMock.mockResolvedValueOnce(response(401, {}, destination));

        const result = await httpGet(url);

        expect(result.statusCode).toBe(401);
        expect(fetchWithCookieMock).toHaveBeenCalledTimes(1);
        await expect(getAuthenticationToken(new URL(destination), "GET")).resolves.toMatchObject({
            accessToken: "destination-token",
        });
    });
});
