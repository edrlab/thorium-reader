// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

import { ICssSelector, IProgressionSelector, ISelector, ITextPositionSelector } from "readium-desktop/common/readium/annotation/annotationModel.type";
import { uniqueCssSelector } from "@r2-navigator-js/electron/renderer/common/cssselector3";
import { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import {  describeTextPosition, describeTextQuote } from "readium-desktop/third_party/apache-annotator/dom";
import { convertRangeInfo } from "@r2-navigator-js/electron/renderer/webview/selection";
import { /*select as selectTyped, take as takeTyped, all as allTyped,*/ call as callTyped, SagaGenerator /*put as putTyped, delay as delayTyped*/ } from "typed-redux-saga/macro";

// Logger
const debug = debug_("readium-desktop:renderer:reader:redux:sagas:readiumAnnotation:selector");

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

export function* readiumAnnotationSelectorFromNote(note: INoteState, isLcp: boolean, _source: string, xmlDom: Document): SagaGenerator<ISelector[]> {

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

    if (range.collapsed) {
        debug("RANGE COLLAPSED??! skipping...");
        return selector;
    }

    // createTextPositionSelectorMatcher()
    const selectorCssSelectorWithTextPosition = yield* callTyped(() => describeCssSelectorWithTextPosition(range, document, root));
    if (selectorCssSelectorWithTextPosition) {

        debug("CssWithTextPositionSelector : ", selectorCssSelectorWithTextPosition);
        selector.push(selectorCssSelectorWithTextPosition);
    }

    // describeTextPosition()
    const selectorTextPosition = yield* callTyped(() => describeTextPosition(range, root));
    debug("TextPositionSelector : ", selectorTextPosition);
    selector.push(selectorTextPosition);

    if (!isLcp) {

        // describeTextQuote()
        const selectorTextQuote = yield* callTyped(() => describeTextQuote(range, root));
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

    // this normally occurs at import time, but let's save debugging effort by checking immediately when exporting...
    // errors are non-fatal, just hunt for the "IRangeInfo DIFF" console logs
    // const isABookmark = drawType === EDrawType.bookmark; // rangeInfo.endContainerChildTextNodeIndex === rangeInfo.startContainerChildTextNodeIndex && rangeInfo.endContainerElementCssSelector === rangeInfo.startContainerElementCssSelector && rangeInfo.endOffset - rangeInfo.startOffset === 1;
    // if (IS_DEV) {
        // await convertSelectorTargetToLocatorExtended({ source: "", selector }, cacheDocument, rangeInfo, isABookmark);
    // }
    return selector;
}

export function checkIfIsAllSelectorsNoteAreGeneratedForReadiumAnnotation(note: INoteState) {

    return Array.isArray(note.readiumAnnotation?.export?.selector);
}
