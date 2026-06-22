// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debounce from "debounce";
import { ipcRenderer } from "electron";

import {
    R2_EVENT_TTS_DOC_END, R2_EVENT_TTS_DOC_BACK, R2_EVENT_TTS_IS_PAUSED, R2_EVENT_TTS_IS_PLAYING, R2_EVENT_TTS_IS_STOPPED,
} from "../../common/events";
import {
    HighlightDrawTypeBackground, HighlightDrawTypeOpacityMask, HighlightDrawTypeOpacityMaskRuler, HighlightDrawTypeUnderline, IColor, IHighlight,
    IHighlightDefinition, HighlightDrawTypeNONE,
} from "../../common/highlight";
import {
    CSS_CLASS_NO_FOCUS_OUTLINE, POPUP_DIALOG_CLASS, POPUP_DIALOG_CLASS_COLLAPSE, ROOT_CLASS_REDUCE_MOTION,
    TTS_CLASS_IS_ACTIVE, TTS_CLASS_PAUSED, TTS_CLASS_PLAYING, TTS_CLASS_STOPPED, TTS_CLASS_THEME1, TTS_CLASS_UTTERANCE, TTS_CLASS_UTTERANCE_HEADING1,
    TTS_CLASS_UTTERANCE_HEADING2, TTS_CLASS_UTTERANCE_HEADING3, TTS_CLASS_UTTERANCE_HEADING4,
    TTS_CLASS_UTTERANCE_HEADING5, TTS_ID_ACTIVE_UTTERANCE, TTS_ID_ACTIVE_WORD, TTS_ID_CONTAINER,
    TTS_ID_NEXT, TTS_ID_PREVIOUS, TTS_ID_SLIDER, TTS_ID_SPEAKING_DOC_ELEMENT, TTS_NAV_BUTTON_CLASS,
    TTS_POPUP_DIALOG_CLASS,
} from "../../common/styles";
import { IPropertyAnimationState, animateProperty } from "../common/animateProperty";

import {
    ITtsQueueItem, ITtsQueueItemReference, computeEpubTypes, findTtsQueueItemIndex, generateTtsQueue,
    getTtsQueueItemRef, getTtsQueueItemRefText, getTtsQueueLength, normalizeHtmlText,
} from "../common/dom-text-utils";
import { easings } from "../common/easings";
import { IHTMLDialogElementWithPopup, PopupDialog, isPopupDialogOpen } from "../common/popup-dialog";
import { createHighlights, destroyHighlight, ENABLE_CSS_HIGHLIGHTS, HIGHLIGHT_GROUP_TTS } from "./highlight";
import { isRTL, clearImageZoomOutlineDebounced } from "./readium-css";

import { ReadiumElectronWebviewWindow } from "./state";

// import { uniqueCssSelector } from "../common/cssselector2-3";
// import { convertRange } from "./selection";

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

const win = global.window as ReadiumElectronWebviewWindow;

interface IHTMLDialogElementWithTTSState extends IHTMLDialogElementWithPopup {

    domSlider: HTMLInputElement | undefined;
    domNext: HTMLButtonElement | undefined;
    domPrevious: HTMLButtonElement | undefined;
    domText: HTMLDivElement | undefined;

    ttsUtterance: SpeechSynthesisUtterance | undefined;
    ttsQueue: ITtsQueueItem[] | undefined;
    ttsQueueLength: number; // index by ITtsQueueItemReference.iGlobal
    ttsQueueItem: ITtsQueueItemReference | undefined;

    ttsRootElement: Element | undefined;

    ttsOverlayEnabled: boolean;

    focusScrollRaw:
    ((el: HTMLOrSVGElement, doFocus: boolean, animate: boolean, domRect: DOMRect | undefined, center?: boolean) => void) | undefined;

    ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable: (() => number) | undefined;
    ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable: ((val: number) => void) | undefined;
}

let _dialogState: IHTMLDialogElementWithTTSState | undefined;

function resetState(stop: boolean) {
    if (stop) {
        _resumableState = undefined;
    }

    if (_dialogState) {
        if (_dialogState.hasAttribute("open") || _dialogState.open) {
            console.log("...DIALOG close() from TTS resetState()");
            // _dialogState.popDialog?.dialog.close();
            _dialogState.close();
        }

        _dialogState.popDialog = undefined;
        _dialogState.focusScrollRaw = undefined;
        _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable = undefined;
        _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable = undefined;

        _dialogState.ttsRootElement = undefined;
        _dialogState.ttsQueue = undefined;
        _dialogState.ttsQueueLength = -1;
        _dialogState.ttsUtterance = undefined;
        _dialogState.ttsQueueItem = undefined;

        _dialogState.domSlider = undefined;
        _dialogState.domNext = undefined;
        _dialogState.domPrevious = undefined;
        _dialogState.domText = undefined;

        _dialogState.ttsOverlayEnabled = win.READIUM2.ttsOverlayEnabled;

        _dialogState.remove();
    }
    _dialogState = undefined;

    win.document.documentElement.classList.remove(TTS_CLASS_IS_ACTIVE);
    if (stop || !_resumableState) {
        ipcRenderer.sendToHost(R2_EVENT_TTS_IS_STOPPED);
        win.READIUM2.ttsClickEnabled = false;
        win.document.documentElement.classList.remove(TTS_CLASS_PLAYING, TTS_CLASS_PAUSED);
        win.document.documentElement.classList.add(TTS_CLASS_STOPPED);
    } else {
        win.READIUM2.ttsClickEnabled = true;
        win.document.documentElement.classList.remove(TTS_CLASS_PLAYING, TTS_CLASS_STOPPED);
        win.document.documentElement.classList.add(TTS_CLASS_PAUSED);
    }
    clearImageZoomOutlineDebounced();
}

function documentForward(node: Node): Node | null {
    if (node.firstChild) {
        return node.firstChild;
    }

    let n: Node | null = node;
    while (!n.nextSibling) {
        n = n.parentNode;
        if (!n) {
            return null;
        }
    }
    return n.nextSibling;
}

export function ttsPlay(
    speed: number,
    voices: SpeechSynthesisVoice[] | null,
    focusScrollRaw:
        (el: HTMLOrSVGElement, doFocus: boolean, animate: boolean, domRect: DOMRect | undefined) => void,
    rootElem: Element | undefined,
    startElem: Element | undefined,
    startTextNode: Node | undefined,
    startTextNodeOffset: number,
    ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable: () => number,
    ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable: (val: number) => void,
) {
    ttsStop();

    let rootEl = rootElem;

    if (!rootEl) {
        rootEl = win.document.body;
    }

    const splitSentences = win.READIUM2.ttsSentenceDetectionEnabled;
    const ttsQueue = generateTtsQueue(rootEl, splitSentences);
    if (!ttsQueue.length) {
        return;
    }

    let ttsQueueIndex = -1;
    if (startElem) {
        let idx = findTtsQueueItemIndex(ttsQueue, startElem, startTextNode, startTextNodeOffset, rootEl);
        if (idx >= 0) {
            ttsQueueIndex = idx;
        } else {
            let nextEl: Node | null = startElem;
            while (nextEl = documentForward(nextEl)) {
                if (nextEl.nodeType !== Node.ELEMENT_NODE) {
                    continue;
                }
                idx = findTtsQueueItemIndex(ttsQueue, nextEl as Element, undefined, 0, rootEl);
                if (idx >= 0) {
                    ttsQueueIndex = idx;
                    break;
                }
            }
        }
    }
    if (ttsQueueIndex < 0) {
        ttsQueueIndex = 0;
    }
    setTimeout(() => {
        startTTSSession(
            speed,
            voices,
            rootEl as Element,
            ttsQueue,
            ttsQueueIndex,
            focusScrollRaw,
            ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
            ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
    }, 100);
}

export function ttsStop() {
    // if (_dialogState) {
    //     if (_dialogState.hasAttribute("open") || _dialogState.open) {
    //         ttsPause(true);
    //         resetState(true);
    //         console.log("...DIALOG close() from TTS ttsStop()");
    //         _dialogState.close(); // => onDialogClosed()
    //         return;
    //     }
    // }
    ttsPause(true);
    resetState(true);
}

export function ttsPause(doNotReset = false) {

    highlights(false);

    // can actually be in paused state!
    if (win.speechSynthesis.speaking) {
        // if (win.speechSynthesis.paused) {
        //     console.log("resume");
        //     win.speechSynthesis.resume();
        // } else {
        //     console.log("pause");
        //     win.speechSynthesis.pause(); // doesn't seem to work!
        // }

        if (_dialogState && _dialogState.ttsUtterance) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (_dialogState.ttsUtterance as any).r2_cancel = true;
        }
        setTimeout(() => {
            win.speechSynthesis.cancel();
        }, 0);
    } else if (win.speechSynthesis.pending) {
        // we only queue a single utterance, so this isn't really needed.

        if (_dialogState && _dialogState.ttsUtterance) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (_dialogState.ttsUtterance as any).r2_cancel = true;
        }
        setTimeout(() => {
            win.speechSynthesis.cancel();
        }, 0);
    }

    win.document.documentElement.classList.remove(TTS_CLASS_PLAYING, TTS_CLASS_STOPPED);
    win.document.documentElement.classList.add(TTS_CLASS_PAUSED);
    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        win.document.documentElement.classList.add(TTS_CLASS_IS_ACTIVE);
    }
    ipcRenderer.sendToHost(R2_EVENT_TTS_IS_PAUSED);
    win.READIUM2.ttsClickEnabled = true;
    clearImageZoomOutlineDebounced();

    const isOpen = _dialogState?.hasAttribute("open") || _dialogState?.open;

    if (isPopupDialogOpen(win.document) && isOpen) {
        const diagEl = win.document.getElementById(POPUP_DIALOG_CLASS);
        if (diagEl) {
            const isCollapsed = diagEl.classList.contains(POPUP_DIALOG_CLASS_COLLAPSE);
            if (!isCollapsed) {
                doNotReset = true; // override
            }
        }
    }

    if (!doNotReset) {
        if (isOpen) {
            console.log("...DIALOG close() from TTS ttsPause()");
            _dialogState?.close(); // => onDialogClosed()
        }
    }
}

