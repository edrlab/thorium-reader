// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("readium-desktop/main/network/http", () => ({
    httpGet: jest.fn(),
    httpPutWithAuth: jest.fn(),
}));
jest.mock("readium-desktop/main/event", () => ({
    getOpdsAuthenticationChannel: jest.fn(),
}));

import { OPDSAuthenticationDoc } from "@r2-opds-js/opds/opds2/opds2-authentication-doc";
import { OPDS_PROGRESSION_MEDIA_TYPE } from "readium-desktop/common/models/opdsProgression";
import type { IHttpGetResult } from "readium-desktop/common/utils/http";
import { getOpdsAuthenticationChannel } from "readium-desktop/main/event";
import { httpGet, httpPutWithAuth } from "readium-desktop/main/network/http";
import {
    getOpdsProgression,
    parseOpdsProgressionDocument,
    putOpdsProgression,
} from "readium-desktop/main/services/opdsProgression";

const httpGetMock = jest.mocked(httpGet);
const httpPutWithAuthMock = jest.mocked(httpPutWithAuth);
const getOpdsAuthenticationChannelMock = jest.mocked(getOpdsAuthenticationChannel);
const authenticationChannelPutMock = jest.fn();
const url = "https://example.org/publications/1/progression";
const validDocument = {
    modified: "2026-09-30T10:00:00Z",
    device: {
        id: "urn:uuid:019c0047-cc8d-7ec4-a3c3-938ccadc020a",
        name: "Test reader",
    },
    progression: 0.625,
};

const result = (payload: string, overrides: Partial<IHttpGetResult<undefined>> = {}) =>
    ({
        contentType: OPDS_PROGRESSION_MEDIA_TYPE,
        isFailure: false,
        isSuccess: true,
        response: {
            text: async () => payload,
        },
        statusCode: 200,
        url,
        ...overrides,
    }) as IHttpGetResult<undefined>;

