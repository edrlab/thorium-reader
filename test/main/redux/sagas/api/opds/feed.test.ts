// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it, jest } from "@jest/globals";
import { runSaga } from "redux-saga";
import { OpdsFeed } from "readium-desktop/common/models/opds";

jest.mock("typed-redux-saga/macro", () => jest.requireActual("typed-redux-saga"));
jest.mock("electron", () => ({ nativeImage: {} }));
jest.mock("@r2-lcp-js/serializable", () => ({ TaJsonDeserialize: (value: unknown) => value }));
jest.mock("@r2-opds-js/opds/opds2/opds2", () => ({ OPDSFeed: class {} }));
jest.mock("readium-desktop/main/di", () => ({ diMainGet: jest.fn() }));
jest.mock("readium-desktop/main/network/http", () => ({ httpGetWithAuth: jest.fn() }));
jest.mock("readium-desktop/main/analytics/catalog", () => ({ logCatalogAdd: jest.fn(), logCatalogEvent: jest.fn() }));
jest.mock("readium-desktop/common/redux/actions", () => ({
    opdsActions: { refresh: { build: () => ({ type: "refresh" }) } },
}));

import { addFeed } from "readium-desktop/main/redux/sagas/api/opds/feed";
import { diMainGet } from "readium-desktop/main/di";
import { httpGetWithAuth } from "readium-desktop/main/network/http";

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
                documents.push(doc);
                return doc;
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