// interface SpeechSynthesisVoice {
//     readonly default: boolean;
//     readonly lang: string;
//     readonly localService: boolean;
//     readonly name: string;
//     readonly voiceURI: string;
// }
export function ttsVoices(voices: SpeechSynthesisVoice[] | null) {
    win.READIUM2.ttsVoices = voices;

    if (_dialogState) {
        const resumableState = _resumableState;
        ttsStop();
        // if (_dialogState.ttsUtterance) {
        //     _dialogState.ttsUtterance.voice = voice;
        // }
        // _dialogState.ttsUtterance = undefined;
        // _resumableState = {
        //     ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable:
        //         _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable,
        //     ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable:
        //         _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
        //     focusScrollRaw: _dialogState.focusScrollRaw,
        //     ttsQueue: _dialogState.ttsQueue,
        //     ttsQueueIndex: _dialogState.ttsQueueItem.iGlobal, // ttsQueueIndex
        //     ttsRootElement: _dialogState.ttsRootElement,
        // };

        setTimeout(() => {
            _resumableState = resumableState;
            ttsResume();
        }, 60);
    }
}

export function ttsPlaybackRate(speed: number) {
    win.READIUM2.ttsPlaybackRate = speed;

    if (_dialogState) {
        ttsPause(true);
        if (_dialogState?.ttsUtterance) {
            _dialogState.ttsUtterance.rate = speed;
        }
        setTimeout(() => {
            ttsResume();
        }, 60);
    }
}

interface IResumableState {
    ttsRootElement: Element;
    ttsQueue: ITtsQueueItem[];
    ttsQueueIndex: number;
    focusScrollRaw:
    ((el: HTMLOrSVGElement, doFocus: boolean, animate: boolean, domRect: DOMRect | undefined) => void);
    ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable: (() => number);
    ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable: ((val: number) => void);
}
let _resumableState: IResumableState | undefined;

export function ttsResume() {

    if (_dialogState &&
        _dialogState.ttsUtterance) {
        highlights(true);

        setTimeout(() => {
            if (_dialogState &&
                _dialogState.ttsUtterance) {

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (_dialogState.ttsUtterance as any).r2_cancel = false;
                win.speechSynthesis.speak(_dialogState.ttsUtterance);
            }
        }, 0);

        win.document.documentElement.classList.remove(TTS_CLASS_PAUSED, TTS_CLASS_STOPPED);
        win.document.documentElement.classList.add(TTS_CLASS_PLAYING);
        if (_dialogState && _dialogState.ttsOverlayEnabled) {
            win.document.documentElement.classList.add(TTS_CLASS_IS_ACTIVE);
        }
        ipcRenderer.sendToHost(R2_EVENT_TTS_IS_PLAYING);
        win.READIUM2.ttsClickEnabled = true;
        clearImageZoomOutlineDebounced();
    } else if (_resumableState) {
        resetState(false);
        setTimeout(() => {
            if (_resumableState) {
                startTTSSession(
                    win.READIUM2.ttsPlaybackRate,
                    win.READIUM2.ttsVoices,
                    _resumableState.ttsRootElement,
                    _resumableState.ttsQueue,
                    _resumableState.ttsQueueIndex,
                    _resumableState.focusScrollRaw,
                    _resumableState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
                    _resumableState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
            }
        }, 100);
    }
}

export function isTtsPlaying() {
    return isTtsActive() && !win.speechSynthesis.paused;
}

export function isTtsActive() {
    if (_dialogState && (_dialogState.hasAttribute("open") || _dialogState.open) &&
        (win.speechSynthesis.speaking || win.speechSynthesis.pending)) {
        return true;
    }
    return false;
}

export function ttsPauseOrResume() {
    if (isTtsPlaying()) {
        ttsPause();
    } else {
        ttsResume();
    }
}

export function ttsQueueSize(): number {
    if (_dialogState && _dialogState.ttsQueue) {
        getTtsQueueLength(_dialogState.ttsQueue);
    }
    return -1;
}
export function ttsQueueCurrentIndex(): number {
    if (_dialogState && _dialogState.ttsQueueItem) {
        return _dialogState.ttsQueueItem.iGlobal;
    }
    return -1;
}
export function ttsQueueCurrentText(): string | undefined {
    if (_dialogState && _dialogState.ttsQueueItem) {
        return getTtsQueueItemRefText(_dialogState.ttsQueueItem);
    }
    return undefined;
}

// https://www.w3.org/TR/epub-33/#sec-escapability
const _escapableElementNames = ["svg", "math", "table", "tr", "li", "ol", "ul"];
// https://www.w3.org/TR/epub-ssv-11/
const _escapableRoles = ["table", "table-row", "list", "list-item", "figure", "aside", "endnotes", "rearnotes", "footnotes", "marginalia", "glossary", "bibliography", "appendix" , "colophon"]; // etc... ?
const isEscapable = (element: Element) => {
    const name = element.tagName.toLowerCase();
    if (_escapableElementNames.includes(name)) {
        return true;
    }

    const epubTypes = computeEpubTypes(element);
    if (!!epubTypes.find((et) => _escapableRoles.includes(et))) {
        return true;
    }

    return false;
};

export function ttsNext(skipSentences: boolean, escape = false) {
    if (_dialogState && _dialogState.ttsQueueItem) {
        let ttsQueueIndex = _dialogState.ttsQueueItem.iGlobal + 1;

        if (escape) {
            let escapableSelfOrAncestorInitial: Element | null = null;
            let node: Element | null = _dialogState.ttsQueueItem.item.parentElement;
            while (node) {
                if (isEscapable(node)) {
                    escapableSelfOrAncestorInitial = node;
                    break;
                }
                node = node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE ? node.parentNode as Element : null;
            }
            if (escapableSelfOrAncestorInitial) {
                while (_dialogState.ttsQueue && ttsQueueIndex >= 0 && ttsQueueIndex < _dialogState.ttsQueueLength) {
                    const ttsQueueItem = getTtsQueueItemRef(_dialogState.ttsQueue, ttsQueueIndex);
                    if (!ttsQueueItem) {
                        break;
                    }

                    let escapableSelfOrAncestorLocal: Element | null = null;
                    let node: Element | null = ttsQueueItem.item.parentElement;
                    while (node) {
                        if (isEscapable(node)) {
                            escapableSelfOrAncestorLocal = node;
                            break;
                        }
                        node = node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE ? node.parentNode as Element : null;
                    }

                    if (escapableSelfOrAncestorLocal === escapableSelfOrAncestorInitial) {
                        ttsQueueIndex = ttsQueueItem.iGlobal + 1;
                        continue;
                    }

                    break;
                }
            }
        } else if (skipSentences &&
            _dialogState.ttsQueueItem.iSentence !== -1 &&
            _dialogState.ttsQueueItem.item.combinedTextSentences) {
                ttsQueueIndex = _dialogState.ttsQueueItem.iGlobal +
                (_dialogState.ttsQueueItem.item.combinedTextSentences.length -
                    _dialogState.ttsQueueItem.iSentence);
        }
        if (ttsQueueIndex >= _dialogState.ttsQueueLength || ttsQueueIndex < 0) {
            ttsStop();
            flushDestroy();

            setTimeout(() => {
                ipcRenderer.sendToHost(R2_EVENT_TTS_DOC_END);
                // const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
                //     direction: "LTR",
                //     go: "NEXT",
                // };
                // ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
            }, 400);
            return;
        }
        ttsPause(true);
        ttsPlayQueueIndexDebounced(ttsQueueIndex);
    } else if (_resumableState) {
        ttsResume();
    }
}
export function ttsPrevious(skipSentences: boolean, escape = false) {
    if (_dialogState && _dialogState.ttsQueueItem) {
        let ttsQueueIndex = _dialogState.ttsQueueItem.iGlobal - 1;

        if (escape) {
            let escapableSelfOrAncestorInitial: Element | null = null;
            let node: Element | null = _dialogState.ttsQueueItem.item.parentElement;
            while (node) {
                if (isEscapable(node)) {
                    escapableSelfOrAncestorInitial = node;
                    break;
                }
                node = node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE ? node.parentNode as Element : null;
            }
            if (escapableSelfOrAncestorInitial) {
                while (_dialogState.ttsQueue && ttsQueueIndex >= 0 && ttsQueueIndex < _dialogState.ttsQueueLength) {
                    const ttsQueueItem = getTtsQueueItemRef(_dialogState.ttsQueue, ttsQueueIndex);
                    if (!ttsQueueItem) {
                        break;
                    }

                    let escapableSelfOrAncestorLocal: Element | null = null;
                    let node: Element | null = ttsQueueItem.item.parentElement;
                    while (node) {
                        if (isEscapable(node)) {
                            escapableSelfOrAncestorLocal = node;
                            break;
                        }
                        node = node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE ? node.parentNode as Element : null;
                    }

                    if (escapableSelfOrAncestorLocal === escapableSelfOrAncestorInitial) {
                        ttsQueueIndex = ttsQueueItem.iGlobal - 1;
                        continue;
                    }

                    break;
                }
            }
        } else if (skipSentences &&
            _dialogState.ttsQueueItem.iSentence !== -1 &&
            _dialogState.ttsQueueItem.item.combinedTextSentences) {
            ttsQueueIndex = _dialogState.ttsQueueItem.iGlobal - _dialogState.ttsQueueItem.iSentence - 1;
        }
        if (ttsQueueIndex >= _dialogState.ttsQueueLength || ttsQueueIndex < 0) {
            ttsStop();
            flushDestroy();

            setTimeout(() => {
                ipcRenderer.sendToHost(R2_EVENT_TTS_DOC_BACK);
                // const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
                //     direction: "LTR",
                //     go: "NEXT",
                // };
                // ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
            }, 400);
            return;
        }
        ttsPause(true);
        ttsPlayQueueIndexDebounced(ttsQueueIndex);
    } else if (_resumableState) {
        ttsResume();
    }
}

export function ttsPreviewAndEventuallyPlayQueueIndex(n: number) {

    ttsPause(true);

    // if (_dialogState && _dialogState.ttsQueue) {
    //     updateTTSInfo(getTtsQueueItemRef(_dialogState.ttsQueue, n), -1, undefined);
    // }

    ttsPlayQueueIndexDebounced(n);
}

// const _getCssSelectorOptions = {
//     className: (_str: string) => {
//         return true;
//     },
//     idName: (_str: string) => {
//         return true;
//     },
//     tagName: (_str: string) => {
//         return true;
//     },
// };
// function getCssSelector(element: Element): string {
//     try {
//         return uniqueCssSelector(element, win.document, _getCssSelectorOptions);
//     } catch (err) {
//         console.log("uniqueCssSelector:");
//         console.log(err);
//         return "";
//     }
// }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function throttle(fn: (...argz: any[]) => any, time: number) {
    let called = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastCalled: any[] | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const func = (...args: any[]) => {
        if (!called) {
            fn(...args);
            called = true;
            setTimeout(() => {
                called = false;
                if (lastCalled) {
                    const argos = lastCalled;
                    lastCalled = undefined;
                    func(...argos);
                    // setTimeout(() => {
                    // }, 0);
                }
            }, time);
        } else {
            lastCalled = args;
        }
    };
    return func;
}