describe("OPDS progression service", () => {
    beforeEach(() => {
        httpGetMock.mockReset();
        httpPutWithAuthMock.mockReset();
        authenticationChannelPutMock.mockReset();
        getOpdsAuthenticationChannelMock.mockReturnValue({
            put: authenticationChannelPutMock,
        } as unknown as ReturnType<typeof getOpdsAuthenticationChannel>);
    });

    it("requests and returns a valid progression document", async () => {
        httpGetMock.mockResolvedValue(result(JSON.stringify(validDocument)));

        await expect(getOpdsProgression(url, "en")).resolves.toEqual(validDocument);
        expect(httpGetMock).toHaveBeenCalledWith(
            url,
            {
                headers: { Accept: OPDS_PROGRESSION_MEDIA_TYPE },
                timeout: 6000,
            },
            undefined,
            "en",
        );
    });

    it("accepts an empty 200 response as no known progression", async () => {
        httpGetMock.mockResolvedValue(result("  \n"));
        await expect(getOpdsProgression(url)).resolves.toBeUndefined();
    });

    it.each([
        { ...validDocument, modified: "not-a-date" },
        { ...validDocument, progression: -0.1 },
        { ...validDocument, progression: 1.1 },
        { ...validDocument, device: { id: "not a URI", name: "Reader" } },
        { ...validDocument, device: { id: "urn:uuid:test", name: "" } },
    ])("rejects an invalid document: %p", (document) => {
        expect(parseOpdsProgressionDocument(document)).toBeUndefined();
    });

    it("ignores references after validating them", () => {
        const document = {
            ...validDocument,
            references: ["chapter-3.xhtml#paragraph-2"],
        };
        expect(parseOpdsProgressionDocument(document)).toEqual(document);
    });

    it("does not surface HTTP, media-type, JSON, or schema errors", async () => {
        httpGetMock
            .mockResolvedValueOnce(result("", { isFailure: true, isSuccess: false, statusCode: 500 }))
            .mockResolvedValueOnce(result(JSON.stringify(validDocument), { contentType: "text/plain" }))
            .mockResolvedValueOnce(result("{"))
            .mockResolvedValueOnce(result(JSON.stringify({ ...validDocument, progression: 2 })));

        await expect(getOpdsProgression(url)).resolves.toBeUndefined();
        await expect(getOpdsProgression(url)).resolves.toBeUndefined();
        await expect(getOpdsProgression(url)).resolves.toBeUndefined();
        await expect(getOpdsProgression(url)).resolves.toBeUndefined();
    });

    it("uploads only the required float progression fields", async () => {
        httpPutWithAuthMock.mockResolvedValue(
            result(JSON.stringify(validDocument), {
                statusCode: 201,
            }),
        );

        const input = {
            ...validDocument,
            title: "Must not be uploaded",
            references: ["chapter.xhtml#fragment"],
        };
        await expect(putOpdsProgression(url, input, "en")).resolves.toEqual({
            kind: "success",
            statusCode: 201,
            document: validDocument,
        });

        expect(httpPutWithAuthMock).toHaveBeenCalledWith(
            url,
            {
                body: JSON.stringify(validDocument),
                headers: {
                    Accept: OPDS_PROGRESSION_MEDIA_TYPE,
                    "Content-Type": OPDS_PROGRESSION_MEDIA_TYPE,
                },
                timeout: 6000,
            },
            undefined,
            "en",
        );
    });

    it("rejects an invalid outbound document before sending it", async () => {
        await expect(
            putOpdsProgression(url, {
                ...validDocument,
                progression: 2,
            }),
        ).resolves.toEqual({ kind: "invalid-document" });
        expect(httpPutWithAuthMock).not.toHaveBeenCalled();
    });

    it.each([200, 201] as const)("rejects an invalid %i response document", async (statusCode) => {
        httpPutWithAuthMock.mockResolvedValue(
            result(
                JSON.stringify({
                    ...validDocument,
                    progression: 2,
                }),
                { statusCode },
            ),
        );

        await expect(putOpdsProgression(url, validDocument)).resolves.toEqual({
            kind: "invalid-response",
            statusCode,
        });
    });

    it("classifies malformed success JSON as an invalid response", async () => {
        httpPutWithAuthMock.mockResolvedValue(result("{"));
        await expect(putOpdsProgression(url, validDocument)).resolves.toEqual({
            kind: "invalid-response",
            statusCode: 200,
        });
    });

    it.each([
        [400, "bad-request"],
        [401, "unauthorized"],
        [403, "forbidden"],
        [409, "conflict"],
    ] as const)("returns the %i Problem Details outcome", async (statusCode, kind) => {
        const problem = {
            type: "https://example.org/problems/progression",
            title: "Progression rejected",
            status: statusCode,
            detail: "Test detail",
        };
        httpPutWithAuthMock.mockResolvedValue(
            result("", {
                contentType: "application/problem+json",
                isFailure: true,
                isSuccess: false,
                response: {
                    json: async () => problem,
                },
                statusCode,
            }),
        );

        await expect(putOpdsProgression(url, validDocument)).resolves.toEqual({
            kind,
            statusCode,
            problem,
        });
    });

    it.each(["application/opds-authentication+json", "application/vnd.opds.authentication.v1.0+json"])(
        "forwards a 401 %s document to the authentication flow",
        async (authenticationMediaType) => {
            const authenticationDocument = {
                id: "https://example.org/auth",
                title: "Sign in",
                authentication: [] as Array<Record<string, unknown>>,
            };
            httpPutWithAuthMock.mockResolvedValue(
                result("", {
                    contentType: authenticationMediaType,
                    isFailure: true,
                    isSuccess: false,
                    response: {
                        json: async () => authenticationDocument,
                    },
                    responseUrl: "https://auth.example.org/progression",
                    statusCode: 401,
                }),
            );

            await expect(putOpdsProgression(url, validDocument)).resolves.toEqual({
                kind: "authentication-required",
                statusCode: 401,
                authenticationUrl: "https://auth.example.org/progression",
            });
            expect(authenticationChannelPutMock).toHaveBeenCalledWith([
                expect.any(OPDSAuthenticationDoc),
                "https://auth.example.org/progression",
                false,
            ]);
        },
    );

    it("distinguishes retryable server and network failures", async () => {
        const problem = {
            title: "Temporarily unavailable",
            status: 503,
        };
        httpPutWithAuthMock
            .mockResolvedValueOnce(
                result("", {
                    isFailure: true,
                    isSuccess: false,
                    response: { json: async () => problem },
                    statusCode: 503,
                }),
            )
            .mockResolvedValueOnce(
                result("", {
                    isFailure: true,
                    isNetworkError: true,
                    isSuccess: false,
                    isTimeout: true,
                    response: undefined,
                    statusCode: undefined,
                }),
            );

        await expect(putOpdsProgression(url, validDocument)).resolves.toEqual({
            kind: "server-error",
            statusCode: 503,
            problem,
        });
        await expect(putOpdsProgression(url, validDocument)).resolves.toEqual({
            kind: "network-error",
            isTimeout: true,
        });
    });

    it("does not surface transport exceptions", async () => {
        httpPutWithAuthMock.mockRejectedValue(new Error("offline"));
        await expect(putOpdsProgression(url, validDocument)).resolves.toEqual({
            kind: "network-error",
            isTimeout: false,
        });
    });
});
