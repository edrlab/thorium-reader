// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";

import { ICssSelector, IReadiumAnnotation, IReadiumAnnotationSet, isCFIFragmentSelector, isCfiSelector, isCssSelector, isProgressionSelector, isTextPositionSelector, isTextQuoteSelector, ITextPositionSelector, ITextQuoteSelector } from "./annotationModel.type";
import { uuidv4 } from "readium-desktop/utils/uuid";
import { _APP_NAME, _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { PublicationView } from "readium-desktop/common/views/publication";
import { rgbToHex } from "readium-desktop/common/rgb";
import { createCssSelectorMatcher, createTextPositionSelectorMatcher, createTextQuoteSelectorMatcher } from "readium-desktop/third_party/apache-annotator/dom";
import { makeRefinable } from "readium-desktop/third_party/apache-annotator/selector";
import { convertRange, normalizeRange } from "@r2-navigator-js/electron/renderer/webview/selection";
import { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { uniqueCssSelector } from "@r2-navigator-js/electron/renderer/common/cssselector3";
import { IRangeInfo, ISelectedTextInfo, ISelectionInfo } from "@r2-navigator-js/electron/common/selection";

import { convertMultiLangStringToString } from "readium-desktop/common/language-string";
import {
    NOTE_DEFAULT_COLOR,
    noteColorCodeToColorSet,
    type PublicationNoteImportUnresolvedReason,
    type PublicationNote,
} from "readium-desktop/common/publication-notes";
import { availableLanguages } from "readium-desktop/common/services/translator";
import { EDrawType } from "readium-desktop/common/type/note.type";

import { EpubCfiParser } from "@r2-navigator-js/electron/common/colibrio-cfi/parser/EpubCfiParser";
import { EpubCfiResolver } from "@r2-navigator-js/electron/common/colibrio-cfi/resolver/EpubCfiResolver";

// Logger
const debug = debug_("readium-desktop:common:readium:annotation:converter");

export type TSelectorTargetLocatorResolution =
    | {
        status: "resolved";
        locatorExtended: MiniLocatorExtended;
    }
    | {
        status: "unresolved";
        reason: PublicationNoteImportUnresolvedReason;
        source?: string | undefined;
        selectorTypes?: string[] | undefined;
        message?: string | undefined;
    };

export type TSelectorTargetLocatorCandidateSource =
    "CfiSelector" |
    "FragmentSelector" |
    "CssSelector" |
    "TextPositionSelector" |
    "TextQuoteSelector";

export interface ISelectorTargetLocatorCandidate {
    selectorType: TSelectorTargetLocatorCandidateSource;
    selectorPriority: number;
    rangeInfo: IRangeInfo;
    textInfo: ISelectedTextInfo;
}

interface ISelectorTargetMatchedRange {
    selectorType: TSelectorTargetLocatorCandidateSource;
    range: Range;
}

const selectorTargetLocatorCandidatePriority: Record<TSelectorTargetLocatorCandidateSource, number> = {
    CfiSelector: 50,
    FragmentSelector: 50,
    CssSelector: 40,
    TextPositionSelector: 30,
    TextQuoteSelector: 20,
};

function selectorTypes(target: IReadiumAnnotation["target"] | undefined): string[] {
    return (target?.selector || [])
        .map((selector) => selector.type)
        .filter((type): type is string => !!type);
}

function unresolvedSelectorTarget(
    target: IReadiumAnnotation["target"] | undefined,
    reason: PublicationNoteImportUnresolvedReason,
    message?: string,
): TSelectorTargetLocatorResolution {
    return {
        status: "unresolved",
        reason,
        source: target?.source,
        selectorTypes: selectorTypes(target),
        message,
    };
}

function isUsableLocatorCandidate(candidate: ISelectorTargetLocatorCandidate): boolean {
    return !!candidate.rangeInfo?.startContainerElementCssSelector && !!candidate.textInfo?.rawText;
}

function rangeInfosMatch(left: IRangeInfo, right: IRangeInfo): boolean {
    return left.startContainerElementCssSelector === right.startContainerElementCssSelector &&
        left.startContainerChildTextNodeIndex === right.startContainerChildTextNodeIndex &&
        left.startOffset === right.startOffset &&
        left.endContainerElementCssSelector === right.endContainerElementCssSelector &&
        left.endContainerChildTextNodeIndex === right.endContainerChildTextNodeIndex &&
        left.endOffset === right.endOffset &&
        left.cfi === right.cfi;
}

function textInfosMatch(left: ISelectedTextInfo, right: ISelectedTextInfo): boolean {
    return left.rawText === right.rawText && left.cleanText === right.cleanText;
}

export function selectSelectorTargetLocatorCandidate(
    candidates: ISelectorTargetLocatorCandidate[],
): {
    status: "resolved";
    candidate: ISelectorTargetLocatorCandidate;
} | {
    status: "unresolved";
    reason: Extract<PublicationNoteImportUnresolvedReason, "selector-not-found" | "ambiguous-match">;
} {

    const usableCandidates = candidates.filter(isUsableLocatorCandidate);
    if (!usableCandidates.length) {
        return {
            status: "unresolved",
            reason: "selector-not-found",
        };
    }

    const firstCandidate = usableCandidates[0];
    const hasAmbiguousMatch = usableCandidates.some((candidate) =>
        !rangeInfosMatch(firstCandidate.rangeInfo, candidate.rangeInfo) ||
        !textInfosMatch(firstCandidate.textInfo, candidate.textInfo));
    if (hasAmbiguousMatch) {
        return {
            status: "unresolved",
            reason: "ambiguous-match",
        };
    }

    const selectedCandidate = [...usableCandidates]
        .sort((left, right) => right.selectorPriority - left.selectorPriority)[0];

    return {
        status: "resolved",
        candidate: selectedCandidate,
    };
}

export async function resolveSelectorTargetToLocatorExtended(target: IReadiumAnnotation["target"], debugRangeInfo: IRangeInfo | undefined, isABookmark: boolean, xmlDom: Document | undefined, href: string): Promise<TSelectorTargetLocatorResolution> {

    if (!target || !target.source || !xmlDom || !href) {
        return unresolvedSelectorTarget(target, "source-mismatch", "The annotation source could not be loaded from the publication.");
    }

    const cfiSelector = target.selector.find(isCfiSelector);
    const cfiFragmentSelector = target.selector.find(isCFIFragmentSelector);
    const textQuoteSelector = target.selector.find(isTextQuoteSelector);
    const textPositionSelector = target.selector.find(isTextPositionSelector);
    const cssSelector = target.selector.find(isCssSelector);
    const progressionSelector = target.selector.find(isProgressionSelector);
    const progressionValue = progressionSelector?.value || undefined;
    if (!(cssSelector || textQuoteSelector || textPositionSelector || cfiFragmentSelector || cfiSelector)) {
        debug("No supported selector found !!", JSON.stringify(target.selector, null, 4));
        return unresolvedSelectorTarget(target, "unsupported-selector", "The annotation does not include a supported selector.");
    }

    const root = xmlDom.body;
    if (!root) {
        return unresolvedSelectorTarget(target, "source-mismatch", "The annotation source could not be loaded from the publication.");
    }

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

    const ranges: ISelectorTargetMatchedRange[] = [];
    const pushToRangeArray: (selectorType: TSelectorTargetLocatorCandidateSource, rangeOrElement: Range | Element) => void = (selectorType, rangeOrElement) => {
        let range: Range = undefined;

        if (rangeOrElement instanceof Element) {
            range = document.createRange();
            range.selectNode(rangeOrElement);
        } else {
            range = rangeOrElement;
        }

        ranges.push({
            selectorType,
            range,
        });
    };
    if (textQuoteSelector) {
        const matchAll = createMatcher(textQuoteSelector);
        for await (const rangeOrElement of matchAll(root)) {
            pushToRangeArray("TextQuoteSelector", rangeOrElement);
        }
    }
    if (textPositionSelector) {
        const matchAll = createMatcher(textPositionSelector);
        for await (const rangeOrElement of matchAll(root)) {
            pushToRangeArray("TextPositionSelector", rangeOrElement);
        }
    }
    if (cssSelector) {
        const matchAll = createMatcher(cssSelector);
        for await (const rangeOrElement of matchAll(root)) {
            pushToRangeArray("CssSelector", rangeOrElement);
        }
    }

    let cfi = cfiSelector?.value || cfiFragmentSelector?.value;
    const cfiSelectorType: TSelectorTargetLocatorCandidateSource | undefined =
        cfiSelector ? "CfiSelector" :
            cfiFragmentSelector ? "FragmentSelector" :
                undefined;
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
                if (domRange && cfiSelectorType) {
                    pushToRangeArray(cfiSelectorType, domRange);
                }
            } else if (resolved.isTargetingElement()) {
                const elem = resolved.getTargetElement();
                debug("Colibrio CFI ELEMENT", elem);
            }
        }
    }
    if (!ranges.length) {
        debug("No selector found !!", JSON.stringify(target.selector, null, 4));
        return unresolvedSelectorTarget(target, "selector-not-found", "The selectors did not match this publication content.");
    }
    debug(`${ranges.length} range(s) found !!!`);

    const convertedRangeArray: ISelectorTargetLocatorCandidate[] = [];

    for (const matchedRange of ranges) {
        const range = normalizeRange(matchedRange.range);
        if (range.collapsed) {
            debug("RANGE COLLAPSED :( skipping...");
            continue;
        }

        // the range start/end is guaranteed in document order due to the text matchers above (forward tree walk) ... but DOM Ranges are always ordered anyway (only the user / document selection object can be reversed)
        const tuple = convertRange(range, (element) => uniqueCssSelector(element, xmlDom, {root}), () => "" /*, () => "" */);
        if (tuple && tuple.length === 2) {
            convertedRangeArray.push({
                selectorType: matchedRange.selectorType,
                selectorPriority: selectorTargetLocatorCandidatePriority[matchedRange.selectorType],
                rangeInfo: tuple[0],
                textInfo: tuple[1],
            });
        }
    }
    if (!convertedRangeArray.length) {
        debug(`No selector found but ${ranges.length} found !!`, JSON.stringify(target.selector, null, 4));
        return unresolvedSelectorTarget(target, "selector-not-found", "The selectors matched content that could not be converted into a locator.");
    }
    debug(`${convertedRangeArray.length} range(s) converted found !!!`);
    debug("dump convertedRange : ", JSON.stringify(convertedRangeArray, null, 4));

    if (__TH__IS_DEV__) {
        debug("#".repeat(80));
        let ok = true;
        let prevRangeInfo = debugRangeInfo;
        for (const convertedRange of convertedRangeArray) {
            const rangeInfo = convertedRange.rangeInfo;
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
                debug(JSON.stringify(convertedRangeArray.map((convertedRange) => convertedRange.rangeInfo), null, 4));
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

    const locatorCandidateSelection = selectSelectorTargetLocatorCandidate(convertedRangeArray);
    if (locatorCandidateSelection.status === "unresolved") {
        debug("No unique range candidate found !!");
        if (locatorCandidateSelection.reason === "ambiguous-match") {
            return unresolvedSelectorTarget(target, "ambiguous-match", "The selectors matched more than one distinct location.");
        }

        return unresolvedSelectorTarget(target, "selector-not-found", "The selectors did not produce a usable locator.");
    }
    const { rangeInfo, textInfo } = locatorCandidateSelection.candidate;

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

    return {
        status: "resolved",
        locatorExtended,
    };
}

export async function convertSelectorTargetToLocatorExtended(target: IReadiumAnnotation["target"], debugRangeInfo: IRangeInfo | undefined, isABookmark: boolean, xmlDom: Document | undefined, href: string): Promise<MiniLocatorExtended | undefined> {

    const resolution = await resolveSelectorTargetToLocatorExtended(target, debugRangeInfo, isABookmark, xmlDom, href);
    return resolution.status === "resolved" ? resolution.locatorExtended : undefined;
}

// export type PublicationNoteWithICacheDocument = PublicationNote & { __cacheDocument?: ICacheDocument | undefined };

export function convertAnnotationStateToReadiumAnnotation(note: PublicationNote): IReadiumAnnotation | undefined {

    const { uuid, color, locatorExtended, tags, drawType, textualValue, creator, created, modified, readiumAnnotation } = note;
    const highlight = (drawType === EDrawType.solid_background ? "solid" : EDrawType[drawType]) as IReadiumAnnotation["body"]["highlight"];
    const isABookmark = drawType === EDrawType.bookmark;

    // PDF annotations currently store their target in `note.pdfAnnotation`.
    // Do not serialize them as Readium annotations until there is an explicit
    // PDF page/rectangle target mapping.
    if (note.pdfAnnotation) {
        debug("Skip PDF annotation during Readium annotation export", note.uuid);
        return undefined;
    }

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
        motivation: isABookmark ? "bookmarking" : "highlighting", // isABookmark = drawType === EDrawType.bookmark
    };
}

