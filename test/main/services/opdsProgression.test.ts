// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("readium-desktop/main/network/http", () => ({
    httpGet: jest.fn(),
}));

import { OPDS_PROGRESSION_MEDIA_TYPE } from "readium-desktop/common/models/opdsProgression";
import type { IHttpGetResult } from "readium-desktop/common/utils/http";
import { httpGet } from "readium-desktop/main/network/http";
import { getOpdsProgression, parseOpdsProgressionDocument } from "readium-desktop/main/services/opdsProgression";

const httpGetMock = jest.mocked(httpGet);
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
});
