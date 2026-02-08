
// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { split } from "sentence-splitter";

import { ROOT_CLASS_NO_RUBY, SKIP_LINK_ID } from "../../common/styles";
import { uniqueCssSelector } from "../common/cssselector3";
import { ReadiumElectronWebviewWindow } from "../webview/state";

// const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

const win = global.window as ReadiumElectronWebviewWindow;

export function combineTextNodes(textNodes: Node[], skipNormalize?: boolean): string {
    if (textNodes && textNodes.length) {
        let str = "";
        for (const textNode of textNodes) {
            let txt = textNode.nodeValue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((textNode as any).__RUBY) {
                // exxslint-disable-next-line @typescript-eslint/no-explicit-any
                // str += " (SKIP) ";
            } else if (txt) { // does not exclude purely-whitespace text nodes
                // normalizeText() preserves prefix/suffix whitespace (collapsed to single), no trim()
                // if (str.length) {
                //     str += " ";
                // }
                if (!txt.trim().length) {
                    txt = " ";
                    str += txt;
                } else {
                    str += (skipNormalize ? txt : normalizeText(txt));
                }
            }
        }
        return str;
    }
    return "";
}

export function getLanguage(el: Element): string { //  | undefined

    let currentElement = el;

    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {

        let lang = currentElement.getAttribute("xml:lang");
        if (!lang) {
            lang = currentElement.getAttributeNS("http://www.w3.org/XML/1998/namespace", "lang");
        }
        if (!lang) {
            lang = currentElement.getAttribute("lang");
        }
        if (lang) {
            return lang;
        }

        currentElement = currentElement.parentNode as Element;
    }

    return "und"; // undefined
}

export function getDirection(el: Element): string | undefined {

    let currentElement = el;

    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {

        const dir = currentElement.getAttribute("dir");
        if (dir) {
            return dir;
        }

        currentElement = currentElement.parentNode as Element;
    }

    return undefined;
}

