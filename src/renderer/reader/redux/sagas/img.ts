// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { setImageClickHandler } from "@r2-navigator-js/electron/renderer";
import { takeSpawnEveryChannel } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { eventChannel } from "redux-saga";
import { put as putTyped, select as selectTyped, call as callTyped } from "typed-redux-saga";
import { readerLocalActionSetImageClick } from "../actions";

import { IEventPayload_R2_EVENT_IMAGE_CLICK } from "@r2-navigator-js/electron/common/events";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { ICacheDocument } from "readium-desktop/common/redux/states/renderer/resourceCache";
import { getDocumentFromICacheDocument } from "readium-desktop/utils/xmlDom";
import { cleanupStr } from "readium-desktop/utils/search/transliteration";

// Logger
const filename_ = "readium-desktop:renderer:reader:saga:img";
const debug = debug_(filename_);
debug("_");

export function getWebviewImageClickChannel() {

    const channel = eventChannel<IEventPayload_R2_EVENT_IMAGE_CLICK>(
        (emit) => {

            const handler = (payload: IEventPayload_R2_EVENT_IMAGE_CLICK) => {
                emit(payload);
            };

            setImageClickHandler(handler);

            // eslint-disable-next-line @typescript-eslint/no-empty-function
            return () => {
                // no destrutor
            };
        },
    );

    return channel;
}

const getCacheDocumentFromLocator = (cacheDocumentArray: ICacheDocument[], hrefSource: string): ICacheDocument => {

    for (const cacheDoc of cacheDocumentArray) {
        if (hrefSource && cacheDoc.href && cacheDoc.href === hrefSource) {
            return cacheDoc;
        }
    }

    return undefined;
};

function* webviewImageClick(payload: IEventPayload_R2_EVENT_IMAGE_CLICK) {

    debug("IMAGE_CLICK received :", payload);
    yield* putTyped(readerLocalActionSetImageClick.build(payload));

    const { hostDocumentURL, cssSelectorOf_HTMLImg_SVGImage_SVGFragment } = payload;
    const cacheDocuments = yield* selectTyped((state: IReaderRootState) => state.resourceCache);
    const cacheDoc = getCacheDocumentFromLocator(cacheDocuments, hostDocumentURL);

    const xmlDom = yield* callTyped(() => getDocumentFromICacheDocument(cacheDoc));
    if (!xmlDom) {
        return ;
    }

    const rootElem = xmlDom.body;
    const imgElem = xmlDom.querySelector(cssSelectorOf_HTMLImg_SVGImage_SVGFragment);
    console.log("IMGElem", imgElem);
    console.log("ImgElem Attributes", imgElem.attributes);
    // const altAttributes = imgElem.getAttribute("alt");
    // const titleAttributes = imgElem.getAttribute("title");
    // const ariaLabelAttributes = imgElem.getAttribute("aria-label");
    const ariaDetailsAttributes = imgElem.getAttribute("aria-details");
    console.log("ariaDetailsAttributes", ariaDetailsAttributes);
    const ariaDescribedbyAttributes = imgElem.getAttribute("aria-describedby");
    console.log("ariaDescribedbyAttributes", ariaDescribedbyAttributes);


    // https://kb.daisy.org/publishing/docs/html/images-desc.html

    // is Surrounded by a Figure tag ?
    let figureElem = undefined;
    {
        let currElem = imgElem;
        while (rootElem !== currElem.parentElement) {
            if (currElem.nodeName === "FIGURE" || currElem.nodeName === "figure") {
                figureElem = currElem;
                console.log("FIGURE ELEM", figureElem);
                break;
            }
            currElem = currElem.parentElement;
        }
    }

    let detailsText = "";
    if (ariaDetailsAttributes) {
        const elem = xmlDom.getElementById(ariaDetailsAttributes);
        if (elem) {
            detailsText = cleanupStr(elem.textContent || "");
        }
    }

    let describedbyText = "";
    if (ariaDescribedbyAttributes) {
        const elem = xmlDom.getElementById(ariaDescribedbyAttributes);
        if (elem) {
            describedbyText = cleanupStr(elem.textContent || "");
        }
    }

    let labelledByText = "";
    let figcaptionText = "";
    if (figureElem) {
        console.log("FigureElement attributes", figureElem.attributes);
        const ariaLabelledByAttributes = figureElem.getAttribute("aria-labelledby");
        if (ariaLabelledByAttributes) {
            const elem = xmlDom.getElementById(ariaLabelledByAttributes);
            if (elem) {
                labelledByText = cleanupStr(elem.textContent || "");
            }
        }
        {
            const elem = figureElem.getElementsByTagName("figcaption");
            if (elem) {
                figcaptionText = cleanupStr(elem[0]?.textContent || "");
            }
        }
    }

    const N_CHAR_SIZE = 200;
    const CUT = N_CHAR_SIZE + 50;

    let beforeText = "";
    let afterText = "";
    // if (!detailsText && !describedbyText && (!(labelledByText && figcaptionText) || !figcaptionText)) {

    const iter = xmlDom.createNodeIterator(rootElem, NodeFilter.SHOW_ALL, { acceptNode: () => NodeFilter.FILTER_ACCEPT });

    const resetImgIterator = () => {
        let curEl;
        do {
            curEl = iter.nextNode();
        } while (curEl && imgElem !== curEl);
        if (curEl != imgElem) {
            return;
        }
    };

    resetImgIterator();
    while (beforeText.length < N_CHAR_SIZE) {

        const node = iter.previousNode();
        if (!node) {
            break;
        }
        if (node.nodeType === Node.TEXT_NODE) {
            beforeText = cleanupStr(node.nodeValue) + " " + beforeText;
        }
        if (node.nodeName === "IMG" || node.nodeName === "img") {
            break;
        } 
    }
    resetImgIterator();
    while (afterText.length < N_CHAR_SIZE) {
        const node = iter.nextNode();
        if (!node) {
            break;
        }
        if (node.nodeType === Node.TEXT_NODE) {
            afterText += cleanupStr(node.nodeValue) + " ";
        }
    }

    const abs = (v: number) => v < 0 ? 0 : -1 * v;

    beforeText = beforeText.slice(abs(beforeText.length - CUT), beforeText.length);
    afterText = afterText.slice(0, CUT);

    const DomParsingTexts = {
        dom_beforeText: beforeText,
        dom_afterText: afterText,
        dom_detailsText: detailsText,
        dom_describedbyText: describedbyText,
        dom_labelledByText: labelledByText,
        dom_figcaptionText: figcaptionText,
    };
    debug("IMG_CLICK ImgDomParsed injected to img payload:", DomParsingTexts);

    yield* putTyped(readerLocalActionSetImageClick.build({ ...payload, ...DomParsingTexts }));

    return;
}

export function saga() {

    const ch = getWebviewImageClickChannel();
    return takeSpawnEveryChannel(
        ch,
        webviewImageClick,
    );
}
