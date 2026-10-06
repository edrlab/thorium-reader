// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import type { TOpdsProgressionPutDocument } from "readium-desktop/main/services/opdsProgression";
import {
    OpdsProgressionSyncCoordinator,
    TOpdsProgressionUploadOutcome,
} from "readium-desktop/main/services/opdsProgressionSync";

const registration = {
    device: {
        id: "urn:uuid:019c0047-cc8d-7ec4-a3c3-938ccadc020a",
        name: "Thorium",
    },
    locale: "en" as const,
    publicationIdentifier: "publication-id",
    spine: [
        { Href: "chapter-1.xhtml" },
        { Href: "chapter-2.xhtml" },
        { Href: "chapter-3.xhtml" },
        { Href: "chapter-4.xhtml" },
    ],
    url: "https://example.org/publications/1/progression",
    windowIdentifier: "window-id",
};

const locator = (href: string, progression: number): MiniLocatorExtended["locator"] => ({
    href,
    locations: { progression },
});

const successfulUpload = (modified: string, progression = 0.3): TOpdsProgressionUploadOutcome => ({
    kind: "success",
    modified,
    progression,
});

interface ICreateCoordinatorOptions {
    canUpload?: (windowIdentifier: string, publicationIdentifier: string) => boolean;
    initialLocator?: MiniLocatorExtended["locator"];
    now?: () => number;
    onUpload?: (
        document: TOpdsProgressionPutDocument,
        uploadNumber: number,
    ) => Promise<TOpdsProgressionUploadOutcome> | TOpdsProgressionUploadOutcome;
    outcomes?: TOpdsProgressionUploadOutcome[];
}

const createCoordinator = (options: ICreateCoordinatorOptions = {}) => {
    const uploads: TOpdsProgressionPutDocument[] = [];
    const outcomes = [...(options.outcomes || [])];
    let now = Date.parse("2026-10-01T10:00:00.000Z");
    const coordinator = new OpdsProgressionSyncCoordinator({
        canUpload: options.canUpload,
        now: options.now || (() => now++),
        upload: async (_url, document) => {
            uploads.push(document);
            if (options.onUpload) {
                return options.onUpload(document, uploads.length);
            }
            return outcomes.shift() || successfulUpload(document.modified, document.progression);
        },
    });
    coordinator.register({
        ...registration,
        initialLocator: options.initialLocator,
    });
    return { coordinator, uploads };
};

interface IDeferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
}

const deferred = <T>(): IDeferred<T> => {
    let resolvePromise: ((value: T) => void) | undefined;
    const promise = new Promise<T>((resolve) => {
        resolvePromise = resolve;
    });
    return {
        promise,
        resolve: (value) => resolvePromise?.(value),
    };
};

const advanceTimers = async (milliseconds: number): Promise<void> => {
    await jest.advanceTimersByTimeAsync(milliseconds);
};

