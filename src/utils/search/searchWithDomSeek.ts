// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { convertRange } from "@r2-navigator-js/electron/renderer/webview/selection";

import { getCount } from "../counter";
import { getCssSelector_ } from "./cssSelector";
import { escapeRegExp } from "./regexp";
import { ISearchResult } from "./search.interface";
import { cleanupStr, collapseWhitespaces } from "./transliteration";

export async function searchDocDomSeek(searchInput: string, doc: Document, href: string): Promise<ISearchResult[]> {
    const text = doc.body.textContent;
    if (!text) {
        return [];
    }

    searchInput = cleanupStr(searchInput);
    if (!searchInput.length) {
        return [];
    }

    const iter = doc.createNodeIterator(
        doc.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (_node) => NodeFilter.FILTER_ACCEPT,
        },
    );

    // normalizeDiacriticsAndLigatures(searchInput)
    const regexp = new RegExp(escapeRegExp(searchInput).replace(/ /g, "\\s+"), "gim");

    const searchResults: ISearchResult[] = [];

    const snippetLength = 100;
    const snippetLengthNormalized = 30;

    // let consumed = 0;
    let accumulated = 0;

    let matches: RegExpExecArray;
    // tslint:disable-next-line: no-conditional-assignment
    while (matches = regexp.exec(text)) {
        // console.log("matches.input: ", matches.input);
        // // console.log(matches);
        // // console.log(JSON.stringify(matches, null, 4));
        // console.log("regexp.lastIndex: ", regexp.lastIndex);
        // console.log("matches.index: ", matches.index);
        // console.log("matches[0].length: ", matches[0].length);

        let i = Math.max(0, matches.index - snippetLength);
        let l = Math.min(snippetLength, matches.index);
        let textBefore = collapseWhitespaces(text.substr(i, l));
        textBefore = textBefore.substr(textBefore.length - snippetLengthNormalized);

        i = regexp.lastIndex;
        l = Math.min(snippetLength, text.length - i);
        const textAfter = collapseWhitespaces(text.substr(i, l)).substr(0, snippetLengthNormalized);

        const range = new Range(); // document.createRange()

        let offset = matches.index;
        while (accumulated <= offset) {
            const nextNode = iter.nextNode();
            accumulated += nextNode.nodeValue.length;
        }
        let localOffset = iter.referenceNode.nodeValue.length - (accumulated - offset);
        // console.log("start accumulated: ", accumulated);
        // console.log("start localNodeOffset: ", localOffset);
        // console.log("start iter.referenceNode.nodeValue: ", iter.referenceNode.nodeValue);
        // console.log("start iter.referenceNode.nodeValue.length: ", iter.referenceNode.nodeValue.length);
        range.setStart(iter.referenceNode, localOffset);

        offset = matches.index + matches[0].length;
        while (accumulated <= offset) {
            const nextNode = iter.nextNode();
            accumulated += nextNode.nodeValue.length;
        }
        localOffset = iter.referenceNode.nodeValue.length - (accumulated - offset);
        // console.log("end accumulated: ", accumulated);
        // console.log("end localNodeOffset: ", localOffset);
        // console.log("end iter.referenceNode.nodeValue: ", iter.referenceNode.nodeValue);
        // console.log("end iter.referenceNode.nodeValue.length: ", iter.referenceNode.nodeValue.length);
        range.setEnd(iter.referenceNode, localOffset);

        // let moveForwardBy = matches.index - consumed;
        // consumed += moveForwardBy;
        // console.log("start moveForwardBy: ", moveForwardBy);
        // let actualMovedForward = domSeek(iter, moveForwardBy);
        // let remainderToMoveForward = moveForwardBy - actualMovedForward;
        // console.log("start actualMovedForward: ", actualMovedForward);
        // console.log("start remainderToMoveForward: ", remainderToMoveForward);
        // console.log("start iter.referenceNode.nodeValue: ", iter.referenceNode.nodeValue);
        // console.log("start iter.referenceNode.nodeValue.length: ", iter.referenceNode.nodeValue.length);
        // // if (remainderToMoveForward) {
        // //     const previousRef = iter.referenceNode;
        // //     actualMovedForward = domSeek(iter, remainderToMoveForward);
        // //     console.log("start actualMovedForward (2): ", actualMovedForward);
        // //     if (previousRef !== iter.referenceNode) {
        // //         console.log("start previousRef !== iter.referenceNode: ", iter.referenceNode.nodeValue);
        // //     }
        // // }
        // range.setStart(iter.referenceNode, remainderToMoveForward);

        // moveForwardBy = matches[0].length;
        // consumed += moveForwardBy;
        // console.log("end moveForwardBy: ", moveForwardBy);
        // actualMovedForward = domSeek(iter, moveForwardBy);
        // remainderToMoveForward = moveForwardBy - actualMovedForward;
        // console.log("end actualMovedForward: ", actualMovedForward);
        // console.log("end remainderToMoveForward: ", remainderToMoveForward);
        // if (range.startContainer !== iter.referenceNode) {
        //     console.log("end RANGE SPANS ACROSS NODES:");
        //     console.log("end iter.referenceNode.nodeValue: ", iter.referenceNode.nodeValue);
        //     console.log("end iter.referenceNode.nodeValue.length: ", iter.referenceNode.nodeValue.length);
        // }
        // // if (remainderToMoveForward) {
        // //     const previousRef = iter.referenceNode;
        // //     actualMovedForward = domSeek(iter, remainderToMoveForward);
        // //     console.log("end actualMovedForward (2): ", actualMovedForward);
        // //     if (previousRef !== iter.referenceNode) {
        // //         console.log("end previousRef !== iter.referenceNode: ", iter.referenceNode.nodeValue);
        // //     }
        // // }
        // range.setEnd(iter.referenceNode, range.startContainer === iter.referenceNode ?
        //     range.startOffset + remainderToMoveForward : remainderToMoveForward);

        // // should be equal
        // console.log("consumed (1): ", consumed);
        // consumed = regexp.lastIndex;
        // console.log("consumed (2): ", consumed);

        if (!(doc as any).getCssSelector) {
            (doc as any).getCssSelector = getCssSelector_(doc);
        }
        const rangeInfo = convertRange(
            range,
            (doc as any).getCssSelector,
            (_node: Node) => ""); // computeElementCFI

        searchResults.push({
            textMatch: collapseWhitespaces(matches[0]),
            textBefore,
            textAfter,
            rangeInfo,
            href,
            uuid: getCount().toString(),
        });
    }

    return searchResults;
}
