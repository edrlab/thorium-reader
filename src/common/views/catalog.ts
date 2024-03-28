// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { PublicationView } from "./publication";

export interface CatalogEntryView {
    id: "continueReading" | "lastAdditions" | "continueReadingAudioBooks" | "continueReadingDivina" | "continueReadingPdf";
    tag?: string;
    totalCount?: number;
    publicationViews?: PublicationView[];
}

export interface CatalogView {
    entries: CatalogEntryView[];
}