// const focusScrollImmediate =
//     debounce((el: HTMLOrSVGElement, doFocus: boolean, animate: boolean, domRect: DOMRect | undefined) => {
//         if (_dialogState && _dialogState.focusScrollRaw) {
//                 _dialogState.focusScrollRaw(el, doFocus, animate, domRect);
//         }
//     }, 500, { immediate: true });

const focusScrollImmediate = throttle((el: HTMLOrSVGElement, doFocus: boolean, animate: boolean, domRect: DOMRect | undefined, center?: boolean) => {
    if (_dialogState && _dialogState.focusScrollRaw) {
        _dialogState.focusScrollRaw(el, doFocus, animate, domRect, center);
    }
}, 500);

const isOnlyWhiteSpace = (str: string) => {
    for (let i = 0; i < str.length; i++) {
        if (str[i] !== " " &&
            str[i] !== "\t" &&
            str[i] !== "\n" &&
            str[i] !== "\r"
            // && !/\s/.test(str)
        ) {
            // console.log("isOnlyWhiteSpace FALSE: [[" + str + "]]");
            return false;
        }
    }
    // console.log("isOnlyWhiteSpace TRUE");
    return true;
};

let _ttsQueueItemHighlightsSentence: Array<IHighlight | null> | undefined;
let _ttsQueueItemHighlightsWord: Array<IHighlight | null> | undefined;

function wrapHighlightWord(
    ttsQueueItemRef: ITtsQueueItemReference,
    utteranceText: string,
    charIndex: number,
    charLength: number,
    // word: string,
    // start: number,
    // end: number
) {
    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        return;
    }

    if (_ttsQueueItemHighlightsWord) {
        _ttsQueueItemHighlightsWord.forEach((highlight) => {
            if (highlight) {
                destroyHighlight(win.document, highlight.id);
            }
        });
        _ttsQueueItemHighlightsWord = undefined;
    }

    const ttsQueueItem = ttsQueueItemRef.item;
    let txtToCheck = ttsQueueItemRef.item.combinedText;
    let charIndexAdjusted = charIndex;
    if (ttsQueueItem.combinedTextSentences &&
        ttsQueueItem.combinedTextSentencesRangeBegin &&
        ttsQueueItem.combinedTextSentencesRangeEnd &&
        ttsQueueItemRef.iSentence >= 0) {

        const sentOffset = ttsQueueItem.combinedTextSentencesRangeBegin[ttsQueueItemRef.iSentence];
        charIndexAdjusted += sentOffset;
        txtToCheck = ttsQueueItem.combinedTextSentences[ttsQueueItemRef.iSentence];
    }

    if (IS_DEV) {
        if (utteranceText !== txtToCheck) {
            console.log("TTS utteranceText DIFF?? ",
                `[[${utteranceText}]]`, `[[${txtToCheck}]]`);
        }
        // const ttsWord = utteranceText.substr(charIndex, charLength);
        // if (ttsWord !== word) {
        //     console.log("TTS word DIFF?? ",
        //         `[[${ttsWord}]]`, `[[${word}]]`,
        //         `${charIndex}--${charLength}`, `${start}--${end - start}`);
        // }
        // console.log("HIGHLIGHT WORD DATA:");
        // console.log(utteranceText);
        // console.log(txtToCheck);
        // console.log(ttsWord);
        // console.log(word);
        // console.log(charIndex);
        // console.log(charLength);
        // console.log(start);
        // console.log(end - start);
    }

    // console.log("...");
    // console.log("++TTS 4 combinedText: [[" + ttsQueueItem.combinedText + "]]");
    // console.log("++TTS 4: combinedTextSentences: [[" + JSON.stringify(ttsQueueItem.combinedTextSentences, null, 4) + "]]");
    // console.log("...");
    // for (const txtNode of ttsQueueItem.textNodes) {
    //     console.log("++TTS 4 TXT A: [[" + txtNode.nodeValue + "]]");
    // }
    // console.log("...");
    // for (const txtNode of ttsQueueItemRef.item.textNodes) {
    //     console.log("++TTS 4 TXT B: [[" + txtNode.nodeValue + "]]");
    // }
    // console.log("...");
    // console.log("++TTS 4 charIndex: " + charIndex);
    // console.log("++TTS 4 charLength: " + charLength);
    // console.log("++TTS 4 charIndexAdjusted: " + charIndexAdjusted);
    // console.log("...");

    let acc = 0;
    let rangeStartNode: Node | undefined;
    let rangeStartOffset = -1;
    let rangeEndNode: Node | undefined;
    let rangeEndOffset = -1;
    const charIndexEnd = charIndexAdjusted + charLength;
    for (const txtNode of ttsQueueItem.textNodes) {
        if (!txtNode.nodeValue && txtNode.nodeValue !== "") {
            continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isRUBY = (txtNode as any).__RUBY;

        const l = isRUBY ? 0 : isOnlyWhiteSpace(txtNode.nodeValue) ? 1 : txtNode.nodeValue.length;
        acc += l;
        if (!rangeStartNode) {
            if (isRUBY && charIndexAdjusted <= acc
                || charIndexAdjusted < acc) {
                rangeStartNode = txtNode;
                rangeStartOffset = isRUBY ? 0 : l - (acc - charIndexAdjusted);
            }
        }
        if (rangeStartNode && charIndexEnd <= acc) {
            rangeEndNode = txtNode;
            rangeEndOffset = isRUBY ? (txtNode.nodeValue.length - 1) : l - (acc - charIndexEnd);
            break;
        }
    }

    ttsQueueItem.lastWordRange = undefined;
    if (rangeStartNode && rangeEndNode) {
        // console.log("HIGHLIGHT WORD");
        // console.log(rangeStartOffset);
        // console.log(rangeEndOffset);

        const range = new Range(); // document.createRange()
        range.setStart(rangeStartNode, rangeStartOffset);
        range.setEnd(rangeEndNode, rangeEndOffset);
        ttsQueueItem.lastWordRange = range;

        if (_dialogState && _dialogState.focusScrollRaw) {
            const domRect = range.getBoundingClientRect();
            //_dialogState.focusScrollRaw
            focusScrollImmediate(ttsQueueItemRef.item.parentElement as HTMLElement, false, true, domRect);
        }

        // const tuple = convertRange(
        //     range,
        //     getCssSelector,
        //     (_node: Node) => ""); // computeElementCFI
        // if (!tuple) {
        //     return;
        // }
        // const rangeInfo = tuple[0];
        // const textInfo = tuple[1];

        const ttsHighlightStyle_WORD = typeof win.READIUM2?.ttsHighlightStyle_WORD !== "undefined" ? win.READIUM2.ttsHighlightStyle_WORD : HighlightDrawTypeUnderline;
        if (ttsHighlightStyle_WORD !== HighlightDrawTypeNONE) {
            const ttsColor_WORD: IColor = win.READIUM2?.ttsHighlightColor_WORD || {
                blue: 0,
                green: 147,
                red: 255,
            };
            const highlightDefinitions = [
                {
                    // https://htmlcolorcodes.com/
                    color: ttsColor_WORD,
                    drawType: ttsHighlightStyle_WORD,
                    expand: ENABLE_CSS_HIGHLIGHTS ? 0 : 2,
                    selectionInfo: undefined,
                    group: HIGHLIGHT_GROUP_TTS,
                    range,
                    // selectionInfo: {
                    //     rawBefore: textInfo.rawBefore,
                    //     rawText: textInfo.rawText,
                    //     rawAfter: textInfo.rawAfter,

                    //     cleanBefore: textInfo.cleanBefore,
                    //     cleanText: textInfo.cleanText,
                    //     cleanAfter: textInfo.cleanAfter,

                    //     rangeInfo,
                    // },
                } as IHighlightDefinition,
            ];
            _ttsQueueItemHighlightsWord = createHighlights(
                win,
                highlightDefinitions,
                false, // mouse / pointer interaction
            );
        }
    }
}

