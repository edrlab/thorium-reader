// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import { LocatorExtended } from "@r2-navigator-js/electron/renderer";
// import { Locator as R2Locator } from "@r2-navigator-js/electron/common/locator";

// TODO: any other information in the LocatorExtended data structure that is NOT worth keeping in Thorium's internal state and persistent database?
// interface LocatorExtended {
//     audioPlaybackInfo: {
//         globalDuration: number | undefined;
//         globalProgression: number | undefined;
//         globalTime: number | undefined;
//         isPlaying: boolean | undefined;
//         localDuration: number | undefined;
//         localProgression: number | undefined;
//         localTime: number | undefined;
//     } | undefined;
//     locator: {
//         href: string;
//         title?: string;
//         text?: {
//             before?: string;
//             highlight?: string;
//             after?: string;
//             beforeRaw?: string;
//             highlightRaw?: string;
//             afterRaw?: string;
//         };
//         locations: {
//             cfi?: string;
//             cssSelector?: string;
//             position?: number;
//             progression?: number;
//             rangeInfo?: {
//                 startContainerElementCssSelector: string;
//                 startContainerElementCFI: string | undefined;
//                 startContainerChildTextNodeIndex: number;
//                 startOffset: number;
//                 endContainerElementCssSelector: string;
//                 endContainerElementCFI: string | undefined;
//                 endContainerChildTextNodeIndex: number;
//                 endOffset: number;
//                 cfi: string | undefined;
//             };
//         };
//     };
//     paginationInfo: {
//         totalColumns: number | undefined;
//         currentColumn: number | undefined;
//         isTwoPageSpread: boolean | undefined;
//         spreadIndex: number | undefined;
//     } | undefined;
//     selectionInfo: {
//         cleanBefore: string;
//         cleanText: string;
//         cleanAfter: string;
//         rawBefore: string;
//         rawText: string;
//         rawAfter: string;

//         rangeInfo: {
//             startContainerElementCssSelector: string;
//             startContainerElementCFI: string | undefined;
//             startContainerChildTextNodeIndex: number;
//             startOffset: number;
//             endContainerElementCssSelector: string;
//             endContainerElementCFI: string | undefined;
//             endContainerChildTextNodeIndex: number;
//             endOffset: number;
//             cfi: string | undefined;
//         };
//     } | undefined;
//     selectionIsNew: boolean | undefined;
//     docInfo: {
//         isFixedLayout: boolean;
//         isRightToLeft: boolean;
//         isVerticalWritingMode: boolean;
//     } | undefined;
//     epubPage: string | undefined;
//     epubPageID: string | undefined;
//     headings: Array<{
//         id: string | undefined;
//         txt: string | undefined;
//         level: number;
//     }> | undefined;
//     secondWebViewHref: string | undefined;
//     followingElementIDs?: string[];
// }
export type MiniLocatorExtended = Omit<LocatorExtended, "followingElementIDs">;

export const minimizeLocatorExtended = (locatorExtended: LocatorExtended): MiniLocatorExtended => {

    if (typeof locatorExtended.followingElementIDs === "undefined") {
        return locatorExtended;
    }
    // locatorExtended = r.clone(locatorExtended);
    // locatorExtended.followingElementIDs = undefined;
    // delete locatorExtended.followingElementIDs;
    return {
        audioPlaybackInfo: locatorExtended.audioPlaybackInfo,
        locator: locatorExtended.locator,
        paginationInfo: locatorExtended.paginationInfo,
        selectionInfo: locatorExtended.selectionInfo,
        selectionIsNew: locatorExtended.selectionIsNew,
        docInfo: locatorExtended.docInfo,
        epubPage: locatorExtended.epubPage,
        epubPageID: locatorExtended.epubPageID,
        headings: locatorExtended.headings,
        secondWebViewHref: locatorExtended.secondWebViewHref,
        // followingElementIDs: locatorExtended.followingElementIDs,
    };
};

export const locatorInitialState = {
    locator: {
        href: undefined,
        locations: {},
    },
} as MiniLocatorExtended;
