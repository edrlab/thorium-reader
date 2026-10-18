// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it, jest } from "@jest/globals";
import { runSaga } from "redux-saga";
import { createStore } from "redux";
import { OpdsFeed } from "readium-desktop/common/models/opds";

jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("electron", () => ({ nativeImage: {} }));
jest.mock("inversify", () => ({ injectable: () => (target: unknown) => target }));
jest.mock("readium-desktop/main/redux/actions", () => ({
    opdsActions: jest.requireActual("readium-desktop/main/redux/actions/opds"),
}));
jest.mock("@r2-lcp-js/serializable", () => ({ TaJsonDeserialize: (value: unknown) => value }));
jest.mock("@r2-opds-js/opds/opds2/opds2", () => ({ OPDSFeed: class {} }));
jest.mock("readium-desktop/main/di", () => ({ diMainGet: jest.fn() }));
jest.mock("readium-desktop/main/network/http", () => ({ httpGetWithAuth: jest.fn() }));
jest.mock("readium-desktop/main/analytics/catalog", () => ({ logCatalogAdd: jest.fn(), logCatalogEvent: jest.fn() }));
jest.mock("readium-desktop/common/redux/actions", () => ({
    opdsActions: { refresh: { build: () => ({ type: "refresh" }) } },
}));

import { addFeed, setFeedFavorite, updateFeed } from "readium-desktop/main/redux/sagas/api/opds/feed";
import { diMainGet } from "readium-desktop/main/di";
import { httpGetWithAuth } from "readium-desktop/main/network/http";
import { logCatalogEvent } from "readium-desktop/main/analytics/catalog";
import { catalogAnalyticsEvents } from "readium-desktop/common/analytics/catalog";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { opdsDbReducers } from "readium-desktop/main/redux/reducers/opds/db";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";

describe("feed updates", () => {
    it.each([
        [false, true, true],
        [true, true, false],
        [true, false, false],
    ])("updates a feed with previous favorite %s and requested favorite %s", async (previousFavorite, favorite, logsFavorite) => {
        jest.mocked(logCatalogEvent).mockClear();
        const data: OpdsFeed = { title: "Updated feed", url: "https://example.org/catalog", favorite };
        const previous = { ...data, favorite: previousFavorite, identifier: "requested-feed", createdAt: 1 };
        const repository = {
            get: jest.fn(async () => previous),
            delete: jest.fn(async () => undefined),
            save: jest.fn(async (feed: OpdsFeed) => feed),
            update: jest.fn(async (_identifier: string, patch: Partial<OpdsFeed>) => ({ ...previous, ...patch })),
        };
        const converter = { convertDocumentToView: (doc: OpdsFeed) => ({ ...doc }) };
        jest.mocked(diMainGet).mockImplementation((key) =>
            (key === "opds-feed-repository" ? repository : converter) as never);

        const result = await runSaga({}, updateFeed, "requested-feed", data).toPromise();

        expect(repository.delete).not.toHaveBeenCalled();
        expect(repository.update).toHaveBeenCalledWith("requested-feed", data);
        expect(result).toEqual({ ...previous, ...data });
        expect(logCatalogEvent).toHaveBeenCalledWith(catalogAnalyticsEvents.edit);
        if (logsFavorite) {
            expect(logCatalogEvent).toHaveBeenCalledWith(catalogAnalyticsEvents.favorite);
        } else {
            expect(logCatalogEvent).not.toHaveBeenCalledWith(catalogAnalyticsEvents.favorite);
        }
    });

    it("rejects a deleted feed without recreating it", async () => {
        const repository = {
            get: async (): Promise<undefined> => undefined,
            save: jest.fn(),
        };
        jest.mocked(diMainGet).mockReturnValue(repository as never);
        await expect(runSaga({ onError: () => undefined }, updateFeed, "deleted-feed", {
            title: "Deleted", url: "https://example.org/catalog",
        }).toPromise()).rejects.toThrow("OPDS feed not found: deleted-feed");
        expect(repository.save).not.toHaveBeenCalled();
    });

    it.each([false, true])("keeps the identifier and never hides a feed during repeated edits (migrated: %s)", async (migrated) => {
        type State = { opds: { catalog: OpdsFeedDocument[] } };
        const store = createStore((state: State = { opds: { catalog: [] } }, action): State => ({
            opds: { catalog: opdsDbReducers(state.opds.catalog, action as never) },
        }));
        const repository = new OpdsFeedRepository();
        const converter = { convertDocumentToView: (doc: OpdsFeed) => ({ ...doc }) };
        jest.mocked(diMainGet).mockImplementation((key) =>
            (key === "store" ? store : key === "opds-feed-repository" ? repository : converter) as never);
        const initial = await repository.save({
            title: "Original", url: "https://example.org/catalog", identifier: "stable-id",
            ...{ migratedFrom1_6Database: migrated, createdAt: 1 },
        });
        const snapshots: unknown[] = [];
        const unsubscribe = store.subscribe(() => snapshots.push(store.getState().opds.catalog));
        for (const title of ["First edit", "Second edit"]) {
            await runSaga({}, updateFeed, initial.identifier, {
                title, url: "https://example.org/edited", favorite: true,
                identifier: "must-not-replace-the-requested-identifier",
            }).toPromise();
            expect(await repository.get(initial.identifier)).toMatchObject({
                identifier: initial.identifier, title, createdAt: 1,
            });
        }
        await runSaga({}, setFeedFavorite, initial.identifier, false).toPromise();
        const authenticationUrl = "https://example.org/auth";
        await runSaga({ dispatch: () => undefined }, addFeed, {
            title: "Ignored", url: "https://example.org/edited", authenticationUrl,
        }).toPromise();
        expect(await repository.get(initial.identifier)).toMatchObject({
            title: "Second edit", favorite: false, authenticationUrl, createdAt: 1,
        });
        unsubscribe();
        expect(snapshots).toHaveLength(4);
        for (const snapshot of snapshots) {
            expect(snapshot).toEqual([expect.objectContaining({
                identifier: initial.identifier, migratedFrom1_6Database: migrated,
            })]);
        }
    });
});

