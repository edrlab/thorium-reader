// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { CatalogView } from "readium-desktop/common/views/catalog";

export interface ICatalogApi {
    get: () => Promise<CatalogView>;
    // addEntry: (entryView: CatalogEntryView) => Promise<CatalogEntryView[]>;
    // getEntries: () => Promise<CatalogEntryView[]>;
    // updateEntries: (entryView: CatalogEntryView[]) => Promise<CatalogEntryView[]>;
}

export interface ICatalogModuleApi {
    "catalog/get": ICatalogApi["get"];
    // "catalog/addEntry": ICatalogApi["addEntry"];
    // "catalog/getEntries": ICatalogApi["getEntries"];
    // "catalog/updateEntries": ICatalogApi["updateEntries"];
}