let _flushDestroyTimeout: NodeJS.Timeout | undefined;
let _ttsQueueItemHighlightsSentenceToDestroy: IHighlight[] | undefined;
const flushDestroy = () => {
    if (_flushDestroyTimeout) {
        clearTimeout(_flushDestroyTimeout);
        _flushDestroyTimeout = undefined;
    }
    if (_ttsQueueItemHighlightsSentenceToDestroy) {
        _ttsQueueItemHighlightsSentenceToDestroy.forEach((highlight) => {
            destroyHighlight(win.document, highlight.id);
        });
        _ttsQueueItemHighlightsSentenceToDestroy = undefined;
    }
};
function wrapHighlight(
    doHighlight: boolean,
    ttsQueueItemRef: ITtsQueueItemReference,
    expectNext?: boolean) {

    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        return;
    }

    if (_ttsQueueItemHighlightsWord) {
        _ttsQueueItemHighlightsWord.forEach((highlight) => {
            if (highlight) {
                destroyHighlight(win.document, highlight.id);
            }
        });
        _ttsQueueItemHighlightsWord = undefined;
    }

    if (_ttsQueueItemHighlightsSentence) {
        _ttsQueueItemHighlightsSentence.forEach((highlight) => {
            if (highlight) {
                if ((doHighlight || expectNext) && (highlight.drawType === HighlightDrawTypeOpacityMask || highlight.drawType === HighlightDrawTypeOpacityMaskRuler)) {
                    if (!_ttsQueueItemHighlightsSentenceToDestroy) {
                        _ttsQueueItemHighlightsSentenceToDestroy = [];
                    }
                    _ttsQueueItemHighlightsSentenceToDestroy.push(highlight);
                } else {
                    destroyHighlight(win.document, highlight.id);
                }
            }
        });
        _ttsQueueItemHighlightsSentence = undefined;
    }

    const ttsQueueItem = ttsQueueItemRef.item;
    if (doHighlight &&
        ttsQueueItem.parentElement) {

        let range: Range | undefined;
        if (!ttsQueueItem.textNodes || !ttsQueueItem.textNodes.length) {
            // console.log("++TTS 1");
            range = new Range();
            range.selectNode(ttsQueueItem.parentElement);
            // if (ttsQueueItem.parentElement.childNodes?.length) {
            //     range = new Range();
            //     range.setStart(ttsQueueItem.parentElement, 0);
            //     range.setEnd(ttsQueueItem.parentElement, ttsQueueItem.parentElement.childNodes.length);
            // }
        } else if (ttsQueueItem.combinedTextSentences &&
            ttsQueueItem.combinedTextSentencesRangeBegin &&
            ttsQueueItem.combinedTextSentencesRangeEnd &&
            ttsQueueItemRef.iSentence >= 0) {
            // console.log("...");
            // console.log("++TTS 2 combinedText: [[" + ttsQueueItem.combinedText + "]]");
            // console.log("++TTS 2: combinedTextSentences: [[" + JSON.stringify(ttsQueueItem.combinedTextSentences, null, 4) + "]]");
            // console.log("...");
            // for (const txtNode of ttsQueueItem.textNodes) {
            //     console.log("++TTS 2 TXT A: [[" + txtNode.nodeValue + "]]");
            // }
            // console.log("...");
            // for (const txtNode of ttsQueueItemRef.item.textNodes) {
            //     console.log("++TTS 2 TXT B: [[" + txtNode.nodeValue + "]]");
            // }
            // console.log("...");

            const sentBegin = ttsQueueItem.combinedTextSentencesRangeBegin[ttsQueueItemRef.iSentence];
            const sentEnd = ttsQueueItem.combinedTextSentencesRangeEnd[ttsQueueItemRef.iSentence];

            let acc = 0;
            let rangeStartNode: Node | undefined;
            let rangeStartOffset = -1;
            let rangeEndNode: Node | undefined;
            let rangeEndOffset = -1;
            for (const txtNode of ttsQueueItemRef.item.textNodes) {
                if (!txtNode.nodeValue && txtNode.nodeValue !== "") {
                    continue;
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const isRUBY = (txtNode as any).__RUBY;

                const l = isRUBY ? 0 : isOnlyWhiteSpace(txtNode.nodeValue) ? 1 : txtNode.nodeValue.length;
                acc += l;
                if (!rangeStartNode) {
                    if (isRUBY && sentBegin <= acc
                        || sentBegin < acc) {
                        rangeStartNode = txtNode;
                        rangeStartOffset = isRUBY ? 0 : l - (acc - sentBegin);
                    }
                }
                if (rangeStartNode && sentEnd <= acc) {
                    rangeEndNode = txtNode;
                    rangeEndOffset = isRUBY ? (txtNode.nodeValue.length - 1) : l - (acc - sentEnd);
                    break;
                }
            }

            if (rangeStartNode && rangeEndNode) {
                // console.log("HIGHLIGHT WORD");
                // console.log(rangeStartOffset);
                // console.log(rangeEndOffset);

                range = new Range(); // document.createRange()
                range.setStart(rangeStartNode, rangeStartOffset);
                range.setEnd(rangeEndNode, rangeEndOffset);
            }
        } else { // ttsQueueItem.combinedText
            // console.log("...");
            // console.log("++TTS 3 combinedText: [[" + ttsQueueItem.combinedText + "]]");
            // console.log("...");
            // console.log("++TTS 3: combinedTextSentences: [[" + JSON.stringify(ttsQueueItem.combinedTextSentences, null, 4) + "]]");
            // console.log("...");
            // for (const txtNode of ttsQueueItem.textNodes) {
            //     console.log("++TTS 3 TXT: [[" + txtNode.nodeValue + "]]");
            // }
            // console.log("...");

            range = new Range(); // document.createRange()

            const firstTextNode = ttsQueueItem.textNodes[0];
            if (!firstTextNode.nodeValue && firstTextNode.nodeValue !== "") {
                flushDestroy();
                return;
            }
            // exxxslint-disable-next-line @typescript-eslint/no-explicit-any
            // if ((firstTextNode as any).__RUBY) {
            //     flushDestroy();
            //     return;
            // }
            range.setStart(firstTextNode, isOnlyWhiteSpace(firstTextNode.nodeValue) ? firstTextNode.nodeValue.length - 1 : 0);

            const lastTextNode = ttsQueueItem.textNodes[ttsQueueItem.textNodes.length - 1];
            if (!lastTextNode.nodeValue && lastTextNode.nodeValue !== "") {
                flushDestroy();
                return;
            }
            // exxxslint-disable-next-line @typescript-eslint/no-explicit-any
            // if ((lastTextNode as any).__RUBY) {
            //     flushDestroy();
            //     return;
            // }
            range.setEnd(lastTextNode, isOnlyWhiteSpace(lastTextNode.nodeValue) ? 1 : lastTextNode.nodeValue.length);
        }

        ttsQueueItem.lastUtteranceRange = undefined;
        if (range) {
            ttsQueueItem.lastUtteranceRange = range;

            if (_dialogState && _dialogState.focusScrollRaw) {
                const domRect = range.getBoundingClientRect();
                // focusScrollImmediate
                _dialogState.focusScrollRaw(ttsQueueItemRef.item.parentElement as HTMLElement, false, true, domRect, true);
            }

            // const tuple = convertRange(
            //     range,
            //     getCssSelector,
            //     (_node: Node) => ""); // computeElementCFI
            // if (!tuple) {
            //     return;
            // }
            // const rangeInfo = tuple[0];
            // const textInfo = tuple[1];

            const ttsHighlightStyle = typeof win.READIUM2?.ttsHighlightStyle !== "undefined" ? win.READIUM2.ttsHighlightStyle : HighlightDrawTypeBackground;
            if (ttsHighlightStyle !== HighlightDrawTypeNONE) {
                const ttsColor: IColor = win.READIUM2?.ttsHighlightColor || {
                    blue: 116, // 204,
                    green: 248, // 218,
                    red: 248, // 255,
                };
                const highlightDefinitions = [
                    {
                        // https://htmlcolorcodes.com/
                        color: ttsColor,
                        drawType: ttsHighlightStyle,
                        expand: ttsHighlightStyle === HighlightDrawTypeOpacityMaskRuler || ttsHighlightStyle === HighlightDrawTypeOpacityMask ? 0 : ttsHighlightStyle === HighlightDrawTypeBackground ? 4 : 0,
                        selectionInfo: undefined,
                        group: HIGHLIGHT_GROUP_TTS,
                        range,
                        // selectionInfo: {
                        //     rawBefore: textInfo.rawBefore,
                        //     rawText: textInfo.rawText,
                        //     rawAfter: textInfo.rawAfter,

                        //     cleanBefore: textInfo.cleanBefore,
                        //     cleanText: textInfo.cleanText,
                        //     cleanAfter: textInfo.cleanAfter,

                        //     rangeInfo,
                        // },
                    } as IHighlightDefinition,
                ];
                _ttsQueueItemHighlightsSentence = createHighlights(
                    win,
                    highlightDefinitions,
                    false, // mouse / pointer interaction
                );
            }
        }
    }

    if (doHighlight) {
        flushDestroy();
    } else if (expectNext) {
        if (_flushDestroyTimeout) {
            clearTimeout(_flushDestroyTimeout);
            _flushDestroyTimeout = undefined;
        }
        _flushDestroyTimeout = setTimeout(() => {
            _flushDestroyTimeout = undefined;
            flushDestroy();
        }, 1000);
    }
}