describe("feed authentication discovery", () => {
    it("persists the discovered authentication URL after a slow icon download", async () => {
        const feedUrl = "https://example.org/catalog";
        const authenticationUrl = "https://example.org/auth";
        const iconUrl = "https://example.org/icon.svg";
        const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"></svg>');
        const documents: (OpdsFeed & { identifier: string })[] = [];
        const repository = {
            findAll: async () => [...documents],
            save: async (feed: OpdsFeed) => {
                const doc = { ...feed, identifier: feed.identifier || "saved-feed" };
                const idx = documents.findIndex((entry) => entry.identifier === doc.identifier);
                if (idx >= 0) {
                    documents[idx] = doc;
                } else {
                    documents.push(doc);
                }
                return doc;
            },
            update: async (identifier: string, patch: Partial<OpdsFeed>) => {
                const index = documents.findIndex((doc) => doc.identifier === identifier);
                if (index < 0) throw new Error("Deleted feed");
                documents[index] = { ...documents[index], ...patch };
                return documents[index];
            },
            delete: async (identifier: string) => {
                documents.splice(documents.findIndex((doc) => doc.identifier === identifier), 1);
            },
        };
        const converter = {
            convertDocumentToView: (doc: OpdsFeed) => ({ ...doc }),
            convertOpdsFeedToView: () => ({ links: { bookshelf: [{ url: authenticationUrl }] } }),
        };
        jest.mocked(diMainGet).mockImplementation((key) =>
            (key === "opds-feed-repository" ? repository : converter) as never);

        let releaseIcon: () => void;
        const iconGate = new Promise<void>((resolve) => { releaseIcon = resolve; });
        const requests: string[] = [];
        const http = async (url: string) => {
            requests.push(url);
            if (url === iconUrl) {
                await iconGate;
                return { isSuccess: true, contentType: "image/svg+xml", response: { buffer: async () => svg } };
            }
            return { contentType: "application/opds-authentication+json", response: { json: async () => ({}) } };
        };
        jest.mocked(httpGetWithAuth).mockReturnValue(http as never);
        const dispatched: unknown[] = [];
        const task = runSaga({ dispatch: (action: unknown) => { dispatched.push(action); } },
            addFeed, { title: "Registry feed", url: feedUrl }, "registry", iconUrl);

        // Leave the icon pending while all immediately resolving discovery work
        // would finish. This reproduces the original race without timing sleeps.
        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(requests).toContain(iconUrl);
        expect(documents).toHaveLength(0);
        releaseIcon();
        await task.toPromise();
        await new Promise<void>((resolve) => setImmediate(resolve));

        expect(requests).toContain(feedUrl);
        expect(requests).toContain(authenticationUrl);
        expect(documents).toHaveLength(1);
        expect(documents[0].authenticationUrl).toBe(authenticationUrl);
        expect(documents[0].icon).toBe("data:image/svg+xml;base64," + svg.toString("base64"));
        expect(dispatched).toContainEqual({ type: "refresh" });
    });
});


