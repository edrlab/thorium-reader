// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ICacheDocument } from "readium-desktop/common/redux/states/renderer/resourceCache";
import { ContentType } from "./contentType";
import { removeUTF8BOM } from "readium-desktop/common/utils/bom";

export function getDocumentFromICacheDocument(data: ICacheDocument): Document {

    if (!data.xml) {
        return undefined;
    }
    if (!window.DOMParser) {
        console.log("NOT RENDERER PROCESS???! (DOMParser for search)");
        return undefined;
    }

    // TODO: this is a hack...
    // but rendered reflowable documents have a top-level invisible accessible link injected by the navigator
    // so we need it here to compute CSS Selectors
    let toParse = data.isFixedLayout ? data.xml : data.xml.replace(
        /<body([\s\S]*?)>/gm,
        "<body$1><a id=\"r2-skip-link\" href=\"javascript:;\" title=\"__\" aria-label=\"__\" tabindex=\"0\"> </a>",
    );
    // console.log(`===data.isFixedLayout ${data.isFixedLayout}`, data.xml);

    const contentType = data.contentType ? (data.contentType as DOMParserSupportedType) : ContentType.Xhtml;

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