function highlights(doHighlight: boolean, expectNext?: boolean) {

    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        return;
    }
    if (!_dialogState) {
        return;
    }
    if (doHighlight) {
        if (_dialogState.ttsQueueItem) {
            wrapHighlight(true, _dialogState.ttsQueueItem, expectNext);
        }
        if (win.READIUM2.DEBUG_VISUALS &&
            _dialogState.ttsRootElement) {
            _dialogState.ttsRootElement.classList.add(TTS_ID_SPEAKING_DOC_ELEMENT);
        }
    } else {
        if (_dialogState.ttsQueueItem) {
            wrapHighlight(false, _dialogState.ttsQueueItem, expectNext);
        }
        if (// win.READIUM2.DEBUG_VISUALS &&
            _dialogState.ttsRootElement) {
            _dialogState.ttsRootElement.classList.remove(TTS_ID_SPEAKING_DOC_ELEMENT);
        }
    }
}

let _lastAnimState: IPropertyAnimationState | undefined;
const animationTime = 400;

const scrollIntoViewSpokenTextDebounced = debounce((id: string) => {
    scrollIntoViewSpokenText(id);
}, 200);
function scrollIntoViewSpokenText(id: string) {

    const reduceMotion = win.document.documentElement.classList.contains(ROOT_CLASS_REDUCE_MOTION);

    const span = win.document.getElementById(id) as HTMLElement;
    if (span && _dialogState && _dialogState.domText) {
        const rect = span.getBoundingClientRect();
        const rect2 = _dialogState.domText.getBoundingClientRect();
        const scrollTopMax = _dialogState.domText.scrollHeight - _dialogState.domText.clientHeight;
        let offset = _dialogState.domText.scrollTop + (rect.top - rect2.top - (_dialogState.domText.clientHeight / 2));
        if (offset > scrollTopMax) {
            offset = scrollTopMax;
        } else if (offset < 0) {
            offset = 0;
        }
        const diff = Math.abs(_dialogState.domText.scrollTop - offset);
        if (diff < 20) {
            return; // prevents jittering
        }

        if (_lastAnimState && _lastAnimState.animating) {
            win.cancelAnimationFrame(_lastAnimState.id);
            _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
        }

        // _dialogState.domText.scrollTop = offset;
        const targetObj = _dialogState.domText;
        const targetProp = "scrollTop";
        if (reduceMotion) {
            _lastAnimState = undefined;
            targetObj[targetProp] = offset;
        } else {
            // _lastAnimState = undefined;
            // (targetObj as HTMLElement).style.transition = "";
            // (targetObj as HTMLElement).style.transform = "none";
            // (targetObj as HTMLElement).style.transition =
            //     `transform ${animationTime}ms ease-in-out 0s`;
            // (targetObj as HTMLElement).style.transform =
            //     isVerticalWritingMode() ?
            //     `translateY(${unit}px)` :
            //     `translateX(${(isRTL() ? -1 : 1) * unit}px)`;
            // setTimeout(() => {
            //     (targetObj as HTMLElement).style.transition = "";
            //     (targetObj as HTMLElement).style.transform = "none";
            //     targetObj[targetProp] = offset;
            // }, animationTime);
            _lastAnimState = animateProperty(
                win.cancelAnimationFrame,
                undefined,
                // (cancelled: boolean) => {
                //     debug(cancelled);
                // },
                targetProp,
                animationTime,
                targetObj,
                offset,
                win.requestAnimationFrame,
                easings.easeInOutQuad,
            );
        }
        // span.focus();
        // span.scrollIntoView({
        //     // TypeScript lib.dom.d.ts difference in 3.2.1
        //     // ScrollBehavior = "auto" | "instant" | "smooth" VS ScrollBehavior = "auto" | "smooth"
        //     behavior: "auto",
        //     // ScrollLogicalPosition = "start" | "center" | "end" | "nearest"
        //     block: "center",
        //     // ScrollLogicalPosition = "start" | "center" | "end" | "nearest"
        //     inline: "nearest",
        // } as ScrollIntoViewOptions);
    }
}

const R2_DATA_ATTR_UTTERANCE_INDEX = "data-r2-tts-utterance-index";

