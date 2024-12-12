// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IReadiumAnnotation, IReadiumAnnotationSet } from "./annotationModel.type";
import { v4 as uuidv4 } from "uuid";
import { _APP_NAME, _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { PublicationView } from "readium-desktop/common/views/publication";
import { IAnnotationState } from "readium-desktop/common/redux/states/renderer/annotation";
import { rgbToHex } from "readium-desktop/common/rgb";

export function convertAnnotationToReadiumAnnotationModel(annotation: IAnnotationState): IReadiumAnnotation {

    const { uuid, color, locatorExtended: def, tags, drawType, comment, creator, created, modified } = annotation;
    const { locator, headings, epubPage/*, selectionInfo*/ } = def;
    const { href, text/*, locations*/ } = locator;
    const { afterRaw, beforeRaw, highlightRaw } = text || {};
    // const { rangeInfo: rangeInfoSelection } = selectionInfo || {};
    // const { progression } = locations;

    const highlight: IReadiumAnnotation["body"]["highlight"] = drawType === "solid_background" ? "solid" : drawType;

    const selector: IReadiumAnnotation["target"]["selector"] = [];

    if (highlightRaw && afterRaw && beforeRaw) {
        selector.push({
            type: "TextQuoteSelector",
            exact: highlightRaw,
            prefix: beforeRaw,
            suffix: afterRaw,
        });
    }

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: uuid ? "urn:uuid:" + uuid : "",
        created: new Date(created).toISOString(),
        modified: modified ? new Date(modified).toISOString() : undefined,
        type: "Annotation",
        body: {
            type: "TextualBody",
            value: comment || "",
            format: "text/plain",
            color: rgbToHex(color),
            tag: (tags || [])[0] || "",
            highlight,
            //   textDirection: "ltr",
            //   language: "fr",
        },
        creator: creator ? {...creator} : undefined,
        target: {
            source: href || "",
            meta: {
                headings: (headings || []).map(({ txt, level }) => ({ txt, level })),
                page: epubPage || "",
            },
            selector,
        },
    };
}

export function convertAnnotationListToReadiumAnnotationSet(annotationArray: IAnnotationState[], publicationView: PublicationView, label?: string): IReadiumAnnotationSet {

    const currentDate = new Date();
    const dateString: string = currentDate.toISOString();

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: "urn:uuid:" + uuidv4(),
        type: "AnnotationSet",
        generator: {
            id: "https://github.com/edrlab/thorium-reader/releases/tag/v" + _APP_VERSION,
            type: "Software",
            name: _APP_NAME + " " + _APP_VERSION,
            homepage: "https://thorium.edrlab.org",
        },
        generated: dateString,
        title: label || "Annotations set",
        about: {
            "dc:identifier": ["urn:thorium:" + publicationView.identifier, publicationView.workIdentifier ? publicationView.workIdentifier : ""], // TODO workIdentifier urn ?
            "dc:format": "application/epub+zip",
            "dc:title": publicationView.documentTitle || "",
            "dc:publisher": publicationView.publishers || [],
            "dc:creator": publicationView.authors || [],
            "dc:date": publicationView.publishedAt || "",
        },
        items: (annotationArray || []).map((v) => convertAnnotationToReadiumAnnotationModel(v)),
    };
}
