// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ContentType } from "../content-type";
import { ISearchDocument, ISearchResult } from "./search.interface";
import { searchDocDomSeek } from "./searchWithDomSeek";

export async function search(searchInput: string, data: ISearchDocument): Promise<ISearchResult[]> {

    try {

        const xmlDom = (new DOMParser()).parseFromString(
            data.xml,
            ContentType.TextXml,
        );

        return searchDocDomSeek(searchInput, xmlDom, data.href);

    } catch (e) {
        console.error("DOM Parser error", e);
        return [];
    }
}
