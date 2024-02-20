// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { JSDOM } from "jsdom";
// import * as xmldom from "@xmldom/xmldom";

import { removeUTF8BOM } from "readium-desktop/common/utils/bom";

import { ContentType } from "../contentType";
import { ISearchDocument, ISearchResult } from "./search.interface";
import { searchDocDomSeek } from "./searchWithDomSeek";

export async function search(searchInput: string, data: ISearchDocument): Promise<ISearchResult[]> {

    if (!data.xml) {
        return [];
    }
    if (!window.DOMParser) {
        console.log("NOT RENDERER PROCESS???! (DOMParser for search)");
        return [];
    }

    // TODO: this is a hack...
    // but rendered reflowable documents have a top-level invisible accessible link injected by the navigator
    // so we need it here to compute CSS Selectors
    let toParse = data.isFixedLayout ? data.xml : data.xml.replace(
        /<body([\s\S]*?)>/gm,
        "<body$1><a href=\"DUMMY_URL\">DUMMY LINK</a>",
    );
    // console.log(`===data.isFixedLayout ${data.isFixedLayout}`, data.xml);

    const contentType = data.contentType ? (data.contentType as DOMParserSupportedType) : ContentType.Xhtml;
    try {
        // const isRenderer = typeof window !== undefined; // && typeof process === undefined;
        // const xmlDom = isRenderer ? (new DOMParser()).parseFromString(
        //     toParse,
        //     contentType,
        // ) : (false ? (new xmldom.DOMParser()).parseFromString(
        //     toParse,
        //     contentType,
        // ) : new JSDOM(toParse, { contentType: contentType }).window.document);

        toParse = removeUTF8BOM(toParse);
        const xmlDom = (new window.DOMParser()).parseFromString(
            toParse,
            contentType,
        );

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

        const sub = data.xml.substring(0, 400);
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

        return searchDocDomSeek(searchInput, xmlDom, data.href);
    } catch (e) {
        console.error("DOM Parser error", e);
        return [];
    }
}
