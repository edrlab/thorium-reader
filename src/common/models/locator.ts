// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { IRangeInfo } from "@r2-navigator-js/electron/common/selection";
// import { Locator, LocatorText, LocatorLocations } from "@r2-navigator-js/electron/common/locator";

export enum LocatorType {
    LastReadingLocation = "last-reading-location",
    Bookmark = "bookmark",
}

// export interface Locator {
//     href: string;
//     title?: string;
//     text?: LocatorText;
//     locations: LocatorLocations;
// }

// export interface LocatorText {
//     before?: string;
//     highlight?: string;
//     after?: string;
// }

// export interface LocatorLocations {
//     cfi?: string;
//     cssSelector?: string;
//     position?: number;
//     progression?: number;
//     rangeInfo?: IRangeInfo;
// }
