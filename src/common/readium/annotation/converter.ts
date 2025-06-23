// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

import { ICssSelector, IReadiumAnnotation, IReadiumAnnotationSet, isCFIFragmentSelector, isCfiSelector, isCssSelector, isProgressionSelector, isTextPositionSelector, isTextQuoteSelector, ITextPositionSelector, ITextQuoteSelector } from "./annotationModel.type";
import { v4 as uuidv4 } from "uuid";
import { _APP_NAME, _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { PublicationView } from "readium-desktop/common/views/publication";
import { rgbToHex } from "readium-desktop/common/rgb";
import { createCssSelectorMatcher, createTextPositionSelectorMatcher, createTextQuoteSelectorMatcher } from "readium-desktop/third_party/apache-annotator/dom";
import { makeRefinable } from "readium-desktop/third_party/apache-annotator/selector";
import { convertRange, normalizeRange } from "@r2-navigator-js/electron/renderer/webview/selection";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { uniqueCssSelector } from "@r2-navigator-js/electron/renderer/common/cssselector3";
import { IRangeInfo, ISelectedTextInfo, ISelectionInfo } from "@r2-navigator-js/electron/common/selection";

import { IS_DEV } from "readium-desktop/preprocessor-directives";
import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import { availableLanguages } from "readium-desktop/common/services/translator";
import { EDrawType, INoteState, NOTE_DEFAULT_COLOR, noteColorCodeToColorSet } from "readium-desktop/common/redux/states/renderer/note";

import { EpubCfiParser } from "@r2-navigator-js/electron/common/colibrio-cfi/parser/EpubCfiParser";
import { EpubCfiResolver } from "@r2-navigator-js/electron/common/colibrio-cfi/resolver/EpubCfiResolver";

// Logger
const debug = debug_("readium-desktop:common:readium:annotation:converter");

export async function convertSelectorTargetToLocatorExtended(target: IReadiumAnnotation["target"], debugRangeInfo: IRangeInfo | undefined, isABookmark: boolean, xmlDom: Document, href: string): Promise<MiniLocatorExtended | undefined> {

    if (!target || !target.source || !xmlDom || !href) {
        return undefined;
    }

    const root = xmlDom.body;

    const cfiSelector = target.selector.find(isCfiSelector);
    const cfiFragmentSelector = target.selector.find(isCFIFragmentSelector);
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

    let cfi = cfiSelector?.value || cfiFragmentSelector?.value;
    if (cfi) {
        cfi = cfi.trim();
        cfi = cfi.replace(/^epubcfi\(/, "").replace(/^.*!/, "").replace(/\)$/, ""); // keep only the right part after the !
        cfi = `epubcfi(${cfi})`;
        const parser = new EpubCfiParser(cfi);
        const rootNode = parser.parse();
        const resolver = new EpubCfiResolver(rootNode);
        resolver.continueResolving(xmlDom.documentElement, new URL("fake://dummy"));
        const resolved = resolver.getResolvedTarget();
        if (resolved.hasErrors()) {
            debug("Colibrio CFI ERRORS:");
            debug(JSON.stringify(resolved.getParserErrors(), null, 4));
            debug(JSON.stringify(resolved.getResolverErrors(), null, 4));
        } else {
            if (resolved.isDomRange()) {
                const domRange = resolved.createDomRange();
                debug("Colibrio CFI DOM RANGE");
                if (domRange) {
                    pushToRangeArray(domRange);
                }
            } else if (resolved.isTargetingElement()) {
                const elem = resolved.getTargetElement();
                debug("Colibrio CFI ELEMENT", elem);
            }
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
        const tuple = convertRange(range, (element) => uniqueCssSelector(element, xmlDom, {root}), () => "" /*, () => "" */);
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

    if (IS_DEV) {
        debug("#".repeat(80));
        let ok = true;
        let prevRangeInfo = debugRangeInfo;
        for (const tuple of convertedRangeArray) {
            const rangeInfo = tuple[0];
            if (!prevRangeInfo) {
                prevRangeInfo = rangeInfo;
                debug("----IRangeInfo DIFF ok (first)----");
                continue;
            }
            if (prevRangeInfo.startOffset !== rangeInfo.startOffset ||
                prevRangeInfo.startContainerElementCssSelector !== rangeInfo.startContainerElementCssSelector ||
                prevRangeInfo.startContainerChildTextNodeIndex !== rangeInfo.startContainerChildTextNodeIndex ||
                prevRangeInfo.endOffset !== rangeInfo.endOffset ||
                prevRangeInfo.endContainerElementCssSelector !== rangeInfo.endContainerElementCssSelector ||
                prevRangeInfo.endContainerChildTextNodeIndex !== rangeInfo.endContainerChildTextNodeIndex
            ) {
                debug("!!!!IRangeInfo DIFF!!!!");
                debug(JSON.stringify(convertedRangeArray.map((tuple) => tuple[0]), null, 4));
                ok = false;
                break;
            } else {
                debug("----IRangeInfo DIFF ok----");
            }
        }
        if (ok) {
            debug("____IRangeInfo DIFF OKAY____");
        }
        debug("#".repeat(80));
    }

    // TODO: need an Heuristic to choose the range from the array, maybe check if all ranges are equal and add a priority in function of the selector
    // see above IS_DEV ... maybe pick the most "correct" DOM Range? (most generated, to eliminate odd ones?)
    let rangeInfo: IRangeInfo = undefined;
    let textInfo: ISelectedTextInfo = undefined;
    for (const convertedRange of convertedRangeArray) {
        if (convertedRange[0]?.startContainerElementCssSelector && convertedRange[1]?.rawText) {
            rangeInfo = convertedRange[0];
            textInfo = convertedRange[1];
        }
    }
    if (!rangeInfo || !textInfo) {
        debug("No range found !!");
        return undefined;
    }

    // How to define if it is a bookmark rangeInfo !?
    // need to check if the start/end ContainerElementCssSelector & start/end ContainerChildTextNodeIndex is equal and if the end - start offset equal 1
    let caretInfo: ISelectionInfo = undefined;
    let selectionInfo: ISelectionInfo = undefined;
    if (
        isABookmark //||  // See https://github.com/edrlab/thorium-reader/issues/2988
        // (rangeInfo.endContainerChildTextNodeIndex === rangeInfo.startContainerChildTextNodeIndex && rangeInfo.endContainerElementCssSelector === rangeInfo.startContainerElementCssSelector && rangeInfo.endOffset - rangeInfo.startOffset === 1)
    ) {
        // IT's a bookmark: need to move this rangeInfo to the locations.caretInfo

        caretInfo = {
            textFragment: undefined,

            rangeInfo: {...rangeInfo},

            cleanBefore: textInfo.cleanBefore,
            cleanText: textInfo.cleanText,
            cleanAfter: textInfo.cleanAfter,

            rawBefore: textInfo.rawBefore,
            rawText: textInfo.rawText,
            rawAfter: textInfo.rawAfter,
        };
    } else {
        selectionInfo = {
            textFragment: undefined,

            rangeInfo: {...rangeInfo},

            cleanBefore: textInfo.cleanBefore,
            cleanText: textInfo.cleanText,
            cleanAfter: textInfo.cleanAfter,

            rawBefore: textInfo.rawBefore,
            rawText: textInfo.rawText,
            rawAfter: textInfo.rawAfter,
        };
    }
    const cssSelectorFromRangeInfo = selectionInfo?.rangeInfo.startContainerElementCssSelector || caretInfo?.rangeInfo.startContainerElementCssSelector;

    debug("SelectionInfo generated:", JSON.stringify(selectionInfo || caretInfo, null, 4));

    const locatorExtended: MiniLocatorExtended = {
        locator: {
            href,
            locations: {
                cssSelector: cssSelectorFromRangeInfo,
                caretInfo: caretInfo,
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

// export type INoteStateWithICacheDocument = INoteState & { __cacheDocument?: ICacheDocument | undefined };

export function convertAnnotationStateToReadiumAnnotation(note: INoteState): IReadiumAnnotation {

    const { uuid, color, locatorExtended, tags, drawType, textualValue, creator, created, modified, readiumAnnotation } = note;
    const highlight = (drawType === EDrawType.solid_background ? "solid" : EDrawType[drawType]) as IReadiumAnnotation["body"]["highlight"];
    const isABookmark = drawType === EDrawType.bookmark;

    if (!locatorExtended) {
        debug("Convert A Note without any locator !!!", note.uuid);
    }

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: uuid ? "urn:uuid:" + uuid : "",
        created: new Date(created).toISOString(),
        modified: modified ? new Date(modified).toISOString() : undefined,
        type: "Annotation",
        body: {
            type: "TextualBody",
            value: textualValue || "",
            format: "text/plain",
            color: noteColorCodeToColorSet[rgbToHex(color)] || NOTE_DEFAULT_COLOR,
            tag: (tags || [])[0] || "",
            highlight,
            //   textDirection: "ltr",
            //   language: "fr",
        },
        creator: creator?.urn ? {
            id: creator.urn,
            name: creator.name || "",
            type: creator.type,
        } : undefined,
        target: {
            source: locatorExtended?.locator.href || "",
            meta: (locatorExtended?.headings || locatorExtended?.epubPage) ? {
                headings: locatorExtended?.headings ? locatorExtended.headings.map(({ txt, level }) => ({ txt, level })) : undefined,
                page: locatorExtended?.epubPage || undefined,
            } : undefined,
            selector: readiumAnnotation?.export?.selector || [],
        },
        motivation: isABookmark ? "bookmarking" : undefined, // isABookmark = drawType === EDrawType.bookmark
    };
}

export function convertAnnotationStateArrayToReadiumAnnotationSet(locale: keyof typeof availableLanguages, notes: INoteState[], publicationView: PublicationView, label?: string): IReadiumAnnotationSet {

    const currentDate = new Date();
    const dateString: string = currentDate.toISOString();
    // const iLcp = !!publicationView.lcp;

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
            "dc:publisher": publicationView.publishersLangString ?
                publicationView.publishersLangString.map((item) => {
                    return convertMultiLangStringToString(item, locale);
                }) : [],
            "dc:creator": publicationView.authorsLangString ?
                publicationView.authorsLangString.map((item) => {
                    return convertMultiLangStringToString(item, locale);
                }) : [],
            "dc:date": publicationView.publishedAt || "",
        },
        items: notes.map((v) => convertAnnotationStateToReadiumAnnotation(v)),
    };
}
