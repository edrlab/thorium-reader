// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { ICacheDocument } from "readium-desktop/common/redux/states/renderer/resourceCache";
import { ContentType } from "readium-desktop/utils/contentType";
import {
    all as allTyped, select as selectTyped,
    call as callTyped, put as putTyped,
} from "typed-redux-saga/macro";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import * as debug_ from "debug";
import { readerLocalActionSetResourceToCache } from "../actions";
const debug = debug_("readium-desktop:renderer:reader:redux:saga:resourceCache");

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

export function* getResourceCache() {

    const cacheFromState = yield* selectTyped((state: IReaderRootState) => state.resourceCache);

    // TODO: check this before merge
    if (cacheFromState && cacheFromState.length) {
        debug("spine item caches already acquired and ready ! len:", cacheFromState.length);
        return;
    }
    //

    const r2Manifest = yield* selectTyped((state: IReaderRootState) => state.reader.info.r2Publication);
    const manifestUrlR2Protocol = yield* selectTyped(
        (state: IReaderRootState) => state.reader.info.manifestUrlR2Protocol,
    );
    const request = r2Manifest.Spine.map((ln) => callTyped(async () => {
        const ret: ICacheDocument = {
            xml: "", // initialized in code below
            href: ln.Href,
            contentType: ln.TypeLink ? ln.TypeLink : ContentType.Xhtml,
            isFixedLayout: isFixedLayout(ln, r2Manifest),
        };
        debug(`requestPublicationData ISearchDocument: [${JSON.stringify(ret, null, 4)}]`);

        try {
            // DEPRECATED API (watch for the inverse function parameter order!):
            // url.resolve(manifestUrlR2Protocol, ln.Href)
            const url = new URL(ln.Href, manifestUrlR2Protocol);
            if (url.pathname.endsWith(".html") || url.pathname.endsWith(".xhtml") || url.pathname.endsWith(".xml")
                || ln.TypeLink === ContentType.Xhtml
                || ln.TypeLink === ContentType.Html
                || ln.TypeLink === ContentType.Xml) {

                const urlStr = url.toString();
                const res = await fetch(urlStr);
                if (res.ok) {
                    const text = await res.text();
                    ret.xml = text;
                }
            }
        } catch (e) {
            console.error("requestPublicationData", ln.Href, e);
        }

        return ret;
    }));

    const result = yield* allTyped(request);
    yield* putTyped(readerLocalActionSetResourceToCache.build(result));
}
