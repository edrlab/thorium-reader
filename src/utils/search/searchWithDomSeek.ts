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
import { cleanupStr, collapseWhitespaces, equivalents } from "./transliteration";

export async function searchDocDomSeek(searchInput: string, doc: Document, href: string): Promise<ISearchResult[]> {
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
    // 'textContent' excludes comments and processing instructions but includes CDATA! (such as <style> inside <svg>)
    const text = doc.body.textContent;
    // console.log("SEARCH TEXT: ", text);
    if (!text) {
        return [];
    }

    const searchInput_ = searchInput;

    // searchInput = searchInput.replace(/[\s]+/gmi, '\\s+')
    searchInput = cleanupStr(searchInput);
    if (!searchInput.length) {
        return [];
    }

    searchInput = escapeRegExp(searchInput);

    // transliteratesDifferentLengthsLower
    // transliteratesDifferentLengthsUpper
    const transliterations: Record<string, string> = {
        "œ": "oe",
        "ᴔ": "oe",
        "Œ": "OE", // could be "Oe" (capitalised first letter)
        "ɶ": "OE",
    };
    for (const key of Object.keys(transliterations)) {
        const val = transliterations[key];
        searchInput = searchInput.replace(new RegExp(key, "gmi"), val);
    }

    const alreadyProcessed: string[] = [];
    for (const key of Object.keys(transliterations)) {
        const val = transliterations[key];
        const valLower = val.toLowerCase();
        if (alreadyProcessed.includes(valLower)) {
            continue;
        }
        alreadyProcessed.push(valLower);
        let rep = "(";
        rep += "(";
        rep += valLower;
        rep += ")";
        for (const key2 of Object.keys(transliterations)) {
            const val2 = transliterations[key2];
            const valLower2 = val2.toLowerCase();
            if (valLower === valLower2) {
                rep += "|";
                rep += key2;
            }
        }
        rep += ")";
        searchInput = searchInput.replace(new RegExp(valLower, "gmi"), rep);
    }

    // https://github.com/julkue/mark.js/blob/7f7e9820514e2268918c2259b58aec3bd5f437f6/src/lib/regexpcreator.js#L256-L268
    // searchInput = searchInput.replace(/[^(|)\\]/g, (val, indx, original) => {
    //     const nextChar = original.charAt(indx + 1);
    //     if (/[(|)\\]/.test(nextChar) || nextChar === "") {
    //         return val;
    //     } else {
    //         return val + "\u0000";
    //     }
    // });

    const equivalentsList = equivalents();
    const done: number[] = [];
    for (let i = 0; i < searchInput.length; i++) {
        const ch = searchInput[i];
        for (let j = 0; j < equivalentsList.length; j++) {
            const equivalents = equivalentsList[j];
            if (!equivalents.has(ch)) {
                continue;
            }
            if (done.includes(j)) {
                break;
            }
            done.push(j);

            let eqs = "";
            equivalents.forEach((eq) => {
                eqs += eq;
            });

            searchInput = searchInput.replace(new RegExp(`[${eqs}]`, "gmi"), `[${eqs}]`);
        }
    }

    searchInput = searchInput.replace(/ /g, "\\s+"); // see cleanupStr() which collapsed all contiguous whitespaces in single space, and trimmed

    // https://github.com/julkue/mark.js/blob/7f7e9820514e2268918c2259b58aec3bd5f437f6/src/lib/regexpcreator.js#L279-L295
    // u+00ad = soft hyphen
    // u+200b = zero-width space
    // u+200c = zero-width non-joiner
    // u+200d = zero-width joiner
    // searchInput = searchInput.split(/\u0000+/).join("[\\u00ad\\u200b\\u200c\\u200d,;\\.]*");

    console.log("REGEXP SEARCH: \n" + searchInput_ + "\n==>\n" + searchInput + "\n");

    const iter = doc.createNodeIterator(
        doc.body,
        NodeFilter.SHOW_TEXT,
        // 'textContent' excludes comments and processing instructions but includes CDATA! (such as <style> inside <svg>)
        // ... but, we trim the DOM ahead of time to avoid this corner case
        // | NodeFilter.SHOW_CDATA_SECTION
        {
            acceptNode: (_node) => NodeFilter.FILTER_ACCEPT,
        },
    );

    // normalizeDiacriticsAndLigatures(searchInput)
    const regexp = new RegExp(searchInput, "gim");

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
            if (!nextNode) {
                break;
            }
            // console.log("nextNode.nodeValue: ", nextNode.nodeValue);
            // console.log("nextNode.nodeValue.length: ", nextNode.nodeValue.length);
            accumulated += nextNode.nodeValue.length;
        }
        // console.log("iter.referenceNode.nodeValue: ", iter.referenceNode.nodeValue);
        // console.log("iter.referenceNode.nodeValue.length: ", iter.referenceNode.nodeValue.length);
        let localOffset = iter.referenceNode.nodeValue.length - (accumulated - offset);
        // console.log("accumulated: ", accumulated);
        // console.log("offset: ", offset);
        // console.log("localOffset: ", localOffset);
        // console.log("start accumulated: ", accumulated);
        // console.log("start localNodeOffset: ", localOffset);
        // console.log("start iter.referenceNode.nodeValue: ", iter.referenceNode.nodeValue);
        // console.log("start iter.referenceNode.nodeValue.length: ", iter.referenceNode.nodeValue.length);
        range.setStart(iter.referenceNode, localOffset);

        offset = matches.index + matches[0].length;
        while (accumulated <= offset) {
            const nextNode = iter.nextNode();
            if (!nextNode) {
                break;
            }
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
        const tuple = convertRange(
            range,
            (doc as any).getCssSelector,
            (_node: Node) => ""); // computeElementCFI

        if (tuple) {
            const rangeInfo = tuple[0];
            // const textInfo = tuple[1];
            searchResults.push({
                cleanText: collapseWhitespaces(matches[0]),
                cleanBefore: textBefore,
                cleanAfter: textAfter,
                // rawText: textInfo.rawText,
                // rawBefore: textInfo.rawBefore,
                // rawAfter: textInfo.rawAfter,
                rangeInfo,
                href,
                uuid: getCount().toString(),
            });
        }
    }

    return searchResults;
}