function updateTTSInfo(
    // ttsQueueItemPreview: ITtsQueueItemReference | undefined,
    charIndex: number,
    charLength: number,
    utteranceText: string | undefined): string | undefined {

    if (!_dialogState || !_dialogState.hasAttribute("open") || !_dialogState.open || !_dialogState.domText ||
        !_dialogState.ttsQueue || !_dialogState.ttsQueueItem) {
        return undefined;
    }

    const ttsQueueItem = _dialogState.ttsQueueItem;
    if (!ttsQueueItem) {
        return undefined;
    }

    // utteranceText is set from utterance.onboundary event callback
    const isWordBoundary = charIndex >= 0 && utteranceText;

    if (_dialogState.ttsOverlayEnabled &&
        !isWordBoundary &&
        _dialogState.focusScrollRaw &&
        ttsQueueItem.item.parentElement) {

        // let domRect: DOMRect | undefined;
        // if (ttsQueueItem.item.textNodes && ttsQueueItem.item.textNodes.length) {
        //     const txtNode = ttsQueueItem.item.textNodes[0];
        //     const range = new Range(); // documant.createRange();
        //     try {
        //         range.selectNode(txtNode);
        //         domRect = range.getBoundingClientRect();
        //         range.detach();
        //     } catch (err) {
        //         console.log(err);
        //     }
        // }
        _dialogState.focusScrollRaw(ttsQueueItem.item.parentElement as HTMLElement, false, true, undefined); // domRect
    }

    // console.log("--TTS utteranceText: [" + utteranceText + "]");
    const ttsQueueItemText = utteranceText ? utteranceText : getTtsQueueItemRefText(ttsQueueItem);
    // console.log("--TTS ttsQueueItemText: [" + ttsQueueItemText + "]" + " -- [" + getTtsQueueItemRefText(ttsQueueItem) + "]");

    if (!ttsQueueItemText.trim().length) {
        // console.log("--TTS ttsQueueItemText EMPTY SKIP");
        return "";
    }

    let ttsQueueItemMarkup = normalizeHtmlText(ttsQueueItemText);
    // console.log("--TTS ttsQueueItemMarkup: [" + ttsQueueItemMarkup + "]");

    if (isWordBoundary) { // charIndex >= 0 && utteranceText
        // const start = utteranceText.slice(0, charIndex + 1).search(/\S+$/);
        // const right = utteranceText.slice(charIndex).search(/\s/);
        // const word = right < 0 ? utteranceText.slice(start) : utteranceText.slice(start, right + charIndex);
        // const end = start + word.length;
        // // debug(word);
        const word = utteranceText.substr(charIndex, charLength);
        // console.log("--TTS word: [" + word + "]");

        if (_dialogState && _dialogState.ttsOverlayEnabled) {
            const prefix = `<span id="${TTS_ID_ACTIVE_WORD}">`;
            const suffix = "</span>";

            // const before = utteranceText.substr(0, start);
            // const after = utteranceText.substr(end);

            const before = utteranceText.substr(0, charIndex);
            const after = utteranceText.substr(charIndex + charLength);
            // console.log("--TTS before: [" + before + "]");
            // console.log("--TTS after: [" + after + "]");

            const l = before.length + word.length + after.length;
            // console.log("--TTS utteranceText.length: " + utteranceText.length);
            // console.log("--TTS l: " + l);

            ttsQueueItemMarkup = (l === utteranceText.length) ?
                `${normalizeHtmlText(before)}${prefix}${normalizeHtmlText(word)}${suffix}${normalizeHtmlText(after)}` :
                normalizeHtmlText(utteranceText);
        } else {
            // tslint:disable-next-line:max-line-length
            wrapHighlightWord(ttsQueueItem, utteranceText, charIndex, charLength,
            // , word, start, end
            );
        }
    }

    if (!(_dialogState && _dialogState.ttsOverlayEnabled)) {
        return ttsQueueItemText;
    }

    let activeUtteranceElem = _dialogState.domText.ownerDocument ?
        _dialogState.domText.ownerDocument.getElementById(TTS_ID_ACTIVE_UTTERANCE) :
        _dialogState.domText.querySelector(`#${TTS_ID_ACTIVE_UTTERANCE}`);
    if (activeUtteranceElem) {
        const indexStr = activeUtteranceElem.getAttribute(R2_DATA_ATTR_UTTERANCE_INDEX);
        if (indexStr && indexStr !== `${ttsQueueItem.iGlobal}`) {
            activeUtteranceElem.removeAttribute("id");
            const activeWordElem = activeUtteranceElem.ownerDocument ?
                activeUtteranceElem.ownerDocument.getElementById(TTS_ID_ACTIVE_WORD) :
                activeUtteranceElem.querySelector(`#${TTS_ID_ACTIVE_WORD}`);
            if (activeWordElem) {
                const index = parseInt(indexStr, 10);
                if (!isNaN(index)) {
                    const ttsQItem = getTtsQueueItemRef(_dialogState.ttsQueue, index);
                    if (ttsQItem) {
                        const txt = getTtsQueueItemRefText(ttsQItem);
                        try {
                            activeUtteranceElem.innerHTML = normalizeHtmlText(txt);
                        } catch (err) {
                            console.log(err);
                            console.log(txt);
                            activeUtteranceElem.innerHTML = "txt";
                        }
                    }
                }
            }

            activeUtteranceElem = _dialogState.domText.querySelector(
                `[${R2_DATA_ATTR_UTTERANCE_INDEX}="${ttsQueueItem.iGlobal}"]`);
            if (activeUtteranceElem) {
                activeUtteranceElem.setAttribute("id", TTS_ID_ACTIVE_UTTERANCE);
            }
        }
        if (activeUtteranceElem) {
            try {
                activeUtteranceElem.innerHTML = ttsQueueItemMarkup;
            } catch (err) {
                console.log(err);
                console.log(ttsQueueItemMarkup);
                activeUtteranceElem.innerHTML = "ttsQueueItemMarkup";
            }
        }
    } else {
        let fullMarkup = "";
        for (let i = 0; i < _dialogState.ttsQueueLength; i++) {
            const ttsQItem = getTtsQueueItemRef(_dialogState.ttsQueue, i);
            if (!ttsQItem) {
                continue;
            }
            let ttsQItemMarkup = ttsQueueItemMarkup;

            let isHeadingLevel1 = false;
            let isHeadingLevel2 = false;
            let isHeadingLevel3 = false;
            let isHeadingLevel4 = false;
            let isHeadingLevel5 = false;
            let p: Element | null = ttsQItem.item.parentElement;
            while (p && p.tagName) {
                const tagName = p.tagName.toLowerCase();
                if (tagName === "h1") {
                    isHeadingLevel1 = true;
                    break;
                } else if (tagName === "h2") {
                    isHeadingLevel2 = true;
                    break;
                } else if (tagName === "h3") {
                    isHeadingLevel3 = true;
                    break;
                } else if (tagName === "h4") {
                    isHeadingLevel4 = true;
                    break;
                } else if (tagName === "h5") {
                    isHeadingLevel5 = true;
                    break;
                }
                p = p.parentNode as (Element | null);
            }
            const classes = TTS_CLASS_UTTERANCE +
                (isHeadingLevel1 ? ` ${TTS_CLASS_UTTERANCE_HEADING1}` :
                    (isHeadingLevel2 ? ` ${TTS_CLASS_UTTERANCE_HEADING2}` :
                        (isHeadingLevel3 ? ` ${TTS_CLASS_UTTERANCE_HEADING3}` :
                            (isHeadingLevel4 ? ` ${TTS_CLASS_UTTERANCE_HEADING4}` :
                                (isHeadingLevel5 ? ` ${TTS_CLASS_UTTERANCE_HEADING5}` : "")))));

            // tslint:disable-next-line:max-line-length
            let ttsQItemMarkupAttributes = `${R2_DATA_ATTR_UTTERANCE_INDEX}="${ttsQItem.iGlobal}" class="${classes}"`;
            if (ttsQItem.iGlobal === ttsQueueItem.iGlobal) {
                ttsQItemMarkupAttributes += ` id="${TTS_ID_ACTIVE_UTTERANCE}" `;
            } else {
                ttsQItemMarkup = normalizeHtmlText(getTtsQueueItemRefText(ttsQItem));
            }
            let imageMarkup = "";
            if (ttsQItem.item.parentElement && ttsQItem.item.parentElement.tagName &&
                ttsQItem.item.parentElement.tagName.toLowerCase() === "img" &&
                (ttsQItem.item.parentElement as HTMLImageElement).src) {

                imageMarkup = `<img src="${(ttsQItem.item.parentElement as HTMLImageElement).src}" />`;
            }
            if (ttsQItem.item.parentElement && ttsQItem.item.parentElement.tagName &&
                ttsQItem.item.parentElement.tagName.toLowerCase() === "svg") {

                imageMarkup = ttsQItem.item.parentElement.outerHTML;
            }
            if (ttsQItem.item.dir) {
                ttsQItemMarkupAttributes += ` dir="${ttsQItem.item.dir}" `;
            }
            if (ttsQItem.item.lang) {
                ttsQItemMarkupAttributes += ` lang="${ttsQItem.item.lang}" xml:lang="${ttsQItem.item.lang}" `;
            }
            if (imageMarkup || ttsQItemMarkup?.trim().length) {
                fullMarkup += `${imageMarkup}<div ${ttsQItemMarkupAttributes}>${ttsQItemMarkup}</div>`;
            }
        }

        try {
            _dialogState.domText.insertAdjacentHTML("beforeend", fullMarkup);
        } catch (err) {
            console.log(err);
            console.log(fullMarkup);
            try {
                _dialogState.domText.innerHTML = fullMarkup;
            } catch (err) {
                console.log(err);
                console.log(fullMarkup);
                _dialogState.domText.innerHTML = "fullMarkup";
            }
        }
    }

    // if (!isWordBoundary) {
    //     if (_dialogState.domInfo) {
    //         _dialogState.domInfo.innerText = (ttsQueueItem.iGlobal + 1) + "/" + _dialogState.ttsQueueLength;
    //     }
    // }

    scrollIntoViewSpokenTextDebounced(isWordBoundary ? TTS_ID_ACTIVE_WORD : TTS_ID_ACTIVE_UTTERANCE);

    return ttsQueueItemText;
}

const ttsPlayQueueIndexDebounced = debounce((ttsQueueIndex: number, ttsAndMediaOverlaysManualPlayNext = false) => {
    ttsPlayQueueIndex(ttsQueueIndex, ttsAndMediaOverlaysManualPlayNext);
}, 150);

