// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

import { ICssSelector, IProgressionSelector, IReadiumAnnotation, IReadiumAnnotationSet, isCssSelector, ISelector, isProgressionSelector, isTextPositionSelector, isTextQuoteSelector, ITextPositionSelector, ITextQuoteSelector } from "./annotationModel.type";
import { v4 as uuidv4 } from "uuid";
import { _APP_NAME, _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { PublicationView } from "readium-desktop/common/views/publication";
import { IAnnotationState } from "readium-desktop/common/redux/states/renderer/annotation";
import { rgbToHex } from "readium-desktop/common/rgb";
import { ICacheDocument } from "readium-desktop/common/redux/states/renderer/resourceCache";
import { getDocumentFromICacheDocument } from "readium-desktop/utils/xmlDom";
import { createCssSelectorMatcher, createTextPositionSelectorMatcher, createTextQuoteSelectorMatcher, describeTextPosition, describeTextQuote } from "readium-desktop/third_party/apache-annotator/dom";
import { makeRefinable } from "readium-desktop/third_party/apache-annotator/selector";
import { convertRange, convertRangeInfo, normalizeRange } from "@r2-navigator-js/electron/renderer/webview/selection";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { uniqueCssSelector as finder } from "@r2-navigator-js/electron/renderer/common/cssselector2-3";
import { ISelectionInfo } from "@r2-navigator-js/electron/common/selection";

// Logger
const debug = debug_("readium-desktop:common:readium:annotation:converter");

export async function convertSelectorTargetToLocatorExtended(target: IReadiumAnnotation["target"], cacheDoc: ICacheDocument): Promise<MiniLocatorExtended | undefined> {

   const xmlDom = getDocumentFromICacheDocument(cacheDoc);
    if (!xmlDom) {
        return undefined;
    }

    const root = xmlDom.body;

    const textQuoteSelector = target.selector.find(isTextQuoteSelector);
    const textPositionSelector = target.selector.find(isTextPositionSelector);
    const cssSelector = target.selector.find(isCssSelector);
    const progressionSelector = target.selector.find(isProgressionSelector);
    const progressionValue = progressionSelector?.value || undefined;

    //makeRefinable
    const createMatcher = makeRefinable<ITextPositionSelector | ITextQuoteSelector | ICssSelector<any>, Node | Range, Range | Element>((selector) => {

        const innerCreateMatcher = {
            "TextQuoteSelector": createTextQuoteSelectorMatcher,
            "TextPositionSelector": createTextPositionSelectorMatcher,
            "CssSelector": createCssSelectorMatcher,
        }[selector.type];

        if (!innerCreateMatcher) {

            // no matcher for this selector
            debug("no matcher for this selector:", selector.type);
            return undefined;
        }

        return innerCreateMatcher(selector as never);
    });

    const ranges: Range[] = [];
    const pushToRangeArray: (rangeOrElement: Range | Element) => void = (rangeOrElement) => {
           let range: Range = undefined;

        if (rangeOrElement instanceof Element) {
            range = document.createRange();
            range.selectNode(rangeOrElement);
        } else {
            range = rangeOrElement;
        }

        ranges.push(range);
    };
    if (textQuoteSelector) {
        const matchAll = createMatcher(textQuoteSelector);
        for await (const rangeOrElement of matchAll(root)) {
            pushToRangeArray(rangeOrElement);
        }
    }
    if (textPositionSelector) {
        const matchAll = createMatcher(textPositionSelector);
        for await (const rangeOrElement of matchAll(root)) {
            pushToRangeArray(rangeOrElement);
        }
    }
    if (cssSelector) {
        const matchAll = createMatcher(cssSelector);
        for await (const rangeOrElement of matchAll(root)) {
            pushToRangeArray(rangeOrElement);
        }
    }
    if (!ranges.length) {
        debug("No selector found !!", JSON.stringify(target.selector, null, 4));
        return undefined;
    }
    debug(`${ranges.length} range(s) found !!!`);

    const convertedRangeArray: ReturnType<typeof convertRange>[] = [];

    for (const r of ranges) {
        const range = normalizeRange(r);
        if (range.collapsed) {
            debug("RANGE COLLAPSED :( skipping...");
            continue;
        }

        // the range start/end is guaranteed in document order due to the text matchers above (forward tree walk) ... but DOM Ranges are always ordered anyway (only the user / document selection object can be reversed)
        const tuple = convertRange(range, (element) => finder(element, xmlDom, {root}), () => "", () => "");
        if (tuple && tuple.length === 2) {
            convertedRangeArray.push(tuple);
        }
    }
    if (!convertedRangeArray.length) {
        debug(`No selector found but ${ranges.length} found !!`, JSON.stringify(target.selector, null, 4));
        return undefined;
    }
    debug(`${convertedRangeArray.length} range(s) converted found !!!`);
    debug("dump convertedRange : ", JSON.stringify(convertedRangeArray, null, 4));


    // TODO: need an Heuristic to choose the range from the array, maybe check if all ranges are equal and add a priority in function of the selector
    const [rangeInfo, textInfo] = convertedRangeArray[0];

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
            locations: {
                cssSelector: selectionInfo.rangeInfo.startContainerElementCssSelector,
                rangeInfo: selectionInfo.rangeInfo,
                progression: progressionValue,
            },
        },
        selectionInfo: selectionInfo,

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

export type IAnnotationStateWithICacheDocument = IAnnotationState & { __cacheDocument?: ICacheDocument | undefined };

const describeCssSelectorWithTextPosition = async (range: Range, document: Document, root: HTMLElement): Promise<ICssSelector<ITextPositionSelector> | undefined> => {
    // normalizeRange can fundamentally alter the DOM Range by repositioning / snapping to Text boundaries, this is an internal implementation detail inside navigator when CREATING ranges from user document selections.
    // const rangeNormalize = normalizeRange(range); // from r2-nav and not from third-party/apache-annotator

    const commonAncestorHTMLElement =
        (range.commonAncestorContainer && range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE)
            ? range.commonAncestorContainer as Element
            : (range.startContainer.parentNode && range.startContainer.parentNode.nodeType === Node.ELEMENT_NODE)
                ? range.startContainer.parentNode as Element
                : undefined;
    if (!commonAncestorHTMLElement) {
        return undefined;
    }

    return {
        type: "CssSelector",
        value: finder(commonAncestorHTMLElement, document, { root }),
        refinedBy: await describeTextPosition(
            range,
            commonAncestorHTMLElement,
        ),
    };
};

export async function convertAnnotationStateToSelector(annotationWithCacheDoc: IAnnotationStateWithICacheDocument, isLcp: boolean): Promise<ISelector[]> {

    const selector: ISelector<any>[] = [];

    const {__cacheDocument, ...annotation} = annotationWithCacheDoc;

    const xmlDom = getDocumentFromICacheDocument(__cacheDocument);
    if (!xmlDom) {
        return [];
    }

    const document = xmlDom;
    const root = xmlDom.body;

    const { locatorExtended } = annotation;
    const { selectionInfo, locator } = locatorExtended;
    const { locations } = locator;
    const { progression } = locations;
    const { rangeInfo } = selectionInfo;

    // the range start/end is guaranteed in document order (internally used in navigator whenever deserialising DOM Ranges from JSON expression) ... but DOM Ranges are always ordered anyway (only the user / document selection object can be reversed)
    const range = convertRangeInfo(xmlDom, rangeInfo);
    debug("Dump range memory found:", range);

    if (range.collapsed) {
        debug("RANGE COLLAPSED??! skipping...");
        return selector;
    }

    // createTextPositionSelectorMatcher()
    const selectorCssSelectorWithTextPosition = await describeCssSelectorWithTextPosition(range, document, root);
    if (selectorCssSelectorWithTextPosition) {

        debug("CssWithTextPositionSelector : ", selectorCssSelectorWithTextPosition);
        selector.push(selectorCssSelectorWithTextPosition);
    }

    // describeTextPosition()
    const selectorTextPosition = await describeTextPosition(range, root);
    debug("TextPositionSelector : ", selectorTextPosition);
    selector.push(selectorTextPosition);

    if (!isLcp) {

        // describeTextQuote()
        const selectorTextQuote = await describeTextQuote(range, root);
        debug("TextQuoteSelector : ", selectorTextQuote);
        selector.push(selectorTextQuote);
    }

    const progressionSelector: IProgressionSelector = {
        type: "ProgressionSelector",
        value: progression || -1,
    };
    debug("ProgressionSelector : ", progressionSelector);
    selector.push(progressionSelector);

    // Next TODO: CFI !?!

    return selector;
}

export async function convertAnnotationStateToReadiumAnnotation(annotation: IAnnotationStateWithICacheDocument, isLcp: boolean): Promise<IReadiumAnnotation> {

    const { uuid, color, locatorExtended: def, tags, drawType, comment, creator, created, modified } = annotation;
    const { locator, headings, epubPage/*, selectionInfo*/ } = def;
    const { href /*text, locations*/ } = locator;
    // const { afterRaw, beforeRaw, highlightRaw } = text || {};
    // const { rangeInfo: rangeInfoSelection } = selectionInfo || {};
    // const { progression } = locations;

    const highlight: IReadiumAnnotation["body"]["highlight"] = drawType === "solid_background" ? "solid" : drawType;

    const selector = await convertAnnotationStateToSelector(annotation, isLcp);

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
    const isLcp = !!publicationView.lcp;

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
        items: await Promise.all((annotationArray || []).map(async (v) => await convertAnnotationStateToReadiumAnnotation(v, isLcp))),
    };
}
