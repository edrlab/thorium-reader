// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it, jest } from "@jest/globals";

import {
    cleanupAndDestroyReadersForForcedShutdown,
    IForcedShutdownDependencies,
} from "readium-desktop/main/redux/sagas/win/opdsProgressionShutdown";

interface IDeferred {
    promise: Promise<void>;
    resolve: () => void;
}

const deferred = (): IDeferred => {
    let resolvePromise: () => void = () => undefined;
    const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
    });
    return { promise, resolve: resolvePromise };
};

describe("forced reader shutdown", () => {
    it("awaits every progression close and clears live state before destroying readers", async () => {
        const close = deferred();
        const events: string[] = [];
        const closing = new Set<string>();
        const snapshots = new Set(["reader-1", "reader-2", "reader-3"]);
        const readerWindows = new Set(["reader-1", "reader-2", "reader-3"]);
        const locks = new Map([
            ["publication-1", "reader-1"],
            ["publication-2", "surviving-reader"],
            ["publication-3", "reader-3"],
        ]);
        const destroyReader1 = jest.fn(() => {
            events.push("destroy:reader-1");
        });
        const destroyReader2 = jest.fn(() => {
            events.push("destroy:reader-2");
        });
        const readers = [
            {
                identifier: "reader-1",
                publicationIdentifier: "publication-1",
                readerWindow: {
                    destroy: destroyReader1,
                },
            },
            {
                identifier: "reader-2",
                publicationIdentifier: "publication-2",
                readerWindow: {
                    destroy: destroyReader2,
                },
            },
            {
                // A stale Redux session without a live BrowserWindow still needs
                // its coordinator, snapshot, DI, and lock state cleaned.
                identifier: "reader-3",
                publicationIdentifier: "publication-3",
            },
        ];
        const dependencies: IForcedShutdownDependencies = {
            clearProgressionLock: (publicationIdentifier) => {
                events.push(`lock:clear:${publicationIdentifier}`);
                locks.delete(publicationIdentifier);
            },
            closeProgressionSession: async (windowIdentifier) => {
                events.push(`close:start:${windowIdentifier}`);
                expect(closing).toEqual(new Set(["reader-1", "reader-2", "reader-3"]));
                await close.promise;
                events.push(`close:end:${windowIdentifier}`);
            },
            deleteLocalProgressionSnapshot: (windowIdentifier) => {
                events.push(`snapshot:delete:${windowIdentifier}`);
                snapshots.delete(windowIdentifier);
            },
            deleteReaderWindow: (windowIdentifier) => {
                events.push(`di:delete:${windowIdentifier}`);
                readerWindows.delete(windowIdentifier);
            },
            getProgressionLockOwner: (publicationIdentifier) => locks.get(publicationIdentifier),
            markReaderClosing: (windowIdentifier) => closing.add(windowIdentifier),
            unmarkReaderClosing: (windowIdentifier) => closing.delete(windowIdentifier),
        };

        const shutdown = cleanupAndDestroyReadersForForcedShutdown(readers, dependencies);
        await Promise.resolve();

        expect(destroyReader1).not.toHaveBeenCalled();
        expect(destroyReader2).not.toHaveBeenCalled();
        expect(snapshots).toEqual(new Set(["reader-1", "reader-2", "reader-3"]));

        close.resolve();
        await shutdown;

        expect(snapshots).toEqual(new Set());
        expect(readerWindows).toEqual(new Set());
        expect(locks.get("publication-1")).toBeUndefined();
        expect(locks.get("publication-2")).toBe("surviving-reader");
        expect(locks.get("publication-3")).toBeUndefined();
        expect(closing).toEqual(new Set());
        expect(events.indexOf("destroy:reader-1")).toBeGreaterThan(events.indexOf("lock:clear:publication-1"));
        expect(events.indexOf("destroy:reader-2")).toBeGreaterThan(events.indexOf("di:delete:reader-2"));
        expect(destroyReader1).toHaveBeenCalledTimes(1);
        expect(destroyReader2).toHaveBeenCalledTimes(1);
    });
});
