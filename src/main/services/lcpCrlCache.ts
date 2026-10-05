// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Buffer } from "node:buffer";

const PEM_HEADER = "-----BEGIN X509 CRL-----";
const PEM_FOOTER = "-----END X509 CRL-----";

export const LCP_CRL_CACHE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

interface ILcpCrlCacheEntry {
    crlPem: string;
    cachedAt: number;
}

interface ILcpCrlMemoryEntry {
    crlPem: string;
    isExpired: boolean;
}

export const encodeLcpCrlPem = (der: Uint8Array): string =>
    `${PEM_HEADER}${Buffer.from(der).toString("base64")}${PEM_FOOTER}`;

/**
 * Checks that the data has the outer DER structure of an X.509 CRL.
 *
 * CertificateList is a SEQUENCE whose first element, tbsCertList, is another
 * SEQUENCE. This deliberately does not parse the full CRL; it rejects non-DER
 * responses such as captive portal HTML and truncated downloads.
 */
export const isX509Crl = (data: Uint8Array): boolean => {
    if (data.length < 2 || data[0] !== 0x30) {
        return false;
    }

    let headerSize: number;
    let contentLength: number;
    if ((data[1] & 0x80) === 0) {
        headerSize = 2;
        contentLength = data[1];
    } else {
        const lengthSize = data[1] & 0x7F;
        if (lengthSize < 1 || lengthSize > 4 || data.length < 2 + lengthSize) {
            return false;
        }
        headerSize = 2 + lengthSize;
        contentLength = data.slice(2, headerSize).reduce((length, byte) => length * 256 + byte, 0);
    }

    if (headerSize + contentLength !== data.length) {
        return false;
    }

    return data.length > headerSize && data[headerSize] === 0x30;
};

interface ILcpCrlCacheOptions {
    fetchCrl: () => Promise<Uint8Array>;
    expirationMs?: number;
    defaultCrlPem?: string;
    defaultCrlCachedAt?: number;
    now?: () => number;
    log?: (message: string, error?: unknown) => void;
}

/**
 * In-memory CRL cache following readium/swift-toolkit's refresh behavior, with
 * Swift's readLocal() model represented here as readMemory(). If no memory CRL
 * has been seeded, a missing CRL blocks on the network, while an expired valid
 * CRL is returned immediately and refreshed in the background.
 *
 * Thorium seeds this cache with the build-time BUILD_CRL constant and its
 * BUILD_CRL_CACHED_AT timestamp. This gives liblcp a trusted fallback before
 * the first network refresh completes, while using the same freshness rule for
 * the bundled CRL as for a CRL fetched during the current process.
 *
 * This intentionally mirrors the Swift refresh algorithm, not its persistence
 * semantics. The Swift toolkit implementation stores its cache in UserDefaults,
 * which may be app-container scoped on sandboxed Apple platforms. In Electron,
 * the closest equivalent is app.getPath("userData"), a normal per-user app data
 * directory that another same-user process can usually modify or roll back.
 *
 * If this cache ever becomes disk-backed, treat the disk bytes and timestamps as
 * untrusted hints only. Before promoting a persisted CRL into memory, verify the
 * CRL signature against a pinned LCP CA/CRL-signing certificate or public key,
 * verify issuer/AuthorityKeyIdentifier, require cRLSign on the signing
 * certificate, and prefer signed CRL fields such as thisUpdate, nextUpdate and
 * CRLNumber over a local cachedAt value. Invalid persisted data should be
 * ignored and refreshed from the network instead of being passed to liblcp.
 *
 * Current logical model:
 *   startup:
 *     BUILD_CRL is seeded in memory with BUILD_CRL_CACHED_AT
 *     preload starts a network refresh only if the memory CRL is expired
 *   unlock:
 *     fresh memory CRL        -> return it
 *     expired memory CRL      -> return it and refresh in the background
 *     no memory CRL seed      -> wait for one network refresh before unlocking
 *
 * Logical model for a future disk-backed cache:
 *   startup:
 *     disk CRL present and authenticated -> load into memory, then refresh if stale
 *     disk CRL missing/invalid/expired   -> fall back to BUILD_CRL and refresh
 *   unlock:
 *     fresh memory CRL          -> return it
 *     stale but authentic CRL   -> return it and refresh in the background
 *     no authentic local CRL    -> use BUILD_CRL or wait for one network refresh
 */
