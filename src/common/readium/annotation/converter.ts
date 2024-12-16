// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

import { IReadiumAnnotation, IReadiumAnnotationSet, ISelector, isTextPositionSelector } from "./annotationModel.type";
import { v4 as uuidv4 } from "uuid";
import { _APP_NAME, _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { PublicationView } from "readium-desktop/common/views/publication";
import { IAnnotationState } from "readium-desktop/common/redux/states/renderer/annotation";
import { rgbToHex } from "readium-desktop/common/rgb";
import { ICacheDocument } from "readium-desktop/common/redux/states/renderer/resourceCache";
import { getDocumentFromICacheDocument } from "readium-desktop/utils/xmlDom";
import { createTextPositionSelectorMatcher, describeTextPosition, describeTextQuote } from "readium-desktop/third_party/apache-annotator/dom";
import { convertRange, convertRangeInfo } from "r2-navigator-js/dist/es8-es2017/src/electron/renderer/webview/selection";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { uniqueCssSelector as finder } from "@r2-navigator-js/electron/renderer/common/cssselector2-3";
import { ISelectionInfo } from "r2-navigator-js/dist/es8-es2017/src/electron/common/selection";


// Logger
const debug = debug_("readium-desktop:common:readium:annotation:converter");


export async function convertSelectorTargetToLocatorExtended(target: IReadiumAnnotation["target"], cacheDoc: ICacheDocument): Promise<MiniLocatorExtended | undefined> {
   
   const xmlDom = getDocumentFromICacheDocument(cacheDoc);
    if (!xmlDom) {
        return undefined;
    }

    // const textQuoteSelector = target.selector.find(isTextQuoteSelector);
    const textPositionSelector = target.selector.find(isTextPositionSelector);
    // const fragmentSelectorArray = target.selector.filter(isFragmentSelector);
    // const cfiFragmentSelector = fragmentSelectorArray.find(isCFIFragmentSelector);

    const root = xmlDom.body.ownerDocument.documentElement;

    if (textPositionSelector) {

        debug("TextPositionSelector found !!", JSON.stringify(textPositionSelector));
        const textPositionMatches = createTextPositionSelectorMatcher(textPositionSelector)(root);
        // const textPositionMatches = textPositionSelectorMatcher(textPositionSelector)(xmlDom.body);
        const matchRange = (await textPositionMatches.next()).value;
        if (matchRange) {

            const tuple = convertRange(matchRange, (element) => finder(element, xmlDom, {root}), () => "", () => "");
            const rangeInfo = tuple[0];
            const textInfo = tuple[1];


            const selectionInfo: ISelectionInfo = {
                textFragment: undefined,

                rangeInfo,

                cleanBefore: textInfo.cleanBefore,
                cleanText: textInfo.cleanText,
                cleanAfter: textInfo.cleanAfter,

                rawBefore: textInfo.rawBefore,
                rawText: textInfo.rawText,
                rawAfter: textInfo.rawAfter,
            };
            debug("SelectionInfo generated:", JSON.stringify(selectionInfo, null, 4));

            const locatorExtended: MiniLocatorExtended = {
                locator: {
                    href: cacheDoc.href,
                    locations: {},
                },
                selectionInfo,

                audioPlaybackInfo: undefined,
                paginationInfo: undefined,
                selectionIsNew: undefined,
                docInfo: undefined,
                epubPage: undefined,
                epubPageID: undefined,
                headings: undefined,
                secondWebViewHref: undefined,
            };

            return locatorExtended;
        }
    } else {

        debug("No selector found !!", JSON.stringify(target.selector, null, 4));
    }

    return undefined; 
}

export type IAnnotationStateWithICacheDocument = IAnnotationState & { __cacheDocument?: ICacheDocument | undefined }; 

export async function convertAnnotationStateToSelector(annotationWithCacheDoc: IAnnotationStateWithICacheDocument): Promise<ISelector[]> {

    const selector: ISelector[] = [];

    const {__cacheDocument, ...annotation} = annotationWithCacheDoc;

    const xmlDom = getDocumentFromICacheDocument(__cacheDocument);
    if (!xmlDom) {
        return [];
    }


    const { locatorExtended } = annotation;
    const { selectionInfo } = locatorExtended;
    const { rangeInfo } = selectionInfo;


    const range = convertRangeInfo(xmlDom, rangeInfo);
    debug(range);

    // describeTextPosition()
    const selectorTextPosition = await describeTextPosition(range, xmlDom.body);
    debug("TextPositionSelector : ", selectorTextPosition);
    selector.push(selectorTextPosition);

    // describeTextQuote()
    const selectorTextQuote = await describeTextQuote(range, xmlDom.body);
    debug("TextQuoteSelector : ", selectorTextQuote);
    selector.push(selectorTextQuote);

    // Next TODO: CFI !?! 

    return selector;
}

export async function convertAnnotationStateToReadiumAnnotation(annotation: IAnnotationStateWithICacheDocument): Promise<IReadiumAnnotation> {

    const { uuid, color, locatorExtended: def, tags, drawType, comment, creator, created, modified } = annotation;
    const { locator, headings, epubPage/*, selectionInfo*/ } = def;
    const { href /*text, locations*/ } = locator;
    // const { afterRaw, beforeRaw, highlightRaw } = text || {};
    // const { rangeInfo: rangeInfoSelection } = selectionInfo || {};
    // const { progression } = locations;

    const highlight: IReadiumAnnotation["body"]["highlight"] = drawType === "solid_background" ? "solid" : drawType;

    const selector = await convertAnnotationStateToSelector(annotation);

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

export async function convertAnnotationStateArrayToReadiumAnnotationSet(annotationArray: IAnnotationStateWithICacheDocument[], publicationView: PublicationView, label?: string): Promise<IReadiumAnnotationSet> {

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
        items: await Promise.all((annotationArray || []).map(async (v) => await convertAnnotationStateToReadiumAnnotation(v))),
    };
}
