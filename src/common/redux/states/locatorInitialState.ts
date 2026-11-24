// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import type { LocatorExtended } from "@r2-navigator-js/electron/renderer";
import type { ISelectionInfo } from "@r2-navigator-js/electron/common/selection";
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

const MAX_LOCATOR_TEXT_LENGTH = 200;

const limitLocatorExcerpt = (text?: string, keepEnd = false): string | undefined => {
    if (!text || text.length <= MAX_LOCATOR_TEXT_LENGTH) {
        return text;
    }
    return keepEnd ?
        text.slice(-MAX_LOCATOR_TEXT_LENGTH).replace(/^\p{Surrogate}/u, "") :
        text.slice(0, MAX_LOCATOR_TEXT_LENGTH).replace(/\p{Surrogate}$/u, "");
};

const limitSelectionText = (selection?: ISelectionInfo): ISelectionInfo | undefined => {
    if (!selection) {
        return undefined;
    }
    const { cleanBefore, cleanText, cleanAfter, rawBefore, rawText, rawAfter } = selection;
    if ([cleanBefore, cleanText, cleanAfter, rawBefore, rawText, rawAfter].every((text) =>
        !text || text.length <= MAX_LOCATOR_TEXT_LENGTH)) {
        return selection;
    }
    return {
        ...selection,
        cleanBefore: limitLocatorExcerpt(cleanBefore, true),
        cleanText: limitLocatorExcerpt(cleanText),
        cleanAfter: limitLocatorExcerpt(cleanAfter),
        rawBefore: limitLocatorExcerpt(rawBefore, true),
        rawText: limitLocatorExcerpt(rawText),
        rawAfter: limitLocatorExcerpt(rawAfter),
    };
};

export const limitLocatorText = (locator: MiniLocatorExtended["locator"]): MiniLocatorExtended["locator"] => {
    if (!locator) {
        return locator;
    }
    const caretInfo = locator.locations?.caretInfo;
    const limitedCaret = limitSelectionText(caretInfo);
    const text = locator.text;
    const before = limitLocatorExcerpt(text?.before, true);
    const highlight = limitLocatorExcerpt(text?.highlight);
    const after = limitLocatorExcerpt(text?.after);
    const beforeRaw = limitLocatorExcerpt(text?.beforeRaw, true);
    const highlightRaw = limitLocatorExcerpt(text?.highlightRaw);
    const afterRaw = limitLocatorExcerpt(text?.afterRaw);
    const textChanged = text && (before !== text.before || highlight !== text.highlight || after !== text.after ||
        beforeRaw !== text.beforeRaw || highlightRaw !== text.highlightRaw || afterRaw !== text.afterRaw);

    if (!textChanged && limitedCaret === caretInfo) {
        return locator;
    }
    return {
        ...locator,
        locations: limitedCaret === caretInfo ? locator.locations : { ...locator.locations, caretInfo: limitedCaret },
        text: textChanged ? { ...text, before, highlight, after, beforeRaw, highlightRaw, afterRaw } : text,
    };
};

export const minimizeLocatorExtended = (locatorExtended: LocatorExtended): MiniLocatorExtended => {
    const { locator, selectionInfo } = locatorExtended;
    const limitedLocator = limitLocatorText(locator);
    const limitedSelection = limitSelectionText(selectionInfo);

    if (typeof locatorExtended.followingElementIDs === "undefined" &&
        limitedSelection === selectionInfo && limitedLocator === locator) {
        return locatorExtended;
    }
    return {
        locEventID: locatorExtended.locEventID,
        audioPlaybackInfo: locatorExtended.audioPlaybackInfo,
        locator: limitedLocator,
        paginationInfo: locatorExtended.paginationInfo,
        selectionInfo: limitedSelection,
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