export function convertAnnotationStateArrayToReadiumAnnotationSet(locale: keyof typeof availableLanguages, notes: PublicationNote[], publicationView: PublicationView, label?: string): IReadiumAnnotationSet {

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
            homepage: "https://www.thoriumreader.com/",
        },
        generated: dateString,
        title: label || "Annotations set",
        about: {
            "dc:identifier": ["urn:thorium:" + publicationView.identifier, publicationView.workIdentifier ? publicationView.workIdentifier : ""], // TODO workIdentifier urn ?
            "dc:format": "application/epub+zip",
            "dc:title": publicationView.documentTitle || "",
            "dc:publisher": publicationView.publishersLangString ?
                publicationView.publishersLangString.map((item) => {

                    const textObj = item;
                    const pubLangs = publicationView.languages;
                    const pubLang = pubLangs ? pubLangs[0] : undefined; // TODO: OPF xml:lang on title meta is actually the lang, not the declared pub lang(s)!
                    const textObj_ = pubLang && typeof textObj === "string" ? { [pubLang]: textObj } : textObj;

                    return convertMultiLangStringToString(textObj_, locale);
                }) : [],
            "dc:creator": publicationView.authorsLangString ?
                publicationView.authorsLangString.map((item) => {

                    const textObj = item;
                    const pubLangs = publicationView.languages;
                    const pubLang = pubLangs ? pubLangs[0] : undefined; // TODO: OPF xml:lang on title meta is actually the lang, not the declared pub lang(s)!
                    const textObj_ = pubLang && typeof textObj === "string" ? { [pubLang]: textObj } : textObj;

                    return convertMultiLangStringToString(textObj_, locale);
                }) : [],
            "dc:date": publicationView.publishedAt || "",
        },
        items: notes.reduce<IReadiumAnnotation[]>((items, note) => {
            const readiumAnnotation = convertAnnotationStateToReadiumAnnotation(note);
            if (readiumAnnotation) {
                items.push(readiumAnnotation);
            }
            return items;
        }, []),
    };
}