export function assignUtteranceVoice(utterance: SpeechSynthesisUtterance) {
    // console.log("ttsVoices xx", JSON.stringify(win.READIUM2.ttsVoices, null, 4));

    const systemVoices = win.speechSynthesis.getVoices();
    // console.log("ttsVoices yy a", JSON.stringify(systemVoices.map(v => ({
    //     name: v.name,
    //     lang: v.lang,
    //     voiceURI: v.voiceURI,
    //     default: v.default,
    //     localService: v.localService,
    //     })), null, 4));

    const userVoices: SpeechSynthesisVoice[] = (win.READIUM2.ttsVoices || []).map((userVoice) =>
        systemVoices.find((sysVoice) =>
            userVoice.name === sysVoice.name &&
            userVoice.lang === sysVoice.lang &&
            userVoice.voiceURI === sysVoice.voiceURI &&
            // userVoice.default === sysVoice.default &&
            userVoice.localService === sysVoice.localService),
    ).filter((v) => !!v);

    // console.log("ttsVoices yy b", JSON.stringify(userVoices.map(v => ({
    //     name: v.name,
    //     lang: v.lang,
    //     voiceURI: v.voiceURI,
    //     default: v.default,
    //     localService: v.localService,
    //     })), null, 4));

    utterance.voice = null as (SpeechSynthesisVoice | null); // userVoices.find((usrVoice) => usrVoice.default) || null;

    // console.log("TTS ****************************************");
    // console.log("utterance.lang", utterance.lang);
    // console.log("utterance.voice.lang (default)", utterance.voice?.lang);

    // console.log("speechSynthesis.getVoices()", systemVoices.length);
    // console.log("win.READIUM2.ttsVoices", win.READIUM2.ttsVoices?.length, JSON.stringify(win.READIUM2.ttsVoices, null, 4));
    // console.log("userVoices = win.READIUM2.ttsVoices filtered", userVoices.length, JSON.stringify(userVoices.map((v) => ({
    //     default: v.default,
    //     lang: v.lang,
    //     localService: v.localService,
    //     name: v.name,
    //     voiceURI: v.voiceURI,
    // })), null, 4));

    // TODO: match Greek variants? (etc.) el, grc, gre, ell ....

    if (!utterance.lang) { // authored lang
        return;
    }

    const utteranceLang = utterance.lang.toLowerCase();

    const voicesCascade = [userVoices, systemVoices];
    for (const voices of voicesCascade) {
        let utteranceLangShort = utteranceLang;
        const i = utteranceLangShort.indexOf("-");
        const utteranceLangIsSpecific = i > 0;
        if (utteranceLangIsSpecific) {
            utteranceLangShort = utteranceLangShort.substring(0, i);
        }

        let found = false;
        for (const usrVoice of voices) {
            if (!usrVoice.lang) {
                continue;
            }

            if (utterance.lang === "und") {
                utterance.lang = "";
                utterance.voice = usrVoice;
                found = true;
                break; // pick first one chosen by user
            }

            const usrVoiceLang = usrVoice.lang.toLowerCase();

            if (utteranceLang === usrVoiceLang) { // exact match
                // console.log("))))) utteranceLang === usrVoiceLang", utteranceLang, JSON.stringify({
                //     default: usrVoice.default,
                //     lang: usrVoice.lang,
                //     localService: usrVoice.localService,
                //     name: usrVoice.name,
                //     voiceURI: usrVoice.voiceURI,
                // }, null, 4));
                utterance.voice = usrVoice;
                found = true;
                break;
            }

            let usrVoiceLangShort = usrVoiceLang;
            const j = usrVoiceLangShort.indexOf("-");
            const usrVoiceLangIsSpecific = j > 0;
            if (usrVoiceLangIsSpecific) {
                usrVoiceLangShort = usrVoiceLangShort.substring(0, j);
            }

            // is accepting a loose BCP47 match the correct heuristic?
            // in other words, for example is fr-CA TTS voice suitable for authored fr-FR?
            // (or en-US vs. en-UK which are somewhat acceptable semi-matches ...
            // but what about locales / dialects with stronger differentiations?)
            if (utteranceLangShort === usrVoiceLangShort) { // first loose match wins
                // console.log("))))) utteranceLangShort === usrVoiceLangShort", utteranceLangShort, JSON.stringify({
                //     default: usrVoice.default,
                //     lang: usrVoice.lang,
                //     localService: usrVoice.localService,
                //     name: usrVoice.name,
                //     voiceURI: usrVoice.voiceURI,
                // }, null, 4));
                utterance.voice = usrVoice;
                found = true;
                break;
            }
        }
        if (found) {
            // console.log("ttsVoices zz", utterance.voice?.name, utterance.voice?.lang, utterance.voice?.voiceURI, utterance.voice?.localService);
            break;
        }
    }
}

export function ttsPlayQueueIndex(ttsQueueIndex: number, ttsAndMediaOverlaysManualPlayNext = false) {

    if (!_dialogState ||
        !_dialogState.ttsRootElement ||
        !_dialogState.focusScrollRaw ||
        !_dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable ||
        !_dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable ||
        !_dialogState.ttsQueue ||
        !_dialogState.hasAttribute("open") || !_dialogState.open) {
        ttsStop();
        return;
    }

    if (!ttsAndMediaOverlaysManualPlayNext) {

        _dialogState.ttsQueueItem = undefined;
        _dialogState.ttsUtterance = undefined;

        if (_dialogState.domSlider) {
            // _dialogState.domSlider.value = "" + ttsQueueIndex;
            _dialogState.domSlider.valueAsNumber = ttsQueueIndex;
        }
    }

    if (ttsQueueIndex < 0) {
        ttsStop();
        return;
    }
    if (ttsQueueIndex >= _dialogState.ttsQueueLength) {
        ttsStop();
        flushDestroy();

        setTimeout(() => {
            ipcRenderer.sendToHost(R2_EVENT_TTS_DOC_END);
            // const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
            //     direction: "LTR",
            //     go: "NEXT",
            // };
            // ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
        }, 400);

        return;
    }
    const ttsQueueItem = getTtsQueueItemRef(_dialogState.ttsQueue, ttsQueueIndex);
    if (!ttsQueueItem) {
        ttsStop();
        return;
    }

    if (ttsAndMediaOverlaysManualPlayNext) {
        // _dialogState.ttsQueueItem = undefined;
        _dialogState.ttsUtterance = undefined;
        _resumableState = {
            ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable:
                _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable,
            ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable:
                _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
            focusScrollRaw: _dialogState.focusScrollRaw,
            ttsQueue: _dialogState.ttsQueue,
            ttsQueueIndex: ttsQueueItem.iGlobal, // _dialogState.ttsQueueItem.iGlobal // ttsQueueIndex
            ttsRootElement: _dialogState.ttsRootElement,
        };
        return;
    }

    _dialogState.ttsQueueItem = ttsQueueItem;

    highlights(true);

    const txtStr = updateTTSInfo(-1, -1, undefined);

    if (txtStr === "") {
        highlights(false);
        ttsPlayQueueIndexDebounced(ttsQueueIndex + 1);
        return;
    }

    // empty string is falsy!
    if (!txtStr) {
        ttsStop();
        return;
    }

    const utterance = new SpeechSynthesisUtterance(txtStr);
    _dialogState.ttsUtterance = utterance;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (utterance as any).r2_ttsQueueIndex = ttsQueueIndex;

    // TODO:
    // utterance.pitch
    // utterance.volume
    if (_dialogState.ttsQueueItem.item.lang) {
        utterance.lang = _dialogState.ttsQueueItem.item.lang;
    }
    assignUtteranceVoice(utterance);

    if (win.READIUM2.ttsPlaybackRate >= 0.1 && win.READIUM2.ttsPlaybackRate <= 10) {
        utterance.rate = win.READIUM2.ttsPlaybackRate;
    }

    utterance.onboundary = (ev: SpeechSynthesisEvent) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((utterance as any).r2_cancel) {
            return;
        }
        if (!_dialogState || !_dialogState.ttsQueueItem) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((utterance as any).r2_ttsQueueIndex !== _dialogState.ttsQueueItem.iGlobal) {
            return;
        }

        if (ev.name !== "word") {
            return;
        }

        updateTTSInfo(ev.charIndex, ev.charLength, utterance.text);
    };

    const onEnd = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((utterance as any).r2_cancel) {
            return;
        }
        if (!_dialogState || !_dialogState.ttsQueueItem) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((utterance as any).r2_ttsQueueIndex !== _dialogState.ttsQueueItem.iGlobal) {
            return;
        }

        if (win.READIUM2.ttsAndMediaOverlaysManualPlayNext) {

            highlights(false);
            ttsPlayQueueIndexDebounced(ttsQueueIndex + 1, true);
            ttsPause(true); // calls highlights(false);

            return;
        }

        highlights(false, true);
        ttsPlayQueueIndexDebounced(ttsQueueIndex + 1);
    };
    utterance.onend = (_ev: SpeechSynthesisEvent) => {
        onEnd();
    };

    _resumableState = {
        ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable:
            _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable,
        ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable:
            _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
        focusScrollRaw: _dialogState.focusScrollRaw,
        ttsQueue: _dialogState.ttsQueue,
        ttsQueueIndex: _dialogState.ttsQueueItem.iGlobal, // ttsQueueIndex
        ttsRootElement: _dialogState.ttsRootElement,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (utterance as any).r2_cancel = false;
    setTimeout(() => {
        // note that isSkippable===true never reaches into a ttsQueueItem because we eject at compilation time instead of runtime / playback:
        // if (win.READIUM2.ttsSkippabilityEnabled && ttsQueueItem.item.isSkippable) {
        //     onEnd();
        // } else {
        //     win.speechSynthesis.speak(utterance);
        // }
        win.speechSynthesis.speak(utterance);
    }, 0);

    win.document.documentElement.classList.remove(TTS_CLASS_PAUSED, TTS_CLASS_STOPPED);
    win.document.documentElement.classList.add(TTS_CLASS_PLAYING);
    if (_dialogState && _dialogState.ttsOverlayEnabled) {
        win.document.documentElement.classList.add(TTS_CLASS_IS_ACTIVE);
    }
    ipcRenderer.sendToHost(R2_EVENT_TTS_IS_PLAYING);
    win.READIUM2.ttsClickEnabled = true;
    clearImageZoomOutlineDebounced();
}

