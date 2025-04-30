// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { JSDOM } from "jsdom";
// import * as xmldom from "@xmldom/xmldom";

import { ICacheDocument } from "readium-desktop/common/redux/sagas/resourceCache";
import { searchDocDomSeek } from "./searchWithDomSeek";

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

export async function search(searchInput: string, cacheDoc: ICacheDocument): Promise<ISearchResult[]> {

    if (!cacheDoc) {
        return [];
    }
    try {
        // const isRenderer = typeof window !== undefined; // && typeof process === undefined;
        // const xmlDom = isRenderer ? (new DOMParser()).parseFromString(
        //     toParse,
        //     contentType,
        // ) : (false ? (new xmldom.DOMParser()).parseFromString(
        //     toParse,
        //     contentType,
        // ) : new JSDOM(toParse, { contentType: contentType }).window.document);

        const xmlDom = cacheDoc.xmlDom;
        if (!xmlDom) {
            return [];
            // throw new Error("xmlDom not defined !?!");
        }

        const iter = xmlDom.createNodeIterator(
            xmlDom.body,
            NodeFilter.SHOW_CDATA_SECTION,
            // 'textContent' excludes comments and processing instructions but includes CDATA! (such as <style> inside <svg>)
            // ... but, we trim the DOM ahead of time to avoid this corner case
            {
                acceptNode: (_node) => NodeFilter.FILTER_ACCEPT,
            },
        );
        let cdataNode: Node | undefined;
        while (cdataNode = iter.nextNode()) {
            console.log("SEARCH REMOVE CDATA... [[" + cdataNode.nodeValue + "]]");
            if (cdataNode.parentNode) {
                cdataNode.parentNode.removeChild(cdataNode);
            }
        }

        const sub = cacheDoc.xml.substring(0, 400);
        if (/lang\s*=\s*["']ja/.test(sub)) {
            const iter = xmlDom.createNodeIterator(
                xmlDom.body,
                NodeFilter.SHOW_ELEMENT,
                {
                    acceptNode: (node) => {
                        const lower = node.nodeName.toLowerCase();
                        if ((lower === "rt" || lower === "rp") && node.parentElement?.nodeName.toLowerCase() === "ruby") {

                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_REJECT;
                    },
                },
            );
            let rubyNode: Node | undefined;
            while (rubyNode = iter.nextNode()) {
                if (rubyNode.parentNode) {
                    // console.log("removed: " + rubyNode.textContent)
                    rubyNode.parentNode.removeChild(rubyNode);
                }
            }
        }

        return searchDocDomSeek(searchInput, xmlDom, cacheDoc.href);
    } catch (e) {
        console.error("DOM Parser error", e);
        return [];
    }
}