export class LcpCrlCache {
    private readonly expirationMs: number;
    private readonly fetchCrl: () => Promise<Uint8Array>;
    private readonly log: (message: string, error?: unknown) => void;
    private readonly now: () => number;
    private memoryCrl: ILcpCrlCacheEntry | undefined;
    private refreshPromise: Promise<string> | undefined;

    constructor(options: ILcpCrlCacheOptions) {
        this.expirationMs = options.expirationMs ?? LCP_CRL_CACHE_EXPIRATION_MS;
        this.fetchCrl = options.fetchCrl;
        this.log = options.log ?? (() => undefined);
        this.now = options.now ?? Date.now;

        if (options.defaultCrlPem) {
            this.memoryCrl = {
                crlPem: options.defaultCrlPem,
                cachedAt: options.defaultCrlCachedAt ?? this.now() - this.expirationMs,
            };
        }
    }

    /** Warms a missing or expired cache without making startup wait. */
    public preload(): void {
        this.log("LCP CRL PRELOAD");
        const memoryCrl = this.readMemory();
        if (memoryCrl?.isExpired ?? true) {
            void this.refresh().catch((error) => this.log("LCP CRL preload failed", error));
        }
    }

    public async retrieve(): Promise<string> {
        this.log("LCP CRL RETRIEVE");
        const memoryCrl = this.readMemory();
        if (!memoryCrl) {
            return this.refresh();
        }

        if (memoryCrl.isExpired) {
            void this.refresh().catch((error) => this.log("LCP CRL background refresh failed", error));
        }
        return memoryCrl.crlPem;
    }

    /**
     * Swift's CRLService.readLocal() reads and validates UserDefaults. Thorium
     * deliberately keeps the cache memory-only, so the equivalent decision point
     * simply exposes the current memory CRL and whether it is expired.
     */
    private readMemory(): ILcpCrlMemoryEntry | undefined {
        const memoryCrl = this.memoryCrl;
        if (!memoryCrl) {
            return undefined;
        }

        return {
            crlPem: memoryCrl.crlPem,
            isExpired: this.isExpired(memoryCrl),
        };
    }

    private isExpired(entry: ILcpCrlCacheEntry): boolean {
        return this.now() - entry.cachedAt >= this.expirationMs;
    }

    /** Starts a refresh, or returns the refresh already in flight. */
    private refresh(): Promise<string> {
        if (typeof this.refreshPromise !== "undefined") {
            return this.refreshPromise;
        }

        this.log("LCP CRL REFRESH");
        const refreshPromise = this.fetchAndSave();
        this.refreshPromise = refreshPromise;
        void refreshPromise.then(
            () => this.clearRefreshPromise(refreshPromise),
            () => this.clearRefreshPromise(refreshPromise),
        );
        return refreshPromise;
    }

    private clearRefreshPromise(refreshPromise: Promise<string>): void {
        if (this.refreshPromise === refreshPromise) {
            this.refreshPromise = undefined;
        }
    }

    private async fetchAndSave(): Promise<string> {
        const der = await this.fetchCrl();
        if (!isX509Crl(der)) {
            throw new Error("The LCP CRL response is not a valid DER-encoded X.509 CRL");
        }

        const entry: ILcpCrlCacheEntry = {
            crlPem: encodeLcpCrlPem(der),
            cachedAt: this.now(),
        };
        this.memoryCrl = entry;
        return entry.crlPem;
    }
}
