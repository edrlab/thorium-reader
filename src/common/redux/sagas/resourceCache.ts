// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { ContentType } from "readium-desktop/utils/contentType";
import {
    select as selectTyped,
    call as callTyped,
    SagaGenerator, delay as delayTyped,
} from "typed-redux-saga/macro";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import * as debug_ from "debug";
import { ENABLE_SKIP_LINK } from "@r2-navigator-js/electron/common/styles";
import { removeUTF8BOM } from "readium-desktop/common/utils/bom";

const debug = debug_("readium-desktop:common:redux:saga:resourceCache");
debug("_");

export interface ICacheDocument {
    href: string;
    xml: string;
    xmlDom?: Document | undefined;
    contentType: string;
    isFixedLayout: boolean;
    _live: number;
}
const __resourceCache: Map<string, ICacheDocument> = new Map();
const TIMEOUT_LIVE = 60;


const isFixedLayout = (link: Link, publication: R2Publication): boolean => {
    if (link && link.Properties) {
        if (link.Properties.Layout === "fixed") {
            return true;
        }
        if (typeof link.Properties.Layout !== "undefined") {
            return false;
        }
    }

    if (publication &&
        publication.Metadata &&
        publication.Metadata.Rendition) {
        return publication.Metadata.Rendition.Layout === "fixed";
    }
    return false;
};
function getDocumentFromICacheDocument(cacheDoc: ICacheDocument): Document {

    if (!cacheDoc.xml) {
        return undefined;
    }
    if (!window.DOMParser) {
        console.log("NOT RENDERER PROCESS???! (DOMParser for search)");
        return undefined;
    }

    // TODO: this is a hack...
    // but rendered reflowable documents have a top-level invisible accessible link injected by the navigator
    // so we need it here to compute CSS Selectors
    let toParse = (!ENABLE_SKIP_LINK || cacheDoc.isFixedLayout) ? cacheDoc.xml : cacheDoc.xml.replace(
        /<body([\s\S]*?)>/gm,
        "<body$1><a id=\"r2-skip-link\" href=\"javascript:;\" title=\"__\" aria-label=\"__\" tabindex=\"0\"> </a>",
    );
    // console.log(`===cacheDoc.isFixedLayout ${cacheDoc.isFixedLayout}`, cacheDoc.xml);

    const contentType = cacheDoc.contentType ? (cacheDoc.contentType as DOMParserSupportedType) : ContentType.Xhtml;

    try {
        toParse = removeUTF8BOM(toParse);
        const xmlDom = (new window.DOMParser()).parseFromString(
            toParse,
            contentType,
        );

        return xmlDom;
    } catch {
        // nothing
    }

    return undefined;
}

export function* resourceCacheTimer(): SagaGenerator<void> {

    yield* delayTyped(1000);

    for (const cacheDoc of __resourceCache.values()) {
        if (cacheDoc._live > 0) {
            cacheDoc._live--;
        } else {
            __resourceCache.delete(cacheDoc.href);
        }
    }

    if (__resourceCache.size) {
        // debug(`__resourceCache MAP (size: ${__resourceCache.size}):`, __resourceCache);
    }
}


function* getResourceCache__(from: Link, r2Manifest: R2Publication): SagaGenerator<ICacheDocument | undefined> {

    const linkFound = from;
    if (!linkFound) {
        return undefined;
    }
    
    const found = __resourceCache.get(from.Href);
    if (found) {
        found._live = TIMEOUT_LIVE;
        return found;
    }

    const manifestUrlR2Protocol = yield* selectTyped(
        (state: IReaderRootState) => state.reader.info.manifestUrlR2Protocol,
    );

    const cacheDoc: ICacheDocument = {
        xml: "",
        href: linkFound.Href,
        contentType: linkFound.TypeLink ? linkFound.TypeLink : ContentType.Xhtml,
        isFixedLayout: isFixedLayout(linkFound, r2Manifest),
        _live: TIMEOUT_LIVE,
    };

    try {
        // DEPRECATED API (watch for the inverse function parameter order!):
        // url.resolve(manifestUrlR2Protocol, ln.Href)
        const url = new URL(linkFound.Href, manifestUrlR2Protocol);
        if (url.pathname.endsWith(".html") || url.pathname.endsWith(".xhtml") || url.pathname.endsWith(".xml")
            || linkFound.TypeLink === ContentType.Xhtml
            || linkFound.TypeLink === ContentType.Html
            || linkFound.TypeLink === ContentType.Xml) {

            const urlStr = url.toString();
            const res = yield* callTyped(fetch, urlStr);
            if (res.ok) {
                const text = yield* callTyped(() => res.text());
                cacheDoc.xml = text;
                cacheDoc.xmlDom = getDocumentFromICacheDocument(cacheDoc);

                if (!__resourceCache.get(linkFound.Href)) {
                    __resourceCache.set(linkFound.Href, cacheDoc);
                }

                return cacheDoc;
            }
        }
    } catch (e) {
        console.error("requestPublicationData", linkFound.Href, e);
    }

    return undefined;
}

export function* getResourceCache(href: string): SagaGenerator<ICacheDocument | undefined> {

    const r2Manifest = yield* selectTyped((state: IReaderRootState) => state.reader.info.r2Publication);
    const linkFound = r2Manifest.Spine.find((ln) => ln.Href === href);
    if (linkFound) {
        return yield* callTyped(getResourceCache__, linkFound, r2Manifest);
    }

    return undefined;
}

export function* getResourceCacheAll(): SagaGenerator<ICacheDocument[]> {

    const r2Manifest = yield* selectTyped((state: IReaderRootState) => state.reader.info.r2Publication);
    const cacheDocs: ICacheDocument[] = [];

    for (const link of r2Manifest.Spine) {
        const cacheDoc = yield* callTyped(getResourceCache__, link, r2Manifest);
        if (cacheDoc) {
            cacheDocs.push(cacheDoc);
        }
    }
    
    return cacheDocs;
}
