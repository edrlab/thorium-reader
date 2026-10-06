// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { isIP } from "node:net";

import { URL_PROTOCOL_APP_HANDLER_OPDS } from "readium-desktop/common/streamerProtocol";
import { IHttpGetResult } from "readium-desktop/common/utils/http";
import { getHttpNetworkErrorKind } from "./http-error";

export interface IOpdsTransportUrls {
    primaryUrl: string;
    httpFallbackUrl?: string;
}

const normalizeHostname = (hostname: string): string =>
    hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");

const isPrivateIpv4Address = (hostname: string): boolean => {
    const octets = hostname.split(".").map((octet) => Number(octet));
    if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
        return false;
    }

    const [first, second] = octets;
    return first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 100 && second >= 64 && second <= 127) ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168);
};

/**
 * Returns whether a host is eligible for the legacy local HTTP fallback.
 *
 * Recognized DNS namespaces:
 * - `localhost` and `*.localhost` are loopback names (RFC 6761).
 * - `*.local` is reserved for link-local Multicast DNS / mDNS (RFC 6762); it
 *   is not treated as a general-purpose private DNS suffix.
 * - `*.home.arpa` is reserved for residential home networks (RFC 8375).
 * - A single-label name is treated as a local/intranet hostname by Thorium
 *   policy, not because it belongs to an IETF-reserved private namespace.
 *
 * Other special-use names are deliberately excluded: `.invalid`, `.test`, and
 * `.example` are for invalid/test/documentation use (RFC 2606 and RFC 6761),
 * while `.onion` identifies Tor onion services (RFC 7686). Private-looking
 * suffixes such as `.lan`, `.corp`, `.private`, `.home`, and `.internal` are
 * likewise not accepted merely because of their suffix.
 *
 * Numeric hosts are accepted only when they are loopback, unspecified,
 * link-local, carrier-grade NAT, or private-use IPv4/IPv6 address ranges.
 */
export const isLocalOrPrivateHostname = (hostname: string): boolean => {
    const normalizedHostname = normalizeHostname(hostname);

    if (!normalizedHostname) {
        return false;
    }

    const ipVersion = isIP(normalizedHostname);
    if (ipVersion === 4) {
        return isPrivateIpv4Address(normalizedHostname);
    }
    if (ipVersion === 6) {
        if (normalizedHostname === "::" || normalizedHostname === "::1") {
            return true;
        }

        const firstHextet = Number.parseInt(normalizedHostname.split(":")[0], 16);
        if ((firstHextet & 0xfe00) === 0xfc00 || (firstHextet & 0xffc0) === 0xfe80) {
            return true;
        }

        const ipv4MappedAddress = normalizedHostname.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
        return !!ipv4MappedAddress && isPrivateIpv4Address(ipv4MappedAddress);
    }

    return normalizedHostname === "localhost" ||
        normalizedHostname.endsWith(".localhost") ||
        normalizedHostname.endsWith(".local") ||
        normalizedHostname.endsWith(".home.arpa") ||
        !normalizedHostname.includes(".");
};

export const getOpdsTransportUrls = (urlRaw: string): IOpdsTransportUrls => {
    const parsedUrl = new URL(urlRaw);
    if (parsedUrl.protocol !== `${URL_PROTOCOL_APP_HANDLER_OPDS}:`) {
        return { primaryUrl: urlRaw };
    }

    const primaryUrl = urlRaw.replace(/^opds:/i, "https:");
    const httpFallbackUrl = isLocalOrPrivateHostname(parsedUrl.hostname)
        ? urlRaw.replace(/^opds:/i, "http:")
        : undefined;

    return { primaryUrl, httpFallbackUrl };
};

export const requestOpdsUrl = async <TData>(
    urlRaw: string,
    request: (url: string) => Promise<IHttpGetResult<TData>>,
): Promise<IHttpGetResult<TData>> => {
    const { primaryUrl, httpFallbackUrl } = getOpdsTransportUrls(urlRaw);
    const primaryResult = await request(primaryUrl);
    const networkErrorKind = primaryResult.networkErrorKind || getHttpNetworkErrorKind(
        primaryResult.networkErrorCode,
        !!primaryResult.isTimeout,
    );

    if (httpFallbackUrl &&
        primaryResult.isNetworkError &&
        (networkErrorKind === "connection" || networkErrorKind === "timeout")) {
        return request(httpFallbackUrl);
    }

    return primaryResult;
};
