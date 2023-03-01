// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IRangeInfo } from "@r2-navigator-js/electron/common/selection";

export interface ISearchResult {
    rangeInfo: IRangeInfo;

    cleanBefore: string;
    cleanText: string;
    cleanAfter: string;

    // rawBefore: string;
    // rawText: string;
    // rawAfter: string;

    href: string;
    uuid: string;
}

export interface ISearchDocument {
    xml: string;
    href: string;
    contentType: string;
    isFixedLayout: boolean;
}