export function normalizeHtmlText(str: string): string {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function normalizeText(str: string): string {
    // tslint:disable-next-line:max-line-length
    return normalizeHtmlText(str).replace(/[\r\n]/g, " ").replace(/\s\s+/g, " "); // no trim(), we collapse multiple whitespaces into single, preserving prefix and suffix (if any)
}

export interface ITtsQueueItem {
    lastUtteranceRange?: Range;
    lastWordRange?: Range;
    dir: string | undefined;
    lang: string | undefined;
    parentElement: Element;
    textNodes: Node[];
    combinedText: string; // combineText(this.textNodes)
    combinedTextSentences: string[] | undefined;
    combinedTextSentencesRangeBegin: number[] | undefined;
    combinedTextSentencesRangeEnd: number[] | undefined;
    // isSkippable: boolean | undefined;
}

export interface ITtsQueueItemReference {
    item: ITtsQueueItem;
    iArray: number; // ITtsQueueItem[]
    iSentence: number; // ITtsQueueItem.combinedTextSentences
    iGlobal: number; // ITtsQueueItem[] and ITtsQueueItem.combinedTextSentences
}

export function consoleLogTtsQueueItem(i: ITtsQueueItem) {
    console.log("<<----");
    console.log(i.dir);
    console.log(i.lang);
    const cssSelector = uniqueCssSelector(i.parentElement, i.parentElement.ownerDocument as Document, {
        // allow long CSS selectors with many steps, deep DOM element paths => minimise runtime querySelectorAll() calls to verify unicity in optimize() function (sacrifice memory footprint in locators for runtime efficiency and human readbility / debugging, better than CFI)
        // seedMinLength: 1000,
        // optimizedMinLength: 1001,
    });
    console.log(cssSelector);
    console.log(i.parentElement.tagName);
    console.log(i.combinedText);
    if (i.combinedTextSentences) {
        console.log(".......");
        for (const j of i.combinedTextSentences) {
            console.log(j);
        }
        console.log(".......");
    }
    console.log("---->>");
}
export function consoleLogTtsQueue(f: ITtsQueueItem[]) {
    for (const i of f) {
        consoleLogTtsQueueItem(i);
    }
}

export function getTtsQueueLength(items: ITtsQueueItem[]) {
    let l = 0;
    for (const it of items) {
        if (it.combinedTextSentences) {
            l += it.combinedTextSentences.length;
        } else {
            l++;
        }
    }
    return l;
}

export function getTtsQueueItemRefText(obj: ITtsQueueItemReference): string {
    if (obj.iSentence === -1) {
        return obj.item.combinedText;
    }
    if (obj.item.combinedTextSentences) {
        return obj.item.combinedTextSentences[obj.iSentence];
    }
    return "";
}

export function getTtsQueueItemRef(items: ITtsQueueItem[], index: number): ITtsQueueItemReference | undefined {
    let i = -1;
    let k = -1;
    for (const it of items) {
        k++;
        if (it.combinedTextSentences) {
            let j = -1;
            for (const _sent of it.combinedTextSentences) {
                j++;
                i++;
                if (index === i) {
                    return { item: it, iArray: k, iGlobal: i, iSentence: j };
                }
            }
        } else {
            i++;
            if (index === i) {
                return { item: it, iArray: k, iGlobal: i, iSentence: -1 };
            }
        }
    }
    return undefined;
}

export function findTtsQueueItemIndex(
    ttsQueue: ITtsQueueItem[],
    element: Element,
    startTextNode: Node | undefined,
    startTextNodeOffset: number,
    rootElem: Element): number {

    let i = 0;
    for (const ttsQueueItem of ttsQueue) {
        if (startTextNode) {
            if (ttsQueueItem.textNodes?.includes(startTextNode)) { // NOTE SECOND PASS!
                if (ttsQueueItem.combinedTextSentences &&
                    ttsQueueItem.combinedTextSentencesRangeBegin &&
                    ttsQueueItem.combinedTextSentencesRangeEnd) {
                    let offset = 0;
                    for (const txtNode of ttsQueueItem.textNodes) {
                        if (!txtNode.nodeValue && txtNode.nodeValue !== "") {
                            continue;
                        }
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        if ((txtNode as any).__RUBY) {
                            continue;
                        }
                        if (txtNode === startTextNode) {
                            offset += startTextNodeOffset;
                            break;
                        }
                        offset += txtNode.nodeValue.length;
                    }
                    let j = i - 1;
                    // let iSent = -1;
                    for (const end of ttsQueueItem.combinedTextSentencesRangeEnd) {
                        // iSent++;
                        j++;
                        if (end < offset) {
                            continue;
                        }
                        return j;
                    }
                    return i;
                } else { // ttsQueueItem.combinedText
                    return i;
                }
            }
        } else if ( // (!startTextNode || !ttsQueueItem.textNodes?.length) && // NOTE SECOND PASS!
            (
            element === ttsQueueItem.parentElement
            ||
            (ttsQueueItem.parentElement !== (element.ownerDocument as Document).body &&
                ttsQueueItem.parentElement !== rootElem &&
                ttsQueueItem.parentElement.contains(element))
            ||
            element.contains(ttsQueueItem.parentElement))
            ) {

            return i;
        }
        if (ttsQueueItem.combinedTextSentences) {
            i += ttsQueueItem.combinedTextSentences.length;
        } else { // ttsQueueItem.combinedText
            i++;
        }
    }

    // SECOND PASS, e.g. text nodes descendants of MathML
    i = 0;
    for (const ttsQueueItem of ttsQueue) {
        if (startTextNode && ttsQueueItem.textNodes?.includes(startTextNode)) { // DIFF SECOND PASS!
            if (ttsQueueItem.combinedTextSentences &&
                ttsQueueItem.combinedTextSentencesRangeBegin &&
                ttsQueueItem.combinedTextSentencesRangeEnd) {
                let offset = 0;
                for (const txtNode of ttsQueueItem.textNodes) {
                    if (!txtNode.nodeValue && txtNode.nodeValue !== "") {
                        continue;
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if ((txtNode as any).__RUBY) {
                        continue;
                    }
                    if (txtNode === startTextNode) {
                        offset += startTextNodeOffset;
                        break;
                    }
                    offset += txtNode.nodeValue.length;
                }
                let j = i - 1;
                // let iSent = -1;
                for (const end of ttsQueueItem.combinedTextSentencesRangeEnd) {
                    // iSent++;
                    j++;
                    if (end < offset) {
                        continue;
                    }
                    return j;
                }
                return i;
            } else { // ttsQueueItem.combinedText
                return i;
            }
        } else if ((!startTextNode || !ttsQueueItem.textNodes?.length) && // DIFF SECOND PASS!
            (
            element === ttsQueueItem.parentElement
            ||
            (ttsQueueItem.parentElement !== (element.ownerDocument as Document).body &&
                ttsQueueItem.parentElement !== rootElem &&
                ttsQueueItem.parentElement.contains(element))
            ||
            element.contains(ttsQueueItem.parentElement))
            ) {

            return i;
        }
        if (ttsQueueItem.combinedTextSentences) {
            i += ttsQueueItem.combinedTextSentences.length;
        } else { // ttsQueueItem.combinedText
            i++;
        }
    }

    return -1;
}

// tslint:disable-next-line:max-line-length
const _putInElementStackTagNames = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "th", "td", "caption", "li", "blockquote", "q", "dt", "dd", "figcaption", "div", "pre"];
// tslint:disable-next-line:max-line-length
const _doNotProcessDeepChildTagNames = ["svg", "img", "sup", "sub", "audio", "video", "source", "button", "canvas", "del", "dialog", "embed", "form", "head", "iframe", "meter", "noscript", "object", "s", "script", "select", "style", "textarea"]; // "code", "nav", "dl", "figure", "table", "ul", "ol"

// https://www.w3.org/TR/epub-33/#sec-behaviors-skip-escape
// https://www.w3.org/TR/epub-ssv-11/
const _skippables = [
    "footnote",
    "endnote",
    "pagebreak",
    //
    "note",
    "rearnote",
    "sidebar",
    "marginalia",
    "annotation",
    // "practice",
    // "help",
];
// TODO: invisible page breaks but labeled (aria-label, title, etc.) can occur mid-sentence as span/etc. elements without descendant text content or with display:none (edge case or common practice?),
// so ideally we should ignore the fragment and merge together the adjacent text(s) to form the utterance ...
// but this is technically challenging in this algorithm (previous/next may have different language, etc.),

export const computeEpubTypes = (childElement: Element) => {

    let epubType = childElement.getAttribute("epub:type");
    if (!epubType) {
        epubType = childElement.getAttributeNS("http://www.idpf.org/2007/ops", "type");
        if (!epubType) { // TODO merge epub:type and role instead of fallback?
            epubType = childElement.getAttribute("role");
            if (epubType) {
                epubType = epubType.replace(/doc-/g, "");
            }
        }
    }
    if (epubType) {
        epubType = epubType.replace(/\s\s+/g, " ").trim();
        if (epubType.length === 0) {
            epubType = null;
        }
    }
    const epubTypes = epubType ? epubType.split(" ") : [];
    return epubTypes;
};

export function generateTtsQueue(rootElement: Element, splitSentences: boolean): ITtsQueueItem[] {

    let ttsQueue: ITtsQueueItem[] = [];
    const elementStack: Element[] = [];

    function processTextNode(textNode: Node) {

        if (textNode.nodeType !== Node.TEXT_NODE) {
            return;
        }
        // test for word regexp?  || !/\w/.test(textNode.nodeValue)
        if (!textNode.nodeValue) {
            return;
        }

        // we need significant spaces between <span> etc.
        // if (!textNode.nodeValue.trim().length) {
        //     return;
        // }

        const parentElement = elementStack[elementStack.length - 1];
        if (!parentElement) {
            return;
        }

        const documant = (textNode.parentElement || parentElement).ownerDocument as Document;

        // const lowerTagName = (textNode.parentElement || parentElement).tagName?.toLowerCase();
        const lowerTagName = textNode.parentElement?.tagName?.toLowerCase();

        // <ruby> children are rb or pure kanji TEXT_NODE, then rp and rt siblings
        if (documant.documentElement.classList.contains(ROOT_CLASS_NO_RUBY)) {
            if (lowerTagName === "rp" || lowerTagName === "rt") {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((lowerTagName === "ruby" || lowerTagName === "rb") && (textNode as any).__RUBY) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (textNode as any).__RUBY = false;
            }
        } else {
            if (lowerTagName === "ruby" || lowerTagName === "rb") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (textNode as any).__RUBY = true;
                // return;
            }
        }

        let current = ttsQueue[ttsQueue.length - 1];

        // note that isSkippable===true never reaches into a ttsQueueItem because we eject at compilation time instead of runtime / playback:
        // if (win.READIUM2.ttsSkippabilityEnabled && current && current.isSkippable) {
        //     return;
        // }

        const lang = textNode.parentElement ? getLanguage(textNode.parentElement) : undefined;
        const dir = textNode.parentElement ? getDirection(textNode.parentElement) : undefined;

        if (!current || current.parentElement !== parentElement || current.lang !== lang || current.dir !== dir) {

            // note that isSkippable===true never reaches into a ttsQueueItem because we eject at compilation time instead of runtime / playback:
            if (win.READIUM2.ttsSkippabilityEnabled) {
                const epubTypes = computeEpubTypes(parentElement);
                const isSkippable = epubTypes.find((et) => _skippables.includes(et)) ? true : undefined;
                if (isSkippable) {
                    return;
                }
            }

            current = {
                combinedText: "", // filled in later (see finalizeTextNodes())
                combinedTextSentences: undefined, // filled in later, if text is further chunkable
                combinedTextSentencesRangeBegin: undefined,
                combinedTextSentencesRangeEnd: undefined,
                dir,
                lang,
                parentElement,
                textNodes: [],
                // isSkippable: undefined,
            };
            ttsQueue.push(current);
        }

        current.textNodes.push(textNode);
    }

    let first = true;
    function processElement(element: Element) {
        if (element.nodeType !== Node.ELEMENT_NODE) {
            first = false;
            return;
        }

        const documant = element.ownerDocument as Document;

        function isHidden(el: Element): boolean {

            if (el.getAttribute("id") === SKIP_LINK_ID) {
                return true;
            }
            const lower = el.tagName?.toLowerCase();

            // <ruby> children are rb or pure kanji TEXT_NODE, then rp and rt siblings
            if (documant.documentElement.classList.contains(ROOT_CLASS_NO_RUBY)) {
                if (lower === "rt" || lower === "rp") {
                    return true;
                }
                // else if (lower === "rb") {
                //     return false;
                // }
            } else {
                if (true // win.READIUM2.ttsSkippabilityEnabled
                    && (lower === "rb") // not "ruby" which contains mixed content (element children, maybe "rb", definitely "rp" or "rt")
                ) {
                    // SEE: (textNode as any).__RUBY
                    // return true;
                }
            }

            let curEl = el;
            do {
                if (curEl.nodeType === Node.ELEMENT_NODE &&
                    curEl.tagName?.toLowerCase() === "details" &&

                    // curEl.getAttribute("open")
                    //  === "open" or  === "true" ... it's in fact a "boolean attr"
                    // (much like 'hidden' below),
                    // so only its non-existence means "not open"
                    !(curEl as HTMLDetailsElement).open) {
                    return true;
                }
            } while (curEl.parentNode && curEl.parentNode.nodeType === Node.ELEMENT_NODE &&
                (curEl = curEl.parentNode as Element));

            const elStyle = win.getComputedStyle(el);
            if (elStyle) {
                const display = elStyle.getPropertyValue("display");
                if (display === "none") {
                    return true;
                } else {
                    const opacity = elStyle.getPropertyValue("opacity");
                    if (opacity === "0") {
                        return true;
                    }
                }

                // Cannot be relied upon, because web browser engine reports
                // invisible when out of view in scrolled columns!!
                // const visibility = elStyle.getPropertyValue("visibility");
                // if (visibility === "hidden") {
                //     return true;
                // }
            }

            //  === "hidden" or  === "true" ... it's a "boolean attr"
            // (much like details.open above),
            // so only its non-existence means "not hidden"
            if (el.getAttribute("hidden") ||
                el.getAttribute("aria-hidden") === "true") {
                return true;
            }

            return false;
        }

        const hidden = isHidden(element);
        if (hidden) {
            first = false;
            return;
        }

        // note that isSkippable===true never reaches into a ttsQueueItem because we eject at compilation time instead of runtime / playback:
        if (win.READIUM2.ttsSkippabilityEnabled) {
            const epubTypes = computeEpubTypes(element);
            const isSkippable = epubTypes.find((et) => _skippables.includes(et)) ? true : undefined;
            if (isSkippable) {
                first = false;
                return;
            }
        }

        const tagNameLow = element.tagName ? element.tagName.toLowerCase() : undefined;

        const putInElementStack = first ||
            tagNameLow && _putInElementStackTagNames.includes(tagNameLow)
            // tslint:disable-next-line:max-line-length
            // element.matches("h1, h2, h3, h4, h5, h6, p, th, td, caption, li, blockquote, q, dt, dd, figcaption, div, pre")
            ;

        first = false;

        if (putInElementStack) {
            elementStack.push(element);
        }

        for (const childNode of element.childNodes) {
            switch (childNode.nodeType) {
                case Node.ELEMENT_NODE:
                    const childElement = childNode as Element;
                    const childTagNameLow = childElement.tagName ? childElement.tagName.toLowerCase() : undefined;

                    const hidden = isHidden(childElement);

                    const epubTypes = computeEpubTypes(childElement);
                    const isSkippable = epubTypes.find((et) => _skippables.includes(et)) ? true : undefined;

                    // note that isSkippable===true never reaches into a ttsQueueItem because we eject at compilation time instead of runtime / playback:
                    if (win.READIUM2.ttsSkippabilityEnabled && isSkippable) {
                        continue; // next child node
                    }

                    // const isPageBreak = epubType ? epubType.indexOf("pagebreak") >= 0 : false; // this includes doc-*
                    const isPageBreak = epubTypes.find((et) => et === "pagebreak") ? true : false;

                    let pageBreakNeedsDeepDive = isPageBreak && !hidden;
                    if (pageBreakNeedsDeepDive) {
                        let altAttr = childElement.getAttribute("title");
                        if (altAttr) {
                            const txt = altAttr.trim();
                            if (txt) {
                                pageBreakNeedsDeepDive = false;
                                const lang = getLanguage(childElement);
                                const dir: string | undefined = undefined;
                                ttsQueue.push({
                                    combinedText: txt,
                                    combinedTextSentences: undefined,
                                    combinedTextSentencesRangeBegin: undefined,
                                    combinedTextSentencesRangeEnd: undefined,
                                    dir,
                                    lang,
                                    parentElement: childElement,
                                    textNodes: [],
                                    // isSkippable,
                                });
                            }
                        } else {
                            altAttr = childElement.getAttribute("aria-label");
                            if (altAttr) {
                                const txt = altAttr.trim();
                                if (txt) {
                                    pageBreakNeedsDeepDive = false;
                                    const lang = getLanguage(childElement);
                                    const dir: string | undefined = undefined;
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir,
                                        lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                        // isSkippable,
                                    });
                                }
                            }
                        }
                    }

                    const isLink = childTagNameLow === "a" && (childElement as HTMLLinkElement).href; // excludes anchors
                    let linkNeedsDeepDive = isLink && !hidden;
                    if (linkNeedsDeepDive) {
                        let altAttr = childElement.getAttribute("title");
                        if (altAttr) {
                            const txt = altAttr.trim();
                            if (txt) {
                                linkNeedsDeepDive = false;
                                const lang = getLanguage(childElement);
                                const dir: string | undefined = undefined;
                                ttsQueue.push({
                                    combinedText: txt,
                                    combinedTextSentences: undefined,
                                    combinedTextSentencesRangeBegin: undefined,
                                    combinedTextSentencesRangeEnd: undefined,
                                    dir,
                                    lang,
                                    parentElement: childElement,
                                    textNodes: [],
                                    // isSkippable,
                                });
                            }
                        } else {
                            altAttr = childElement.getAttribute("aria-label");
                            if (altAttr) {
                                const txt = altAttr.trim();
                                if (txt) {
                                    linkNeedsDeepDive = false;
                                    const lang = getLanguage(childElement);
                                    const dir: string | undefined = undefined;
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir,
                                        lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                        // isSkippable,
                                    });
                                }
                            }
                        }
                    }

                    const isMathJax = childTagNameLow && childTagNameLow.startsWith("mjx-");
                    const isMathML = childTagNameLow === "math";
                    const processDeepChild =
                        pageBreakNeedsDeepDive ||
                        linkNeedsDeepDive ||
                        (
                        !isPageBreak &&
                        !isLink &&
                        !isMathJax &&
                        !isMathML &&
                        childTagNameLow && !_doNotProcessDeepChildTagNames.includes(childTagNameLow)
                        // tslint:disable-next-line:max-line-length
                        // !childElement.matches("svg, img, sup, sub, audio, video, source, button, canvas, del, dialog, embed, form, head, iframe, meter, noscript, object, s, script, select, style, textarea")
                        // code, nav, dl, figure, table, ul, ol
                        )
                    ;

                    if (processDeepChild) {
                        processElement(childElement);
                    } else if (!hidden) {
                        if (isPageBreak || isLink) {
                            // do nothing, already dealt with above (either shallow or deep)
                        } else if (isMathML) {
                            const altAttr = childElement.getAttribute("alttext");
                            if (altAttr) {
                                const txt = altAttr.trim();
                                if (txt) {
                                    const lang = getLanguage(childElement);
                                    const dir: string | undefined = undefined;
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir,
                                        lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                        // isSkippable,
                                    });
                                }
                            } else {
                                const txt = childElement.textContent?.trim();
                                if (txt) {
                                    const lang = getLanguage(childElement);
                                    const dir = getDirection(childElement);
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir,
                                        lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                        // isSkippable,
                                    });
                                }
                            }
                        } else if (isMathJax) {
                            if (childTagNameLow === "mjx-container") {

                                let mathJaxEl: Element | undefined;
                                let mathJaxElMathML: Element | undefined;
                                const mathJaxContainerChildren = Array.from(childElement.children);
                                for (const mathJaxContainerChild of mathJaxContainerChildren) {
                                    if (mathJaxContainerChild.tagName?.toLowerCase() === "mjx-math") {
                                        mathJaxEl = mathJaxContainerChild;
                                    } else if (mathJaxContainerChild.tagName?.toLowerCase() === "mjx-assistive-mml") {
                                        const mathJaxAMMLChildren = Array.from(mathJaxContainerChild.children);
                                        for (const mathJaxAMMLChild of mathJaxAMMLChildren) {
                                            if (mathJaxAMMLChild.tagName?.toLowerCase() === "math") {
                                                mathJaxElMathML = mathJaxAMMLChild;
                                                break;
                                            }
                                        }
                                    }
                                }

                                const altAttr = childElement.getAttribute("aria-label");
                                if (altAttr) {
                                    const txt = altAttr.trim();
                                    if (txt) {
                                        const lang = getLanguage(childElement);
                                        const dir: string | undefined = undefined;
                                        ttsQueue.push({
                                            combinedText: txt,
                                            combinedTextSentences: undefined,
                                            combinedTextSentencesRangeBegin: undefined,
                                            combinedTextSentencesRangeEnd: undefined,
                                            dir,
                                            lang,
                                            parentElement: mathJaxEl ?? childElement,
                                            textNodes: [],
                                            // isSkippable,
                                        });
                                    }
                                } else if (mathJaxElMathML) {
                                    const altAttr = mathJaxElMathML.getAttribute("alttext");
                                    if (altAttr) {
                                        const txt = altAttr.trim();
                                        if (txt) {
                                            const lang = getLanguage(mathJaxElMathML);
                                            const dir: string | undefined = undefined;
                                            ttsQueue.push({
                                                combinedText: txt,
                                                combinedTextSentences: undefined,
                                                combinedTextSentencesRangeBegin: undefined,
                                                combinedTextSentencesRangeEnd: undefined,
                                                dir,
                                                lang,
                                                parentElement: mathJaxEl ?? childElement,
                                                textNodes: [],
                                                // isSkippable,
                                            });
                                        }
                                    } else {
                                        const txt = mathJaxElMathML.textContent?.trim();
                                        if (txt) {
                                            const lang = getLanguage(mathJaxElMathML);
                                            const dir = getDirection(mathJaxElMathML);
                                            ttsQueue.push({
                                                combinedText: txt,
                                                combinedTextSentences: undefined,
                                                combinedTextSentencesRangeBegin: undefined,
                                                combinedTextSentencesRangeEnd: undefined,
                                                dir,
                                                lang,
                                                parentElement: mathJaxEl ?? childElement,
                                                textNodes: [],
                                                // isSkippable,
                                            });
                                        }
                                    }
                                    break;
                                }
                            }
                        } else if (childTagNameLow === "img" &&
                            (childElement as HTMLImageElement).src) {
                            let altAttr = childElement.getAttribute("alt");
                            if (altAttr) {
                                const txt = altAttr.trim();
                                if (txt) {
                                    const lang = getLanguage(childElement);
                                    const dir: string | undefined = undefined;
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir,
                                        lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                        // isSkippable,
                                    });
                                }
                            } else {
                                altAttr = childElement.getAttribute("aria-label");
                                if (altAttr) {
                                    const txt = altAttr.trim();
                                    if (txt) {
                                        const lang = getLanguage(childElement);
                                        const dir: string | undefined = undefined;
                                        ttsQueue.push({
                                            combinedText: txt,
                                            combinedTextSentences: undefined,
                                            combinedTextSentencesRangeBegin: undefined,
                                            combinedTextSentencesRangeEnd: undefined,
                                            dir,
                                            lang,
                                            parentElement: childElement,
                                            textNodes: [],
                                            // isSkippable,
                                        });
                                    }
                                }
                            }
                        } else if (childTagNameLow === "svg") {
                            let done = false;
                            const altAttr = childElement.getAttribute("aria-label");
                            if (altAttr) {
                                const txt = altAttr.trim();
                                if (txt) {
                                    done = true;
                                    const lang = getLanguage(childElement);
                                    const dir: string | undefined = undefined;
                                    ttsQueue.push({
                                        combinedText: txt,
                                        combinedTextSentences: undefined,
                                        combinedTextSentencesRangeBegin: undefined,
                                        combinedTextSentencesRangeEnd: undefined,
                                        dir,
                                        lang,
                                        parentElement: childElement,
                                        textNodes: [],
                                        // isSkippable,
                                    });
                                }
                            } else {
                                const svgChildren = Array.from(childElement.children);
                                for (const svgChild of svgChildren) {
                                    if (svgChild.tagName?.toLowerCase() === "title") {
                                        const txt = svgChild.textContent?.trim();
                                        if (txt) {
                                            done = true;
                                            const lang = getLanguage(svgChild);
                                            const dir = getDirection(svgChild);
                                            ttsQueue.push({
                                                combinedText: txt,
                                                combinedTextSentences: undefined,
                                                combinedTextSentencesRangeBegin: undefined,
                                                combinedTextSentencesRangeEnd: undefined,
                                                dir,
                                                lang,
                                                parentElement: childElement,
                                                textNodes: [],
                                                // isSkippable,
                                            });
                                        }
                                        break;
                                    }
                                }
                            }

                            if (!done) {
                                // this causes an infinite loop / GUI lockup with some SVG, not sure why!?
                                // const parentElement = elementStack[elementStack.length - 1];
                                // if (parentElement !== childElement) {
                                //     // putInElementStack = true;
                                //     elementStack.push(childElement);
                                // }

                                const iter = win.document.createNodeIterator(
                                    childElement, // win.document.body
                                    NodeFilter.SHOW_ELEMENT,
                                    {
                                        // tspan breaks words / sentences
                                        acceptNode: (node) => {
                                            const low = node.nodeName.toLowerCase();
                                            return low === "text"
                                            || low === "math" // inside foreignObject
                                            ?
                                            NodeFilter.FILTER_ACCEPT
                                            :
                                            NodeFilter.FILTER_REJECT;
                                        },
                                    },
                                );
                                let n: Node | null;
                                while (n = iter.nextNode()) {
                                    const el = n as Element;

                                    const parentElement = elementStack[elementStack.length - 1];
                                    if (parentElement !== el) {
                                        // putInElementStack = true;
                                        elementStack.push(el);
                                    }

                                    try {
                                        processElement(el);
                                    } catch (err) {
                                        console.log("SVG TTS error: ", err);
                                        const txt = el.textContent?.trim();
                                        if (txt) {
                                            const lang = getLanguage(el);
                                            const dir = getDirection(el);
                                            ttsQueue.push({
                                                combinedText: txt,
                                                combinedTextSentences: undefined,
                                                combinedTextSentencesRangeBegin: undefined,
                                                combinedTextSentencesRangeEnd: undefined,
                                                dir,
                                                lang,
                                                parentElement: el,
                                                textNodes: [],
                                                // isSkippable,
                                            });
                                        }
                                    }

                                    elementStack.pop();
                                }

                                // elementStack.pop();
                            }
                        }
                    }
                    break;
                case Node.TEXT_NODE:
                    if (elementStack.length !== 0) {
                        processTextNode(childNode);
                    }
                    break;
                default:
                    break;
            }
        }

        if (putInElementStack) {
            elementStack.pop();
        }
    }

    processElement(rootElement);

    // post-processTextNode()
    function finalizeTextNodes(ttsQueueItem: ITtsQueueItem) {
        if (!ttsQueueItem.textNodes || !ttsQueueItem.textNodes.length) {
            // img@alt can set combinedText (no text nodes)
            if (!ttsQueueItem.combinedText || !ttsQueueItem.combinedText.length) {
                ttsQueueItem.combinedText = "";
            }
            ttsQueueItem.combinedTextSentences = undefined;
            return;
        }

        ttsQueueItem.combinedText = combineTextNodes(ttsQueueItem.textNodes, true).replace(/[\r\n]/g, " ");
        // normalizeText ===
        // normalizeHtmlText(str).replace(/[\r\n]/g, " ").replace(/\s\s+/g, " "); // no trim(), we collapse

        // will be ejected with .filter()
        if (!ttsQueueItem.combinedText.trim().length) {
            ttsQueueItem.combinedText = "";
            ttsQueueItem.combinedTextSentences = undefined;
            return;
        }

        // console.log("--TTS ttsQueueItem.combinedText: [" + ttsQueueItem.combinedText + "]");

        // ttsQueueItem.combinedText = ttsQueueItem.combinedTextSentences ?
        //     combineTextNodes(ttsQueueItem.textNodes, false).trim() :
        //     combineTextNodes(ttsQueueItem.textNodes, true);
        let skipSplitSentences = false;
        let parent: Element | null = ttsQueueItem.parentElement;
        while (parent) {
            if (parent.tagName) {
                const tag = parent.tagName.toLowerCase();
                if (tag === "pre" || tag === "code" ||
                    tag === "video" || tag === "audio" ||
                    tag === "img" || tag === "svg" ||
                    tag === "math" || tag.startsWith("mjx-")) {
                    skipSplitSentences = true;
                    break;
                }
            }
            parent = parent.parentElement;
        }
        if (splitSentences && !skipSplitSentences) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                // (textNode as any).__RUBY
                const txt = ttsQueueItem.combinedText; // no further transforms?
                ttsQueueItem.combinedTextSentences = undefined;
                // console.log("---- combinedText", txt);
                const sentences = split(txt);
                ttsQueueItem.combinedTextSentences = [];
                ttsQueueItem.combinedTextSentencesRangeBegin = [];
                ttsQueueItem.combinedTextSentencesRangeEnd = [];
                for (const sentence of sentences) {
                    if (sentence.type === "Sentence") {
                        // console.log(sentence.raw, JSON.stringify(sentence.range, null, 2));

                        ttsQueueItem.combinedTextSentences.push(sentence.raw);
                        ttsQueueItem.combinedTextSentencesRangeBegin.push(sentence.range[0]);
                        ttsQueueItem.combinedTextSentencesRangeEnd.push(sentence.range[1]);
                    }
                    // else {
                    //     console.log(sentence.type);
                    // }
                }
                if (ttsQueueItem.combinedTextSentences.length === 0 ||
                    ttsQueueItem.combinedTextSentences.length === 1) {
                    ttsQueueItem.combinedTextSentences = undefined;
                } else {
                    // let total = 0;
                    // ttsQueueItem.combinedTextSentences.forEach((sent) => {
                    //     total += sent.length;
                    // });
                    // const expectedWhiteSpacesSeparators = ttsQueueItem.combinedTextSentences.length - 1;
                    // if (total !== ttsQueueItem.combinedText.length &&
                    //     ((ttsQueueItem.combinedText.length - total) !== expectedWhiteSpacesSeparators)) {
                    //     console.log("sentences total !== item.combinedText.length");
                    //     console.log(total + " !== " + ttsQueueItem.combinedText.length);
                    //     consoleLogTtsQueueItem(ttsQueueItem);
                    //     console.log(JSON.stringify(sentences, null, 4));
                    // }
                }
            } catch (err) {
                console.log(err);
                ttsQueueItem.combinedTextSentences = undefined;
            }
        } else {
            ttsQueueItem.combinedTextSentences = undefined;
        }
    }

    for (const ttsQueueItem of ttsQueue) {
        finalizeTextNodes(ttsQueueItem);
    }

    ttsQueue = ttsQueue.filter((item) => {
        return !!item.combinedText.length;
    });

    // console.log("#### ttsQueue");
    // consoleLogTtsQueue(ttsQueue);
    return ttsQueue;
}
