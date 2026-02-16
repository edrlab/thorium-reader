// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export type TextFragment = {
    prefix?: string;
    textStart: string;
    textEnd?: string;
    suffix?: string;
}

// https://developer.mozilla.org/en-US/docs/Web/API/Selection
// https://developer.mozilla.org/en-US/docs/Web/API/Range

// A serializable mapping with DOM Range
// (simply encodes a CSS Selector for element, and if text node, then encodes its parent element)
export interface IRangeInfo {
    // always references an element,
    // either Range.startContainer if its nodeType == Node.ELEMENT_NODE
    // or Range.startContainer.parentElement if Range.startContainer.nodeType == Node.TEXT_NODE
    startContainerElementCssSelector: string;
    // startContainerElementCFI: string | undefined;
    startContainerElementXPath: string | undefined;

    // if i == -1, Range.startContainer is the above element
    // if i >=0 and i < element.childNodes.length, Range.startContainer is the above element.childNodes[i]
    // and element.childNodes[i].nodeType == Node.TEXT_NODE
    startContainerChildTextNodeIndex: number;

    // if Range.startContainer.nodeType == Node.TEXT_NODE
    // then if j >=0 and j < Range.startContainer.data.length, Range.startContainer.data[j] is the first char,
    // or if j >= Range.startContainer.data.length, the Range starts after the text but before the text node ends
    //
    // if Range.startContainer.nodeType == Node.ELEMENT_NODE
    // then if j >=0 and j < Range.startContainer.childNodes.length,
    // Range.startContainer.childNodes[j] is the first node inclusive of the range,
    // and if j >= Range.startContainer.childNodes.length, the Range starts after the last node,
    /// but before the parent contents ends
    startOffset: number;

    endContainerElementCssSelector: string;
    // endContainerElementCFI: string | undefined;
    endContainerElementXPath: string | undefined;
    endContainerChildTextNodeIndex: number;
    endOffset: number;

    cfi: string | undefined;
}

export function sameRanges(r1: IRangeInfo, r2: IRangeInfo): boolean {
    if (!r1 || !r2) {
        return false;
    }

    if (r1.startContainerElementCssSelector !== r2.startContainerElementCssSelector) {
        return false;
    }
    if (r1.startContainerChildTextNodeIndex !== r2.startContainerChildTextNodeIndex) {
        return false;
    }
    if (r1.startOffset !== r2.startOffset) {
        return false;
    }

    if (r1.endContainerElementCssSelector !== r2.endContainerElementCssSelector) {
        return false;
    }
    if (r1.endContainerChildTextNodeIndex !== r2.endContainerChildTextNodeIndex) {
        return false;
    }
    if (r1.endOffset !== r2.endOffset) {
        return false;
    }

    return true;
}

export interface ISelectedTextInfo {
    cleanBefore: string;
    cleanText: string;
    cleanAfter: string;

    rawBefore: string;
    rawText: string;
    rawAfter: string;
}

export interface ISelectionInfo extends ISelectedTextInfo {
    rangeInfo: IRangeInfo;
    textFragment: TextFragment | undefined;
}

export function sameSelections(sel1: ISelectionInfo, sel2: ISelectionInfo): boolean {
    if (!sel1 || !sel2) {
        return false;
    }
    if (!sameRanges(sel1.rangeInfo, sel2.rangeInfo)) {
        return false;
    }
    if (sel1.cleanText !== sel2.cleanText) {
        console.log("SAME RANGES BUT DIFFERENT CLEAN TEXT??");
        return false;
    }
    if (sel1.rawText !== sel2.rawText) {
        console.log("SAME RANGES BUT DIFFERENT RAW TEXT??");
        return false;
    }
    return true;
}