function startTTSSession(
    speed: number,
    voices: SpeechSynthesisVoice[] | null,
    ttsRootElement: Element,
    ttsQueue: ITtsQueueItem[],
    ttsQueueIndexStart: number,
    focusScrollRaw:
        (el: HTMLOrSVGElement, doFocus: boolean, animate: boolean, domRect: DOMRect | undefined) => void,
    ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable: () => number,
    ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable: (val: number) => void,
) {
    win.READIUM2.ttsPlaybackRate = speed;
    win.READIUM2.ttsVoices = voices;

    const ttsQueueItemStart = getTtsQueueItemRef(ttsQueue, ttsQueueIndexStart);
    if (!ttsQueueItemStart) {
        ttsStop();
        return;
    }
    const ttsQueueLength = getTtsQueueLength(ttsQueue);

    // TODO: SSML?
    // https://github.com/guest271314/SpeechSynthesisSSMLParser
    // speechApiTxt = `<?xml version="1.0" encoding="utf-8"?>
    //     <speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis"
    //     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    //     xsi:schemaLocation="http://www.w3.org/2001/10/synthesis
    //                         http://www.w3.org/TR/speech-synthesis/synthesis.xsd"
    //     xml:lang="${language}">${txt}</speak>`;

    const val = win.READIUM2.ttsOverlayEnabled ? ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable() : undefined;

    function onDialogClosed(thiz: PopupDialog, el: HTMLOrSVGElement | null) {
        ttsPause(true);

        const clicky = thiz.clickCloseXY.clickX >= 0 && thiz.clickCloseXY.clickY >= 0;

        if (_dialogState && _dialogState.focusScrollRaw) {
            let toScrollTo = el;
            let domRect: DOMRect | undefined;
            if (_dialogState.ttsQueue && _dialogState.ttsQueueItem && _dialogState.ttsQueueItem.item.parentElement) {
                toScrollTo = _dialogState.ttsQueueItem.item.parentElement as HTMLElement;

                // const ttsQueueIndex = ttsQueueCurrentIndex();  // _dialogState.ttsQueueItem?.iGlobal;
                // const ttsQueueItem = getTtsQueueItemRef(_dialogState.ttsQueue, ttsQueueIndex); // === _dialogState.ttsQueueItem
                if (_dialogState.ttsQueueItem.item.lastWordRange) {
                    // console.log("ttsQueueItem.item.lastWordRange");
                    domRect = _dialogState.ttsQueueItem.item.lastWordRange.getBoundingClientRect();
                } else if (_dialogState.ttsQueueItem.item.lastUtteranceRange) {
                    // console.log("ttsQueueItem.item.lastUtteranceRange");
                    domRect = _dialogState.ttsQueueItem.item.lastUtteranceRange.getBoundingClientRect();
                }
            }
            if (toScrollTo) { // _dialogState.ttsOverlayEnabled
                // _dialogState.focusScrollRaw(toScrollTo, false, true, undefined);
                if (!clicky) {
                    _dialogState.focusScrollRaw(toScrollTo, true, false, domRect);
                }
            } else if (typeof val !== "undefined") {
                ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(val);
            }
        } else if (typeof val !== "undefined") {
            ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(val);
        }

        setTimeout(() => {
            resetState(false);
        }, 50);
        setTimeout(() => {
            if (clicky) {
                // const ev = win.document.createEvent("MouseEvents");
                // ev.initMouseEvent(
                //     "click", // typeArg
                //     false, // canBubbleArg
                //     false, // cancelableArg
                //     win.document.defaultView as Window, // viewArg
                //     0, // detailArg
                //     thiz.clickCloseXY.clickX, // screenXArg
                //     thiz.clickCloseXY.clickY, // screenYArg
                //     thiz.clickCloseXY.clickX, // clientXArg
                //     thiz.clickCloseXY.clickY, // clientYArg
                //     false, // ctrlKeyArg
                //     false, // altKeyArg
                //     false, // shiftKeyArg
                //     false, // metaKeyArg
                //     0, // buttonArg
                //     null, // relatedTargetArg
                // );

                const ev = new MouseEvent("click", {
                    button: 0,
                    buttons: 0,
                    clientX: thiz.clickCloseXY.clickX,
                    clientY: thiz.clickCloseXY.clickY,
                    movementX: thiz.clickCloseXY.clickX,
                    movementY: thiz.clickCloseXY.clickY,
                    relatedTarget: null,
                    screenX: thiz.clickCloseXY.clickX,
                    screenY: thiz.clickCloseXY.clickY,

                    altKey: false,
                    ctrlKey: false,
                    metaKey: false,
                    modifierAltGraph: false,
                    modifierCapsLock: false,
                    modifierFn: false,
                    modifierFnLock: false,
                    modifierHyper: false,
                    modifierNumLock: false,
                    modifierScrollLock: false,
                    modifierSuper: false,
                    modifierSymbol: false,
                    modifierSymbolLock: false,
                    shiftKey: false,

                    detail: 0,
                    view: win.document.defaultView,
                    which: 0,
                });
                win.document.dispatchEvent(ev);
            }
        }, 100);
    }

    // &#x21E0;
    // &#x21E2;
    const outerHTML =
        `<div id="${TTS_ID_CONTAINER}"
    class="${CSS_CLASS_NO_FOCUS_OUTLINE} ${TTS_CLASS_THEME1}"
    dir="ltr"
    lang="en"
    xml:lang="en"
    tabindex="0" autofocus="autofocus"></div>
${win.READIUM2.ttsOverlayEnabled ?
            `
<button id="${TTS_ID_PREVIOUS}" class="${TTS_NAV_BUTTON_CLASS}" title="${isRTL() ? "next" : "previous"}"><span>&#9668;</span></button>
<button id="${TTS_ID_NEXT}" class="${TTS_NAV_BUTTON_CLASS}" title="${isRTL() ? "previous" : "next"}"><span>&#9658;</span></button>
<input id="${TTS_ID_SLIDER}" type="range" min="0" max="${ttsQueueLength - 1}" value="0"
    ${isRTL() ? "dir=\"rtl\"" : "dir=\"ltr\""}  title="progress"/>
`
            : ""}
`;

    const pop = new PopupDialog(
        win.document,
        outerHTML,
        onDialogClosed,
        `${TTS_POPUP_DIALOG_CLASS}${win.READIUM2.ttsOverlayEnabled ? "" : ` ${POPUP_DIALOG_CLASS_COLLAPSE}`}`,
        true);
    pop.show(ttsQueueItemStart.item.parentElement);

    _dialogState = pop.dialog as IHTMLDialogElementWithTTSState;
    if (!_dialogState) {
        return;
    }
    _dialogState.ttsOverlayEnabled = win.READIUM2.ttsOverlayEnabled;

    _dialogState.focusScrollRaw = focusScrollRaw;
    _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable =
        ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable;
    _dialogState.ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable =
        ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable;

    _dialogState.ttsRootElement = ttsRootElement;

    _dialogState.domSlider = win.document.getElementById(TTS_ID_SLIDER) as HTMLInputElement;
    _dialogState.domPrevious = win.document.getElementById(TTS_ID_PREVIOUS) as HTMLButtonElement;
    _dialogState.domNext = win.document.getElementById(TTS_ID_NEXT) as HTMLButtonElement;
    _dialogState.domText = win.document.getElementById(TTS_ID_CONTAINER) as HTMLDivElement;

    _dialogState.ttsQueue = ttsQueue;
    _dialogState.ttsQueueLength = ttsQueueLength;

    if (_dialogState.domSlider) {
        _dialogState.domSlider.addEventListener("input", (_ev: Event) => {
            if (_dialogState && _dialogState.domSlider) {
                // const n = parseInt(_dialogState.domSlider.value, 10);
                const n = _dialogState.domSlider.valueAsNumber;

                ttsPreviewAndEventuallyPlayQueueIndex(n);
            }
        });
    }

    if (_dialogState.domPrevious) {
        _dialogState.domPrevious.addEventListener("click", (ev: MouseEvent) => {

            const skipSentences = ev.shiftKey && ev.altKey && ev.metaKey;
            const escape = skipSentences && !ev.metaKey;
            if (isRTL()) {
                ttsNext(skipSentences, escape);
            } else {
                ttsPrevious(skipSentences, escape);
            }
        });
    }
    if (_dialogState.domNext) {
        _dialogState.domNext.addEventListener("click", (ev: MouseEvent) => {

            const skipSentences = ev.shiftKey && ev.altKey && ev.metaKey;
            const escape = skipSentences && !ev.metaKey;
            if (!isRTL()) {
                ttsNext(skipSentences, escape);
            } else {
                ttsPrevious(skipSentences, escape);
            }
        });
    }

    if (_dialogState.domText) {
        _dialogState.domText.addEventListener("click", (ev: MouseEvent) => {
            if (ev.target && _dialogState && _dialogState.ttsQueue && _dialogState.ttsQueueItem) {
                const indexStr = (ev.target as Element).getAttribute(R2_DATA_ATTR_UTTERANCE_INDEX);
                if (indexStr) {
                    const index = parseInt(indexStr, 10);
                    if (!isNaN(index)) {
                        const ttsQItem = getTtsQueueItemRef(_dialogState.ttsQueue, index);
                        if (ttsQItem) {
                            if (ttsQItem.iGlobal !== _dialogState.ttsQueueItem.iGlobal) {
                                ttsPause(true);
                                ttsPlayQueueIndexDebounced(index);
                                return;
                            }
                        }
                    }
                }
            }

            ttsPauseOrResume();
        });
    }

    ttsPlayQueueIndexDebounced(ttsQueueIndexStart);
}
