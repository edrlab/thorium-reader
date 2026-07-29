// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";

import { ICFIFragmentSelector, ICssSelector, IEPUBCFISelector, IProgressionSelector, ISelector, ITextPositionSelector } from "readium-desktop/common/readium/annotation/annotationModel.type";
import { uniqueCssSelector } from "@r2-navigator-js/electron/renderer/common/cssselector3";
import type { PublicationNote } from "readium-desktop/common/publication-notes";
import {  describeTextPosition, describeTextQuote } from "readium-desktop/third_party/apache-annotator/dom";
import { convertRangeInfo } from "@r2-navigator-js/electron/renderer/webview/selection";
import type { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { EpubCfiUtils } from "@r2-navigator-js/electron/common/colibrio-cfi/EpubCfiUtils";
import { EpubCfiBuilderHelper } from "@r2-navigator-js/electron/common/colibrio-cfi/builder/EpubCfiBuilderHelper";
import { EpubCfiStringifier } from "@r2-navigator-js/electron/common/colibrio-cfi/stringifier/EpubCfiStringifier";

// Logger
const debug = debug_("readium-desktop:renderer:reader:readiumAnnotation:selector");

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
        value: uniqueCssSelector(commonAncestorHTMLElement, document, { root }),
        refinedBy: await describeTextPosition(
            range,
            commonAncestorHTMLElement,
        ),
    };
};

export async function readiumAnnotationSelectorFromNote(
    note: PublicationNote,
    isLcp: boolean,
    sourceHref: string,
    xmlDom: Document | undefined,
    r2Publication: R2Publication,
): Promise<ISelector[]> {

    const { locatorExtended } = note;
    if (!locatorExtended) {
        return [];
    }

    const selector: ISelector<any>[] = [];

    if (!xmlDom) {
        return [];
    }

    const document = xmlDom;
    const root = xmlDom.body;

    const { selectionInfo, locator } = locatorExtended;
    const { locations } = locator;
    const { progression } = locations;

    // the range start/end is guaranteed in document order (internally used in navigator whenever deserialising DOM Ranges from JSON expression) ... but DOM Ranges are always ordered anyway (only the user / document selection object can be reversed)
    const rangeInfo = selectionInfo?.rangeInfo || locator.locations.caretInfo?.rangeInfo;
    if (!rangeInfo) {
        debug("ERROR!! RangeInfo not defined !!!");
        debug(rangeInfo);
        return selector;
    }
    const range = convertRangeInfo(xmlDom, rangeInfo);
    debug("Dump range memory found:", range);
    if (!range) {
        debug("ERROR!! RangeInfo could not be converted to DOM Range !!!");
        return selector;
    }

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

    if (typeof progression === "number" && progression >= 0) {
        const progressionSelector: IProgressionSelector = {
            type: "ProgressionSelector",
            value: progression,
        };
        debug("ProgressionSelector : ", progressionSelector);
        selector.push(progressionSelector);
    } else {
        debug("ProgressionSelector SKIP : ", progression);
    }

    const opfSpineItemIndex = r2Publication.Spine.findIndex((link) => link.Href === sourceHref);
    const opfSpineItemCFIPath = opfSpineItemIndex > -1 ? `/6/${(opfSpineItemIndex*2+2)}` : "/6/0"; // TODO Fallback !?

    const rootNode = EpubCfiUtils.createEmptyRootNode();
    EpubCfiBuilderHelper.appendTerminalDomRange(range, rootNode);
    let cfi = EpubCfiStringifier.stringifyRootNode(rootNode);
    let cfiFragmentValue = cfi;
    if (cfi) {
        cfi = cfi.replace(/^epubcfi\(/, "").replace(/\)$/, "");
        cfiFragmentValue = `epubcfi(${opfSpineItemCFIPath}!${cfi})`;
    }

    const cfiFragmentSelector: ICFIFragmentSelector = {
        type: "FragmentSelector",
        conformsTo: "http://www.idpf.org/epub/linking/cfi/epub-cfi.html",
        value: cfiFragmentValue,
    };
    selector.push(cfiFragmentSelector);

    const cfiSelector: IEPUBCFISelector = {
        type: "EPUBCFISelector",
        value: cfi,
    };
    selector.push(cfiSelector);


    // this normally occurs at import time, but let's save debugging effort by checking immediately when exporting...
    // errors are non-fatal, just hunt for the "IRangeInfo DIFF" console logs
    // const isABookmark = drawType === EDrawType.bookmark; // rangeInfo.endContainerChildTextNodeIndex === rangeInfo.startContainerChildTextNodeIndex && rangeInfo.endContainerElementCssSelector === rangeInfo.startContainerElementCssSelector && rangeInfo.endOffset - rangeInfo.startOffset === 1;
    // if (__TH__IS_DEV__) {
        // await convertSelectorTargetToLocatorExtended({ source: "", selector }, cacheDocument, rangeInfo, isABookmark);
    // }
    return selector;
}

export function checkIfIsAllSelectorsNoteAreGeneratedForReadiumAnnotation(note: PublicationNote) {

    const selector = note.readiumAnnotation?.export?.selector;
    return Array.isArray(selector) && selector.length > 0;
}
