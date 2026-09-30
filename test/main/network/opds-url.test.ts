// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IHttpGetResult } from "readium-desktop/common/utils/http";
import { describe, expect, it, jest } from "@jest/globals";
import {
    getOpdsTransportUrls,
    isLocalOrPrivateHostname,
    requestOpdsUrl,
} from "readium-desktop/main/network/opds-url";
import {
    getHttpNetworkErrorCode,
    getHttpNetworkErrorKind,
    isTlsCertificateValidationErrorCode,
} from "readium-desktop/main/network/http-error";

const success = (url: string): IHttpGetResult<undefined> => ({
    url,
    isFailure: false,
    isSuccess: true,
});

const networkFailure = (
    url: string,
    networkErrorCode: string,
): IHttpGetResult<undefined> => ({
    url,
    isFailure: true,
    isSuccess: false,
    isNetworkError: true,
    networkErrorCode,
    networkErrorKind: getHttpNetworkErrorKind(networkErrorCode, false),
});

describe("HTTP network error metadata", () => {
    it("extracts a direct machine error code", () => {
        expect(getHttpNetworkErrorCode({ code: "ECONNREFUSED" })).toBe("ECONNREFUSED");
    });

    it("extracts a machine error code from a wrapped cause", () => {
        expect(getHttpNetworkErrorCode({ cause: { code: "CERT_HAS_EXPIRED" } })).toBe("CERT_HAS_EXPIRED");
    });

    it.each([
        "ERR_TLS_CERT_ALTNAME_INVALID",
        "CERT_HAS_EXPIRED",
        "DEPTH_ZERO_SELF_SIGNED_CERT",
        "SELF_SIGNED_CERT_IN_CHAIN",
        "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    ])("classifies %s as a certificate-validation error", (errorCode) => {
        expect(isTlsCertificateValidationErrorCode(errorCode)).toBe(true);
        expect(getHttpNetworkErrorKind(errorCode, false)).toBe("tls-certificate");
    });

    it("classifies connection, DNS, timeout, and unknown errors", () => {
        expect(getHttpNetworkErrorKind("ECONNREFUSED", false)).toBe("connection");
        expect(getHttpNetworkErrorKind("ENOTFOUND", false)).toBe("dns");
        expect(getHttpNetworkErrorKind("ECONNREFUSED", true)).toBe("timeout");
        expect(getHttpNetworkErrorKind(undefined, false)).toBe("unknown");
    });
});

describe("OPDS URL transport policy", () => {
    it("converts opds URLs to HTTPS without offering a public HTTP fallback", () => {
        expect(getOpdsTransportUrls("opds://example.com/catalog?q=books#new")).toEqual({
            primaryUrl: "https://example.com/catalog?q=books#new",
            httpFallbackUrl: undefined,
        });
    });

    it("preserves explicitly selected HTTP and HTTPS URLs", () => {
        expect(getOpdsTransportUrls("http://example.com/catalog")).toEqual({
            primaryUrl: "http://example.com/catalog",
        });
        expect(getOpdsTransportUrls("https://example.com/catalog")).toEqual({
            primaryUrl: "https://example.com/catalog",
        });
    });

    it.each([
        "localhost",
        "catalog.localhost",
        "books.local",
        "library",
        "127.0.0.1",
        "10.0.0.2",
        "172.16.0.2",
        "192.168.1.2",
        "::1",
        "fd00::1",
        "fe80::1",
    ])("recognizes %s as a local or private host", (hostname) => {
        expect(isLocalOrPrivateHostname(hostname)).toBe(true);
    });

    it.each([
        "",
        "example.test",
        "service.example",
        "hiddenservice.onion",
        "server.internal",
        "example.com",
    ])("does not infer that %s is local", (hostname) => {
        expect(isLocalOrPrivateHostname(hostname)).toBe(false);
    });

    it("uses HTTPS only when it succeeds", async () => {
        const request = jest.fn(async (url: string) => success(url));

        await expect(requestOpdsUrl("opds://localhost:8080/catalog", request)).resolves.toEqual(
            success("https://localhost:8080/catalog"),
        );
        expect(request).toHaveBeenCalledTimes(1);
        expect(request).toHaveBeenCalledWith("https://localhost:8080/catalog");
    });

    it("preserves an explicit HTTP request without trying HTTPS", async () => {
        const request = jest.fn(async (url: string) => success(url));

        await expect(requestOpdsUrl("http://example.com/catalog", request)).resolves.toEqual(
            success("http://example.com/catalog"),
        );
        expect(request).toHaveBeenCalledTimes(1);
        expect(request).toHaveBeenCalledWith("http://example.com/catalog");
    });

    it("falls back to HTTP for a local server after an HTTPS connection failure", async () => {
        const request = jest.fn(async (url: string) => url.startsWith("https:")
            ? networkFailure(url, "ECONNREFUSED")
            : success(url));

        await expect(requestOpdsUrl("opds://127.0.0.1:8080/catalog", request)).resolves.toEqual(
            success("http://127.0.0.1:8080/catalog"),
        );
        expect(request.mock.calls).toEqual([
            ["https://127.0.0.1:8080/catalog"],
            ["http://127.0.0.1:8080/catalog"],
        ]);
    });

    it("does not downgrade a local URL after a certificate validation failure", async () => {
        const failure = networkFailure(
            "https://localhost:8080/catalog",
            "DEPTH_ZERO_SELF_SIGNED_CERT",
        );
        const request = jest.fn(async () => failure);

        await expect(requestOpdsUrl("opds://localhost:8080/catalog", request)).resolves.toBe(failure);
        expect(request).toHaveBeenCalledTimes(1);
    });

    it("does not downgrade a public URL after a connection failure", async () => {
        const failure = networkFailure(
            "https://example.com/catalog",
            "ECONNREFUSED",
        );
        const request = jest.fn(async () => failure);

        await expect(requestOpdsUrl("opds://example.com/catalog", request)).resolves.toBe(failure);
        expect(request).toHaveBeenCalledTimes(1);
    });

    it("does not downgrade a local URL after an unclassified network failure", async () => {
        const failure: IHttpGetResult<undefined> = {
            url: "https://localhost:8080/catalog",
            isFailure: true,
            isSuccess: false,
            isNetworkError: true,
            networkErrorKind: "unknown",
        };
        const request = jest.fn(async () => failure);

        await expect(requestOpdsUrl("opds://localhost:8080/catalog", request)).resolves.toBe(failure);
        expect(request).toHaveBeenCalledTimes(1);
    });
});
