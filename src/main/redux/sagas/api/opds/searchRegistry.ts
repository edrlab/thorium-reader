// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { parseRegistrySearch, RegistrySearchResult } from "readium-desktop/common/models/registry";
import { httpGetWithAuth } from "readium-desktop/main/network/http";
import { SagaGenerator } from "typed-redux-saga";
import { call as callTyped } from "typed-redux-saga/macro";

export function* searchRegistry(query: string, page = 1): SagaGenerator<RegistrySearchResult> {
    if (!query.trim()) return { feeds: [], hasNext: false };
    const url = new URL("https://registry.thoriumreader.com/search");
    url.searchParams.set("query", query.trim());
    url.searchParams.set("page", String(Math.max(1, Math.floor(page))));
    const result = yield* callTyped(() => httpGetWithAuth(false)(url.toString()));
    if (!result.response.ok) throw new Error("Registry search failed");
    const json: unknown = yield* callTyped(() => result.response.json());
    return parseRegistrySearch(json);
}
