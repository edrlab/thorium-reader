// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { describe, expect, it } from "@jest/globals";
import { parseRegistrySearch } from "readium-desktop/common/models/registry";

describe("registry search results", () => {
    it("uses catalog and authentication links rather than registry descriptions", () => {
        expect(parseRegistrySearch({ catalogs: [{
            metadata: { title: "Lirtuel", color: "red" },
            links: [
                { rel: "self", href: "https://registry.thoriumreader.com/catalogs/example" },
                { rel: "catalog", href: "https://www.lirtuel.be/v1/home.opds2" },
                { rel: "authenticate", href: "https://www.lirtuel.be/v1/sign_in.opds2" },
                { rel: "icon", href: "https://www.lirtuel.be/icon.png" },
            ],
        }] })).toEqual({ feeds: [{
            title: "Lirtuel", color: "red", url: "https://www.lirtuel.be/v1/home.opds2",
            authenticationUrl: "https://www.lirtuel.be/v1/sign_in.opds2",
            iconUrl: "https://www.lirtuel.be/icon.png",
        }], hasNext: false });
    });

    it("skips malformed and unsafe links, templates, and duplicate feeds", () => {
        const catalog = (href: string, templated = false) => ({
            metadata: { title: "Library", color: "invalid" },
            links: [{ rel: ["catalog"], href, templated }],
        });
        const result = parseRegistrySearch({ catalogs: [
            undefined, {}, catalog("javascript:alert(1)"), catalog("file:///private"),
            catalog("https://example.com/{query}", true),
            catalog("https://example.com/feed"), catalog("https://example.com/feed"),
        ], links: [{ rel: ["next"], href: "https://registry.thoriumreader.com/search?page=2" }] });
        expect(result.feeds).toEqual([{
            title: "Library", color: "gray", url: "https://example.com/feed", authenticationUrl: undefined,
        }]);
        expect(result.hasNext).toBe(true);
    });

    it("distinguishes an empty search from a malformed response", () => {
        expect(parseRegistrySearch({ catalogs: [] })).toEqual({ feeds: [], hasNext: false });
        expect(() => parseRegistrySearch({ error: "unavailable" })).toThrow("Invalid registry response");
    });

    it("ignores unsafe icon links while keeping the catalog", () => {
        const result = parseRegistrySearch({ catalogs: [{
            metadata: { title: "Library" }, links: [
                { rel: "catalog", href: "https://example.com/feed" },
                { rel: "icon", href: "file:///private/image.png" },
            ],
        }] });
        expect(result.feeds).toHaveLength(1);
        expect(result.feeds[0].iconUrl).toBeUndefined();
    });
});
