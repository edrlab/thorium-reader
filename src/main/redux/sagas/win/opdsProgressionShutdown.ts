// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

interface IDestroyableReaderWindow {
    destroy: () => void;
}

export interface IForcedShutdownReader {
    identifier: string;
    publicationIdentifier: string;
    readerWindow?: IDestroyableReaderWindow;
}

export interface IForcedShutdownDependencies {
    clearProgressionLock: (publicationIdentifier: string) => void;
    closeProgressionSession: (windowIdentifier: string) => Promise<void>;
    deleteLocalProgressionSnapshot: (windowIdentifier: string) => void;
    deleteReaderWindow: (windowIdentifier: string) => void;
    getProgressionLockOwner: (publicationIdentifier: string) => string | undefined;
    markReaderClosing: (windowIdentifier: string) => void;
    unmarkReaderClosing: (windowIdentifier: string) => void;
}

/**
 * Cleans main-process reader state before Electron forcibly destroys windows.
 * Redux reader entries intentionally remain available for session persistence.
 */
export const cleanupAndDestroyReadersForForcedShutdown = async (
    readers: readonly IForcedShutdownReader[],
    dependencies: IForcedShutdownDependencies,
): Promise<void> => {
    const closingWindowIdentifiers = new Set(readers.map((reader) => reader.identifier));
    const errors: unknown[] = [];

    readers.forEach((reader) => dependencies.markReaderClosing(reader.identifier));
    try {
        const closeResults = await Promise.allSettled(readers.map((reader) =>
            Promise.resolve().then(() => dependencies.closeProgressionSession(reader.identifier))));
        closeResults.forEach((result) => {
            if (result.status === "rejected") {
                errors.push(result.reason);
            }
        });

        readers.forEach((reader) => {
            try {
                dependencies.deleteLocalProgressionSnapshot(reader.identifier);
            } catch (err) {
                errors.push(err);
            }
            try {
                dependencies.deleteReaderWindow(reader.identifier);
            } catch (err) {
                errors.push(err);
            }
        });

        new Set(readers.map((reader) => reader.publicationIdentifier)).forEach(
            (publicationIdentifier) => {
                try {
                    const currentOwner = dependencies.getProgressionLockOwner(publicationIdentifier);
                    if (currentOwner && closingWindowIdentifiers.has(currentOwner)) {
                        dependencies.clearProgressionLock(publicationIdentifier);
                    }
                } catch (err) {
                    errors.push(err);
                }
            },
        );

        readers.forEach((reader) => {
            try {
                reader.readerWindow?.destroy();
            } catch (err) {
                errors.push(err);
            }
        });
    } finally {
        readers.forEach((reader) => dependencies.unmarkReaderClosing(reader.identifier));
    }

    if (errors.length) {
        throw errors[0];
    }
};