describe("concurrent repository operations", () => {
    const setup = () => {
        type State = { opds: { catalog: OpdsFeedDocument[] } };
        const store = createStore((state: State = { opds: { catalog: [] } }, action): State => ({
            opds: { catalog: opdsDbReducers(state.opds.catalog, action as never) },
        }));
        const repository = new OpdsFeedRepository();
        const converter = { convertDocumentToView: (doc: OpdsFeed) => ({ ...doc }) };
        jest.mocked(diMainGet).mockImplementation((key) =>
            (key === "store" ? store : key === "opds-feed-repository" ? repository : converter) as never);
        return repository;
    };

    it.each([false, true])("deduplicates overlapping adds (explicit identifiers: %s)", async (explicitIdentifiers) => {
        const repository = setup();
        const [first, second] = await Promise.all([
            repository.save({ title: "First", url: "https://example.org/feed", favorite: true,
                identifier: explicitIdentifiers ? "first-id" : undefined }),
            repository.save({ title: "Second", url: "https://example.org/feed", authenticationUrl: "https://example.org/auth",
                identifier: explicitIdentifiers ? "second-id" : undefined }),
        ]);
        expect(first.identifier).toBe(second.identifier);
        expect(await repository.findAll()).toEqual([expect.objectContaining({
            title: "First", favorite: true, authenticationUrl: "https://example.org/auth",
        })]);
    });

    it("preserves independent fields in overlapping updates", async () => {
        const repository = setup();
        const feed = await repository.save({ title: "Original", url: "https://example.org/feed" });
        await Promise.all([
            repository.update(feed.identifier, { title: "Edited" }),
            repository.update(feed.identifier, { favorite: true }),
            repository.update(feed.identifier, { authenticationUrl: "https://example.org/auth" }),
        ]);
        expect(await repository.get(feed.identifier)).toMatchObject({
            title: "Edited", favorite: true, authenticationUrl: "https://example.org/auth",
        });
    });

    it.each([false, true])("rejects stale updates after deletion (migrated: %s)", async (migrated) => {
        const repository = setup();
        const feed = await repository.save({ title: "Original", url: "https://example.org/feed",
            ...{ migratedFrom1_6Database: migrated } });
        const stale = await repository.get(feed.identifier);
        const results = await Promise.allSettled([
            repository.delete(feed.identifier),
            repository.update(stale.identifier, { title: "Late edit" }),
        ]);
        expect(results[1]).toMatchObject({ status: "rejected", reason: expect.any(Error) });
        expect(await repository.findAll()).toEqual([]);
    });

    it("deduplicates API adds that both observed an empty catalog", async () => {
        const repository = setup();
        const feed = { title: "Catalog", url: "https://example.org/feed", authenticationUrl: "https://example.org/auth" };
        const [first, second] = await Promise.all([
            runSaga({}, addFeed, feed).toPromise(),
            runSaga({}, addFeed, { ...feed, title: "Second request" }).toPromise(),
        ]);
        expect(first.identifier).toBe(second.identifier);
        expect(await repository.findAll()).toHaveLength(1);
    });

    it("preserves an edit and favorite change whose API reads overlap", async () => {
        const repository = setup();
        const feed = await repository.save({ title: "Original", url: "https://example.org/feed" });
        await Promise.all([
            runSaga({}, updateFeed, feed.identifier, { title: "Edited", url: feed.url }).toPromise(),
            runSaga({}, setFeedFavorite, feed.identifier, true).toPromise(),
        ]);
        expect(await repository.get(feed.identifier)).toMatchObject({ title: "Edited", favorite: true });
    });

    it.each([false, true])("does not resurrect a feed deleted while its API read is pending (migrated: %s)", async (migrated) => {
        const repository = setup();
        const feed = await repository.save({ title: "Original", url: "https://example.org/feed",
            ...{ migratedFrom1_6Database: migrated } });
        const task = runSaga({ onError: () => undefined }, updateFeed, feed.identifier,
            { title: "Late edit", url: feed.url });
        // get() has captured a snapshot but has not yet returned to the saga.
        await repository.delete(feed.identifier);
        await expect(task.toPromise()).rejects.toThrow("OPDS feed not found");
        expect(await repository.findAll()).toEqual([]);
    });

    it("keeps deletion when it follows an overlapping update", async () => {
        const repository = setup();
        const feed = await repository.save({ title: "Original", url: "https://example.org/feed" });
        await Promise.all([
            repository.update(feed.identifier, { favorite: true }),
            repository.delete(feed.identifier),
        ]);
        expect(await repository.findAll()).toEqual([]);
    });
});
