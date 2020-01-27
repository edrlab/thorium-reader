// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// FIXME test broken
/*

import { OpdsService } from "readium-desktop/main/services/opds";

const opdsService = new OpdsService();

test("search atom url", async () => {
    expect(await opdsService.parseOpdsSearchUrl([{
        type: ContentType.AtomXml,
        url: "http://manybooks.net/opds/search.php?q={searchTerms}",
    }])).toBe("http://manybooks.net/opds/search.php?q={searchTerms}");
});

test("search opds2 url", async () => {
    expect(await opdsService.parseOpdsSearchUrl([{
        type: ContentType.Opds2,
        url: "https://catalog.feedbooks.com/search.json{?query}",
    }])).toBe("https://catalog.feedbooks.com/search.json?query={searchTerms}");
});

test("search atom url multi search", async () => {
    expect(await opdsService.parseOpdsSearchUrl([{
        type: ContentType.AtomXml,
        url: "http://manybooks.net/opds/search.php?test=123&q={searchTerms}&filter=null",
    }])).toBe("http://manybooks.net/opds/search.php?test=123&q={searchTerms}&filter=null");
});

test("search opds2 url multi search", async () => {
    expect(await opdsService.parseOpdsSearchUrl([{
        type: ContentType.Opds2,
        url: "https://catalog.feedbooks.com/search.json{?author,query}",
    }])).toBe("https://catalog.feedbooks.com/search.json?query={searchTerms}");
});

test("opensearch", async () => {
    expect(await opdsService.parseOpdsSearchUrl([{
        type: ContentType.OpenSearch,
        url: "http://static.wolnelektury.pl/opensearch.xml",
    }])).toBe("https://wolnelektury.pl/opds/search/?q={searchTerms}&author=&translator=&title=");
});

test("opensearch type incorrect", async () => {
    expect(await opdsService.parseOpdsSearchUrl([{
        type: ContentType.Opds2,
        url: "http://static.wolnelektury.pl/opensearch.xml",
    }])).toBe(undefined);
});
*/
