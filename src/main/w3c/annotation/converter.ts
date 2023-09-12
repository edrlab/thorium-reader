// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IAnnotationState } from "readium-desktop/common/redux/states/annotation";
import { IW3CAnnotationModel, IW3CAnnotationModelSet } from "./annotationModel.type";
import { v4 as uuidv4 } from "uuid";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";

function rgbToHex(color: { red: number; green: number; blue: number }): string {
    const { red, green, blue } = color;
    const redHex = Math.min(255, Math.max(0, red)).toString(16).padStart(2, "0");
    const greenHex = Math.min(255, Math.max(0, green)).toString(16).padStart(2, "0");
    const blueHex = Math.min(255, Math.max(0, blue)).toString(16).padStart(2, "0");
    return `#${redHex}${greenHex}${blueHex}`;
}

export function convertAnnotationToW3CAnnotationModel(annotation: IAnnotationState): IW3CAnnotationModel {

    const currentDate = new Date();
    const dateString: string = currentDate.toISOString();
    const { uuid, hash, color, def } = annotation;
    const { selectionInfo, locator, headings, epubPage } = def;
    const { cleanText, rawText, rawBefore, rawAfter } = selectionInfo;
    const { href } = locator;

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: uuid ? "urn:uuid:" + uuid : "",
        created: dateString,
        modified: dateString,
        type: "Annotation",
        hash: hash || "",
        body: {
            type: "TextualBody",
            value: cleanText || "",
            format: "text/plain",
            color: rgbToHex(color),
            //   textDirection: "ltr",
            //   language: "fr",
        },
        target: {
            source: href || "",
            meta: {
                headings: (headings || []).map(({ txt, level }) => ({ level, txt })),
                page: epubPage || "",
            },
            selector: [
                {
                    type: "TextQuoteSelector",
                    exact: rawText || "",
                    prefix: rawBefore || "",
                    suffix: rawAfter || "",
                },
                {
                    type: "ProgressionSelector",
                    value: locator.locations?.progression || 0,
                },
                {
                    type: "DomRangeSelector",
                    startContainerElementCssSelector: selectionInfo?.rangeInfo?.startContainerElementCssSelector || "",
                    startContainerChildTextNodeIndex: selectionInfo?.rangeInfo?.startContainerChildTextNodeIndex || 0,
                    startOffset: selectionInfo?.rangeInfo?.startOffset || 0,
                    endContainerElementCssSelector: selectionInfo?.rangeInfo?.endContainerElementCssSelector || "",
                    endContainerChildTextNodeIndex: selectionInfo?.rangeInfo?.endContainerChildTextNodeIndex || 0,
                    endOffset: selectionInfo?.rangeInfo?.endOffset || 0,
                },
                {
                    type: "FragmentSelector",
                    conformsTo: "http://www.idpf.org/epub/linking/cfi/epub-cfi.html",
                    value: `epubcfi(${selectionInfo?.rangeInfo?.cfi || locator.locations?.cfi || ""})`,
                },
            ],
        },
    };
}

export function convertAnnotationListToW3CAnnotationModelSel(annotationArray: IAnnotationState[],
    publicationMetadata: { identiferArrayString: string[], mimeType: string, title: string, publisher: string, creator: string, dateYear: string, sourceIsbn: string },
): IW3CAnnotationModelSet {

    const { identiferArrayString, mimeType, title, publisher, creator, dateYear, sourceIsbn } = publicationMetadata;
    const currentDate = new Date();
    const dateString: string = currentDate.toISOString();

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: "urn:uuid:" + uuidv4(),
        type: "AnnotationSet",
        generator: {
            id: "https://github.com/edrlab/thorium-reader/releases/tag/v" + _APP_VERSION,
            type: "Software",
            name: _APP_VERSION,
            homepage: "https://thorium.edrlab.org",
        },
        generated: dateString,
        label: "Annotations set",
        about: {
            "dc:identifier": identiferArrayString || [],
            "dc:format": mimeType || "",
            "dc:title": title || "",
            "dc:publisher": publisher || "",
            "dc:creator": creator || "",
            "dc:date": dateYear || "",
            "dc:source": sourceIsbn || "",
        },
        total: annotationArray.length,
        items: (annotationArray || []).map((v) => convertAnnotationToW3CAnnotationModel(v)),
    };
}
