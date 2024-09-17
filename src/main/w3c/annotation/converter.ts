// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IW3CAnnotationModel, IW3CAnnotationModelSet, IW3CAnnotationSetAboutView } from "./annotationModel.type";
import { v4 as uuidv4 } from "uuid";
import { _APP_NAME, _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { PublicationView } from "readium-desktop/common/views/publication";
import { IAnnotationState } from "readium-desktop/common/redux/states/renderer/annotation";
import { rgbToHex } from "readium-desktop/common/rgb";

export function convertAnnotationToW3CAnnotationModel(annotation: IAnnotationState): IW3CAnnotationModel {

    const currentDate = new Date();
    const dateString: string = currentDate.toISOString();
    const { uuid, color, locatorExtended: def } = annotation;
    const { selectionInfo, locator, headings, epubPage } = def;
    const { cleanText, rawText, rawBefore, rawAfter } = selectionInfo;
    const { href } = locator;

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: uuid ? "urn:uuid:" + uuid : "",
        created: dateString,
        modified: dateString,
        type: "Annotation",
        hash: "",
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

export function convertAnnotationListToW3CAnnotationModelSet(annotationArray: IAnnotationState[],
    publicationMetadata: IW3CAnnotationSetAboutView,
): IW3CAnnotationModelSet {

    const { identiferArrayString, mimeType, title, publisher, creator, publishedAt, source } = publicationMetadata;
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
        label: "Annotations set",
        about: {
            "dc:identifier": identiferArrayString || [],
            "dc:format": mimeType || "",
            "dc:title": title || "",
            "dc:publisher": publisher || [],
            "dc:creator": creator || [],
            "dc:date": publishedAt || "",
            "dc:source": source || "",
        },
        total: annotationArray.length,
        items: (annotationArray || []).map((v) => convertAnnotationToW3CAnnotationModel(v)),
    };
}

export function convertPublicationToAnnotationStateAbout(publicationView: PublicationView, publicationIdentifier: string): IW3CAnnotationSetAboutView {

    return {
        identiferArrayString: ["urn:isbn:" + publicationView.workIdentifier || ""],
        mimeType: "application/epub+zip",
        title: publicationView.documentTitle || "",
        publisher: publicationView.publishers || [],
        creator: publicationView.authors || [],
        publishedAt: publicationView.publishedAt || "",
        source: "urn:uuid:" + publicationIdentifier,
    };
}