describe("OPDS progression PUT coordination", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("uploads only while the reader owns the publication lock", async () => {
        let ownsLock = true;
        const { coordinator, uploads } = createCoordinator({
            canUpload: () => ownsLock,
            initialLocator: locator("chapter-1.xhtml", 0.1),
        });
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);

        // Ownership can change after movement was queued but before the debounce ends.
        ownsLock = false;
        await advanceTimers(5000);
        expect(uploads).toEqual([]);
        coordinator.observeLocator("window-id", locator("chapter-3.xhtml", 0.4), false);
        await advanceTimers(5000);
        expect(uploads).toEqual([]);

        ownsLock = true;
        coordinator.acquireUploadLock("window-id");
        await advanceTimers(5000);
        expect(uploads).toHaveLength(1);
        expect(uploads[0].progression).toBe(0.6);
    });

    it("cancels pending uploads when the reader is discarded", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
        });
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        coordinator.discard("window-id");
        await advanceTimers(5000);
        expect(uploads).toEqual([]);
        expect(jest.getTimerCount()).toBe(0);
    });

    it("does not retry an in-flight PUT after the reader is discarded", async () => {
        const response = deferred<TOpdsProgressionUploadOutcome>();
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            onUpload: () => response.promise,
        });
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        await advanceTimers(5000);
        expect(uploads).toHaveLength(1);
        coordinator.discard("window-id");
        response.resolve("retry");
        await advanceTimers(5000);
        expect(uploads).toHaveLength(1);
        expect(jest.getTimerCount()).toBe(0);
    });

    it("uses the first valid navigator position as hydration when no locator was persisted", async () => {
        const { coordinator, uploads } = createCoordinator();

        coordinator.observeLocator("window-id", locator("chapter-1.xhtml", 0.2), true);
        coordinator.completeInitialGet("window-id");
        await advanceTimers(5000);

        expect(uploads).toEqual([]);
    });

    it("uses a persisted locator baseline so the first genuine movement is retained", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.2),
        });

        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        coordinator.completeInitialGet("window-id");
        await advanceTimers(5000);

        expect(uploads).toHaveLength(1);
        expect(uploads[0].progression).toBe(0.3);
    });

    it("compares publication progression rather than unrelated locator metadata", async () => {
        const initialLocator: MiniLocatorExtended["locator"] = {
            ...locator("chapter-2.xhtml", 0.4),
            title: "Before hydration",
            locations: {
                cfi: "/6/2[before]",
                progression: 0.4,
            },
        };
        const { coordinator, uploads } = createCoordinator({ initialLocator });

        coordinator.observeLocator(
            "window-id",
            {
                ...initialLocator,
                title: "After hydration",
                locations: {
                    cfi: "/6/8[after]",
                    progression: 0.4000000001,
                },
            },
            true,
        );
        coordinator.completeInitialGet("window-id");
        await advanceTimers(5000);

        expect(uploads).toEqual([]);
    });

    it("gates and debounces the newest local position until the initial GET completes", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
        });
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        coordinator.observeLocator("window-id", locator("chapter-4.xhtml", 0.4), true);

        await advanceTimers(20_000);
        expect(uploads).toEqual([]);
        expect(coordinator.hasPending("window-id")).toBe(true);

        coordinator.completeInitialGet("window-id");
        await advanceTimers(4999);
        expect(uploads).toEqual([]);
        await advanceTimers(1);

        expect(uploads).toHaveLength(1);
        expect(uploads[0]).toMatchObject({
            device: registration.device,
            progression: 0.85,
        });
        expect(Number.isFinite(Date.parse(uploads[0].modified))).toBe(true);
        expect(Object.prototype.hasOwnProperty.call(uploads[0], "references")).toBe(false);
    });

    it("resets the default trailing debounce after movement while already ready", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
        });
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        await advanceTimers(4000);

        coordinator.observeLocator("window-id", locator("chapter-4.xhtml", 0.4), true);
        await advanceTimers(1000);
        expect(uploads).toEqual([]);
        await advanceTimers(3999);
        expect(uploads).toEqual([]);
        await advanceTimers(1);

        expect(uploads).toHaveLength(1);
        expect(uploads[0].progression).toBe(0.85);
    });

    it("holds queued uploads through a remote prompt and releases them after rejection", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
        });
        coordinator.observeLocator("window-id", locator("chapter-3.xhtml", 0.5), true);
        coordinator.beginRemoteReconciliation("window-id", 0.8);
        coordinator.completeInitialGet("window-id");

        await advanceTimers(20_000);
        expect(uploads).toEqual([]);

        coordinator.resolveRemoteReconciliation("window-id", false);
        await advanceTimers(4999);
        expect(uploads).toEqual([]);
        await advanceTimers(1);

        expect(uploads).toHaveLength(1);
        expect(uploads[0].progression).toBe(0.625);
    });

    it("drops queued local state on acceptance and suppresses the remote-applied locator", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
        });
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        coordinator.beginRemoteReconciliation("window-id", 0.75);
        coordinator.resolveRemoteReconciliation("window-id", true);
        coordinator.acquireUploadLock("window-id");
        await advanceTimers(5000);
        expect(uploads).toEqual([]);

        // If another locator arrives before the programmatic navigation settles,
        // consuming the expected remote locator must cancel that stale candidate.
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.5), true);
        expect(coordinator.hasPending("window-id")).toBe(true);
        coordinator.observeLocator("window-id", locator("chapter-4.xhtml", 0.0000000002), true);

        await advanceTimers(5000);
        expect(uploads).toEqual([]);
        expect(coordinator.hasPending("window-id")).toBe(false);

        coordinator.observeLocator("window-id", locator("chapter-4.xhtml", 0.2), true);
        await advanceTimers(5000);
        expect(uploads).toHaveLength(1);
        expect(uploads[0].progression).toBe(0.8);
    });

    it("suppresses the safe locator produced by an accepted 100 percent remote position", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
        });
        coordinator.beginRemoteReconciliation("window-id", 1);
        coordinator.resolveRemoteReconciliation("window-id", true);

        // The coordinator stores the exact scalar represented by the safe 0.95
        // navigation locator, avoiding any global interpretation of 0.95 as 1.
        coordinator.observeLocator("window-id", locator("chapter-4.xhtml", 0.95), true);
        coordinator.acquireUploadLock("window-id");
        await advanceTimers(5000);

        expect(uploads).toEqual([]);
    });

    it("re-evaluates movement made without the lock when this reader is promoted", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
        });
        coordinator.observeLocator("window-id", locator("chapter-3.xhtml", 0.2), false);
        coordinator.completeInitialGet("window-id");
        await advanceTimers(5000);
        expect(uploads).toEqual([]);

        coordinator.acquireUploadLock("window-id");
        await advanceTimers(5000);

        expect(uploads).toHaveLength(1);
        expect(uploads[0].progression).toBe(0.55);
    });

    it("shares pending upload state without allowing another reader's dialog to clear it", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
        });
        coordinator.register({ ...registration, windowIdentifier: "window-b" });
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        expect(coordinator.hasPending("window-b")).toBe(true);

        coordinator.beginRemoteReconciliation("window-b", 0.8);
        coordinator.resolveRemoteReconciliation("window-b", true);
        coordinator.discard("window-b");
        await advanceTimers(5000);
        expect(uploads).toHaveLength(1);
        expect(uploads[0].progression).toBe(0.3);
    });

    it("does not echo a remote position accepted before acquiring the lock", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
        });
        coordinator.register({ ...registration, windowIdentifier: "window-b" });
        coordinator.beginRemoteReconciliation("window-b", 0.8);
        coordinator.resolveRemoteReconciliation("window-b", true);
        coordinator.observeLocator("window-b", locator("chapter-4.xhtml", 0.2), false);
        coordinator.discard("window-id");
        coordinator.acquireUploadLock("window-b");
        await advanceTimers(5000);
        expect(uploads).toEqual([]);

        coordinator.observeLocator("window-b", locator("chapter-4.xhtml", 0.4), true);
        await advanceTimers(5000);
        expect(uploads).toHaveLength(1);
        expect(uploads[0].progression).toBe(0.85);
    });

    it("replaces the old owner's pending position when the lock changes", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
        });
        coordinator.register({ ...registration, windowIdentifier: "window-b" });
        coordinator.completeInitialGet("window-id");
        coordinator.completeInitialGet("window-b");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        coordinator.observeLocator("window-b", locator("chapter-3.xhtml", 0.4), false);
        coordinator.acquireUploadLock("window-b");
        coordinator.discard("window-id");

        await advanceTimers(5000);
        expect(uploads).toHaveLength(1);
        expect(uploads[0].progression).toBe(0.6);
    });

    it("does not retry the old owner's request after handoff during an upload", async () => {
        const response = deferred<TOpdsProgressionUploadOutcome>();
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            onUpload: (document, count) =>
                count === 1 ? response.promise : successfulUpload(document.modified, document.progression),
        });
        coordinator.register({ ...registration, windowIdentifier: "window-b" });
        coordinator.completeInitialGet("window-id");
        coordinator.completeInitialGet("window-b");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        await advanceTimers(5000);
        coordinator.observeLocator("window-b", locator("chapter-3.xhtml", 0.4), false);
        coordinator.acquireUploadLock("window-b");
        coordinator.discard("window-id");
        response.resolve("retry");
        await advanceTimers(5000);

        expect(uploads.map((document) => document.progression)).toEqual([0.3, 0.6]);
    });

    it("uses one monotonic timestamp floor across readers sharing a progression resource", async () => {
        const fixedNow = Date.parse("2026-10-01T10:00:00.000Z");
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            now: () => fixedNow,
        });
        coordinator.register({
            ...registration,
            initialLocator: locator("chapter-1.xhtml", 0.1),
            windowIdentifier: "window-b",
        });
        coordinator.completeInitialGet("window-id");
        coordinator.completeInitialGet("window-b");

        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        await advanceTimers(5000);
        coordinator.observeLocator("window-b", locator("chapter-3.xhtml", 0.2), false);
        coordinator.acquireUploadLock("window-b");
        await advanceTimers(5000);

        expect(uploads).toHaveLength(2);
        expect(Date.parse(uploads[1].modified)).toBe(Date.parse(uploads[0].modified) + 1);
        expect(uploads[1].progression).toBe(0.55);
    });

    it("advances beyond a future-dated progression retrieved from the server", async () => {
        const fixedNow = Date.parse("2026-10-01T10:00:00.000Z");
        const remoteModified = "2040-01-01T00:00:00.000Z";
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            now: () => fixedNow,
        });
        coordinator.recordRemoteModified("window-id", remoteModified);
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        await advanceTimers(5000);

        expect(uploads).toHaveLength(1);
        expect(Date.parse(uploads[0].modified)).toBe(Date.parse(remoteModified) + 1);
    });

    it("rebases movement queued before a future-dated GET when local wins", async () => {
        const fixedNow = Date.parse("2026-10-01T10:00:00.000Z");
        const remoteModified = "2040-01-01T00:00:00.000Z";
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            now: () => fixedNow,
        });
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        coordinator.recordRemoteModified("window-id", remoteModified);
        coordinator.beginRemoteReconciliation("window-id", 0.8);
        coordinator.resolveRemoteReconciliation("window-id", false);
        await advanceTimers(5000);

        expect(uploads).toHaveLength(1);
        expect(Date.parse(uploads[0].modified)).toBe(Date.parse(remoteModified) + 1);
        expect(uploads[0].progression).toBe(0.3);
    });

    it("advances beyond the canonical modified timestamp returned by PUT", async () => {
        const fixedNow = Date.parse("2026-10-01T10:00:00.000Z");
        const canonicalModified = "2040-01-01T00:00:00.000Z";
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            now: () => fixedNow,
            onUpload: (document, uploadNumber) =>
                uploadNumber === 1
                    ? successfulUpload(canonicalModified, document.progression)
                    : successfulUpload(document.modified, document.progression),
        });
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        await advanceTimers(5000);
        coordinator.observeLocator("window-id", locator("chapter-3.xhtml", 0.2), true);
        await advanceTimers(5000);

        expect(uploads).toHaveLength(2);
        expect(Date.parse(uploads[1].modified)).toBe(Date.parse(canonicalModified) + 1);
    });

    it("rebases movement queued while PUT returns a future canonical timestamp", async () => {
        const firstUpload = deferred<TOpdsProgressionUploadOutcome>();
        const fixedNow = Date.parse("2026-10-01T10:00:00.000Z");
        const canonicalModified = "2040-01-01T00:00:00.000Z";
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            now: () => fixedNow,
            onUpload: (document, uploadNumber) =>
                uploadNumber === 1 ? firstUpload.promise : successfulUpload(document.modified, document.progression),
        });
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        await advanceTimers(5000);
        expect(uploads).toHaveLength(1);

        coordinator.observeLocator("window-id", locator("chapter-3.xhtml", 0.2), true);
        firstUpload.resolve(successfulUpload(canonicalModified, uploads[0].progression));
        await Promise.resolve();
        await Promise.resolve();
        await advanceTimers(5000);

        expect(uploads).toHaveLength(2);
        expect(Date.parse(uploads[1].modified)).toBe(Date.parse(canonicalModified) + 1);
    });

    it("serializes different publications sharing an endpoint and rebases the waiting upload", async () => {
        const firstUpload = deferred<TOpdsProgressionUploadOutcome>();
        const fixedNow = Date.parse("2026-10-01T10:00:00.000Z");
        // The second candidate is preallocated fixedNow + 1 before it waits.
        // An equal canonical timestamp still represents a conflicting document.
        const canonicalModified = new Date(fixedNow + 1).toISOString();
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            now: () => fixedNow,
            onUpload: (document, uploadNumber) => {
                if (uploadNumber === 1) {
                    return firstUpload.promise;
                }
                return successfulUpload(document.modified, document.progression);
            },
        });
        coordinator.register({
            ...registration,
            initialLocator: locator("chapter-1.xhtml", 0.1),
            windowIdentifier: "window-b",
            publicationIdentifier: "another-publication",
        });
        coordinator.completeInitialGet("window-id");
        coordinator.completeInitialGet("window-b");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        coordinator.observeLocator("window-b", locator("chapter-3.xhtml", 0.2), true);

        const firstFlush = coordinator.flush("window-id");
        const secondFlush = coordinator.flush("window-b");
        expect(uploads).toHaveLength(1);

        firstUpload.resolve(successfulUpload(canonicalModified, uploads[0].progression));
        await firstFlush;
        await secondFlush;

        expect(uploads).toHaveLength(2);
        expect(uploads[1].progression).toBe(0.55);
        expect(Date.parse(uploads[1].modified)).toBe(Date.parse(canonicalModified) + 1);
    });

    it("does not mark a request scalar synchronized when PUT returns another progression", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            onUpload: (document, uploadNumber) =>
                successfulUpload(document.modified, uploadNumber === 1 ? 0.8 : document.progression),
        });
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        await advanceTimers(5000);

        coordinator.acquireUploadLock("window-id");
        await advanceTimers(5000);

        expect(uploads).toHaveLength(2);
        expect(uploads[1].progression).toBe(0.3);
    });

    it("drops one rejected candidate without disabling later locator events", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            outcomes: ["drop", successfulUpload("2026-10-01T10:00:00.000Z")],
        });
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        await advanceTimers(5000);

        expect(uploads).toHaveLength(1);
        expect(coordinator.isDisabled("window-id")).toBe(false);

        coordinator.acquireUploadLock("window-id");
        await advanceTimers(5000);
        expect(uploads).toHaveLength(1);

        coordinator.observeLocator("window-id", locator("chapter-3.xhtml", 0.3), true);
        await advanceTimers(5000);

        expect(uploads).toHaveLength(2);
        expect(uploads[1].progression).toBe(0.575);
    });

    it("holds a 401 candidate until OPDS authentication completes", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            outcomes: [
                {
                    kind: "hold",
                    authenticationUrl: "https://auth.example.org/progression",
                },
                successfulUpload("2026-10-01T10:00:00.000Z"),
            ],
        });
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);

        await advanceTimers(5000);
        expect(uploads).toHaveLength(1);
        expect(coordinator.hasPending("window-id")).toBe(true);
        coordinator.observeLocator("window-id", locator("chapter-3.xhtml", 0.4), true);
        await advanceTimers(20_000);
        expect(uploads).toHaveLength(1);

        expect(coordinator.getPendingAuthenticationUrls()).toEqual(["https://auth.example.org/progression"]);
        coordinator.resumeAfterAuthentication("https://unrelated.example.org/progression");
        await advanceTimers(0);
        expect(uploads).toHaveLength(1);

        coordinator.resumeAfterAuthentication("https://auth.example.org/progression");
        await advanceTimers(0);

        expect(uploads).toHaveLength(2);
        expect(uploads[1].progression).toBe(0.6);
        expect(uploads[1].modified > uploads[0].modified).toBe(true);
        expect(coordinator.hasPending("window-id")).toBe(false);
    });

    it("disables all later uploads after a session-fatal outcome", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            outcomes: ["disable"],
        });
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);
        await advanceTimers(5000);

        expect(coordinator.isDisabled("window-id")).toBe(true);
        coordinator.observeLocator("window-id", locator("chapter-3.xhtml", 0.3), true);
        await advanceTimers(5000);
        expect(uploads).toHaveLength(1);
    });

    it("retries once and cancels the exhausted candidate when discarded", async () => {
        const { coordinator, uploads } = createCoordinator({
            initialLocator: locator("chapter-1.xhtml", 0.1),
            outcomes: ["retry", "retry", "retry", successfulUpload("2026-10-01T10:00:00.000Z")],
        });
        coordinator.completeInitialGet("window-id");
        coordinator.observeLocator("window-id", locator("chapter-2.xhtml", 0.2), true);

        await advanceTimers(5000);
        expect(uploads).toHaveLength(1);
        expect(coordinator.hasPending("window-id")).toBe(true);
        await advanceTimers(999);
        expect(uploads).toHaveLength(1);
        await advanceTimers(1);

        expect(uploads).toHaveLength(2);
        expect(uploads[1]).toEqual(uploads[0]);
        expect(coordinator.hasPending("window-id")).toBe(true);
        await advanceTimers(10_000);
        expect(uploads).toHaveLength(2);

        coordinator.discard("window-id");
        await advanceTimers(10_000);
        expect(uploads).toHaveLength(2);
        expect(coordinator.hasPending("window-id")).toBe(false);
    });
});
