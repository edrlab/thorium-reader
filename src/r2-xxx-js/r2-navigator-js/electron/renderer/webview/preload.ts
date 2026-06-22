// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==


import debounce from "debounce";
import debug_ from "debug";
import { ipcRenderer } from "electron";
import { isFocusable } from "tabbable";

import { DISABLE_TEMPORARY_NAV_TARGET_OUTLINE_CLASS, ENABLE_SKIP_LINK, ID_HIGHLIGHTS_FLOATING } from "../../common/styles";

import { ISelectionInfo } from "../../common/selection";

import { LocatorLocations, LocatorText } from "../../common/locator";

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { convertCustomSchemeToHttpUrl, READIUM2_ELECTRON_HTTP_PROTOCOL } from "../../common/sessions";

import {
    IEventPayload_R2_EVENT_AUDIO_SOUNDTRACK, IEventPayload_R2_EVENT_CAPTIONS,
    IEventPayload_R2_EVENT_CLIPBOARD_COPY, IEventPayload_R2_EVENT_DEBUG_VISUALS,
    IEventPayload_R2_EVENT_FXL_CONFIGURE, IEventPayload_R2_EVENT_HIGHLIGHT_CREATE,
    IEventPayload_R2_EVENT_HIGHLIGHT_REMOVE, IEventPayload_R2_EVENT_HIGHLIGHT_REMOVE_ALL, IEventPayload_R2_EVENT_LINK,
    IEventPayload_R2_EVENT_LOCATOR_VISIBLE, IEventPayload_R2_EVENT_MEDIA_OVERLAY_CLICK,
    IEventPayload_R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, IEventPayload_R2_EVENT_MEDIA_OVERLAY_STARTSTOP,
    IEventPayload_R2_EVENT_MEDIA_OVERLAY_STATE,
    IEventPayload_R2_EVENT_PAGE_TURN, IEventPayload_R2_EVENT_READING_LOCATION,
    IEventPayload_R2_EVENT_READIUMCSS, IEventPayload_R2_EVENT_SCROLLTO,
    IEventPayload_R2_EVENT_SHIFT_VIEW_X, IEventPayload_R2_EVENT_TTS_CLICK_ENABLE,
    IEventPayload_R2_EVENT_TTS_DO_NEXT_OR_PREVIOUS, IEventPayload_R2_EVENT_TTS_DO_PLAY,
    IEventPayload_R2_EVENT_TTS_OVERLAY_ENABLE, IEventPayload_R2_EVENT_TTS_PLAYBACK_RATE,
    IEventPayload_R2_EVENT_TTS_SENTENCE_DETECT_ENABLE, IEventPayload_R2_EVENT_TTS_VOICE,
    IEventPayload_R2_EVENT_TTS_SKIP_ENABLE, R2_EVENT_TTS_SKIP_ENABLE,
    IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN, MediaOverlaysStateEnum, R2_EVENT_AUDIO_SOUNDTRACK, R2_EVENT_CAPTIONS,
    R2_EVENT_CLIPBOARD_COPY, R2_EVENT_DEBUG_VISUALS, R2_EVENT_FXL_CONFIGURE,
    R2_EVENT_HIGHLIGHT_CREATE, R2_EVENT_HIGHLIGHT_REMOVE, R2_EVENT_HIGHLIGHT_REMOVE_ALL,
    /* R2_EVENT_KEYBOARD_FOCUS_REQUEST,*/ R2_EVENT_FOCUS_READING_LOC, R2_EVENT_LINK, R2_EVENT_LOCATOR_VISIBLE,
    R2_EVENT_MEDIA_OVERLAY_CLICK, R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT,
    R2_EVENT_MEDIA_OVERLAY_STARTSTOP, R2_EVENT_MEDIA_OVERLAY_STATE, R2_EVENT_PAGE_TURN, R2_EVENT_PAGE_TURN_RES,
    R2_EVENT_READING_LOCATION, R2_EVENT_READIUMCSS, R2_EVENT_SCROLLTO, R2_EVENT_SHIFT_VIEW_X,
    R2_EVENT_SHOW, R2_EVENT_TTS_CLICK_ENABLE, R2_EVENT_TTS_DO_NEXT, R2_EVENT_TTS_DO_PAUSE,
    R2_EVENT_TTS_DO_PLAY, R2_EVENT_TTS_DO_PREVIOUS, R2_EVENT_TTS_DO_RESUME, R2_EVENT_TTS_DO_STOP,
    R2_EVENT_TTS_OVERLAY_ENABLE, R2_EVENT_TTS_PLAYBACK_RATE, R2_EVENT_TTS_SENTENCE_DETECT_ENABLE,
    R2_EVENT_TTS_VOICE, R2_EVENT_WEBVIEW_KEYDOWN, R2_EVENT_WEBVIEW_KEYUP, R2_EVENT_HIGHLIGHT_DRAW_MARGIN, IEventPayload_R2_EVENT_HIGHLIGHT_DRAW_MARGIN,
    R2_EVENT_IMAGE_CLICK,
    IEventPayload_R2_EVENT_IMAGE_CLICK,
    R2_EVENT_TTS_MEDIAOVERLAYS_MANUAL_PLAY_NEXT,
    IEventPayload_R2_EVENT_TTS_MEDIAOVERLAYS_MANUAL_PLAY_NEXT,
    IEventPayload_R2_EVENT_TTS_HIGHLIGHT_STYLE,
    R2_EVENT_TTS_HIGHLIGHT_STYLE,
    // R2_EVENT_DISABLE_TEMPORARY_NAV_TARGET_OUTLINE,
    // IEventPayload_R2_EVENT_DISABLE_TEMPORARY_NAV_TARGET_OUTLINE,
} from "../../common/events";
import { HighlightDrawTypeOpacityMask, HighlightDrawTypeOpacityMaskRuler, IColor, HighlightDrawTypeNONE, HighlightDrawTypeBackground, HighlightDrawTypeOutline, IHighlightDefinition } from "../../common/highlight";
import { IPaginationInfo } from "../../common/pagination";
import {
    appendCSSInline, configureFixedLayout, injectDefaultCSS, injectReadPosCSS, isPaginated,
} from "../../common/readium-css-inject";
import { sameSelections } from "../../common/selection";
import {
    CLASS_PAGINATED, CSS_CLASS_NO_FOCUS_OUTLINE, HIDE_CURSOR_CLASS, LINK_TARGET_CLASS, LINK_TARGET_ALT_CLASS,
    POPOUTIMAGE_CONTAINER_ID, POPUP_DIALOG_CLASS, POPUP_DIALOG_CLASS_COLLAPSE,
    R2_MO_CLASS_ACTIVE, R2_MO_CLASS_ACTIVE_PLAYBACK, R2_MO_CLASS_PAUSED, R2_MO_CLASS_PLAYING, R2_MO_CLASS_STOPPED, ROOT_CLASS_INVISIBLE_MASK,
    ROOT_CLASS_INVISIBLE_MASK_REMOVED, ROOT_CLASS_KEYBOARD_INTERACT, ROOT_CLASS_MATHJAX,
    ROOT_CLASS_NO_FOOTNOTES, ROOT_CLASS_REDUCE_MOTION, SKIP_LINK_ID, TTS_CLASS_PAUSED, TTS_CLASS_PLAYING, TTS_ID_SPEAKING_DOC_ELEMENT,
    CLASS_HIGHLIGHT_CONTAINER, ROOT_CLASS_NO_RUBY,
    CLASS_HIGHLIGHT_CONTOUR, CLASS_HIGHLIGHT_CONTOUR_MARGIN,
    WebViewSlotEnum, ZERO_TRANSFORM_CLASS, readPosCssStylesAttr1, readPosCssStylesAttr2,
    readPosCssStylesAttr3, readPosCssStylesAttr4,
    ID_HIGHLIGHTS_CONTAINER,
    EXTRA_COLUMN_PAD_ID,
    ENABLE_EXTRA_COLUMN_SHIFT_METHOD,
    ENABLE_VISIBILITY_MASK,
} from "../../common/styles";
import { IPropertyAnimationState, animateProperty } from "../common/animateProperty";
import { uniqueCssSelector } from "../common/cssselector3";

import { getDirection, getLanguage, normalizeText } from "../common/dom-text-utils";
import { easings } from "../common/easings";
import { closePopupDialogs, isPopupDialogOpen } from "../common/popup-dialog";
import { getURLQueryParams } from "../common/querystring";
import { IRect, getClientRectsNoOverlap, DOMRectListToArray } from "../common/rect-utils";
import {
    URL_PARAM_HIGHLIGHTS,
    URL_PARAM_CLIPBOARD_INTERCEPT, URL_PARAM_CSS, URL_PARAM_DEBUG_VISUALS,
    URL_PARAM_EPUBREADINGSYSTEM, URL_PARAM_GOTO, URL_PARAM_GOTO_DOM_RANGE, URL_PARAM_PREVIOUS,
    URL_PARAM_SECOND_WEBVIEW, URL_PARAM_WEBVIEW_SLOT,
    FRAG_ID_CSS_SELECTOR, FRAG_ID_CSS_SELECTOR_ACTIVATE_LINK,
    URL_PARAM_A11Y_SUPPORT_ENABLED,
    URL_PARAM_EPUBMEDIAOVERLAYS,
    FRAG_ID_CSS_SELECTOR_HYPERLINK,
} from "../common/url-params";
import { setupAudioBook } from "./audiobook";
import { INameVersion, setWindowNavigatorEpubReadingSystem } from "./epubReadingSystem";
import {
    createHighlights, destroyAllhighlights, destroyHighlight, destroyHighlightsGroup,
    ENABLE_PAGEBREAK_MARGIN_TEXT_EXPERIMENT,
    HIGHLIGHT_GROUP_PAGEBREAK, HIGHLIGHT_GROUP_TTS,
    recreateAllHighlights, recreateAllHighlightsRaw, setDrawMargin,
} from "./highlight";
import { popoutImage } from "./popoutImages";
import { popupFootNote } from "./popupFootNotes";
import {
    assignUtteranceVoice,
    ttsNext, ttsPause, ttsPlay, ttsPlaybackRate, ttsPrevious, ttsResume, ttsStop, ttsVoices,
} from "./readaloud";
import {
    calculateColumnDimension, calculateMaxScrollShift, calculateTotalColumns, checkHiddenFootNotes,
    computeVerticalRTL, getScrollingElement, isRTL, isTwoPageSpread, isVerticalWritingMode,
    readiumCSS, clearImageZoomOutlineDebounced, clearImageZoomOutline,
    checkHeightConstrainedTables,
} from "./readium-css";
import { clearCurrentSelection, convertRangeInfo, getCurrentSelectionInfo, convertRange, setSelectionChangeAction } from "./selection";
import { ReadiumElectronWebviewWindow } from "./state";
import { convertTextFragmentToRanges, parseTextFragmentDirective } from "./textFragment";

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

const DEBUG_TRACE = true && IS_DEV;

// import { consoleRedirect } from "../common/console-redirect";
if (IS_DEV) {
    // tslint:disable-next-line:no-var-requires
    // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-require-imports
    const cr = require("../common/console-redirect");
    // const releaseConsoleRedirect =
    cr.consoleRedirect("r2:navigator#electron/renderer/webview/preload", process.stdout, process.stderr, true);
}

// import { ENABLE_WEBVIEW_RESIZE } from "../common/webview-resize";

// import { registerProtocol } from "@r2-navigator-js/electron/renderer/common/protocol";
// registerProtocol();

const debug = debug_("r2:navigator#electron/renderer/webview/preload");

let __locEventID = 0;

const INJECTED_LINK_TXT = "__";

const win = global.window as ReadiumElectronWebviewWindow;

win.READIUM2 = {
    // disableTemporaryNavigationTargetOutline: false,
    lastClickedTextChar: undefined,
    DEBUG_VISUALS: false,
    // dialogs = [],
    fxlViewportHeight: 0,
    fxlViewportScale: 1,
    fxlViewportWidth: 0,
    fxlZoomPercent: 0,
    hashElement: null,
    isAudio: false,
    ignorekeyDownUpEvents: false,
    accessibilitySupportEnabled: false,
    isClipboardIntercept: false,
    isFixedLayout: false,
    locationHashOverride: undefined,
    locationHashOverrideInfo: {
        locEventID: undefined,
        audioPlaybackInfo: undefined,
        docInfo: undefined,
        epubPage: undefined,
        epubPageID: undefined,
        headings: undefined,
        href: "",
        locations: {
            cfi: undefined,
            cssSelector: undefined,
            position: undefined,
            progression: undefined,
            xpath: undefined,
        },
        paginationInfo: undefined,
        secondWebViewHref: undefined,
        selectionInfo: undefined,
        selectionIsNew: undefined,
        title: undefined,
        userInteract: false,
    },
    ttsHighlightStyle: HighlightDrawTypeBackground,
    ttsHighlightColor: undefined,
    ttsHighlightColor_WORD: undefined,
    ttsHighlightStyle_WORD: undefined,
    ttsClickEnabled: false,
    ttsOverlayEnabled: false,
    ttsPlaybackRate: 1,
    ttsAndMediaOverlaysManualPlayNext: false,
    ttsSkippabilityEnabled: false,
    ttsSentenceDetectionEnabled: true,
    // mediaOverlaysUseTTSHighlights: false,
    ttsVoices: null,
    urlQueryParams: win.location.search ? getURLQueryParams(win.location.search) : undefined,
    webViewSlot: WebViewSlotEnum.center,
};

// const _winAlert = win.alert;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
win.alert = (...args: any[]) => {
    console.log.apply(win, args);
};
// const _winConfirm = win.confirm;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
win.confirm = (...args: any[]): boolean => {
    console.log.apply(win, args);
    return false;
};
// const _winPrompt = win.prompt;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
win.prompt = (...args: any[]): string => {
    console.log.apply(win, args);
    return "";
};

// CSS pixel tolerance margin to detect "end of document reached" (during "next" page turn / scroll)
// This CSS bug is hard to reproduce consistently, only in Windows it seems, maybe due to display DPI?
// (I observed different outcomes with Virtual Machines in various resolutions, versus hardware laptop/tablet)
const CSS_PIXEL_TOLERANCE = 5;

// setTimeout(() => {
//     if (win.alert) {
//         win.alert("win.alert!");
//     }
//     if (win.confirm) {
//         const ok = win.confirm("win.confirm?");
//         console.log(ok);
//     }
//     // NOT SUPPORTED: fatal error in console.
//     if (win.prompt) {
//         const str = win.prompt("win.prompt:");
//         console.log(str);
//     }
// }, 2000);

setSelectionChangeAction(win, () => {
    if (DEBUG_TRACE) debug("setSelectionChangeAction: notifyReadingLocationDebounced()...");
    // CONTEXT: setSelectionChangeAction
    notifyReadingLocationDebounced(true, false, true); // userInteract assumed (not programmatic)
});

const TOUCH_SWIPE_DELTA_MIN = 80;
const TOUCH_SWIPE_LONG_PRESS_MAX_TIME = 500;
const TOUCH_SWIPE_MAX_TIME = 500;
let touchstartEvent: TouchEvent | undefined;
let touchEventEnd: TouchEvent | undefined;
win.document.addEventListener(
    "touchstart",
    (event: TouchEvent) => {
        if (isPopupDialogOpen(win.document)) {
            touchstartEvent = undefined;
            touchEventEnd = undefined;
            return;
        }
        if (event.changedTouches.length !== 1) {
            return;
        }
        touchstartEvent = event;
    },
    true,
);
win.document.addEventListener(
    "touchend",
    (event: TouchEvent) => {
        if (isPopupDialogOpen(win.document)) {
            touchstartEvent = undefined;
            touchEventEnd = undefined;
            return;
        }
        if (event.changedTouches.length !== 1) {
            return;
        }
        if (!touchstartEvent) {
            return;
        }

        const startTouch = touchstartEvent.changedTouches[0];
        const endTouch = event.changedTouches[0];

        if (!startTouch || !endTouch) {
            return;
        }

        const deltaX =
            (startTouch.clientX - endTouch.clientX) / win.devicePixelRatio;
        const deltaY =
            (startTouch.clientY - endTouch.clientY) / win.devicePixelRatio;

        if (
            Math.abs(deltaX) < TOUCH_SWIPE_DELTA_MIN &&
            Math.abs(deltaY) < TOUCH_SWIPE_DELTA_MIN
        ) {
            if (touchEventEnd) {
                touchstartEvent = undefined;
                touchEventEnd = undefined;
                return;
            }

            if (
                event.timeStamp - touchstartEvent.timeStamp >
                TOUCH_SWIPE_LONG_PRESS_MAX_TIME
            ) {
                touchstartEvent = undefined;
                touchEventEnd = undefined;

                // if (win.document.getSelection()) {
                //     notifyReadingLocationDebounced(true);
                // }
                return;
            }

            touchstartEvent = undefined;
            touchEventEnd = event;
            return;
        }

        touchEventEnd = undefined;

        if (
            event.timeStamp - touchstartEvent.timeStamp >
            TOUCH_SWIPE_MAX_TIME
        ) {
            touchstartEvent = undefined;
            return;
        }

        const slope =
            (startTouch.clientY - endTouch.clientY) /
            (startTouch.clientX - endTouch.clientX);
        if (Math.abs(slope) > 0.5) {
            touchstartEvent = undefined;
            return;
        }

        const rtl = isRTL();
        if (deltaX > 0) {
            // navLeftOrRight(!rtl);
            // navPreviousOrNext(rtl)
            const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
                // direction: rtl ? "RTL" : "LTR",
                go: rtl ? "PREVIOUS" : "NEXT",
                nav: true,
            };
            ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
        } else {
            // navLeftOrRight(rtl);
            // navPreviousOrNext(!rtl)
            const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
                // direction: rtl ? "RTL" : "LTR",
                go: rtl ? "NEXT" : "PREVIOUS",
                nav: true,
            };
            ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
        }

        touchstartEvent = undefined;
    },
    true,
);

function keyDownUpEventHandler(ev: KeyboardEvent, keyDown: boolean) {
    if (win.READIUM2.ignorekeyDownUpEvents) {
        return;
    }
    const elementName = (ev.target && (ev.target as Element).nodeName) ?
        (ev.target as Element).nodeName : "";
    const elementAttributes: { [name: string]: string } = {};
    if (ev.target && (ev.target as Element).attributes) {
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < (ev.target as Element).attributes.length; i++) {
            const attr = (ev.target as Element).attributes[i];
            elementAttributes[attr.name] = attr.value;
        }
    }
    const payload: IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN = { // same as IEventPayload_R2_EVENT_WEBVIEW_KEYUP
        altKey: ev.altKey,
        code: ev.code,
        ctrlKey: ev.ctrlKey,
        elementAttributes,
        elementName,
        key: ev.key,
        metaKey: ev.metaKey,
        shiftKey: ev.shiftKey,
    };
    ipcRenderer.sendToHost(keyDown ? R2_EVENT_WEBVIEW_KEYDOWN : R2_EVENT_WEBVIEW_KEYUP, payload);
}
win.document.addEventListener("keydown", (ev: KeyboardEvent) => {
    keyDownUpEventHandler(ev, true);
}, {
    capture: true,
    once: false,
    passive: false,
});
win.document.addEventListener("keyup", (ev: KeyboardEvent) => {
    keyDownUpEventHandler(ev, false);
}, {
    capture: true,
    once: false,
    passive: false,
});

win.READIUM2.isAudio = win.location.protocol === "data:";

if (win.READIUM2.urlQueryParams) {
    let readiumEpubReadingSystemJson: INameVersion | undefined;

    // tslint:disable-next-line:no-string-literal
    const base64EpubReadingSystem = win.READIUM2.urlQueryParams[URL_PARAM_EPUBREADINGSYSTEM];
    if (base64EpubReadingSystem) {
        try {
            const str = Buffer.from(base64EpubReadingSystem, "base64").toString("utf8");
            readiumEpubReadingSystemJson = JSON.parse(str);
        } catch (err) {
            debug(err);
        }
    }

    if (readiumEpubReadingSystemJson) {
        setWindowNavigatorEpubReadingSystem(win, readiumEpubReadingSystemJson);
    }
    win.READIUM2.DEBUG_VISUALS = win.READIUM2.urlQueryParams[URL_PARAM_DEBUG_VISUALS] === "true";

    win.READIUM2.accessibilitySupportEnabled = win.READIUM2.urlQueryParams[URL_PARAM_A11Y_SUPPORT_ENABLED] === "true";
    win.READIUM2.isClipboardIntercept = win.READIUM2.urlQueryParams[URL_PARAM_CLIPBOARD_INTERCEPT] === "true";

    win.READIUM2.webViewSlot =
        win.READIUM2.urlQueryParams[URL_PARAM_WEBVIEW_SLOT] === "left" ? WebViewSlotEnum.left :
            (win.READIUM2.urlQueryParams[URL_PARAM_WEBVIEW_SLOT] === "right" ? WebViewSlotEnum.right :
                WebViewSlotEnum.center);
}

if (IS_DEV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_DEBUG_VISUALS, (_event: any, payload: IEventPayload_R2_EVENT_DEBUG_VISUALS) => {
        win.READIUM2.DEBUG_VISUALS = payload.debugVisuals;

        if (!payload.debugVisuals) {
            const existings = win.document.querySelectorAll(
                // tslint:disable-next-line:max-line-length
                `*[${readPosCssStylesAttr1}], *[${readPosCssStylesAttr2}], *[${readPosCssStylesAttr3}], *[${readPosCssStylesAttr4}]`);
            existings.forEach((existing) => {
                existing.removeAttribute(`${readPosCssStylesAttr1}`);
                existing.removeAttribute(`${readPosCssStylesAttr2}`);
                existing.removeAttribute(`${readPosCssStylesAttr3}`);
                existing.removeAttribute(`${readPosCssStylesAttr4}`);
            });
            // destroyAllhighlights(win.document);
        }
        if (payload.cssClass) {
            if (_blacklistIdClassForCssSelectors.indexOf(payload.cssClass) < 0) {
                _blacklistIdClassForCssSelectors.push(payload.cssClass.toLowerCase());
            }

            if (payload.debugVisuals && payload.cssStyles && payload.cssStyles.length) {
                const idSuffix = `debug_for_class_${payload.cssClass}`;
                appendCSSInline(win.document, idSuffix, payload.cssStyles);

                if (payload.cssSelector) {
                    const toHighlights = win.document.querySelectorAll(payload.cssSelector);
                    toHighlights.forEach((toHighlight) => {
                        const clazz = `${payload.cssClass}`;
                        if (!toHighlight.classList.contains(clazz)) {
                            toHighlight.classList.add(clazz);
                        }
                    });
                }
            } else {
                // const existings = win.document.querySelectorAll(payload.cssSelector);
                const existings = win.document.querySelectorAll(`.${payload.cssClass}`);
                existings.forEach((existing) => {
                    existing.classList.remove(`${payload.cssClass}`);
                });
            }
        }
    });
}

function isVisible(allowPartial: boolean, element: Element, domRect: DOMRect | undefined): boolean {
    if (DEBUG_TRACE) debug("isVisible:", getCssSelector(element), allowPartial);
    if (DEBUG_TRACE && domRect) debug("isVisible domRect:", domRect.x, domRect.y, domRect.width, domRect.height);

    if (win.READIUM2.isFixedLayout) {
        return true;
    } else if (!win.document || !win.document.documentElement || !win.document.body) {
        return false;
    }
    if (element === win.document.body || element === win.document.documentElement) {
        if (DEBUG_TRACE) debug("isVisible: HTML BODY always true");
        return true;
    }

    const blacklisted = checkBlacklisted(element);
    if (blacklisted) {
        // debug("isVisible blacklisted");
        return false;
    }

    const elStyle = win.getComputedStyle(element);
    if (elStyle) {
        const display = elStyle.getPropertyValue("display");
        if (display === "none") {
            if (IS_DEV) {
                debug("isVisible element DISPLAY NONE");
            }
            // console.log(element.outerHTML);
            return false;
        }
        // Cannot be relied upon, because web browser engine reports
        // invisible when out of view in scrolled columns!!
        // const visibility = elStyle.getPropertyValue("visibility");
        // if (visibility === "hidden") {
        //     if (IS_DEV) {
        //         console.log("element VISIBILITY HIDDEN");
        //     }
        //     console.log(element.outerHTML);
        //     return false;
        // }
        const opacity = elStyle.getPropertyValue("opacity");
        if (opacity === "0") {
            if (IS_DEV) {
                debug("isVisible element OPACITY ZERO");
            }
            // console.log(element.outerHTML);
            return false;
        }
    }

    const scrollElement = getScrollingElement(win.document);

    const isVWM = isVerticalWritingMode();

    if (!isPaginated(win.document)) { // scroll
        // debug("isVisible not isPaginated (scroll");

        const rect = domRect || element.getBoundingClientRect();
        // debug(rect.top);
        // debug(rect.left);
        // debug(rect.width);
        // debug(rect.height);

        // let offset = 0;
        // if (isVerticalWritingMode()) {
        //     offset = ((isRTL() ? -1 : 1) * scrollElement.scrollLeft) + rect.left + (isRTL() ? rect.width : 0);
        // } else {
        //     offset = scrollElement.scrollTop + rect.top;
        // }
        // const progressionRatio = offset /
        //     (isVerticalWritingMode() ? scrollElement.scrollWidth : scrollElement.scrollHeight);

        if (isVWM) {
            if (
                rect.left >= 0 &&
                // (rect.left + rect.width) >= 0 &&
                (rect.left + rect.width) <= win.document.documentElement.clientWidth
                // rect.left <= win.document.documentElement.clientWidth
            ) {
                return true;
            }
            if (allowPartial && (rect.left >= 0 || (rect.left + rect.width) <= win.document.documentElement.clientWidth)) {
                return true;
            }
        } else {
            if (rect.top >= 0 &&
                // (rect.top + rect.height) >= 0 &&
                (rect.top + rect.height) <= win.document.documentElement.clientHeight
                // rect.top <= win.document.documentElement.clientHeight
            ) {
                return true;
            }
            if (allowPartial && (rect.top >= 0 || (rect.top + rect.height) <= win.document.documentElement.clientWidth)) {
                return true;
            }
        }

        // tslint:disable-next-line:max-line-length
        // debug(`isVisible FALSE: clientRect TOP: ${rect.top} -- win.document.documentElement.clientHeight: ${win.document.documentElement.clientHeight}`);
        return false;
    }

    // TODO: vertical writing mode? (paginated)
    if (isVWM) {
        debug("isVisible FALSE VWM paginated");
        return false;
    }

    const scrollLeftPotentiallyExcessive = getScrollOffsetIntoView(element as HTMLElement, domRect);

    // const { maxScrollShift, maxScrollShiftAdjusted } = calculateMaxScrollShift();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extraShift = ENABLE_EXTRA_COLUMN_SHIFT_METHOD ? (scrollElement as any).scrollLeftExtra : 0;
    // extraShift === maxScrollShiftAdjusted - maxScrollShift

    let currentOffset = scrollElement.scrollLeft;
    if (extraShift) {
        currentOffset += (((currentOffset < 0) ? -1 : 1) * extraShift);
    }

    if (scrollLeftPotentiallyExcessive[0] >= (currentOffset - 10) &&
        scrollLeftPotentiallyExcessive[0] <= (currentOffset + 10)) {
        if (DEBUG_TRACE) debug("isVisible TRUE (!!!allowPartial)", scrollLeftPotentiallyExcessive[0], scrollLeftPotentiallyExcessive[1], currentOffset);
        return true;
    }

    if (allowPartial) {
        if (scrollLeftPotentiallyExcessive[1] >= (currentOffset - 10) &&
            scrollLeftPotentiallyExcessive[1] <= (currentOffset + 10)) {
            if (DEBUG_TRACE) debug("isVisible TRUE (allowPartial)", scrollLeftPotentiallyExcessive[0], scrollLeftPotentiallyExcessive[1], currentOffset);
            return true;
        }
    }

    // tslint:disable-next-line:max-line-length
    if (DEBUG_TRACE) debug("isVisible FALSE", scrollLeftPotentiallyExcessive[0], scrollLeftPotentiallyExcessive[1], currentOffset);
    return false;
}
function isVisible_(location: LocatorLocations): boolean {

    let visible = false;
    if (win.READIUM2.isAudio) {
        visible = true;
    } else if (win.READIUM2.isFixedLayout) {
        visible = true;
    } else if (!win.document || !win.document.documentElement || !win.document.body) {
        visible = false;
    } else if (!location || !location.cssSelector) {
        visible = false;
    } else {
        // payload.location.cssSelector = payload.location.cssSelector.replace(/\+/g, " ");
        let selected: Element | null = null;
        try {
            selected = win.document.querySelector(location.cssSelector);
        } catch (err) {
            debug(err);
        }
        if (selected) {
            visible = isVisible(false, selected, undefined); // TODO: domRect of DOM Range in LocatorExtended?
        }
    }
    return visible;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
ipcRenderer.on(R2_EVENT_LOCATOR_VISIBLE, (_event: any, payload: IEventPayload_R2_EVENT_LOCATOR_VISIBLE, eventID: number) => {

    payload.visible = isVisible_(payload.location);
    ipcRenderer.sendToHost(R2_EVENT_LOCATOR_VISIBLE, payload, eventID);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
ipcRenderer.on(R2_EVENT_SCROLLTO, (_event: any, payload: IEventPayload_R2_EVENT_SCROLLTO) => {

    if (DEBUG_TRACE) debug("R2_EVENT_SCROLLTO");

    if (win.READIUM2.isAudio) {
        return;
    }

    showHideContentMask(false, win.READIUM2.isFixedLayout);

    clearCurrentSelection(win);
    closePopupDialogs(win.document);

    // _cancelInitialScrollCheck = true;

    if (!win.READIUM2.urlQueryParams) {
        win.READIUM2.urlQueryParams = {};
    }
    if (payload.isSecondWebView) {
        win.READIUM2.urlQueryParams[URL_PARAM_SECOND_WEBVIEW] = "1";
    } else {
        win.READIUM2.urlQueryParams[URL_PARAM_SECOND_WEBVIEW] = "0";
    }
    if (payload.previous) {
        // tslint:disable-next-line:no-string-literal
        win.READIUM2.urlQueryParams[URL_PARAM_PREVIOUS] = "true";
    } else {
        // tslint:disable-next-line:no-string-literal
        if (typeof win.READIUM2.urlQueryParams[URL_PARAM_PREVIOUS] !== "undefined") {
            // tslint:disable-next-line:no-string-literal
            delete win.READIUM2.urlQueryParams[URL_PARAM_PREVIOUS];
        }
    }
    if (payload.goto) {
        // tslint:disable-next-line:no-string-literal
        win.READIUM2.urlQueryParams[URL_PARAM_GOTO] = payload.goto; // decodeURIComponent
    } else {
        // tslint:disable-next-line:no-string-literal
        if (typeof win.READIUM2.urlQueryParams[URL_PARAM_GOTO] !== "undefined") {
            // tslint:disable-next-line:no-string-literal
            delete win.READIUM2.urlQueryParams[URL_PARAM_GOTO];
        }
    }
    if (payload.gotoDomRange) {
        // tslint:disable-next-line:no-string-literal
        win.READIUM2.urlQueryParams[URL_PARAM_GOTO_DOM_RANGE] = payload.gotoDomRange; // decodeURIComponent
    } else {
        // tslint:disable-next-line:no-string-literal
        if (typeof win.READIUM2.urlQueryParams[URL_PARAM_GOTO_DOM_RANGE] !== "undefined") {
            // tslint:disable-next-line:no-string-literal
            delete win.READIUM2.urlQueryParams[URL_PARAM_GOTO_DOM_RANGE];
        }
    }

    if (win.READIUM2.isFixedLayout) {
        win.READIUM2.locationHashOverride = win.document.body;
        resetLocationHashOverrideInfo();

        const isVWM = isVerticalWritingMode();
        const x = ((isVWM || isRTL()) ? win.document.documentElement.clientWidth - 2 : 1);
        const y = 1;  // (isVWM ? win.document.documentElement.clientHeight - 1 : 0);

        if (DEBUG_TRACE) debug("R2_EVENT_SCROLLTO: processXYRaw()...");
        // CONTEXT: R2_EVENT_SCROLLTO
        processXYRaw(x, y, false, false);

        if (DEBUG_TRACE) debug("R2_EVENT_SCROLLTO: notifyReadingLocationDebounced()...");
        // CONTEXT: R2_EVENT_SCROLLTO
        notifyReadingLocationDebounced();

        return;
    }

    let delayScrollIntoView = false;
    if (payload.hash) {
        debug(".hashElement = 1");
        win.READIUM2.hashElement = win.document.getElementById(payload.hash);
        if (win.READIUM2.DEBUG_VISUALS) {
            if (win.READIUM2.hashElement) {
                // const existings = win.document.querySelectorAll(`*[${readPosCssStylesAttr1}]`);
                // existings.forEach((existing) => {
                //     existing.removeAttribute(`${readPosCssStylesAttr1}`);
                // });
                win.READIUM2.hashElement.setAttribute(readPosCssStylesAttr1, "R2_EVENT_SCROLLTO hashElement");
            }
        }

        win.location.href = "#" + payload.hash;
        delayScrollIntoView = true;

        // unfortunately, does not sync CSS :target pseudo-class :(
        // win.history.replaceState({}, undefined, "#" + payload.hash);
    } else {
        const scrollElement = getScrollingElement(win.document);
        const scrollTop = scrollElement.scrollTop;
        const scrollLeft = scrollElement.scrollLeft;
        win.location.href = "#";
        delayScrollIntoView = true;
        setTimeout(() => {
            debug("location HREF # hash, reset scroll left/top: ", scrollTop, scrollLeft);
            scrollElement.scrollTop = scrollTop;
            scrollElement.scrollLeft = scrollLeft;
        }, 0);
        win.READIUM2.hashElement = null;
    }

    win.READIUM2.locationHashOverride = undefined;
    resetLocationHashOverrideInfo();

    if (delayScrollIntoView) {
        setTimeout(() => {
            if (DEBUG_TRACE) debug("R2_EVENT_SCROLLTO: delayScrollIntoView + scrollToHashRaw()...");
            // CONTEXT: R2_EVENT_SCROLLTO
            scrollToHashRaw(false, true);
        }, 100);
    } else {
        if (DEBUG_TRACE) debug("R2_EVENT_SCROLLTO: !delayScrollIntoView + scrollToHashRaw()...");
        // CONTEXT: R2_EVENT_SCROLLTO
        scrollToHashRaw(false, true);
    }
});

function resetLocationHashOverrideInfo() {
    win.READIUM2.locationHashOverrideInfo = {
        locEventID: undefined,
        audioPlaybackInfo: undefined,
        docInfo: undefined,
        epubPage: undefined,
        epubPageID: undefined,
        headings: undefined,
        href: "",
        locations: {
            cfi: undefined,
            cssSelector: undefined,
            position: undefined,
            progression: undefined,
            xpath: undefined,
        },
        paginationInfo: undefined,
        secondWebViewHref: undefined,
        selectionInfo: undefined,
        selectionIsNew: undefined,
        title: undefined,
        userInteract: false,
    };
}

let _lastAnimState: IPropertyAnimationState | undefined;

function elementCapturesKeyboardArrowKeys(target: Element): boolean {

    let curElement: Node | null = target;
    while (curElement && curElement.nodeType === Node.ELEMENT_NODE) {

        const editable = (curElement as Element).getAttribute("contenteditable");
        if (editable) {
            return true;
        }

        const arrayOfKeyboardCaptureElements = ["input", "textarea", "video", "audio", "select"];
        if (arrayOfKeyboardCaptureElements.indexOf((curElement as Element).tagName.toLowerCase()) >= 0) {
            return true;
        }

        curElement = curElement.parentNode;
    }

    return false;
}

function ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable(): number {

    if (!ENABLE_EXTRA_COLUMN_SHIFT_METHOD) {
        return 0;
    }

    const scrollElement = getScrollingElement(win.document);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (scrollElement as any).scrollLeftExtra;
    if (val === 0) {
        return 0;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (scrollElement as any).scrollLeftExtra = 0;
    ipcRenderer.sendToHost(R2_EVENT_SHIFT_VIEW_X,
        { offset: 0, backgroundColor: undefined } as IEventPayload_R2_EVENT_SHIFT_VIEW_X);
    return val;
}
function ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable(scrollLeftExtra: number) {

    if (!ENABLE_EXTRA_COLUMN_SHIFT_METHOD) {
        return;
    }

    const scrollElement = getScrollingElement(win.document);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (scrollElement as any).scrollLeftExtra = scrollLeftExtra;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scrollLeftExtraBackgroundColor = (scrollElement as any).scrollLeftExtraBackgroundColor;

    ipcRenderer.sendToHost(R2_EVENT_SHIFT_VIEW_X,
        {
            backgroundColor: scrollLeftExtraBackgroundColor ? scrollLeftExtraBackgroundColor : undefined,
            offset: (isRTL() ? 1 : -1) * scrollLeftExtra,
        } as IEventPayload_R2_EVENT_SHIFT_VIEW_X);
}

function ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffset: number, maxScrollShift: number) {

    if (!ENABLE_EXTRA_COLUMN_SHIFT_METHOD) {
        return;
    }

    if (!win || !win.document || !win.document.body || !win.document.documentElement) {
        return;
    }

    const scrollElement = getScrollingElement(win.document);

    let dialogPopup = isPopupDialogOpen(win.document);
    if (dialogPopup) {
        const diagEl = win.document.getElementById(POPUP_DIALOG_CLASS);
        if (diagEl) {
            const isCollapsed = diagEl.classList.contains(POPUP_DIALOG_CLASS_COLLAPSE);
            if (isCollapsed) {
                dialogPopup = false; // override
            }
        }
    }

    const noChange = dialogPopup ||
        !isPaginated(win.document) ||
        !isTwoPageSpread() ||
        isVerticalWritingMode() || // TODO: VWM?
        maxScrollShift <= 0 ||
        Math.abs(scrollOffset) <= maxScrollShift;
    if (noChange) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (scrollElement as any).scrollLeftExtra = 0;

        // console.log(`"""""""""""""""""""""""""""""""" noChange: ${maxScrollShift}`);
        // win.document.documentElement.classList.remove("r2-spread-offset");
        ipcRenderer.sendToHost(R2_EVENT_SHIFT_VIEW_X,
            { offset: 0, backgroundColor: undefined } as IEventPayload_R2_EVENT_SHIFT_VIEW_X);
        return;
    }
    // scrollElement.scrollLeft is maxed-out, we need to simulate further scrolling
    // isRTL() == val < 0
    const extraOffset = Math.abs(scrollOffset) - maxScrollShift;
    // console.log(`"""""""""""""""""""""""""""""""" shiftOffset: ${extraOffset}`);
    // win.document.documentElement.style.setProperty("--r2-spread-offset", `-${shiftOffset}px`);
    // win.document.documentElement.classList.add("r2-spread-offset");
    // if (isRTL()) {
    //     win.document.documentElement.classList.add("r2-rtl");
    // } else {
    //     win.document.documentElement.classList.remove("r2-rtl");
    // }

    // const backgroundColor = win.document.documentElement.style.backgroundColor ?
    //     win.document.documentElement.style.backgroundColor : win.document.body.style.backgroundColor;

    let backgroundColor: string | undefined;
    const docStyle = win.getComputedStyle(win.document.documentElement);
    if (docStyle) {
        backgroundColor = docStyle.getPropertyValue("background-color");
    }
    if (!backgroundColor || backgroundColor === "transparent") {
        const bodyStyle = win.getComputedStyle(win.document.body);
        backgroundColor = bodyStyle.getPropertyValue("background-color");
        if (backgroundColor === "transparent") {
            backgroundColor = undefined;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (scrollElement as any).scrollLeftExtra = extraOffset;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (scrollElement as any).scrollLeftExtraBackgroundColor = backgroundColor;

    ipcRenderer.sendToHost(R2_EVENT_SHIFT_VIEW_X,
        {
            backgroundColor: backgroundColor ? backgroundColor : undefined,
            offset: (isRTL() ? 1 : -1) * extraOffset,
        } as IEventPayload_R2_EVENT_SHIFT_VIEW_X);
}

function onEventPageTurn(payload: IEventPayload_R2_EVENT_PAGE_TURN) {

    if (DEBUG_TRACE) debug("onEventPageTurn");

    let leftRightKeyWasUsedInsideKeyboardCapture = false;
    if (win.document.activeElement &&
        elementCapturesKeyboardArrowKeys(win.document.activeElement)) {

        if (win.document.hasFocus()) {
            leftRightKeyWasUsedInsideKeyboardCapture = true;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const oldDate = (win.document.activeElement as any).r2_leftrightKeyboardTimeStamp;
            if (oldDate) {
                const newDate = new Date();
                const msDiff = newDate.getTime() - oldDate.getTime();
                if (msDiff <= 300) {
                    leftRightKeyWasUsedInsideKeyboardCapture = true;
                }
            }
        }
    }
    if (leftRightKeyWasUsedInsideKeyboardCapture) {
        return;
    }

    clearCurrentSelection(win);
    closePopupDialogs(win.document);

    if (win.READIUM2.isAudio || win.READIUM2.isFixedLayout || !win.document.body) {
        ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
        return;
    }

    if (!win.document || !win.document.documentElement) {
        return;
    }

    const scrollElement = getScrollingElement(win.document);

    const reduceMotion = win.document.documentElement.classList.contains(ROOT_CLASS_REDUCE_MOTION);

    const isPaged = isPaginated(win.document);

    const goPREVIOUS = payload.go === "PREVIOUS"; // any other value is NEXT

    const animationTime = 300;

    if (_lastAnimState && _lastAnimState.animating) {
        win.cancelAnimationFrame(_lastAnimState.id);
        _lastAnimState.object[_lastAnimState.property] = _lastAnimState.destVal;
    }

    const isVWM = isVerticalWritingMode();

    if (!goPREVIOUS) { // goPREVIOUS && isRTL() || !goPREVIOUS && !isRTL()) { // right

        const maxScrollShift = calculateMaxScrollShift().maxScrollShift;
        const maxScrollShiftTolerated = maxScrollShift - CSS_PIXEL_TOLERANCE;

        if (isPaged) {
            const unit = isVWM ?
                (scrollElement as HTMLElement).offsetHeight :
                (scrollElement as HTMLElement).offsetWidth;
            let scrollElementOffset = Math.round(isVWM ?
                scrollElement.scrollTop :
                scrollElement.scrollLeft);
            const isNegative = scrollElementOffset < 0;
            const scrollElementOffsetAbs = Math.abs(scrollElementOffset);
            const fractional = scrollElementOffsetAbs / unit;
            const integral = Math.floor(fractional);
            const decimal = fractional - integral;
            const partial = decimal * unit;
            if (partial <= CSS_PIXEL_TOLERANCE) {
                scrollElementOffset = (isNegative ? -1 : 1) * integral * unit;
            } else if (partial >= (unit - CSS_PIXEL_TOLERANCE)) {
                scrollElementOffset = (isNegative ? -1 : 1) * (integral + 1) * unit;
            }
            if (isVWM && (scrollElementOffsetAbs < maxScrollShiftTolerated) ||
                !isVWM && (scrollElementOffsetAbs < maxScrollShiftTolerated)) {

                const scrollOffsetPotentiallyExcessive_ = isVWM ?
                    (scrollElementOffset + unit) :
                    (scrollElementOffset + (isRTL() ? -1 : 1) * unit);
                // now snap (just in case):
                const nWholes = Math.floor(scrollOffsetPotentiallyExcessive_ / unit); // retains +/- sign
                const scrollOffsetPotentiallyExcessive = nWholes * unit;
                // if (scrollOffsetPotentiallyExcessive !== scrollOffsetPotentiallyExcessive_) {
                // tslint:disable-next-line:max-line-length
                //     console.log(`}}}}}}}}}}}}}}}}1 offset!! ${scrollOffsetPotentiallyExcessive} != ${scrollOffsetPotentiallyExcessive_}`);
                // }

                // if (Math.abs(scrollOffsetPotentiallyExcessive) > maxScrollShift) {
                //     console.log("onEventPageTurn scrollOffset EXCESS");
                // }
                // tslint:disable-next-line:max-line-length
                ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffsetPotentiallyExcessive, maxScrollShift);

                const scrollOffset = (scrollOffsetPotentiallyExcessive < 0 ? -1 : 1) *
                    Math.min(Math.abs(scrollOffsetPotentiallyExcessive), maxScrollShift);

                const targetObj = scrollElement;
                const targetProp = isVWM ? "scrollTop" : "scrollLeft";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    if (DEBUG_TRACE) debug("onEventPageTurn: !goPREVIOUS + isPaged + reduceMotion + scroll?...");
                    targetObj[targetProp] = scrollOffset;
                } else {
                    _ignoreScrollEvent = true;
                    // _lastAnimState = undefined;
                    // (targetObj as HTMLElement).style.transition = "";
                    // (targetObj as HTMLElement).style.transform = "none";
                    // (targetObj as HTMLElement).style.transition =
                    //     `transform ${animationTime}ms ease-in-out 0s`;
                    // (targetObj as HTMLElement).style.transform =
                    //     vwm ?
                    //     `translateY(${unit}px)` :
                    //     `translateX(${(isRTL() ? -1 : 1) * unit}px)`;
                    // setTimeout(() => {
                    //     (targetObj as HTMLElement).style.transition = "";
                    //     (targetObj as HTMLElement).style.transform = "none";
                    //     targetObj[targetProp] = scrollOffset;
                    // }, animationTime);
                    _lastAnimState = animateProperty(
                        win.cancelAnimationFrame,
                        // undefined,
                        (_cancelled: boolean) => {
                            // debug(cancelled);
                            _ignoreScrollEvent = false;

                            if (DEBUG_TRACE) debug("onEventPageTurn: !goPREVIOUS + isPaged + !reduceMotion + onScrollDebounced()...");
                            // CONTEXT: onEventPageTurn()
                            onScrollDebounced();
                        },
                        targetProp,
                        animationTime,
                        targetObj,
                        scrollOffset,
                        win.requestAnimationFrame,
                        easings.easeInOutQuad,
                    );
                }
                payload.go = "";
                // payload.direction = "";
                ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
                return;
            }
        } else {
            if (isVWM && (Math.abs(scrollElement.scrollLeft) < (maxScrollShiftTolerated - CSS_PIXEL_TOLERANCE)) ||
                !isVWM && (Math.abs(scrollElement.scrollTop) < (maxScrollShiftTolerated - CSS_PIXEL_TOLERANCE))) {
                const newVal = isVWM ?
                    (scrollElement.scrollLeft + (isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (scrollElement.scrollTop + win.document.documentElement.clientHeight);

                const targetObj = scrollElement;
                const targetProp = isVWM ? "scrollLeft" : "scrollTop";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    if (DEBUG_TRACE) debug("onEventPageTurn: !goPREVIOUS + !isPaged + reduceMotion + scroll?...");
                    targetObj[targetProp] = newVal;
                } else {
                    _ignoreScrollEvent = true;
                    _lastAnimState = animateProperty(
                        win.cancelAnimationFrame,
                        // undefined,
                        (_cancelled: boolean) => {
                            // debug(cancelled);
                            _ignoreScrollEvent = false;

                            if (DEBUG_TRACE) debug("onEventPageTurn: !goPREVIOUS + !isPaged + !reduceMotion + onScrollDebounced()...");
                            // CONTEXT: onEventPageTurn()
                            onScrollDebounced();
                        },
                        targetProp,
                        animationTime,
                        targetObj,
                        newVal,
                        win.requestAnimationFrame,
                        easings.easeInOutQuad,
                    );
                }
                payload.go = "";
                // payload.direction = "";
                ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
                return;
            }
        }
    } else if (goPREVIOUS) { //  && !isRTL() || !goPREVIOUS && isRTL()) { // left
        if (isPaged) {
            const unit = isVWM ?
                (scrollElement as HTMLElement).offsetHeight :
                (scrollElement as HTMLElement).offsetWidth;
            let scrollElementOffset = Math.round(isVWM ?
                scrollElement.scrollTop :
                scrollElement.scrollLeft);
            const isNegative = scrollElementOffset < 0;
            const scrollElementOffsetAbs = Math.abs(scrollElementOffset);
            const fractional = scrollElementOffsetAbs / unit;
            const integral = Math.floor(fractional);
            const decimal = fractional - integral;
            const partial = decimal * unit;
            if (partial <= CSS_PIXEL_TOLERANCE) {
                scrollElementOffset = (isNegative ? -1 : 1) * integral * unit;
            } else if (partial >= (unit - CSS_PIXEL_TOLERANCE)) {
                scrollElementOffset = (isNegative ? -1 : 1) * (integral + 1) * unit;
            }
            if (isVWM && (scrollElementOffsetAbs > 0) ||
                !isVWM && (scrollElementOffsetAbs > 0)) {

                const scrollOffset_ = isVWM ?
                    (scrollElementOffset - unit) :
                    (scrollElementOffset - (isRTL() ? -1 : 1) * unit);
                // now snap (just in case):
                // retains +/- sign
                const nWholes = isRTL() ? Math.floor(scrollOffset_ / unit) : Math.ceil(scrollOffset_ / unit);
                const scrollOffset = nWholes * unit;
                // if (scrollOffset !== scrollOffset_) {
                //     // tslint:disable-next-line:max-line-length
                //     console.log(`}}}}}}}}}}}}}}}}2 offset!! ${scrollOffset} != ${scrollOffset_}`);
                // }

                // zero reset
                ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffset, 0);

                const targetObj = scrollElement;
                const targetProp = isVWM ? "scrollTop" : "scrollLeft";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    if (DEBUG_TRACE) debug("onEventPageTurn: goPREVIOUS + isPaged + reduceMotion + scroll?...");
                    targetObj[targetProp] = scrollOffset;
                } else {
                    _ignoreScrollEvent = true;
                    _lastAnimState = animateProperty(
                        win.cancelAnimationFrame,
                        // undefined,
                        (_cancelled: boolean) => {
                            // debug(cancelled);
                            _ignoreScrollEvent = false;

                            if (DEBUG_TRACE) debug("onEventPageTurn: goPREVIOUS + isPaged + !reduceMotion + onScrollDebounced()...");
                            // CONTEXT: onEventPageTurn()
                            onScrollDebounced();
                        },
                        targetProp,
                        animationTime,
                        targetObj,
                        scrollOffset,
                        win.requestAnimationFrame,
                        easings.easeInOutQuad,
                    );
                }
                payload.go = "";
                // payload.direction = "";
                ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
                return;
            }
        } else {
            if (isVWM && (Math.abs(scrollElement.scrollLeft) > CSS_PIXEL_TOLERANCE) ||
                !isVWM && (Math.abs(scrollElement.scrollTop) > CSS_PIXEL_TOLERANCE)) {
                const newVal = isVWM ?
                    (scrollElement.scrollLeft - (isRTL() ? -1 : 1) * win.document.documentElement.clientWidth) :
                    (scrollElement.scrollTop - win.document.documentElement.clientHeight);

                const targetObj = scrollElement;
                const targetProp = isVWM ? "scrollLeft" : "scrollTop";
                if (reduceMotion) {
                    _lastAnimState = undefined;
                    if (DEBUG_TRACE) debug("onEventPageTurn: goPREVIOUS + !isPaged + reduceMotion + scroll?...");
                    targetObj[targetProp] = newVal;
                } else {
                    _ignoreScrollEvent = true;
                    _lastAnimState = animateProperty(
                        win.cancelAnimationFrame,
                        // undefined,
                        (_cancelled: boolean) => {
                            // debug(cancelled);
                            _ignoreScrollEvent = false;

                            if (DEBUG_TRACE) debug("onEventPageTurn: goPREVIOUS + !isPaged + !reduceMotion + onScrollDebounced()...");
                            // CONTEXT: onEventPageTurn()
                            onScrollDebounced();
                        },
                        targetProp,
                        animationTime,
                        targetObj,
                        newVal,
                        win.requestAnimationFrame,
                        easings.easeInOutQuad,
                    );
                }
                payload.go = "";
                // payload.direction = "";
                ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
                return;
            }
        }
    }

    ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
ipcRenderer.on(R2_EVENT_PAGE_TURN, (_event: any, payload: IEventPayload_R2_EVENT_PAGE_TURN) => {
    if (DEBUG_TRACE) debug("R2_EVENT_PAGE_TURN");

    focusScrollDebounced.clear();
    // processXYDebounced.clear();
    processXYDebouncedImmediate.clear();
    notifyReadingLocationDebounced.clear();
    notifyReadingLocationDebouncedImmediate.clear();
    scrollToHashDebounced.clear();
    onScrollDebounced.clear();
    // onResizeDebounced.clear();
    handleFocusInDebounced.clear();
    // mediaOverlaysClickDebounced.clear();

    // Because 'r2_leftrightKeyboardTimeStamp' is set AFTER the main window left/right keyboard handler!
    setTimeout(() => { // we could debounce too?
        if (DEBUG_TRACE) debug("R2_EVENT_PAGE_TURN: onEventPageTurn()...");
        onEventPageTurn(payload);
    }, 100);
});

// +R2_EVENT_KEYBOARD_FOCUS_REQUEST
function focusElement(element: Element, preventScroll: boolean /*, focusHost: boolean */) {

    if (DEBUG_TRACE) debug("focusElement", getCssSelector(element));

    if (preventScroll &&
        (
        // win.READIUM2.focussedElement ??
        element === win.document.activeElement
        // || element === win.READIUM2.locationHashOverride
        )
    ) {
        if (DEBUG_TRACE) debug("focusElement: preventScroll && document.activeElement");
        return;
    }

    // const tabbables = lazyTabbables();
    if (element === win.document.body || !isFocusable(element as HTMLElement)) {
        const attr = (element as HTMLElement).getAttribute("tabindex");
        if (!attr) {
            (element as HTMLElement).setAttribute("tabindex", "-1");
            (element as HTMLElement).classList.add(CSS_CLASS_NO_FOCUS_OUTLINE);
            if (DEBUG_TRACE) debug("focusElement: tabindex -1");
        }
    }

    if (element === win.document.body) {
        // const attr = (element as HTMLElement).getAttribute("tabindex");
        // if (!attr) {
        //     (element as HTMLElement).setAttribute("tabindex", "-1");
        //     (element as HTMLElement).classList.add(CSS_CLASS_NO_FOCUS_OUTLINE);
        //     if (IS_DEV) {
        //         debug("tabindex -1 set BODY (focusable):");
        //         debug(getCssSelector(element));
        //     }
        // }
        if (DEBUG_TRACE) debug("focusElement: body, preventScroll");
        _ignoreFocusInEvent = true;
        // CONTEXT: focusElement()
        (element as HTMLElement).focus({preventScroll: true});
    } else {
        if (DEBUG_TRACE) debug("focusElement: !body, preventScroll?", preventScroll);
        _ignoreFocusInEvent = true;
        // CONTEXT: focusElement()
        (element as HTMLElement).focus({preventScroll});
    }

    // if (focusHost) {
    //     // win.blur();
    //     // win.focus();
    //     // const payload: IEventPayload_R2_EVENT_KEYBOARD_FOCUS_REQUEST = {
    //     // };
    //     ipcRenderer.sendToHost(R2_EVENT_KEYBOARD_FOCUS_REQUEST, null);
    // }
}

const tempLinkTargetOutline = (element: Element, time: number, alt: boolean) => {
    if (DEBUG_TRACE) debug("tempLinkTargetOutline", getCssSelector(element));

    // if (win.READIUM2.disableTemporaryNavigationTargetOutline) {
    //     return;
    // }
    if (win.document.documentElement.classList.contains(DISABLE_TEMPORARY_NAV_TARGET_OUTLINE_CLASS)
        ||
        win.document.documentElement.classList.contains(TTS_CLASS_PLAYING)
        ||
        win.document.documentElement.classList.contains(TTS_CLASS_PAUSED)
    ) {
        return;
    }

    let skip = false;
    const targets = win.document.querySelectorAll(`.${LINK_TARGET_CLASS}`);
    targets.forEach((t) => {
        if (alt && !t.classList.contains(LINK_TARGET_ALT_CLASS)) {
            skip = true;
            return;
        }
        // (t as HTMLElement).style.animationPlayState = "paused";
        t.classList.remove(LINK_TARGET_CLASS);
        t.classList.remove(LINK_TARGET_ALT_CLASS);
    });
    if (skip) {
        return;
    }

    (element as HTMLElement).style.animation = "none";
    // trigger layout to restart animation
    // tslint:disable-next-line: no-unused-expression
    void (element as HTMLElement).offsetWidth;
    (element as HTMLElement).style.animation = "";

    element.classList.add(LINK_TARGET_CLASS);
    if (alt) {
        element.classList.add(LINK_TARGET_ALT_CLASS);
    }

    // (element as HTMLElement).style.animationPlayState = "running";

    // if (!(element as any)._TargetAnimationEnd) {
    //     (element as any)._TargetAnimationEnd = (ev: Event) => {
    //         debug("ANIMATION END");
    //         (ev.target as HTMLElement).style.animationPlayState = "paused";
    //     };
    //     element.addEventListener("animationEnd", (element as any)._TargetAnimationEnd);
    // }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((element as any)._timeoutTargetClass) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clearTimeout((element as any)._timeoutTargetClass);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (element as any)._timeoutTargetClass = undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (element as any)._timeoutTargetClass = setTimeout(() => {
        // debug("ANIMATION TIMEOUT REMOVE");
        // (element as HTMLElement).style.animationPlayState = "paused";
        element.classList.remove(LINK_TARGET_CLASS);
        element.classList.remove(LINK_TARGET_ALT_CLASS);
    }, time);
};

let _lastAnimState2: IPropertyAnimationState | undefined;
const animationTime2 = 400;

function scrollElementIntoView(element: Element, doFocus: boolean, animate: boolean, domRect: DOMRect | undefined, center?: boolean /*, focusHost: boolean */) {

    if (DEBUG_TRACE) debug("scrollElementIntoView", getCssSelector(element));

    if (win.READIUM2.DEBUG_VISUALS) {
        const existings = win.document.querySelectorAll(`*[${readPosCssStylesAttr3}]`);
        existings.forEach((existing) => {
            existing.removeAttribute(`${readPosCssStylesAttr3}`);
        });
        element.setAttribute(readPosCssStylesAttr3, "scrollElementIntoView");
    }

    if (win.READIUM2.isFixedLayout) {
        if (DEBUG_TRACE) debug("scrollElementIntoView: isFixedLayout");
        return;
    }

    if (doFocus) {
        tempLinkTargetOutline(element, 2000, false);

        if (DEBUG_TRACE) debug("scrollElementIntoView: doFocus + focusElement()");
        // CONTEXT: scrollElementIntoView()
        focusElement(element, !!domRect /*, focusHost */);
    }

    setTimeout(() => {
        const isPaged = isPaginated(win.document);
        if (isPaged) {
            if (DEBUG_TRACE) debug("scrollElementIntoView: isPaged + scrollIntoView()");
            scrollIntoView(element as HTMLElement, domRect);
        } else {
            const scrollElement = getScrollingElement(win.document);
            const rect = domRect || element.getBoundingClientRect();
            // calculateMaxScrollShift()

            if (!center && isVisible(false, element, domRect)) {
                if (DEBUG_TRACE) debug("scrollElementIntoView: !center && isVisible");
            } else {
                const isVWM = isVerticalWritingMode();
                const scrollTopMax = isVWM ?
                    (isRTL() ? -1 : 1) * (scrollElement.scrollWidth - win.document.documentElement.clientWidth) :
                    scrollElement.scrollHeight - win.document.documentElement.clientHeight;

                let offset = isVWM ?
                    scrollElement.scrollLeft + (rect.left - (win.document.documentElement.clientWidth / 2) + (center ? (rect.width / 2) : 0)) :
                    scrollElement.scrollTop + (rect.top - (win.document.documentElement.clientHeight / 2) + (center ? (rect.height / 2) : 0));

                if (isVWM && isRTL()) {
                    if (offset < scrollTopMax) {
                        offset = scrollTopMax;
                    } else if (offset > 0) {
                        offset = 0;
                    }
                } else {
                    if (offset > scrollTopMax) {
                        offset = scrollTopMax;
                    } else if (offset < 0) {
                        offset = 0;
                    }
                }

                const diff = Math.abs((isVWM ? scrollElement.scrollLeft : scrollElement.scrollTop) - offset);
                if (diff < 10) {
                    return; // prevents jittering
                }

                const targetProp = isVWM ? "scrollLeft" : "scrollTop";
                if (animate) {
                    const reduceMotion = win.document.documentElement.classList.contains(ROOT_CLASS_REDUCE_MOTION);

                    if (_lastAnimState2 && _lastAnimState2.animating) {
                        win.cancelAnimationFrame(_lastAnimState2.id);
                        _lastAnimState2.object[_lastAnimState2.property] = _lastAnimState2.destVal;
                    }

                    // scrollElement.scrollTop = offset;
                    const targetObj = scrollElement;
                    if (reduceMotion) {
                        _lastAnimState2 = undefined;
                        if (DEBUG_TRACE) debug("scrollElementIntoView: animate + reduceMotion + scroll?...");
                        targetObj[targetProp] = offset;
                    } else {
                        _ignoreScrollEvent = true;
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
                        _lastAnimState2 = animateProperty(
                            win.cancelAnimationFrame,
                            // undefined,
                            (_cancelled: boolean) => {
                                // debug(cancelled);
                                _ignoreScrollEvent = false;
                                if (DEBUG_TRACE) debug("scrollElementIntoView: animate + !reduceMotion + onScrollDebounced()...");
                                // CONTEXT: scrollElementIntoView()
                                onScrollDebounced();
                            },
                            targetProp,
                            animationTime2,
                            targetObj,
                            offset,
                            win.requestAnimationFrame,
                            easings.easeInOutQuad,
                        );
                    }
                } else {
                    if (DEBUG_TRACE) debug("scrollElementIntoView: !animate + scroll?...");
                    scrollElement[targetProp] = offset;
                }

                // element.scrollIntoView({
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
    },
    // doFocus ? 100 : 0
    0,
    );
}

// TODO: vertical writing mode
function getScrollOffsetIntoView(element: HTMLElement, domRect: DOMRect | undefined): [number, number] {
    if (!win.document || !win.document.documentElement || !win.document.body ||
        !isPaginated(win.document) || isVerticalWritingMode()) {
        return [0, 0];
    }

    const scrollElement = getScrollingElement(win.document);
    // debug("getScrollOffsetIntoView scrollElement == documentElement?", scrollElement === win.document.documentElement);

    const rect = domRect || element.getBoundingClientRect();
    // debug("getScrollOffsetIntoView RECT", !!domRect, rect.left, rect.width);

    const columnDimension = calculateColumnDimension();
    // debug("getScrollOffsetIntoView columnDimension", columnDimension);

    const isTwoPage = isTwoPageSpread();
    // debug("getScrollOffsetIntoView isTwoPage", isTwoPage);

    const fullOffset =
        (
        isRTL() ?
        ((columnDimension * (isTwoPage ? 2 : 1)) - (rect.left + rect.width)) :
        rect.left
        )
        +
        ((isRTL() ? -1 : 1) * scrollElement.scrollLeft);
    // debug("getScrollOffsetIntoView fullOffset", fullOffset, scrollElement.scrollLeft);

    const columnIndex = Math.floor(fullOffset / columnDimension); // 0-based index
    // debug("getScrollOffsetIntoView columnIndex", columnIndex);

    const spreadIndex = isTwoPage ? Math.floor(columnIndex / 2) : columnIndex; // 0-based index
    // debug("getScrollOffsetIntoView spreadIndex", spreadIndex);

    const off = (isRTL() ? -1 : 1) * (spreadIndex * (columnDimension * (isTwoPage ? 2 : 1)));
    // debug("getScrollOffsetIntoView off", off);

    const fullOffsetEnd = fullOffset + ((isRTL() ? 1 : 1) * rect.width);
    // debug("getScrollOffsetIntoView fullOffsetEnd", fullOffsetEnd);

    const columnIndexEnd = Math.floor(fullOffsetEnd / columnDimension); // 0-based index
    // debug("getScrollOffsetIntoView columnIndexEnd", columnIndexEnd);

    const spreadIndexEnd = isTwoPage ? Math.floor(columnIndexEnd / 2) : columnIndexEnd; // 0-based index
    // debug("getScrollOffsetIntoView spreadIndexEnd", spreadIndexEnd);

    const offEnd = (isRTL() ? -1 : 1) * (spreadIndexEnd * (columnDimension * (isTwoPage ? 2 : 1)));
    // debug("getScrollOffsetIntoView offEnd", offEnd);

    return [off, offEnd];
}

// TODO: vertical writing mode
function scrollIntoView(element: HTMLElement, domRect: DOMRect | undefined) {
    if (!win.document || !win.document.documentElement || !win.document.body || !isPaginated(win.document)) {
        return;
    }
    const maxScrollShift = calculateMaxScrollShift().maxScrollShift;
    const scrollLeftPotentiallyExcessive = getScrollOffsetIntoView(element, domRect);
    // if (Math.abs(scrollLeftPotentiallyExcessive) > maxScrollShift) {
    //     console.log("getScrollOffsetIntoView scrollLeft EXCESS");
    // }
    ensureTwoPageSpreadWithOddColumnsIsOffset(scrollLeftPotentiallyExcessive[0], maxScrollShift);

    const scrollElement = getScrollingElement(win.document);

    // scrollLeft is capped at maxScrollShift by the browser engine
    const scrollOffset = (scrollLeftPotentiallyExcessive[0] < 0 ? -1 : 1) *
        Math.min(Math.abs(scrollLeftPotentiallyExcessive[0]), maxScrollShift);
    scrollElement.scrollLeft = scrollOffset;
    scrollElement.scrollTop = 0; // edge-case, see win.location.href = "#" in R2_EVENT_SCROLLTO handler
}

const scrollToHashRaw = (animate: boolean, skipRedraw?: boolean) => {
    if (DEBUG_TRACE) debug("scrollToHashRaw");

    if (!win.document || !win.document.body || !win.document.documentElement) {
        return;
    }

    if (!skipRedraw) {
        if (DEBUG_TRACE) debug("scrollToHashRaw: recreateAllHighlightsRaw()...");
        recreateAllHighlightsRaw(win);
    }

    // if (win.READIUM2.isFixedLayout) {
    //     debug("scrollToHashRaw skipped, FXL");
    //     return;
    // }

    const isPaged = isPaginated(win.document);

    const isVWM = isVerticalWritingMode();

    if (win.READIUM2.locationHashOverride) {
        // if (win.READIUM2.locationHashOverride === win.document.body) {
        //     notifyReadingLocationDebounced();
        //     return;
        // }
        // _ignoreScrollEvent = true;

        if (DEBUG_TRACE) debug("scrollToHashRaw: locationHashOverride + scrollElementIntoView()...");
        // CONTEXT: scrollToHashRaw()
        scrollElementIntoView(win.READIUM2.locationHashOverride, true, animate, undefined /*, false */);

        if (DEBUG_TRACE) debug("scrollToHashRaw: locationHashOverride + notifyReadingLocationDebounced()...");
        // CONTEXT: scrollToHashRaw()
        notifyReadingLocationDebounced();
        return;
    } else if (win.READIUM2.hashElement) {
        win.READIUM2.locationHashOverride = win.READIUM2.hashElement;

        // _ignoreScrollEvent = true;

        if (DEBUG_TRACE) debug("scrollToHashRaw: hashElement + scrollElementIntoView()...");
        // CONTEXT: scrollToHashRaw()
        scrollElementIntoView(win.READIUM2.hashElement, true, animate, undefined /*, false */);

        if (DEBUG_TRACE) debug("scrollToHashRaw: hashElement + notifyReadingLocationDebounced()...");
        // CONTEXT: scrollToHashRaw()
        notifyReadingLocationDebounced();
        return;
    } else {
        const scrollElement = getScrollingElement(win.document);

        if (win.READIUM2.urlQueryParams) {
            // tslint:disable-next-line:no-string-literal
            const previous = win.READIUM2.urlQueryParams[URL_PARAM_PREVIOUS];
            const isPreviousNavDirection = previous === "true";
            if (isPreviousNavDirection) {
                const { maxScrollShift, maxScrollShiftAdjusted } = calculateMaxScrollShift();

                _ignoreScrollEvent = true;
                if (isPaged) {
                    if (isVWM) {
                        scrollElement.scrollLeft = 0;
                        scrollElement.scrollTop = maxScrollShift;
                    } else {
                        const scrollLeftPotentiallyExcessive = (isRTL() ? -1 : 1) * maxScrollShiftAdjusted;
                        // tslint:disable-next-line:max-line-length
                        ensureTwoPageSpreadWithOddColumnsIsOffset(scrollLeftPotentiallyExcessive, maxScrollShift);
                        const scrollLeft = (isRTL() ? -1 : 1) * maxScrollShift;
                        scrollElement.scrollLeft = scrollLeft;
                        scrollElement.scrollTop = 0;
                    }
                } else {
                    if (isVWM) {
                        scrollElement.scrollLeft = (isRTL() ? -1 : 1) * maxScrollShift;
                        scrollElement.scrollTop = 0;
                    } else {
                        scrollElement.scrollLeft = 0;
                        scrollElement.scrollTop = maxScrollShift;
                    }
                }

                win.READIUM2.locationHashOverride = undefined;
                resetLocationHashOverrideInfo();

                setTimeout(() => {

                    // relative to fixed window top-left corner
                    // const y = (isPaged ?
                    //     (vwm ?
                    //         win.document.documentElement.offsetWidth :
                    //         win.document.documentElement.offsetHeight) :
                    //     (vwm ?
                    //         win.document.documentElement.clientWidth :
                    //         win.document.documentElement.clientHeight))
                    // - 1;
                    // processXYRaw(0, y, true);

                    // const isVWM = isVerticalWritingMode();
                    const x = ((isVWM || isRTL()) ? win.document.documentElement.clientWidth - 2 : 1);
                    const y = 1;  // (isVWM ? win.document.documentElement.clientHeight - 1 : 0);

                    if (DEBUG_TRACE) debug("scrollToHashRaw: urlQueryParams + isPreviousNavDirection + processXYRaw()...");
                    // CONTEXT: scrollToHashRaw
                    processXYRaw(x, y, false, false);

                    showHideContentMask(false, win.READIUM2.isFixedLayout);

                    if (!win.READIUM2.locationHashOverride) { // already in processXYRaw()

                        if (DEBUG_TRACE) debug("scrollToHashRaw: urlQueryParams + isPreviousNavDirection + notifyReadingLocationDebounced()...");
                        // CONTEXT: scrollToHashRaw()
                        notifyReadingLocationDebounced();
                    }

                    setTimeout(() => {
                        _ignoreScrollEvent = false;
                    }, 10);
                }, 60);
                return;
            }

            // tslint:disable-next-line:no-string-literal
            const gto = win.READIUM2.urlQueryParams[URL_PARAM_GOTO];
            let gotoCssSelector: string | undefined;
            let gotoProgression: number | undefined;
            if (gto) {
                // decodeURIComponent
                const locStr = Buffer.from(gto, "base64").toString("utf8");
                const locObj = JSON.parse(locStr) as LocatorLocations;
                gotoCssSelector = locObj.cssSelector;
                gotoProgression = locObj.progression;
            }
            if (gotoCssSelector) {
                gotoCssSelector = gotoCssSelector.replace(/\+/g, " ");

                let doHyperlink = false;
                if (gotoCssSelector.startsWith(FRAG_ID_CSS_SELECTOR_HYPERLINK)) {
                    doHyperlink = true;
                    gotoCssSelector = gotoCssSelector.replace(FRAG_ID_CSS_SELECTOR_HYPERLINK, "");
                }

                let selected: Element | null = null;
                try {
                    selected = win.document.querySelector(gotoCssSelector);
                } catch (err) {
                    debug(err);
                }
                if (selected) {
                    win.READIUM2.locationHashOverride = selected;
                    debug(".hashElement = 2");
                    win.READIUM2.hashElement = selected;

                    resetLocationHashOverrideInfo();
                    if (win.READIUM2.locationHashOverrideInfo) {
                        win.READIUM2.locationHashOverrideInfo.locations.cssSelector = gotoCssSelector;
                    }

                    let domRect: DOMRect | undefined;
                    // tslint:disable-next-line:no-string-literal
                    const gtoDomRange = win.READIUM2.urlQueryParams[URL_PARAM_GOTO_DOM_RANGE];
                    if (gtoDomRange) {
                        try {
                            // decodeURIComponent
                            const rangeInfoStr = Buffer.from(gtoDomRange, "base64").toString("utf8");
                            const rangeInfo = JSON.parse(rangeInfoStr);
                            debug("rangeInfo", rangeInfo);
                            const domRange = convertRangeInfo(win.document, rangeInfo);
                            if (domRange) {
                                domRect = domRange.getBoundingClientRect();
                            }
                        } catch (err) {
                            debug("gtoDomRange", err);
                        }
                    }

                    // _ignoreScrollEvent = true;

                    if (DEBUG_TRACE) debug("scrollToHashRaw: urlQueryParams + gotoCssSelector + scrollElementIntoView()...");
                    // CONTEXT: scrollToHashRaw()
                    scrollElementIntoView(selected, true, animate, domRect /*, false */);

                    if (DEBUG_TRACE) debug("scrollToHashRaw: urlQueryParams + gotoCssSelector + notifyReadingLocationDebounced()...");
                    // CONTEXT: scrollToHashRaw()
                    notifyReadingLocationDebounced();

                    if (doHyperlink && selected.tagName?.toLowerCase() === "a") {
                        setTimeout(() => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (selected as any).__skipHistory = true;
                            (selected as HTMLLinkElement).click();
                        }, 100);
                    }
                    return;
                }
            } else if (typeof gotoProgression !== "undefined") {
                const { maxScrollShift } = calculateMaxScrollShift();

                if (isPaged) {
                    const isTwoPage = isTwoPageSpread();
                    const nColumns = calculateTotalColumns();
                    const nUnits = isTwoPage ? Math.ceil(nColumns / 2) : nColumns;
                    const unitIndex = Math.floor(gotoProgression * nUnits);

                    const unit = isVWM ?
                        (scrollElement as HTMLElement).offsetHeight :
                        (scrollElement as HTMLElement).offsetWidth;

                    const scrollOffsetPotentiallyExcessive = isVWM ?
                        (unitIndex * unit) :
                        ((isRTL() ? -1 : 1) * unitIndex * unit);

                    // tslint:disable-next-line:max-line-length
                    ensureTwoPageSpreadWithOddColumnsIsOffset(scrollOffsetPotentiallyExcessive, maxScrollShift);

                    const scrollOffsetPaged = (scrollOffsetPotentiallyExcessive < 0 ? -1 : 1) *
                        Math.min(Math.abs(scrollOffsetPotentiallyExcessive), maxScrollShift);

                    debug("gotoProgression, set scroll left/top (paged): ", scrollOffsetPaged);
                    // debug("gotoProgression", gotoProgression);
                    // debug("maxScrollShift", maxScrollShift);
                    // debug("isTwoPage", isTwoPage);
                    // debug("nColumns", nColumns);
                    // debug("nUnits", nUnits);
                    // debug("unitIndex", unitIndex);
                    // debug("unit", unit);
                    // debug("scrollOffsetPotentiallyExcessive", scrollOffsetPotentiallyExcessive);
                    // debug("scrollOffsetPaged", scrollOffsetPaged);

                    _ignoreScrollEvent = true;
                    if (isVWM) {
                        scrollElement.scrollTop = scrollOffsetPaged;
                        scrollElement.scrollLeft = 0;
                    } else {
                        scrollElement.scrollTop = 0;
                        scrollElement.scrollLeft = scrollOffsetPaged;
                    }
                    setTimeout(() => {
                        _ignoreScrollEvent = false;
                    }, 10);

                    win.READIUM2.locationHashOverride = win.document.body;
                    resetLocationHashOverrideInfo();

                    if (DEBUG_TRACE) debug("scrollToHashRaw: urlQueryParams + gotoProgression + isPaged + focusElement()...");
                    // CONTEXT: scrollToHashRaw()
                    focusElement(win.READIUM2.locationHashOverride, false /*, false */);

                    // const isVWM = isVerticalWritingMode();
                    const x = ((isVWM || isRTL()) ? win.document.documentElement.clientWidth - 2 : 1);
                    const y = 1;  // (isVWM ? win.document.documentElement.clientHeight - 1 : 0);

                    if (DEBUG_TRACE) debug("scrollToHashRaw: urlQueryParams + gotoProgression + isPaged + processXYRaw()...");
                    // CONTEXT: scrollToHashRaw
                    processXYRaw(x, y, false, false);

                    if (!win.READIUM2.locationHashOverride) { // already in processXYRaw()
                        if (DEBUG_TRACE) debug("scrollToHashRaw: urlQueryParams + gotoProgression + isPaged + notifyReadingLocationDebounced()...");
                        // CONTEXT: scrollToHashRaw()
                        notifyReadingLocationDebounced();
                    }
                    return;
                } // !isPaged

                const scrollOffset = gotoProgression * maxScrollShift;

                // console.log(`DEBUGxx maxScrollShift: ${maxScrollShift}`);
                // console.log(`DEBUGxx gotoProgression: ${gotoProgression}`);
                // console.log(`DEBUGxx scrollOffset: ${scrollOffset}`);

                debug("gotoProgression, set scroll left/top (scrolled): ", scrollOffset);

                _ignoreScrollEvent = true;
                if (isVWM) {
                    scrollElement.scrollTop = 0;
                    scrollElement.scrollLeft = (isRTL() ? -1 : 1) * scrollOffset;
                } else {
                    scrollElement.scrollTop = scrollOffset;
                    scrollElement.scrollLeft = 0;
                }
                setTimeout(() => {
                    _ignoreScrollEvent = false;
                }, 10);

                win.READIUM2.locationHashOverride = win.document.body;
                resetLocationHashOverrideInfo();

                if (DEBUG_TRACE) debug("scrollToHashRaw: urlQueryParams + gotoProgression + !isPaged + focusElement()...");
                // CONTEXT: scrollToHashRaw()
                focusElement(win.READIUM2.locationHashOverride, false /*, false */);

                // maxScrollShift === scrollElement.scrollWidth - win.document.documentElement.clientWidth
                // * gotoProgression ?
                // const isVWM = isVerticalWritingMode();
                const x = ((isVWM || isRTL()) ? win.document.documentElement.clientWidth - 2 : 1);
                const y = 1;  // (isVWM ? win.document.documentElement.clientHeight - 1 : 0);

                if (DEBUG_TRACE) debug("scrollToHashRaw: urlQueryParams + gotoProgression + !isPaged + processXYRaw()...");
                // CONTEXT: scrollToHashRaw
                processXYRaw(x, y, false, false);

                if (!win.READIUM2.locationHashOverride) { // already in processXYRaw()
                    if (DEBUG_TRACE) debug("scrollToHashRaw: urlQueryParams + gotoProgression + !isPaged + notifyReadingLocationDebounced()...");
                    // CONTEXT: scrollToHashRaw()
                    notifyReadingLocationDebounced();
                }
                return;
            }
        }

        _ignoreScrollEvent = true;
        scrollElement.scrollLeft = 0;
        scrollElement.scrollTop = 0;
        setTimeout(() => {
            _ignoreScrollEvent = false;
        }, 10);

        win.READIUM2.locationHashOverride = win.document.body;
        resetLocationHashOverrideInfo();

        if (DEBUG_TRACE) debug("scrollToHashRaw: !urlQueryParams focusElement()...");
        // CONTEXT: scrollToHashRaw()
        focusElement(win.READIUM2.locationHashOverride, false /*, false */);

        // const isVWM = isVerticalWritingMode();
        const x = ((isVWM || isRTL()) ? win.document.documentElement.clientWidth - 2 : 1);
        const y = 1;  // (isVWM ? win.document.documentElement.clientHeight - 1 : 0);

        if (DEBUG_TRACE) debug("scrollToHashRaw: !urlQueryParams processXYRaw()...");
        // CONTEXT: scrollToHashRaw
        processXYRaw(x, y, false, false);

        // if (!win.READIUM2.locationHashOverride) { // already in processXYRaw()
        //     notifyReadingLocationDebounced();
        //     return;
        // }
    }

    if (DEBUG_TRACE) debug("scrollToHashRaw: notifyReadingLocationDebounced()...");
    // CONTEXT: scrollToHashRaw()
    notifyReadingLocationDebounced();
};

const scrollToHashDebounced = debounce((animate: boolean) => {
    if (DEBUG_TRACE) debug("scrollToHashDebounced: scrollToHashRaw()...");
    // CONTEXT: scrollToHashDebounced()
    scrollToHashRaw(animate);
}, 100);

let _ignoreScrollEvent = false;

// function testReadiumCSS(readiumcssJson: IEventPayload_R2_EVENT_READIUMCSS | undefined) {
//     const oldHTML = win.document.documentElement.outerHTML;
//     const iBody = oldHTML.indexOf("<body");
//     debug(oldHTML.substr(0, iBody + 100));

//     let newHTML: string | undefined;
//     try {
//         newHTML = readiumCssTransformHtml(oldHTML, readiumcssJson, "application/xhtml+xml");
//     } catch (err) {
//         debug(err);
//         return;
//     }

//     const iBody_ = newHTML.indexOf("<body");
//     debug(newHTML.substr(0, iBody_ + 100));
// }

// ipcRenderer.on("R2_EVENT_HIDE", (_event: any, payload: boolean | null) => {
//     showHideContentMask(true, payload);
// });

function showHideContentMask(doHide: boolean, isFixedLayout: boolean | null) {
    if (!ENABLE_VISIBILITY_MASK) {
        return;
    }
    if (doHide) {
        win.document.documentElement.classList.add(ROOT_CLASS_INVISIBLE_MASK);
        win.document.documentElement.classList.remove(ROOT_CLASS_INVISIBLE_MASK_REMOVED);
    } else {
        if (ENABLE_EXTRA_COLUMN_SHIFT_METHOD) {
            ipcRenderer.sendToHost(R2_EVENT_SHOW, null);
        }

        if (isFixedLayout) {
            win.document.documentElement.classList.add(ROOT_CLASS_INVISIBLE_MASK_REMOVED);
        }
        win.document.documentElement.classList.remove(ROOT_CLASS_INVISIBLE_MASK);
    }
}

function focusScrollRaw(el: HTMLOrSVGElement, doFocus: boolean, animate: boolean, domRect: DOMRect | undefined, center?: boolean) {

    if (DEBUG_TRACE) debug("focusScrollRaw: ", getCssSelector(el as HTMLElement));

    if (
        (!isPaginated(win.document) && !win.READIUM2.isFixedLayout && center) ||
        !isVisible(false, el as HTMLElement, domRect)) {

        if (DEBUG_TRACE) debug("focusScrollRaw: scrollElementIntoView()...");
        // CONTEXT: focusScrollRaw()
        scrollElementIntoView(el as HTMLElement, doFocus, animate, domRect, center /*, false */);
    }

    if (win.READIUM2.locationHashOverride === (el as HTMLElement)) {
        return;
    }

    const blacklisted = checkBlacklisted(el as HTMLElement);
    if (blacklisted) {
        return;
    }

    // underscore special link will prioritise hashElement!
    win.READIUM2.hashElement = doFocus ? el as HTMLElement : win.READIUM2.hashElement;
    win.READIUM2.locationHashOverride = el as HTMLElement;

    if (DEBUG_TRACE) debug("focusScrollRaw: notifyReadingLocationDebounced()...");
    // CONTEXT: focusScrollRaw()
    notifyReadingLocationDebounced();
}
const focusScrollDebounced =
    debounce((el: HTMLOrSVGElement, doFocus: boolean, animate: boolean, domRect: DOMRect | undefined) => {

        if (DEBUG_TRACE) debug("focusScrollDebounced: focusScrollRaw()...", getCssSelector(el as HTMLElement));
        // CONTEXT: focusScrollDebounced()
        focusScrollRaw(el, doFocus, animate, domRect);
    }, 100);

let _ignoreFocusInEvent = false;

// function lazyTabbables(): HTMLElement[] {
//     // cache problem: temporary tabbables? (e.g. HTML5 details/summary element, expand/collapse)
//     // so right now, resize observer resets body.tabbables. Is that enough? (other edge cases?)
//     const alreadySet: HTMLElement[] = (win.document.body as any).tabbables;
//     return alreadySet ? alreadySet :
//         ((win.document.body as any).tabbables = tabbable(win.document.body) as HTMLElement[]);
// }
const handleFocusInDebounced = debounce((target: HTMLElement, tabKeyDownEvent: KeyboardEvent | undefined) => {
    if (DEBUG_TRACE) debug("handleFocusInDebounced: handleFocusInRaw()...", getCssSelector(target));
    // CONTEXT: handleFocusInDebounced()
    handleFocusInRaw(target, tabKeyDownEvent);
}, 100);
function handleFocusInRaw(target: HTMLElement, _tabKeyDownEvent: KeyboardEvent | undefined) {
    if (DEBUG_TRACE) debug("handleFocusInRaw:", getCssSelector(target));

    if (!target || !win.document.body) {
        return;
    }
    // _ignoreFocusInEvent = true;

    // doFocus is false (important, as otherwise
    // underscore special link will prioritise hashElement)
    if (DEBUG_TRACE) debug("handleFocusInRaw: focusScrollRaw()...");
    // CONTEXT: handleFocusInRaw()
    focusScrollRaw(target, false, false, undefined);
}
// function handleTabRaw(target: HTMLElement, tabKeyDownEvent: KeyboardEvent | undefined) {
//     if (!target || !win.document.body) {
//         return;
//     }

//     // target
//     // tab-keydown => originating element (will leave focus)
//     // focusin => destination element (focuses in)

//     // evt
//     // non-nil when tab-keydown
//     // nil when focusin
//     // const isTabKeyDownEvent = typeof evt !== "undefined";
//     // const isFocusInEvent = !isTabKeyDownEvent;

//     _ignoreFocusInEvent = false;

//     const tabbables = lazyTabbables();

//     // freshly-created, let's insert the first tab stop (SKIP_LINK_ID = readium2_skip_link)
//     // if (!alreadySet && tabbables) {
//     //     let skipLinkIndex = -1;
//     //     const skipLink = tabbables.find((t, arrayIndex) => {
//     //         skipLinkIndex = arrayIndex;
//     //         return t.getAttribute && t.getAttribute("id") === SKIP_LINK_ID;
//     //     });
//     //     if (skipLink && skipLinkIndex >= 0) {
//     //         (win.document.body as any).tabbables.splice(skipLinkIndex, 1);
//     //         (win.document.body as any).tabbables.unshift(skipLink);
//     //         tabbables = (win.document.body as any).tabbables;
//     //     }
//     // }

//     const i = tabbables ? tabbables.indexOf(target) : -1;
//     // debug("TABBABLE: " + i);

//     if (i === 0) {
//         // debug("FIRST TABBABLE");
//         // prevent the webview from cycling scroll (does its own unwanted focus)
//         if (!tabKeyDownEvent || tabKeyDownEvent.shiftKey) {
//             // debug("FIRST TABBABLE focusin or shift-tab");
//             _ignoreFocusInEvent = true;
//             focusScrollDebounced(target, true);
//             return;
//         }
//         if (i < (tabbables.length - 1)) {
//             // debug("TABBABLE FORWARD >>");
//             tabKeyDownEvent.preventDefault();
//             const nextTabbable = tabbables[i + 1];
//             focusScrollDebounced(nextTabbable, true);
//             return;
//         }
//         // debug("FIRST TABBABLE ??");
//     } else if (i === (tabbables.length - 1)) {
//         // debug("LAST TABBABLE");
//         // prevent the webview from cycling scroll (does its own unwanted focus)
//         if (!tabKeyDownEvent || !tabKeyDownEvent.shiftKey) {
//             // debug("LAST TABBABLE focusin or no-shift-tab");
//             _ignoreFocusInEvent = true;
//             focusScrollDebounced(target, true);
//             return;
//         }
//         if (i > 0) {
//             // debug("TABBABLE BACKWARD <<");
//             tabKeyDownEvent.preventDefault();
//             const previousTabbable = tabbables[i - 1];
//             focusScrollDebounced(previousTabbable, true);
//             return;
//         }
//         // debug("LAST TABBABLE??");
//     } else if (i > 0) {
//         if (tabKeyDownEvent) {
//             if (tabKeyDownEvent.shiftKey) {
//                 // debug("TABBABLE BACKWARD <<");
//                 tabKeyDownEvent.preventDefault();
//                 const previousTabbable = tabbables[i - 1];
//                 focusScrollDebounced(previousTabbable, true);
//                 return;
//             } else {
//                 // debug("TABBABLE FORWARD >>");
//                 tabKeyDownEvent.preventDefault();
//                 const nextTabbable = tabbables[i + 1];
//                 focusScrollDebounced(nextTabbable, true);
//                 return;
//             }
//         }
//     }
//     if (!tabKeyDownEvent) {
//         // debug("FOCUSIN force");
//         focusScrollDebounced(target, true);
//     }
// }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
ipcRenderer.on(R2_EVENT_READIUMCSS, (_event: any, payload: IEventPayload_R2_EVENT_READIUMCSS) => {
    showHideContentMask(true, payload.isFixedLayout || win.READIUM2.isFixedLayout);
    readiumCSS(win.document, payload);
    recreateAllHighlights(win);
    showHideContentMask(false, payload.isFixedLayout || win.READIUM2.isFixedLayout);
});

let _docTitle: string | undefined;

win.addEventListener("DOMContentLoaded", () => {
    debug("############# DOMContentLoaded");

    const titleElement = win.document.documentElement.querySelector("head > title");
    if (titleElement && titleElement.textContent) {
        _docTitle = titleElement.textContent;
    }

    // _cancelInitialScrollCheck = true;

    // const linkUri = new URI(win.location.href);

    if (!win.READIUM2.isAudio &&
        win.location.hash && win.location.hash.length > 1) {

        debug(".hashElement = 4");
        win.READIUM2.hashElement = win.document.getElementById(win.location.hash.substr(1));
        if (win.READIUM2.DEBUG_VISUALS) {
            if (win.READIUM2.hashElement) {
                // const existings = win.document.querySelectorAll(`*[${readPosCssStylesAttr1}]`);
                // existings.forEach((existing) => {
                //     existing.removeAttribute(`${readPosCssStylesAttr1}`);
                // });
                win.READIUM2.hashElement.setAttribute(readPosCssStylesAttr1, "DOMContentLoaded hashElement");
            }
        }
    }

    win.READIUM2.locationHashOverride = undefined;
    win.READIUM2.ttsHighlightStyle = HighlightDrawTypeBackground;
    win.READIUM2.ttsHighlightColor = undefined;
    win.READIUM2.ttsHighlightColor_WORD = undefined;
    win.READIUM2.ttsHighlightStyle_WORD = undefined;
    // win.READIUM2.mediaOverlaysUseTTSHighlights = false;
    win.READIUM2.ttsClickEnabled = false;
    win.READIUM2.ttsAndMediaOverlaysManualPlayNext = false;
    win.READIUM2.ttsSkippabilityEnabled = false;
    win.READIUM2.ttsSentenceDetectionEnabled = true;
    win.READIUM2.ttsOverlayEnabled = false;

    let readiumcssJson: IEventPayload_R2_EVENT_READIUMCSS | undefined;
    if (win.READIUM2.urlQueryParams) {
        const publicationHasMediaOverlays = win.READIUM2.urlQueryParams[URL_PARAM_EPUBMEDIAOVERLAYS] === "1";
        // debug("findFollowingDescendantSiblingElementsWithID publicationHasMediaOverlays", publicationHasMediaOverlays);
        if (publicationHasMediaOverlays) {
            win.document.documentElement.classList.add(R2_MO_CLASS_STOPPED);
        }

        // tslint:disable-next-line:no-string-literal
        const base64ReadiumCSS = win.READIUM2.urlQueryParams[URL_PARAM_CSS];
        if (base64ReadiumCSS) {
            let str: string | undefined;
            try {
                str = Buffer.from(base64ReadiumCSS, "base64").toString("utf8");
                readiumcssJson = JSON.parse(str);
            } catch (err) {
                debug("################## READIUM CSS PARSE ERROR?!");
                debug(base64ReadiumCSS);
                debug(err);
                debug(str);
            }
        }
    }

    if (win.READIUM2.isAudio) {
        // let audioPlaybackRate = 1;
        // if (readiumcssJson?.setCSS?.audioPlaybackRate) {
        //     audioPlaybackRate = readiumcssJson.setCSS.audioPlaybackRate;
        // }
        setupAudioBook(_docTitle, undefined);
    }

    if (readiumcssJson) {
        win.READIUM2.isFixedLayout = (typeof readiumcssJson.isFixedLayout !== "undefined") ?
            readiumcssJson.isFixedLayout : false;
    }

    // let didHide = false;
    // if (!win.READIUM2.isFixedLayout) {
    //     // only applies to previous nav spine item reading order
    //     if (win.READIUM2.urlQueryParams) {
    //         // tslint:disable-next-line:no-string-literal
    //         const previous = win.READIUM2.urlQueryParams[URL_PARAM_PREVIOUS];
    //         const isPreviousNavDirection = previous === "true";
    //         if (isPreviousNavDirection) {
    //             didHide = true;
    //             showHideContentMask(true, win.READIUM2.isFixedLayout);
    //         }
    //     }
    //     // ensure visible (can be triggered from host)
    //     if (!didHide) {
    //         showHideContentMask(false, win.READIUM2.isFixedLayout);
    //     }
    // }

    if (!win.READIUM2.isFixedLayout && !win.READIUM2.isAudio) {
        const scrollElement = getScrollingElement(win.document);

        // without this CSS hack, the paginated scrolling is SUPER janky!
        if (!(scrollElement as HTMLElement).classList.contains(ZERO_TRANSFORM_CLASS)) {
            (scrollElement as HTMLElement).classList.add(ZERO_TRANSFORM_CLASS);
        }
    }

    // testReadiumCSS(readiumcssJson);

    // innerWidth/Height can be zero at this rendering stage! :(
    const w = (readiumcssJson && readiumcssJson.fixedLayoutWebViewWidth) || win.innerWidth;
    const h = (readiumcssJson && readiumcssJson.fixedLayoutWebViewHeight) || win.innerHeight;
    win.READIUM2.fxlZoomPercent = (readiumcssJson && readiumcssJson.fixedLayoutZoomPercent) || 0;
    const wh = configureFixedLayout(win.document, win.READIUM2.isFixedLayout,
        win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight,
        w, h, win.READIUM2.webViewSlot, win.READIUM2.fxlZoomPercent);
    if (wh) {
        win.READIUM2.fxlViewportWidth = wh.width;
        win.READIUM2.fxlViewportHeight = wh.height;
        win.READIUM2.fxlViewportScale = wh.scale;

        const payload: IEventPayload_R2_EVENT_FXL_CONFIGURE = {
            fxl: wh,
        };
        ipcRenderer.sendToHost(R2_EVENT_FXL_CONFIGURE, payload);
    } else {
        const payload: IEventPayload_R2_EVENT_FXL_CONFIGURE = {
            fxl: null,
        };
        ipcRenderer.sendToHost(R2_EVENT_FXL_CONFIGURE, payload);
    }

    const alreadedInjected = win.document.documentElement.hasAttribute("data-readiumcss-injected");
    if (alreadedInjected) {
        debug(">>>>> ReadiumCSS already injected by streamer");
        // console.log(">>>>>2 ReadiumCSS already injected by streamer");
    }

    computeVerticalRTL();
    if (readiumcssJson) {
        // ReadiumCSS already injected at the streamer level?
        if (isVerticalWritingMode() || // force update, because needs getComputedStyle()
            !alreadedInjected) {

            debug(">>>>>> ReadiumCSS inject again");
            readiumCSS(win.document, readiumcssJson);
        }
    }

    if (!win.READIUM2.isFixedLayout) {
        if (!alreadedInjected) {
            injectDefaultCSS(win.document);
            if (IS_DEV) { // win.READIUM2.DEBUG_VISUALS
                injectReadPosCSS(win.document);
            }
        }

        if (alreadedInjected) { // because querySelector[All]() is not polyfilled
            checkHiddenFootNotes(win.document);
        }
        checkHeightConstrainedTables(win.document);
    }

    // sometimes the load event does not occur! (some weird FXL edge case?)
    setTimeout(() => {
        loaded(true);
    }, 500);
});

// let _cancelInitialScrollCheck = false;

function checkSoundtrack(documant: Document) {

    const audioNodeList = documant.querySelectorAll("audio");
    if (!audioNodeList || !audioNodeList.length) {
        return;
    }
    const audio = audioNodeList[0] as HTMLAudioElement;

    let epubType = audio.getAttribute("epub:type");
    if (!epubType) {
        epubType = audio.getAttributeNS("http://www.idpf.org/2007/ops", "type");
        if (!epubType) {
            epubType = audio.getAttribute("role");
        }
    }
    if (!epubType) {
        return;
    }
    epubType = epubType.trim().replace(/\s\s+/g, " "); // whitespace collapse

    if (epubType.indexOf("ibooks:soundtrack") < 0) {
        return;
    }

    let src = audio.getAttribute("src");
    if (!src) {
        if (!audio.childNodes) {
            return;
        }
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < audio.childNodes.length; i++) {
            const childNode = audio.childNodes[i];
            if (childNode.nodeType === 1) { // Node.ELEMENT_NODE
                const el = childNode as Element;
                const elName = el.nodeName.toLowerCase();
                if (elName === "source") {
                    src = el.getAttribute("src");
                    if (src) {
                        break; // preserve first found (does not mean will be selected by playback engine!)
                    }
                }
            }
        }
    }
    if (!src) {
        return;
    }
    debug(`AUDIO SOUNDTRACK: ${src} ---> ${audio.src}`);
    if (!audio.src) { // should be absolute URL, even if attribute is relative
        return;
    }

    // Basic technique:
    // (works-ish, because broken playback flow when "turning pages" in the book,
    // and possibility of concurrent multiple playback streams with two-page spreads)
    // audio.setAttribute("loop", "loop");
    // setTimeout(async () => {
    //     await audio.play();
    // }, 500);

    // Advanced technique: let the webview manager/host handle playback:
    const payload: IEventPayload_R2_EVENT_AUDIO_SOUNDTRACK = {
        url: audio.src,
    };
    ipcRenderer.sendToHost(R2_EVENT_AUDIO_SOUNDTRACK, payload);
}

function mediaOverlaysClickRaw(element: Element | undefined, userInteract: boolean) {
    const textFragmentIDChain: Array<string | null> = [];
    if (element) { // !userInteract || win.READIUM2.mediaOverlaysClickEnabled
        let curEl = element;
        do {
            const id = curEl.getAttribute("id");
            textFragmentIDChain.push(id ? id : null);
            curEl = curEl.parentNode as Element;
        } while (curEl && curEl.nodeType === Node.ELEMENT_NODE);
    }
    const payload: IEventPayload_R2_EVENT_MEDIA_OVERLAY_CLICK = {
        locationHashOverrideInfo: win.READIUM2.locationHashOverrideInfo,
        textFragmentIDChain,
        userInteract,
    };
    ipcRenderer.sendToHost(R2_EVENT_MEDIA_OVERLAY_CLICK, payload);
}
// const mediaOverlaysClickDebounced = debounce((element: Element | undefined, userInteract: boolean) => {
//     mediaOverlaysClickRaw(element, userInteract);
// }, 100);

const onScrollRaw = (fromScrollEvent?: boolean) => {
    if (DEBUG_TRACE) debug("onScrollRaw: fromScrollEvent", fromScrollEvent);

    if (!win.document || !win.document.documentElement) {
        return;
    }

    // win.document.documentElement.classList.contains(R2_MO_CLASS_PAUSED)
    if (win.document.documentElement.classList.contains(R2_MO_CLASS_PLAYING)) {
        debug("onScrollRaw Media OVerlays PLAYING/PAUSED ... skip"); // also note that display:none pagebreaks may have sync MO!
        return;
    }

    // if (fromScrollEvent &&
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     // ((win as any).r2_keysDown as Set<string>).size > 0
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     ((win as any).r2_keysDown as Set<string>).has("ArrowLeft") ||
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     ((win as any).r2_keysDown as Set<string>).has("ArrowRight") ||
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     ((win as any).r2_keysDown as Set<string>).has("ArrowUp") ||
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     ((win as any).r2_keysDown as Set<string>).has("ArrowDown") ||
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     ((win as any).r2_keysDown as Set<string>).has("PageUp") ||
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     ((win as any).r2_keysDown as Set<string>).has("PageDown") ||
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     ((win as any).r2_keysDown as Set<string>).has("Space")
    // ) {
    //     debug("onScrollRaw fromScrollEvent and key pressed");
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     ((win as any).r2_keysDown as Set<string>).forEach((v) => { debug(v); });
    //     return;
    // }

    // const nowTime = Date.now(); // +new Date()
    // if (fromScrollEvent &&
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     nowTime > ((win as any).r2_scrollTime as number)
    // ) {
    //     debug("onScrollRaw fromScrollEvent debounce time after another scroll");
    //     return;
    // }

    if (!win.READIUM2.ttsClickEnabled &&
        !win.document.documentElement.classList.contains(TTS_CLASS_PLAYING) &&
        !win.document.documentElement.classList.contains(TTS_CLASS_PAUSED)) {

        const el = win.READIUM2.locationHashOverride; // || win.READIUM2.hashElement
        if (el && isVisible(false, el, undefined)) {
            debug("onScrollRaw VISIBLE SKIP");

            if (fromScrollEvent && !isPaginated(win.document)) {
                if (DEBUG_TRACE) debug("onScrollRaw: notifyReadingLocationRaw()...");
                notifyReadingLocationRaw(true, true, true);
                // notifyReadingLocationDebounced();
                // notifyReadingLocationDebouncedImmediate();
            }
            return;
        }
    }

    const isVWM = isVerticalWritingMode();
    const x = ((isVWM || isRTL()) ? win.document.documentElement.clientWidth - 2 : 1);
    const y = 1;  // (isVWM ? win.document.documentElement.clientHeight - 1 : 0);

    if (DEBUG_TRACE) debug("onScrollRaw: processXYRaw()...");
    // CONTEXT: onScrollRaw
    processXYRaw(x, y, false, false, true);
};
const onScrollDebounced = debounce((fromScrollEvent?: boolean) => {
    if (DEBUG_TRACE) debug("onScrollDebounced: onScrollRaw()...");
    // CONTEXT: onScrollDebounced
    onScrollRaw(fromScrollEvent);
}, 300);

// https://github.com/readium/ts-toolkit/blob/9f3d844347b6df8571128c928f4d8d417979a7f1/navigator-html-injectables/src/helpers/document.ts#L28-L81
// https://developer.mozilla.org/en-US/docs/Web/API/Window/visualViewport
// const colCountPerScreen = 2;
// const documentWidth = win.document.scrollingElement!.scrollWidth;
// const windowWidth = win.visualViewport!.width;
// const totalColCount = Math.round((documentWidth / windowWidth) * colCountPerScreen);
// const lonelyColCount = totalColCount % colCountPerScreen;
// const needed = colCountPerScreen === 1 || lonelyColCount === 0 ? 0 : colCountPerScreen - lonelyColCount;
const appendExtraColumnPadIfNecessary = (skipResizeObserver: boolean) => {
    if (ENABLE_EXTRA_COLUMN_SHIFT_METHOD) {
        return;
    }

    let elPad = win.document.getElementById(EXTRA_COLUMN_PAD_ID);
    const isPaged = isPaginated(win.document);
    const isTwo = isTwoPageSpread();
    const isVWM = isVerticalWritingMode();
    // console.log("<><><> 0");
    // console.log(`isPaged: ${isPaged}`);
    // console.log(`isTwo: ${isTwo}`);
    // console.log(`isVWM: ${isVWM}`);
    if (isVWM || !isPaged || !isTwo) {
        // console.log("<><><> 1");
        // if (elPad) {
        //     elPad.remove();
        // }
    } else {
        // const scrollElement = getScrollingElement(win.document);
        // let calculateDocumentColumnizedWidthAdjustedForTwoPageSpread = scrollElement.scrollWidth;
        // const columnizedDocWidth = calculateDocumentColumnizedWidthAdjustedForTwoPageSpread;
        // const twoColWidth = (scrollElement as HTMLElement).offsetWidth;
        // const nSpreads = columnizedDocWidth / twoColWidth;
        // const nWholeSpread = Math.floor(nSpreads);
        // const fractionalSpread = nSpreads - nWholeSpread;
        // if (fractionalSpread > 0 && (Math.round(fractionalSpread * 10) / 10) <= 0.5) {
        //     calculateDocumentColumnizedWidthAdjustedForTwoPageSpread = twoColWidth * Math.ceil(nSpreads);
        // }
        // const maxScrollShift = scrollElement.scrollWidth - (scrollElement as HTMLElement).offsetWidth));
        // const maxScrollShiftAdjusted = calculateDocumentColumnizedWidthAdjustedForTwoPageSpread - (scrollElement as HTMLElement).offsetWidth));
        const { maxScrollShift, maxScrollShiftAdjusted } = calculateMaxScrollShift();

        // console.log("<><><> 2");
        // console.log(`maxScrollShift: ${maxScrollShift}`);
        // console.log(`maxScrollShiftAdjusted: ${maxScrollShiftAdjusted}`);
        // console.log(`scrollElement.scrollWidth: ${scrollElement.scrollWidth}`);
        // const noChange = maxScrollShift <= 0 || Math.abs(scrollElement.scrollWidth) <= maxScrollShift;

        // https://github.com/readium/kotlin-toolkit/blob/cfa55e84b8fc962608739b2cad814ef2cc54bca7/readium/navigator/src/main/assets/_scripts/src/utils.js#L32-L59
        // var documentWidth = document.scrollingElement.scrollWidth;
        // var colCount = documentWidth / pageWidth;
        // var hasOddColCount = (Math.round(colCount * 2) / 2) % 1 > 0.1;

        if (maxScrollShiftAdjusted > maxScrollShift) {
            // console.log("<><><> 3", maxScrollShiftAdjusted, maxScrollShift);
            // if (elPad) {
            //     elPad.remove();
            // } else {
                // console.log("<><><> 5");
                elPad = win.document.createElement("div");
                elPad.setAttribute("id", EXTRA_COLUMN_PAD_ID);
                elPad.style.breakBefore = "column";
                // zero-width space
                // &ZeroWidthSpace;
                elPad.innerHTML = "&#8203;";

                if (!skipResizeObserver) {
                    debug("appendExtraColumnPadIfNecessary !skipResizeObserver");

                    _firstResizeObserver = true;
                    _firstResizeObserverTimeout = win.setTimeout(() => {
                        _firstResizeObserverTimeout = undefined;
                        if (_firstResizeObserver) {
                            _firstResizeObserver = false;
                            debug("ResizeObserver CANCEL SKIP FIRST (extra col pad)");
                        }
                    }, 400);
                }

                debug("appendExtraColumnPadIfNecessary APPEND DIV");
                win.document.body.appendChild(elPad); // will cause another ResizeObserver event!

            // }
        }
        // else {
        //     // console.log("<><><> 4");
        //     if (elPad) {
        //         elPad.remove();
        //     }
        // }
    }
};

function focusCurrentReadingLocationElement(invert: boolean) {
    if (IS_DEV) {
        debug(">>>> focus link click: ");
        debug(win.READIUM2.hashElement ?
            getCssSelector(win.READIUM2.hashElement) : "!hashElement");
        debug(win.READIUM2.locationHashOverride ?
            getCssSelector(win.READIUM2.locationHashOverride) : "!locationHashOverride");
    }

    // tab+click on underscore link SKIP_LINK_ID implies page/scroll shift causing undesirable new reading location,
    // but R2_EVENT_FOCUS_READING_LOC event is explicit intent from application shell to navigate to latest reading location, even if caused by user-created page turn / scroll
    const el = invert ?
        (win.READIUM2.locationHashOverride || win.READIUM2.hashElement) :
        (win.READIUM2.hashElement || win.READIUM2.locationHashOverride);
    if (el) {
        if (DEBUG_TRACE) debug("focusCurrentReadingLocationElement: focusScrollDebounced()...");
        // CONTEXT: focusCurrentReadingLocationElement()
        focusScrollDebounced(el as HTMLElement, true, false, undefined);
    }
}

let _firstResizeObserver = true;
let _firstResizeObserverTimeout: number | undefined = undefined;

let _loaded = false;
function loaded(forced: boolean) {
    if (_loaded) {
        return;
    }
    _loaded = true;
    if (forced) {
        debug(">>> LOAD EVENT WAS FORCED!");
    } else {
        debug(">>> LOAD EVENT was not forced.");
    }

    // trigger initial fetch (empty array!!)
    const systemVoices = win.speechSynthesis.getVoices();
    if (!!systemVoices?.length && false) {
        // @ts-expect-error unreachable
        console.log("loaded() -- window.speechSynthesis.getVoices()", JSON.stringify(systemVoices.map(v => ({
            name: v.name,
            lang: v.lang,
            voiceURI: v.voiceURI,
            default: v.default,
            localService: v.localService,
            })), null, 4));
    }

    _elementsWithID = undefined;
    _allEpubPageBreaks = undefined;
    _allHeadings = undefined;

    if (win.READIUM2.urlQueryParams) {
        // tslint:disable-next-line:no-string-literal
        const b64Highlights = win.READIUM2.urlQueryParams[URL_PARAM_HIGHLIGHTS];
        if (b64Highlights) {
            setTimeout(async () => {

                let jsonStr: string | undefined;
                try {
                    const buff = Buffer.from(b64Highlights, "base64");

                    const cs = new DecompressionStream("gzip");
                    const csWriter = cs.writable.getWriter();
                    csWriter.write(buff); // .buffer
                    csWriter.close();

                    const buffer = Buffer.from(await new Response(cs.readable).arrayBuffer());
                    // const buffer = await streamToBufferPromise(cs.readable as ReadableStream<any>);

                    const jsonStr = new TextDecoder().decode(buffer); // buffer.toString("utf8");

                    // console.log("--HIGH LOAD PARAM OUT--");
                    // console.log(jsonStr);
                    const highlights = JSON.parse(jsonStr);

                    setDrawMargin(win, highlights.margin);
                    recreateAllHighlightsRaw(win, highlights.list);
                } catch (err) {
                    debug("################## HIGHLIGHTS PARSE ERROR?!");
                    debug(b64Highlights);
                    debug(err);
                    debug(jsonStr);
                }
            }, 10);
        }
    }

    if (win.READIUM2.isAudio) {
        showHideContentMask(false, win.READIUM2.isFixedLayout);
    } else {
        if (!win.READIUM2.isFixedLayout) {

            appendExtraColumnPadIfNecessary(true);

            showHideContentMask(false, win.READIUM2.isFixedLayout);

            if (DEBUG_TRACE) debug("LOADED !FXL: scrollToHashDebounced()...");
            // CONTEXT: loaded()
            scrollToHashDebounced(false);

            if (ENABLE_SKIP_LINK && win.document.body) {
                /*
                if (isPaginated(win.document)) {
                    win.document.body.addEventListener("scroll", (ev) => {
                        if (isPaginated(win.document)) {
                            console.log("BODY SCROLL PREVENT");
                            ev.preventDefault();
                        }
                    });
                }
                */

                const focusLink = win.document.createElement("a");
                focusLink.setAttribute("id", SKIP_LINK_ID);
                // focusLink.appendChild(win.document.createTextNode(INJECTED_LINK_TXT));
                focusLink.appendChild(win.document.createTextNode(" "));
                focusLink.setAttribute("title", INJECTED_LINK_TXT);
                focusLink.setAttribute("aria-label", INJECTED_LINK_TXT);
                focusLink.setAttribute("href", "javascript:;");
                focusLink.setAttribute("tabindex", "0");
                win.document.body.insertAdjacentElement("afterbegin", focusLink);
                setTimeout(() => {
                    focusLink.addEventListener("click", (ev) => {
                        ev.preventDefault();
                        if (DEBUG_TRACE) debug("focusLink CLICK: focusCurrentReadingLocationElement()...");
                        // CONTEXT: click/SKIP_LINK_ID
                        focusCurrentReadingLocationElement(false);
                    });
                }, 200);
                // Does not work! :(
                // setTimeout(() => {
                //     console.log("TEST AUTOFOCUS");
                //     focusLink.focus();
                // }, 2000);
            }

            // setTimeout(() => {
            //     debug("++++ scrollToHashRaw FROM LOAD");
            //     scrollToHashRaw();
            // }, 100);
            // _cancelInitialScrollCheck = false;
            // setTimeout(() => {
            //     if (_cancelInitialScrollCheck) {
            //         return;
            //     }
            //     // if (!isPaginated(win.document)) {
            //     //     // scrollToHashRaw();
            //     //     return;
            //     // }
            //     // let visible = false;
            //     // if (win.READIUM2.locationHashOverride === win.document.body ||
            //     //     win.READIUM2.hashElement === win.document.body) {
            //     //     visible = true;
            //     // } else if (win.READIUM2.locationHashOverride) {
            //     //     visible = isVisible(win.READIUM2.locationHashOverride);
            //     // } else if (win.READIUM2.hashElement) {
            //     //     visible = isVisible(win.READIUM2.hashElement);
            //     // }
            //     // if (!visible) {
            //     //     debug("!visible (delayed layout pass?) => forcing second scrollToHashRaw()...");
            //     //     if (win.READIUM2.locationHashOverride) {
            //     //         debug(uniqueCssSelector(win.READIUM2.locationHashOverride, win.document, undefined));
            //     //     }
            //     //     scrollToHashRaw();
            //     // }
            // }, 500);
        } else {
            // processXYDebounced(0, 0, false);

            showHideContentMask(false, win.READIUM2.isFixedLayout);

            win.READIUM2.locationHashOverride = win.document.body;

            if (DEBUG_TRACE) debug("loaded() FXL: notifyReadingLocationDebounced()...");
            // CONTEXT: loaded()
            notifyReadingLocationDebounced();
        }

        checkSoundtrack(win.document);

        // if (win.READIUM2.isFixedLayout) {
        //     mediaOverlaysClickRaw(undefined, false);
        // } else {
        //     setTimeout(() => {
        //         const element = findFirstVisibleElement(win.document.body);
        //         mediaOverlaysClickDebounced(element, false);
        //     }, 200);
        // }
    }

    // // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // (win as any).r2_keysDown = new Set<string>();

    win.document.documentElement.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (win.document && win.document.documentElement) {
            win.document.documentElement.classList.add(ROOT_CLASS_KEYBOARD_INTERACT);
        }

        // if (!ev.repeat) {
        //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
        //     ((win as any).r2_keysDown as Set<string>).add(ev.code);
        // }

        // DEPRECATED
        // if (ev.keyCode === 37 || ev.keyCode === 39) { // left / right
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
        if (ev.code === "ArrowLeft" || ev.code === "ArrowRight") {
            if (ev.target && elementCapturesKeyboardArrowKeys(ev.target as Element)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (ev.target as any).r2_leftrightKeyboardTimeStamp = new Date();
            }
            // allow event up to win.document.addEventListener("keydown")
            else {
                ev.preventDefault();
                // ev.stopPropagation();
            }
        }
    }, true);

    // win.document.documentElement.addEventListener("keyup", (ev: KeyboardEvent) => {
    //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //     ((win as any).r2_keysDown as Set<string>).delete(ev.code);
    // }, true);

    win.document.documentElement.addEventListener("mousedown", (_ev: MouseEvent) => {

        if (win.document && win.document.documentElement) {
            win.document.documentElement.classList.remove(ROOT_CLASS_KEYBOARD_INTERACT);
        }
    }, true);

    if (win.READIUM2.isAudio) {
        debug("AUDIOBOOK RENDER ...");
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    win.document.body.addEventListener("focusin", (ev: any) => {

        if (_ignoreFocusInEvent) {
            debug("focusin --- IGNORE");
            _ignoreFocusInEvent = false;
            return;
        }

        if (isPopupDialogOpen(win.document)) {
            return;
        }

        if (ev.target) {
            let ignoreIncomingMouseClickOnFocusable = false;
            if (win.document && win.document.documentElement) {
                const low = (ev.target as HTMLElement).tagName.toLowerCase();
                if (low === "body") {
                    ignoreIncomingMouseClickOnFocusable = true;
                } else if (!win.document.documentElement.classList.contains(ROOT_CLASS_KEYBOARD_INTERACT)) {
                    if (low === "a" &&
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (ev.target as any).href
                        ||
                        ev.target.getAttribute("tabindex") === "-1" &&
                        (ev.target as HTMLElement).classList.contains(CSS_CLASS_NO_FOCUS_OUTLINE)
                    ) {
                        ignoreIncomingMouseClickOnFocusable = true;
                    }
                }
            }
            if (!ignoreIncomingMouseClickOnFocusable) {
                if (DEBUG_TRACE) debug("loaded() FOCUSIN: handleFocusInDebounced()...");
                // CONTEXT: focusin loaded()
                handleFocusInDebounced(ev.target as HTMLElement, undefined);
            } else {
                debug("focusin mouse click --- IGNORE");
            }
        }
        // if (!win.document) {
        //     return;
        // }
        // const isPaged = isPaginated(win.document);
        // if (isPaged) {
        // }
    });

    // win.document.body.addEventListener("keydown", (ev: KeyboardEvent) => {
    //     if (isPopupDialogOpen(win.document)) {
    //         return;
    //     }

    //     const TAB_KEY = 9;
    //     if (ev.which === TAB_KEY) {
    //         if (ev.target) {
    //             handleTabDebounced(ev.target as HTMLElement, ev);
    //         }
    //     }
    //     // if (!win.document) {
    //     //     return;
    //     // }
    //     // const isPaged = isPaginated(win.document);
    //     // if (isPaged) {
    //     // }
    // }, true);

    const useResizeObserver = !win.READIUM2.isFixedLayout;
    if (useResizeObserver && win.document.body) {
        setTimeout(() => {
            const debouncedResizeObserverCallback = debounce((entries: ResizeObserverEntry[]) => {
                if (DEBUG_TRACE) debug("ResizeObserver ...");
                for (const entry of entries) {
                    const rect = entry.contentRect as DOMRect;
                    const element = entry.target as HTMLElement;

                    if (DEBUG_TRACE) debug("element.id", element.id);
                    if (DEBUG_TRACE) debug("element.innerHTML", element.innerHTML.substring(0, 100));
                    if (DEBUG_TRACE) debug("rect", rect.x, rect.y, rect.width, rect.height);
                }

                if (_firstResizeObserverTimeout !== undefined) {
                    win.clearTimeout(_firstResizeObserverTimeout);
                    _firstResizeObserverTimeout = undefined;
                }

                if (_firstResizeObserver) {
                    _firstResizeObserver = false;
                    debug("ResizeObserver SKIP FIRST");
                    return;
                }
                // debug("ResizeObserver");

                // invalidateBoundingClientRectOfDocumentBody(win);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (win.document.body as any).tabbables = undefined;

                const elPad = win.document.getElementById(EXTRA_COLUMN_PAD_ID);
                if (elPad) {
                    debug("ResizeObserver appendExtraColumnPadIfNecessary EXTRA_COLUMN_PAD_ID will remove...");
                    setTimeout(() => {
                        debug("ResizeObserver appendExtraColumnPadIfNecessary EXTRA_COLUMN_PAD_ID removing");
                        debouncedResizeObserverCallback.clear();
                        // _firstResizeObserver = true;
                        elPad?.remove(); // will cause another ResizeObserver event!
                        // _firstResizeObserverTimeout = win.setTimeout(() => {
                        //     _firstResizeObserverTimeout = undefined;
                        //     if (_firstResizeObserver) {
                        //         _firstResizeObserver = false;
                        //         debug("ResizeObserver CANCEL SKIP FIRST");
                        //     }
                        // }, 400);
                    }, 100);

                    return;
                }

                appendExtraColumnPadIfNecessary(false);

                if (DEBUG_TRACE) debug("ResizeObserver: scrollToHashDebounced()...");
                // CONTEXT: loaded() - ResizeObserver
                scrollToHashDebounced(false);
            }, 200);
            const resizeObserver = new win.ResizeObserver(debouncedResizeObserverCallback);
            resizeObserver.observe(win.document.body);

            _firstResizeObserverTimeout = win.setTimeout(() => {
                _firstResizeObserverTimeout = undefined;
                if (_firstResizeObserver) {
                    _firstResizeObserver = false;
                    debug("ResizeObserver CANCEL SKIP FIRST");
                }
            }, 700);
            // Note that legacy ResizeSensor sets body position to "relative" (default static).
            // Also note that ReadiumCSS default to (via stylesheet :root):
            // document.documentElement.style.position = "relative";
        }, 1000);
        // win.requestAnimationFrame((_timestamp) => {
        // });
    }

    // // "selectionchange" event NOT SUITABLE
    // // IF selection.removeAllRanges() + selection.addRange(range) in selection.ts
    // // (normalization of selection to single range => infinite loop!!)
    // // PROBLEM: "selectionstart" DOES NOT ALWAYS TRIGGER :(
    // win.document.addEventListener("selectionstart", (_ev: any) => {
    //     // notifyReadingLocationDebounced();
    //     debug("############ selectionstart EVENT:");
    //     const selInfo = getCurrentSelectionInfo(win, getCssSelector, computeCFI, computeXPath);
    //     debug(selInfo);
    //     if (win.READIUM2.DEBUG_VISUALS) {
    //         if (selInfo) {
    //             createHighlight(win.document, selInfo);
    //         }
    //     }
    // });

    let _mouseMoveTimeout: number | undefined;
    win.document.documentElement.addEventListener("mousemove", (_ev: MouseEvent) => {
        if (_mouseMoveTimeout !== undefined) {
            win.clearTimeout(_mouseMoveTimeout);
            _mouseMoveTimeout = undefined;
        }
        win.document.documentElement.classList.remove(HIDE_CURSOR_CLASS);
        _mouseMoveTimeout = win.setTimeout(() => {
            _mouseMoveTimeout = undefined;
            win.document.documentElement.classList.add(HIDE_CURSOR_CLASS);
        }, 1000);
    });

    win.document.addEventListener("auxclick", async (ev: MouseEvent) => {
        debug(`AUX __CLICK: ${ev.button} (SKIP middle)`);
        if (ev.button === 1) {
            ev.preventDefault();
            ev.stopPropagation();
        }
    }, true);
    win.document.addEventListener("click", async (ev: MouseEvent) => {
        debug(`!AUX __CLICK: ${ev.button} ...`);
        if (win.document.documentElement.classList.contains(R2_MO_CLASS_PAUSED) || win.document.documentElement.classList.contains(R2_MO_CLASS_PLAYING)) {
            debug("!AUX __CLICK skip because MO playing/paused");

            ev.preventDefault();
            ev.stopPropagation();

            return;
        }

        if (!isPopupDialogOpen(win.document)) {
            // relative to fixed window top-left corner
            // (unlike pageX/Y which is relative to top-left rendered content area, subject to scrolling)
            const x = ev.clientX;
            const y = ev.clientY;

            debug("CLICK ev.clientX/Y", ev.clientX, ev.clientY, win.READIUM2.ttsClickEnabled);

            const domPointData = domDataFromPoint(x, y);
            if (!domPointData.element) {
                debug("CLICK !domPointData.element");
            }
            const visible = domPointData.element ? isVisible(true, domPointData.element, undefined) : false;
            debug("CLICK visible " + (visible ? "YES" : "NO"));

            if (domPointData.element && win.READIUM2.ttsClickEnabled && visible) {
                debug("!AUX __CLICK domPointData.element && win.READIUM2.ttsClickEnabled");

                ev.preventDefault();
                ev.stopPropagation();

                if (ev.altKey) {
                    ttsPlay(
                        win.READIUM2.ttsPlaybackRate,
                        win.READIUM2.ttsVoices,
                        focusScrollRaw,
                        domPointData.element,
                        undefined,
                        undefined,
                        -1,
                        ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
                        ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
                    return;
                }

                ttsPlay(
                    win.READIUM2.ttsPlaybackRate,
                    win.READIUM2.ttsVoices,
                    focusScrollRaw,
                    (domPointData.element.ownerDocument as Document).body,
                    domPointData.element,
                    domPointData.textNode,
                    domPointData.textNodeOffset,
                    ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
                    ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);

                return;
            }
        }

        if (win.READIUM2.ttsClickEnabled || win.document.documentElement.classList.contains(TTS_CLASS_PAUSED) || win.document.documentElement.classList.contains(TTS_CLASS_PLAYING)) {
            debug("!AUX __CLICK skip because TTS playing/paused");

            ev.preventDefault();
            // ev.stopPropagation();

            return;
        }

        // win.document.documentElement.classList.forEach((c) => {
        //     debug(c);
        // });

        let linkElement: Element | undefined;
        let HTMLImg_SVGImage_SVGFragment: Element | undefined;

        let href_src: string | SVGAnimatedString | undefined;
        let href_src_image_nested_in_link: string | SVGAnimatedString | undefined;
        let isSVGFragment = false;
        let isSVGImage = false;
        let globalSVGDefs: NodeListOf<Element> | undefined;
        let currentElement: Element | undefined = ev.target as Element;
        while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
            const tagName = currentElement.tagName.toLowerCase();
            if ((tagName === "img" || tagName === "image" || tagName === "svg")
                && !currentElement.classList.contains(POPOUTIMAGE_CONTAINER_ID)) {

                isSVGFragment = false;
                if (tagName === "svg") {
                    if (HTMLImg_SVGImage_SVGFragment) {
                        // image inside SVG
                        currentElement = currentElement.parentNode as Element;
                        isSVGImage = true;
                        continue;
                    }

                    isSVGFragment = true;
                    href_src = currentElement.outerHTML;

                    const defs = currentElement.querySelectorAll("defs > *[id]");
                    debug("SVG INNER defs: ", defs.length);
                    const uses = currentElement.querySelectorAll("use");
                    debug("SVG INNER uses: ", uses.length);
                    const useIDs: string[] = [];
                    uses.forEach((useElem) => {
                        const href = useElem.getAttribute("href") || useElem.getAttributeNS("http://www.w3.org/1999/xlink", "href");
                        if (href?.startsWith("#")) {
                            const id = href.substring(1);
                            let found = false;
                            for (let i = 0; i < defs.length; i++) {
                                const defElem = defs[i];
                                if (defElem.getAttribute("id") === id) {
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                debug("SVG INNER use (need inject def): ", id);
                                useIDs.push(id);
                            } else {
                                debug("SVG INNER use (already has def): ", id);
                            }
                        }
                    });
                    let defsToInject = "";
                    for (const useID of useIDs) {
                        if (!globalSVGDefs) {
                            globalSVGDefs = win.document.querySelectorAll("defs > *[id]");
                        }
                        debug("SVG GLOBAL defs: ", globalSVGDefs.length);
                        let found = false;
                        globalSVGDefs.forEach((globalSVGDef) => {
                            if (globalSVGDef.getAttribute("id") === useID) {
                                found = true;
                                const outer = globalSVGDef.outerHTML;
                                if (outer.includes("<use")) {
                                    debug("!!!!!! SVG WARNING use inside def: " + outer);
                                }
                                defsToInject += outer;
                            }
                        });
                        if (found) {
                            debug("SVG GLOBAL def for INNER use id: ", useID);
                        } else {
                            debug("no SVG GLOBAL def for INNER use id!! ", useID);
                        }
                    }
                    if (href_src.indexOf("<defs") >= 0) {
                        href_src = href_src.replace(/<\/defs>/, `${defsToInject} </defs>`);
                    } else {
                        href_src = href_src.replace(/>/, `> <defs> ${defsToInject} </defs>`);
                    }

                    // href_src = href_src.replace(/<svg/g, `<svg xml:base="${win.location.origin}${win.location.pathname}" `);
                    href_src = href_src.replace(/:href[\s]*=(["|'])(.+?)(["|'])/g, (match, ...args: string[]) => {
                        const l = args[1].trim();
                        const ret = l.startsWith("#") || l.startsWith("/") || l.startsWith("data:") || /https?:/.test(l) ? match :
                            `:href=${args[0]}${new URL(l, win.location.origin + win.location.pathname)}${args[2]}`;
                        debug("SVG URL REPLACE: ", match, ret);
                        return ret;
                    });
                    href_src = href_src.replace(/url[\s]*\((.+?)\)/g, (match, ...args: string[]) => {
                        const l = args[0].trim();
                        const ret = l.startsWith("#") || l.startsWith("/") || l.startsWith("data:") || /https?:/.test(l) ? match :
                            `url(${new URL(l, win.location.origin + win.location.pathname)})`;
                        debug("SVG URL REPLACE: ", match, ret);
                        return ret;
                    });

                    href_src = href_src.replace(/[\r\n]/g, " ").replace(/\s\s+/g, " ").trim();
                    href_src = href_src.replace(/<desc[^<]+<\/desc>/g, "");
                    debug(`SVG CLICK: ${href_src}`);
                } else {
                    // absolute (already resolved against base)
                    href_src = (currentElement as HTMLImageElement).src;
                    // possibly relative
                    let href_src_ = currentElement.getAttribute("src");
                    if (!href_src) {
                        // SVGAnimatedString (animVal possibly relative)
                        href_src = (currentElement as SVGImageElement).href;

                        // possibly relative
                        href_src_ = currentElement.getAttribute("href") || currentElement.getAttributeNS("http://www.w3.org/1999/xlink", "href");
                    }
                    debug(`IMG CLICK: ${href_src} (${href_src_})`);
                }
                HTMLImg_SVGImage_SVGFragment = currentElement;

                // DOM parent / ancestor could be link a@href, so let's continue walking up the tree
                // break;
            } else if (tagName === "a") {

                if (href_src) {
                    href_src_image_nested_in_link = href_src;
                }

                // absolute (already resolved against base),
                // or SVGAnimatedString (animVal possibly relative)
                href_src = (currentElement as HTMLAnchorElement | SVGAElement).href;

                // possibly relative
                const href_ = currentElement.getAttribute("href") || currentElement.getAttributeNS("http://www.w3.org/1999/xlink", "href");

                linkElement = currentElement;
                debug(`A LINK CLICK: ${href_src} (${href_})`);

                // DOM child / descendant could be img/image/svg (see if condition above)
                break;
            }
            currentElement = currentElement.parentNode as Element;
        }
        currentElement = undefined;

        // at that point, can be both an image and a link! ("img" element descendant of "a" ... clickable image link)

        if (!href_src || (!HTMLImg_SVGImage_SVGFragment && !linkElement)) {
            clearImageZoomOutline();
            return;
        }

        if (href_src_image_nested_in_link && (href_src_image_nested_in_link as SVGAnimatedString).animVal) {
            href_src_image_nested_in_link = (href_src_image_nested_in_link as SVGAnimatedString).animVal;

            if (!href_src_image_nested_in_link) {
                clearImageZoomOutline();
                return;
            }
        }

        if ((href_src as SVGAnimatedString).animVal) {
            href_src = (href_src as SVGAnimatedString).animVal;

            if (!href_src) {
                clearImageZoomOutline();
                return;
            }
        }

        if (typeof href_src !== "string") {

            clearImageZoomOutline();
            return;
        }
        if (href_src_image_nested_in_link && typeof href_src_image_nested_in_link !== "string") {

            clearImageZoomOutline();
            return;
        }

        debug(`HREF SRC: ${href_src} ${href_src_image_nested_in_link} (${win.location.href})`);

        const has = HTMLImg_SVGImage_SVGFragment?.hasAttribute(`data-${POPOUTIMAGE_CONTAINER_ID}`);
        if (HTMLImg_SVGImage_SVGFragment && href_src && (has ||
            ((!linkElement && !win.READIUM2.isFixedLayout && !isSVGFragment) || ev.shiftKey)
        )) {
            if (linkElement && href_src_image_nested_in_link) {
                href_src = href_src_image_nested_in_link;
            }

            clearImageZoomOutline(); // removes HTMLImg_SVGImage_SVGFragment `data-${POPOUTIMAGE_CONTAINER_ID}`

            ev.preventDefault();
            ev.stopPropagation();

            if (has) {
                if (!isSVGFragment &&
                    !/^(https?|thoriumhttps):\/\//.test(href_src as string) &&
                    !(href_src as string).startsWith((READIUM2_ELECTRON_HTTP_PROTOCOL + "://"))) {

                    const destUrl = new URL(href_src as string, win.location.origin + win.location.pathname);
                    href_src = destUrl.toString();
                    debug(`IMG CLICK ABSOLUTE-ized: ${href_src}`);
                }

                const cssSelectorOf_HTMLImg_SVGImage_SVGFragment = getCssSelector(HTMLImg_SVGImage_SVGFragment);

                // const isFigure = (parentElement: Element | null): parentElement is HTMLElement =>
                //     parentElement?.tagName === "FIGURE" || parentElement?.tagName === "figure";

                debug("R2_EVENT_IMAGE_CLICK (ipcRenderer.sendToHost) href: " + href_src + " ___ " + cssSelectorOf_HTMLImg_SVGImage_SVGFragment);

                // console.log("R2_EVENT_IMAGE_CLICK win.document.location.href", win.document.location.href);
                let hostDocumentURL = `${win.document.location.protocol}//${win.document.location.host}${win.document.location.pathname}`;
                // console.log("R2_EVENT_IMAGE_CLICK win.document.location.protocol+host+pathname", hostDocumentURL);
                if (hostDocumentURL.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
                    hostDocumentURL = convertCustomSchemeToHttpUrl(hostDocumentURL);
                    // console.log("R2_EVENT_IMAGE_CLICK convertCustomSchemeToHttpUrl", hostDocumentURL);
                    const u = new URL(hostDocumentURL);
                    hostDocumentURL = u.pathname.replace("/pub/", "");
                    hostDocumentURL = hostDocumentURL.substring(hostDocumentURL.indexOf("/") + 1);
                    // console.log("R2_EVENT_IMAGE_CLICK hostDocumentURL", hostDocumentURL);
                }
                const payload: IEventPayload_R2_EVENT_IMAGE_CLICK = {
                    hostDocumentURL,
                    isSVGFragment,
                    isSVGImage,
                    HTMLImgSrc_SVGImageHref_SVGFragmentMarkup: href_src as string,
                    cssSelectorOf_HTMLImg_SVGImage_SVGFragment,
                    languageOf_HTMLImg_SVGImage_SVGFragment: getLanguage(HTMLImg_SVGImage_SVGFragment),
                    directionOf_HTMLImg_SVGImage_SVGFragment: getDirection(HTMLImg_SVGImage_SVGFragment), // TODO: really, only useful for child title element of SVG, not in the general case
                    altAttributeOf_HTMLImg_SVGImage_SVGFragment: HTMLImg_SVGImage_SVGFragment.getAttribute("alt"),
                    titleAttributeOf_HTMLImg_SVGImage_SVGFragment: HTMLImg_SVGImage_SVGFragment.getAttribute("title"),
                    ariaLabelAttributeOf_HTMLImg_SVGImage_SVGFragment: HTMLImg_SVGImage_SVGFragment.getAttribute("aria-label"),
                    naturalWidthOf_HTMLImg_SVGImage: isSVGFragment ? undefined :
                        isSVGImage ? (((HTMLImg_SVGImage_SVGFragment as SVGImageElement) as unknown as HTMLImageElement).naturalWidth || undefined) :
                        (HTMLImg_SVGImage_SVGFragment as HTMLImageElement).naturalWidth,
                    naturalHeightOf_HTMLImg_SVGImage: isSVGFragment ? undefined :
                        isSVGImage ? (((HTMLImg_SVGImage_SVGFragment as SVGImageElement) as unknown as HTMLImageElement).naturalHeight || undefined) :
                        (HTMLImg_SVGImage_SVGFragment as HTMLImageElement).naturalHeight,
                    // isFigure: isFigure(HTMLImg_SVGImage_SVGFragment.parentElement),
                    // figureCssSelector: isFigure(HTMLImg_SVGImage_SVGFragment.parentElement)
                    //     ? getCssSelector(HTMLImg_SVGImage_SVGFragment.parentElement)
                    //     : undefined,
                    // figcaptionCssSelector: isFigure(HTMLImg_SVGImage_SVGFragment.parentElement)
                    //     ? getCssSelector(HTMLImg_SVGImage_SVGFragment.parentElement.getElementsByTagName("figcaption")[0]) // return "" if undefined
                    //     : undefined,
                    // ariaDescribedbyAttribute: (HTMLImg_SVGImage_SVGFragment as HTMLImageElement).getAttribute("aria-describedby") || undefined,
                    // ariaDetailsAttribute: (HTMLImg_SVGImage_SVGFragment as HTMLImageElement).getAttribute("aria-details") || undefined, // aria-details from the image is removed in navigator why ?
                };
                payload.naturalWidthOf_HTMLImg_SVGImage = payload.naturalWidthOf_HTMLImg_SVGImage || undefined;
                payload.naturalHeightOf_HTMLImg_SVGImage = payload.naturalHeightOf_HTMLImg_SVGImage || undefined;
                if (!isSVGFragment && // isSVGImage or just HTML image
                    !payload.naturalWidthOf_HTMLImg_SVGImage || !payload.naturalHeightOf_HTMLImg_SVGImage) {

                    const imageObject = new Image();
                    imageObject.onload = function() {
                        payload.naturalWidthOf_HTMLImg_SVGImage = imageObject.naturalWidth || undefined;
                        payload.naturalHeightOf_HTMLImg_SVGImage = imageObject.naturalHeight || undefined;
                        ipcRenderer.sendToHost(R2_EVENT_IMAGE_CLICK, payload);
                    };
                    imageObject.onerror = function() {
                        ipcRenderer.sendToHost(R2_EVENT_IMAGE_CLICK, payload);
                    };
                    imageObject.src = href_src as string; // HTMLImgSrc_SVGImageHref_SVGFragmentMarkup
                } else {
                    ipcRenderer.sendToHost(R2_EVENT_IMAGE_CLICK, payload);
                }

            } else {
                // removed by clearImageZoomOutline();
                HTMLImg_SVGImage_SVGFragment.setAttribute(`data-${POPOUTIMAGE_CONTAINER_ID}`, "1");
            }

            return;
        }

        if (!linkElement || !href_src) {
            clearImageZoomOutline();
            return;
        }

        const hrefStr = href_src as string;
        if (/^javascript:/.test(hrefStr)) {
            clearImageZoomOutline();
            return;
        }

        clearImageZoomOutline();

        // a@href onClick on MacOS with event.altKey (aka option) triggers the download dialog, event.metaKey and event.shiftKey request a new child window
        // ... but we intercept here (capture) so the native hyperlink event handler is never called anyway...
        // HOWEVER, some types of programmatic hyperlink activation / window.location redirection (found in Adobe InDesign EPUBs, for example) can bypass this, so:
        // see webContents.setWindowOpenHandler() and webContents.on("will-navigate") in the main process which delegate to R2_EVENT_LINK
        ev.preventDefault();
        ev.stopPropagation();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const skipHistory = !!(linkElement as any).__skipHistory;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (linkElement as any).__skipHistory = undefined;

        const encCssSel = encodeURIComponent_RFC3986(getCssSelector(linkElement));

        if (!skipHistory) {
            const payload: IEventPayload_R2_EVENT_LINK = {
                url: "#" + FRAG_ID_CSS_SELECTOR + encCssSel, // see location.ts locationHandleIpcMessage() eventChannel === R2_EVENT_LINK (URL is made absolute if necessary)
            };
            ipcRenderer.sendToHost(R2_EVENT_LINK, payload); // this will result in the app registering the element in the navigation history, but is skipped in location.ts ipcRenderer.on(R2_EVENT_LINK)
        }

        const done = await popupFootNote(
            linkElement as HTMLElement,
            focusScrollRaw,
            hrefStr,
            ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
            ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
        if (done) {
            if (!skipHistory) {
                // double-insert the hyperlink to trigger the popup programmatically on history.back()/forward()
                const payload: IEventPayload_R2_EVENT_LINK = {
                    url: "#" + FRAG_ID_CSS_SELECTOR_ACTIVATE_LINK + encCssSel,
                };
                ipcRenderer.sendToHost(R2_EVENT_LINK, payload);
            }
        } else {
            focusScrollDebounced.clear();
            // processXYDebounced.clear();
            processXYDebouncedImmediate.clear();
            notifyReadingLocationDebounced.clear();
            notifyReadingLocationDebouncedImmediate.clear();
            scrollToHashDebounced.clear();
            onScrollDebounced.clear();
            onResizeDebounced.clear();
            handleFocusInDebounced.clear();
            // mediaOverlaysClickDebounced.clear();

            if (!skipHistory) {
                const payload: IEventPayload_R2_EVENT_LINK = {
                    url: hrefStr,
                };
                ipcRenderer.sendToHost(R2_EVENT_LINK, payload);
            }
        }
    }, true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on("R2_EVENT_IMAGE_CLICK", (_event: any, payload: IEventPayload_R2_EVENT_IMAGE_CLICK) => {
        debug("R2_EVENT_IMAGE_CLICK (ipcRenderer.on) href: " + JSON.stringify(payload, null, 4));
        // win.document.querySelectorAll(`img[data-${POPOUTIMAGE_CONTAINER_ID}]`);
        // win.document.querySelectorAll(`image[data-${POPOUTIMAGE_CONTAINER_ID}]`);
        // win.document.querySelectorAll(`svg[data-${POPOUTIMAGE_CONTAINER_ID}]`);
        // const HTMLImg_SVGImage_SVGFragment = win.document.querySelector(`[data-${POPOUTIMAGE_CONTAINER_ID}]`);
        const HTMLImg_SVGImage_SVGFragment = win.document.querySelector(payload.cssSelectorOf_HTMLImg_SVGImage_SVGFragment);
        if (HTMLImg_SVGImage_SVGFragment) {
            popoutImage(
                win,
                payload.cssSelectorOf_HTMLImg_SVGImage_SVGFragment,
                HTMLImg_SVGImage_SVGFragment as HTMLImageElement | SVGElement,
                payload.HTMLImgSrc_SVGImageHref_SVGFragmentMarkup,
                payload.isSVGFragment,
                payload.isSVGImage,
                focusScrollRaw,
                ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
                ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on("R2_EVENT_WINDOW_RESIZE", (_event: any, zoomPercent: number) => {
        debug("R2_EVENT_WINDOW_RESIZE zoomPercent " + zoomPercent);

        // if (zoomPercent !== win.READIUM2.fxlZoomPercent) {
        // tslint:disable-next-line:max-line-length
        //     debug("R2_EVENT_WINDOW_RESIZE zoomPercent !== win.READIUM2.fxlZoomPercent ??! " + zoomPercent + " -- " + win.READIUM2.fxlZoomPercent);
        // }
        win.READIUM2.fxlZoomPercent = zoomPercent;

        if (!win.READIUM2.isFixedLayout) {
            debug("R2_EVENT_WINDOW_RESIZE skipped, !FXL");
            return;
        }

        const wh = configureFixedLayout(win.document, win.READIUM2.isFixedLayout,
            win.READIUM2.fxlViewportWidth, win.READIUM2.fxlViewportHeight,
            win.innerWidth, win.innerHeight, win.READIUM2.webViewSlot,
            win.READIUM2.fxlZoomPercent);

        if (wh) {
            win.READIUM2.fxlViewportWidth = wh.width;
            win.READIUM2.fxlViewportHeight = wh.height;
            win.READIUM2.fxlViewportScale = wh.scale;

            const payload: IEventPayload_R2_EVENT_FXL_CONFIGURE = {
                fxl: wh,
            };
            ipcRenderer.sendToHost(R2_EVENT_FXL_CONFIGURE, payload);
        } else {
            const payload: IEventPayload_R2_EVENT_FXL_CONFIGURE = {
                fxl: null,
            };
            ipcRenderer.sendToHost(R2_EVENT_FXL_CONFIGURE, payload);
        }

        recreateAllHighlightsRaw(win);
    });

    const onResizeRaw = () => {

        if (win.READIUM2.isFixedLayout) {
            debug("scrollToHashRaw skipped, FXL");
            return;
        }

        if (DEBUG_TRACE) debug("onResizeRaw: scrollToHashDebounced()...");
        // CONTEXT: loaded() - onResizeRaw
        scrollToHashDebounced(false);
    };
    const onResizeDebounced = debounce(() => {
        if (DEBUG_TRACE) debug("onResizeDebounced: onResizeRaw()...");
        // CONTEXT: onResizeDebounced()
        onResizeRaw();
    }, 200);
    let _firstWindowResize = true;
    win.addEventListener("resize", () => {
        if (_firstWindowResize) {
            debug("Window resize (WEBVIEW), SKIP FIRST");
            _firstWindowResize = false;
            // recreateAllHighlightsRaw(win);
            recreateAllHighlights(win);
            return;
        }

        // if (ENABLE_WEBVIEW_RESIZE) {
        //     onResizeRaw();
        // } else {
        //     onResizeDebounced();
        // }
        //
        if (DEBUG_TRACE) debug(" loaded() RESIZE: onResizeDebounced()...");
        // CONTEXT: event WINDOW "resize"
        onResizeDebounced();
    });

    let _wheelTimeStamp = -1;
    let _wheelSpin = 0;
    const wheelDebounced = // debounce(
        (ev: WheelEvent) => {
        // console.log("wheel", ev);

        const now = (new Date()).getTime();
        if (_wheelTimeStamp === -1) {
            _wheelTimeStamp = now;
        } else {
            const msDiff = now - _wheelTimeStamp;
            if (msDiff < 500) {
                // console.log("wheel skip time", msDiff);
                return;
            }
        }

        if (win.READIUM2.isAudio || win.READIUM2.isFixedLayout || !win.document.body) {
            return;
        }

        if (!win.document || !win.document.documentElement) {
            return;
        }

        const documant = win.document;

        const isPaged = isPaginated(documant);
        if (isPaged) {
            return;
        }

        const delta = Math.abs(ev.deltaY);
        // MacOS touchpad kinetic scroll generates 1px delta post- flick gesture
        // if (delta < 2) {
        //     console.log("wheel skip (small delta)", ev.deltaY, _wheelSpin);
        //     return;
        // }
        _wheelSpin += delta;
        if (_wheelSpin < 300) {
            // console.log("wheel skip (spin more...)", ev.deltaY, _wheelSpin);
            return;
        }

        // console.log("wheel turn page", ev.deltaY, _wheelSpin);
        _wheelSpin = 0;
        _wheelTimeStamp = -1;

        const scrollElement = getScrollingElement(documant);

        const isVWM = isVerticalWritingMode();

        const goPREVIOUS = ev.deltaY < 0;
        if (!goPREVIOUS) { // goPREVIOUS && isRTL() || !goPREVIOUS && !isRTL()) { // right

            const maxScrollShift = calculateMaxScrollShift().maxScrollShift;
            const maxScrollShiftTolerated = maxScrollShift - CSS_PIXEL_TOLERANCE;

            if (isPaged) {
                const unit = isVWM ?
                    (scrollElement as HTMLElement).offsetHeight :
                    (scrollElement as HTMLElement).offsetWidth;
                let scrollElementOffset = Math.round(isVWM ?
                    scrollElement.scrollTop :
                    scrollElement.scrollLeft);
                const isNegative = scrollElementOffset < 0;
                const scrollElementOffsetAbs = Math.abs(scrollElementOffset);
                const fractional = scrollElementOffsetAbs / unit;
                const integral = Math.floor(fractional);
                const decimal = fractional - integral;
                const partial = decimal * unit;
                if (partial <= CSS_PIXEL_TOLERANCE) {
                    scrollElementOffset = (isNegative ? -1 : 1) * integral * unit;
                } else if (partial >= (unit - CSS_PIXEL_TOLERANCE)) {
                    scrollElementOffset = (isNegative ? -1 : 1) * (integral + 1) * unit;
                }
                if (isVWM && (scrollElementOffsetAbs >= maxScrollShiftTolerated) ||
                    !isVWM && (scrollElementOffsetAbs >= maxScrollShiftTolerated)) {

                    const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
                        // direction: "LTR",
                        go: "NEXT",
                    };
                    ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
                    return;
                }
            } else {
                if (isVWM && (Math.abs(scrollElement.scrollLeft) >= maxScrollShiftTolerated) ||
                    !isVWM && (Math.abs(scrollElement.scrollTop) >= maxScrollShiftTolerated)) {

                    const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
                        // direction: "LTR",
                        go: "NEXT",
                    };
                    ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
                    return;
                }
            }
        } else if (goPREVIOUS) { //  && !isRTL() || !goPREVIOUS && isRTL()) { // left
            if (isPaged) {
                const unit = isVWM ?
                    (scrollElement as HTMLElement).offsetHeight :
                    (scrollElement as HTMLElement).offsetWidth;
                let scrollElementOffset = Math.round(isVWM ?
                    scrollElement.scrollTop :
                    scrollElement.scrollLeft);
                const isNegative = scrollElementOffset < 0;
                const scrollElementOffsetAbs = Math.abs(scrollElementOffset);
                const fractional = scrollElementOffsetAbs / unit;
                const integral = Math.floor(fractional);
                const decimal = fractional - integral;
                const partial = decimal * unit;
                if (partial <= CSS_PIXEL_TOLERANCE) {
                    scrollElementOffset = (isNegative ? -1 : 1) * integral * unit;
                } else if (partial >= (unit - CSS_PIXEL_TOLERANCE)) {
                    scrollElementOffset = (isNegative ? -1 : 1) * (integral + 1) * unit;
                }
                if (isVWM && (scrollElementOffsetAbs <= 0) ||
                    !isVWM && (scrollElementOffsetAbs <= 0)) {

                    const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
                        // direction: "LTR",
                        go: "PREVIOUS",
                    };
                    ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
                    return;
                }
            } else {
                if (isVWM && (Math.abs(scrollElement.scrollLeft) <= 0) ||
                    !isVWM && (Math.abs(scrollElement.scrollTop) <= 0)) {

                    const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
                        // direction: "LTR",
                        go: "PREVIOUS",
                    };
                    ipcRenderer.sendToHost(R2_EVENT_PAGE_TURN_RES, payload);
                    return;
                }
            }
        }

    }
    // , 100)
    ;
    win.document.addEventListener("wheel", wheelDebounced);
    win.document.addEventListener("scroll", (_ev: Event) => {
        // console.log("scroll reset _wheelSpin");
        _wheelSpin = 0;
        _wheelTimeStamp = -1;
    });

    setTimeout(() => {
        win.addEventListener("scroll", (_ev: Event) => {

            if (_ignoreScrollEvent) {
                // _ignoreScrollEvent = false;
                return;
            }

            if (_lastAnimState && _lastAnimState.animating) {
                debug("_lastAnimState"); // should never happen, as _ignoreScrollEvent
                return;
            }

            if (_lastAnimState2 && _lastAnimState2.animating) {
                debug("_lastAnimState2"); // should never happen, as _ignoreScrollEvent
                return;
            }

            if (!win.document || !win.document.documentElement) {
                return;
            }

            // const nowTime = Date.now(); // +new Date()
            // // eslint-disable-next-line @typescript-eslint/no-explicit-any
            // ((win as any).r2_scrollTime as number) = nowTime;

            // if (DEBUG_TRACE) debug("loaded() SCROLL: onScrollDebounced()...");
            // CONTEXT: scroll - loaded()
            onScrollDebounced(true);
        });
    }, 200);

    function handleMouseEvent(ev: MouseEvent) {

        if (isPopupDialogOpen(win.document)) {
            return;
        }

        // debug(".hashElement = 5 DEBUUUUUG");
        // if (win.document.activeElement) {
        //     debug("win.document.activeElement:");
        //     debug(getCssSelector(win.document.activeElement));
        // }
        // const elSkip = win.document.getElementById(SKIP_LINK_ID);
        // if (elSkip) {
        //     debug("elSkip:");
        //     debug(getCssSelector(elSkip));
        // }
        // debug("ROOT_CLASS_KEYBOARD_INTERACT: ", win.document.documentElement.classList.contains(ROOT_CLASS_KEYBOARD_INTERACT));

        // screen reader a@href click event without ENTER key generates touch/user interaction!
        if (ENABLE_SKIP_LINK && win.document.activeElement &&
            win.document.activeElement === win.document.getElementById(SKIP_LINK_ID)

            // can't filter with this, because screen reader emulates mouse click!
            // && win.document.documentElement.classList.contains(ROOT_CLASS_KEYBOARD_INTERACT)
            ) {
            debug(".hashElement = 5 => SKIP_LINK_ID mouse click event - screen reader VoiceOver generates mouse click / non-keyboard event");
            return;
        }

        // relative to fixed window top-left corner
        // (unlike pageX/Y which is relative to top-left rendered content area, subject to scrolling)
        const x = ev.clientX;
        const y = ev.clientY;

        console.log("MOUSEUP ev.clientX/Y", ev.clientX, ev.clientY);

        if (DEBUG_TRACE) debug("handleMouseEvent: processXYDebouncedImmediate()...");
        // CONTEXT: handleMouseEvent mouseup
        processXYDebouncedImmediate(x, y, false, true);

        // const domPointData = domDataFromPoint(x, y);

        // if (domPointData.element && win.READIUM2.ttsClickEnabled) {
        //     if (ev.altKey) {
        //         ttsPlay(
        //             win.READIUM2.ttsPlaybackRate,
        //             win.READIUM2.ttsVoice,
        //             focusScrollRaw,
        //             domPointData.element,
        //             undefined,
        //             undefined,
        //             -1,
        //             ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
        //             ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
        //         return;
        //     }

        //     ttsPlay(
        //         win.READIUM2.ttsPlaybackRate,
        //         win.READIUM2.ttsVoice,
        //         focusScrollRaw,
        //         (domPointData.element.ownerDocument as Document).body,
        //         domPointData.element,
        //         domPointData.textNode,
        //         domPointData.textNodeOffset,
        //         ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
        //         ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
        // }
    }

    // win.document.body.addEventListener("click", (ev: MouseEvent) => {
    //     handleMouseEvent(ev);
    // });
    win.document.documentElement.addEventListener("mouseup", (ev: MouseEvent) => {
        handleMouseEvent(ev);
    });

    win.document.addEventListener("mouseup", (ev: MouseEvent) => {

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (ev.target && (ev.target as any).getAttribute) {

            const iBooksMO = (ev.target as HTMLElement).getAttribute("ibooks:readaloud") ||
                (ev.target as HTMLElement).getAttribute("readaloud");

            if (iBooksMO) {
                const payload: IEventPayload_R2_EVENT_MEDIA_OVERLAY_STARTSTOP = {
                    start: iBooksMO === "start" ? true : undefined,
                    startstop: iBooksMO === "startstop" ? true : undefined,
                    stop: iBooksMO === "stop" ? true : undefined,
                };

                ipcRenderer.sendToHost(R2_EVENT_MEDIA_OVERLAY_STARTSTOP, payload);
            }
        }
    }, true);

    win.document.body.addEventListener("copy", (evt: ClipboardEvent) => {
        if (win.READIUM2.isClipboardIntercept) {
            const selection = win.document.getSelection();
            if (selection) {
                const str = selection.toString();
                if (str) {
                    evt.preventDefault();

                    setTimeout(() => {
                        const payload: IEventPayload_R2_EVENT_CLIPBOARD_COPY = {
                            locator: win.READIUM2.locationHashOverrideInfo, // see notifyReadingLocationRaw()
                            txt: str,
                        };
                        ipcRenderer.sendToHost(R2_EVENT_CLIPBOARD_COPY, payload);
                        // if (evt.clipboardData) {
                        //     evt.clipboardData.setData("text/plain", str);
                        // }
                    }, 500); // see notifyReadingLocationDebounced()
                }
            }
        }
    });
}

// after DOMContentLoaded, but sometimes fail to occur (e.g. some fixed layout docs with single image in body!)
win.addEventListener("load", () => {
    debug("############# load");
    // console.log(win.location);
    loaded(false);
});

// // does not occur when re-using same webview (src="href")
// win.addEventListener("unload", () => {
// });

function checkBlacklisted(el: Element): boolean {

    const id = el.getAttribute("id");
    if (id && _blacklistIdClassForCFI.indexOf(id) >= 0) {
        if (IS_DEV && id !== SKIP_LINK_ID) {
            debug("checkBlacklisted ID: " + id);
        }
        return true;
    }

    for (const item of _blacklistIdClassForCFI) {
        if (el.classList.contains(item)) {
            if (IS_DEV) {
                debug("checkBlacklisted CLASS: " + item);
            }
            return true;
        }
    }

    const mathJax = win.document.documentElement.classList.contains(ROOT_CLASS_MATHJAX);
    if (mathJax) {
        const low = el.tagName.toLowerCase();
        for (const item of _blacklistIdClassForCFIMathJax) {
            if (low.startsWith(item)) {
                if (IS_DEV) {
                    debug("checkBlacklisted MathJax ELEMENT NAME: " + el.tagName);
                }
                return true;
            }
        }

        if (id) {
            const lowId = id.toLowerCase();
            for (const item of _blacklistIdClassForCFIMathJax) {
                if (lowId.startsWith(item)) {
                    if (IS_DEV) {
                        debug("checkBlacklisted MathJax ID: " + id);
                    }
                    return true;
                }
            }
        }

        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < el.classList.length; i++) {
            const cl = el.classList[i];
            const lowCl = cl.toLowerCase();
            for (const item of _blacklistIdClassForCFIMathJax) {
                if (lowCl.startsWith(item)) {
                    if (IS_DEV) {
                        debug("checkBlacklisted MathJax CLASS: " + cl);
                    }
                    return true;
                }
            }
        }
    }

    return false;
}

function findFirstVisibleElement(rootElement: Element): Element | undefined {

    const blacklisted = checkBlacklisted(rootElement);
    if (blacklisted) {
        return undefined;
    }

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < rootElement.children.length; i++) {
        const child = rootElement.children[i];
        if (child.nodeType !== Node.ELEMENT_NODE) {
            continue;
        }
        const visibleElement = findFirstVisibleElement(child);
        if (visibleElement) {
            return visibleElement;
        }
    }
    if (rootElement !== win.document.body &&
        rootElement !== win.document.documentElement) {

        if (isVisible(false, rootElement, undefined)) {
            return rootElement;
        }
    }
    return undefined;
}

type TDOMPointData = {
    textNode: Node | undefined;
    textNodeOffset: number;
    element: Element | undefined;
};
const domDataFromPoint = (x: number, y: number): TDOMPointData => {

    // const elems = win.document.elementsFromPoint(x, y);
    // let element: Element | undefined = elems && elems.length ? elems[0] : undefined;
    // if ((win.document as any).caretPositionFromPoint) {
    //     const range = (win.document as any).caretPositionFromPoint(x, y);
    //     const node = range.offsetNode;
    //     const offset = range.offset;
    // } else if (win.document.caretRangeFromPoint) {
    // }

    const domPointData: TDOMPointData = {
        textNode: undefined,
        textNodeOffset: -1,
        element: undefined,
    };
    const range = win.document.caretRangeFromPoint(x, y);
    if (range) {
        const node = range.startContainer;

        if (node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                domPointData.element = node as Element;
                const childrenCount = domPointData.element.childNodes?.length; // childElementCount
                if (childrenCount > 0 &&
                    range.startOffset > 0 &&
                    range.startOffset === range.endOffset &&
                    range.startOffset < childrenCount) {
                    let c = domPointData.element.childNodes[range.startOffset]; // .children
                    if (c.nodeType === Node.ELEMENT_NODE) {
                        domPointData.element = c as Element;
                    } else if (c.nodeType === Node.TEXT_NODE && range.startOffset > 0) { // hack (weird image click bug)
                        c = domPointData.element.childNodes[range.startOffset - 1];
                        if (c?.nodeType === Node.ELEMENT_NODE) {
                            domPointData.element = c as Element;
                        }
                    }
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                domPointData.textNode = node;
                domPointData.textNodeOffset = range.startOffset;

                if (node.parentNode && node.parentNode.nodeType === Node.ELEMENT_NODE) {
                    domPointData.element = node.parentNode as Element;
                }
                if (!domPointData.element && node.parentElement) {
                    domPointData.element = node.parentElement;
                }
            }
        }
    }

    return domPointData;
};

// relative to fixed window top-left corner
const processXYRaw = (x: number, y: number, reverse: boolean, userInteract: boolean, fromViewportScroll?: boolean) => {

    if (DEBUG_TRACE) debug("processXYRaw");
    if (DEBUG_TRACE) debug("reverse", reverse);
    if (DEBUG_TRACE) debug("userInteract", userInteract);
    if (DEBUG_TRACE) debug("fromViewportScroll", fromViewportScroll);
    if (DEBUG_TRACE) debug("x y: ", x, y);
    if (DEBUG_TRACE) debug("document.documentElement.clientWidth/Height: ", win.document.documentElement.clientWidth, win.document.documentElement.clientHeight);
    if (DEBUG_TRACE) debug("document.documentElement.offsetWidth/Height: ", win.document.documentElement.offsetWidth, win.document.documentElement.offsetHeight);
    if (DEBUG_TRACE) debug("document.documentElement.scrollWidth/Height: ", win.document.documentElement.scrollWidth, win.document.documentElement.scrollHeight);
    if (DEBUG_TRACE) debug("document.documentElement.scrollTop/Left: ", win.document.documentElement.scrollTop, win.document.documentElement.scrollLeft);
    if (DEBUG_TRACE) debug("document.body.clientWidth/Height: ", win.document.body.clientWidth, win.document.body.clientHeight);
    if (DEBUG_TRACE) debug("document.body.offsetWidth/Height: ", win.document.body.offsetWidth, win.document.body.offsetHeight);
    if (DEBUG_TRACE) debug("document.body.scrollWidth/Height: ", win.document.body.scrollWidth, win.document.body.scrollHeight);
    if (DEBUG_TRACE) debug("document.body.scrollTop/Left: ", win.document.body.scrollTop, win.document.body.scrollLeft);
    if (DEBUG_TRACE) {
        const bodyComputedStyle = win.getComputedStyle(win.document.body);
        const zoomStr = bodyComputedStyle.zoom || "1";
        const zoomFactor = parseFloat(zoomStr);
        debug("document.body.style.zoom", zoomFactor);
    }



    // includes TTS!
    if (isPopupDialogOpen(win.document)) {
        debug("processXYRaw: isPopupDialogOpen SKIP");
        return;
    }

    // if (userInteract) {
    win.READIUM2.lastClickedTextChar = undefined;
    // }

    const domPointData = domDataFromPoint(x, y);
    if (DEBUG_TRACE) debug("processXYRaw: domDataFromPoint => ", domPointData.element ? getCssSelector(domPointData.element) : "!!!? domPointData.element");

    if (!domPointData.element ||
        domPointData.element === win.document.body ||
        domPointData.element === win.document.documentElement) {

        const root = win.document.body; // || win.document.documentElement;
        domPointData.element = findFirstVisibleElement(root);
        if (!domPointData.element) {
            if (DEBUG_TRACE) debug("processXYRaw: findFirstVisibleElement1 FAIL? (BODY fallback)");
            domPointData.element = win.document.body;
            domPointData.textNode = undefined;
            domPointData.textNodeOffset = -1;
        } else {
            if (DEBUG_TRACE) debug("processXYRaw: findFirstVisibleElement1 => ", getCssSelector(domPointData.element));
        }
    } else if (!userInteract &&
        domPointData.element &&
        !isVisible(false, domPointData.element, undefined)) { // isPaginated(win.document)

        let next: Element | undefined = domPointData.element;
        let found: Element | undefined;
        while (next) {
            // const blacklisted = checkBlacklisted(next);
            // if (blacklisted) {
            //     break;
            // }

            const firstInside = findFirstVisibleElement(next);
            if (firstInside) {
                found = firstInside;
                break;
            }
            let sibling: Element | null = reverse ? next.previousElementSibling : next.nextElementSibling;
            let parent: Node | null = next;
            while (!sibling) {
                parent = parent.parentNode;
                if (!parent || parent.nodeType !== Node.ELEMENT_NODE) {
                    break;
                }
                sibling = reverse ?
                    (parent as Element).previousElementSibling :
                    (parent as Element).nextElementSibling;
            }
            next = sibling ? sibling : undefined;
        }
        if (found) {
            if (DEBUG_TRACE) debug("processXYRaw: findFirstVisibleElement2 => ", getCssSelector(domPointData.element));
            domPointData.element = found;
            domPointData.textNode = undefined;
            domPointData.textNodeOffset = -1;
        } else {
            if (DEBUG_TRACE) debug("processXYRaw: findFirstVisibleElement *AFTER* FAIL?");
        }
    }
    // if (element) {
    //     debug("|||||||||||||| SELECTED ELEMENT");
    //     debug(element);
    //     if (element) {
    //         debug(uniqueCssSelector(element, win.document, undefined));
    //     }
    // }
    if (domPointData.element === win.document.body ||
        domPointData.element === win.document.documentElement) {

        if (DEBUG_TRACE) debug("processXYRaw: domPointData.element HTML BODY?");
    }
    if (domPointData.element) {
        if (DEBUG_TRACE) debug("processXYRaw: branch1 => ", getCssSelector(domPointData.element), win.READIUM2.locationHashOverride ? getCssSelector(win.READIUM2.locationHashOverride) : "!!!win.READIUM2.locationHashOverride");

        if (userInteract ||
            !win.READIUM2.locationHashOverride ||
            win.READIUM2.locationHashOverride === win.document.body ||
            win.READIUM2.locationHashOverride === win.document.documentElement) {
            if (DEBUG_TRACE) debug("processXYRaw: branch1.1");

            if (// userInteract &&
                domPointData.textNode?.nodeValue?.length && domPointData.textNodeOffset >= 0 && domPointData.textNodeOffset <= domPointData.textNode.nodeValue.length) { // can be greater than length!
                // debug("processXYRaw CLICK/MOUSE_UP TEXT NODE: " + domPointData.textNode.nodeValue);

                win.READIUM2.lastClickedTextChar = {
                    textNode: domPointData.textNode,
                    textNodeOffset: domPointData.textNodeOffset,
                };

                // const selection = win.getSelection();
                // if (selection) {
                //     // debug("processXYRaw SELECTION, TEXT NODE OFFSET: " + domPointData.textNodeOffset + " // " + domPointData.textNode.nodeValue.length);

                //     selection.removeAllRanges();
                //     // selection.empty();
                //     // selection.collapseToStart();
                //     const range = win.document.createRange();
                //     const startOffset = domPointData.textNodeOffset >= domPointData.textNode.nodeValue.length ? domPointData.textNodeOffset - 1 : domPointData.textNodeOffset;
                //     range.setStart(domPointData.textNode, startOffset);
                //     range.setEnd(domPointData.textNode, startOffset + 1);
                //     selection.addRange(range);
                // }
            }

            // underscore special link will prioritise hashElement!
            win.READIUM2.hashElement = userInteract ? domPointData.element : win.READIUM2.hashElement;
            win.READIUM2.locationHashOverride = domPointData.element;
        } else {
            if (DEBUG_TRACE) debug("processXYRaw: branch1.2");

            // this logic exists because of TOC linking,
            // to avoid reseting to first visible item ... but for page turns we need this!
            if (!isVisible(false, win.READIUM2.locationHashOverride, undefined)) {
                if (DEBUG_TRACE) debug("processXYRaw: branch1.2.1");

                if (domPointData.textNode?.nodeValue?.length && domPointData.textNodeOffset >= 0 && domPointData.textNodeOffset <= domPointData.textNode.nodeValue.length) { // can be greater than length!
                    win.READIUM2.lastClickedTextChar = {
                        textNode: domPointData.textNode,
                        textNodeOffset: domPointData.textNodeOffset,
                    };
                }

                // underscore special link will prioritise hashElement!
                win.READIUM2.hashElement = userInteract ? domPointData.element : win.READIUM2.hashElement;
                win.READIUM2.locationHashOverride = domPointData.element;
            } else if (
                win.READIUM2.hashElement !== win.READIUM2.locationHashOverride &&
                (
                win.READIUM2.ttsClickEnabled ||
                win.document.documentElement.classList.contains(TTS_CLASS_PLAYING) ||
                win.document.documentElement.classList.contains(TTS_CLASS_PAUSED)
                )
            ) {
                if (DEBUG_TRACE) debug("processXYRaw: branch1.2.2");

                if (domPointData.textNode?.nodeValue?.length && domPointData.textNodeOffset >= 0 && domPointData.textNodeOffset <= domPointData.textNode.nodeValue.length) { // can be greater than length!
                    win.READIUM2.lastClickedTextChar = {
                        textNode: domPointData.textNode,
                        textNodeOffset: domPointData.textNodeOffset,
                    };
                }

                // underscore special link will prioritise hashElement!
                win.READIUM2.hashElement = userInteract ? domPointData.element : win.READIUM2.hashElement;
                win.READIUM2.locationHashOverride = domPointData.element;
            }
        }

        // TODO: 250ms debounce on the leading edge (immediate) doesn't allow double-click to capture win.getSelection() for bookmark titles and annotations, because the notifyReadingLocation occurs before the DOM selection is ready. Instead of reverting to the debounce trailing edge (which causes a 200ms+ delay), could we detect double-click? Any other unintended side-effects / possible regression bugs from this change??
        if (userInteract && win.READIUM2.DEBUG_VISUALS) {
            if (DEBUG_TRACE) debug("processXYRaw: notifyReadingLocationDebouncedImmediate()...");
            // CONTEXT: processXYRaw()
            notifyReadingLocationDebouncedImmediate(userInteract);
        } else {
            if (fromViewportScroll && win.READIUM2.accessibilitySupportEnabled) {
                // we don't want to interfere with screen readers when they are moving their internal virtual buffer cursor which causes layout shifts
                if (DEBUG_TRACE) debug("processXYRaw: scroll-screen-reader + notifyReadingLocationDebounced()...");
                // CONTEXT: processXYRaw()
                notifyReadingLocationDebounced(userInteract, false, true);
            } else {
                if (DEBUG_TRACE) debug("processXYRaw: !scroll-screen-reader + notifyReadingLocationDebounced()...");
                // CONTEXT: processXYRaw()
                notifyReadingLocationDebounced(userInteract);
            }
        }

        if (userInteract && win.READIUM2.locationHashOverride) {
            if (DEBUG_TRACE) debug("processXYRaw: focusElement()...");
            // CONTEXT: processXYRaw()
            focusElement(win.READIUM2.locationHashOverride, true /*, false */);
        }

        if (win.READIUM2.DEBUG_VISUALS) {
            const el = win.READIUM2.locationHashOverride ? win.READIUM2.locationHashOverride : domPointData.element;
            const existings = win.document.querySelectorAll(`*[${readPosCssStylesAttr2}]`);
            existings.forEach((existing) => {
                existing.removeAttribute(`${readPosCssStylesAttr2}`);
            });
            el.setAttribute(readPosCssStylesAttr2, "processXYRaw");
        }
    }

    debug("processXYRaw EXIT");
};
// const processXYDebounced = debounce((x: number, y: number, reverse: boolean, userInteract?: boolean) => {
//     processXYRaw(x, y, reverse, userInteract);
// }, 300);
const processXYDebouncedImmediate = debounce((x: number, y: number, reverse: boolean, userInteract: boolean) => {
    if (DEBUG_TRACE) debug("processXYDebouncedImmediate: processXYRaw()...");
    if (DEBUG_TRACE) debug("x y: ", x, y);
    // CONTEXT: processXYDebouncedImmediate
    processXYRaw(x, y, reverse, userInteract);
}, 300, { immediate: true });

interface IProgressionData {
    percentRatio: number;
    paginationInfo: IPaginationInfo | undefined;
}
const computeProgressionData = (): IProgressionData => {

    const isPaged = isPaginated(win.document);

    const isTwoPage = isTwoPageSpread();

    const { maxScrollShift, maxScrollShiftAdjusted } = calculateMaxScrollShift();

    const totalColumns = calculateTotalColumns();

    let progressionRatio = 0;

    // zero-based index: 0 <= currentColumn < totalColumns
    let currentColumn = 0;

    const scrollElement = getScrollingElement(win.document);

    const isVWM = isVerticalWritingMode();

    let extraShift = 0;
    if (isPaged) {
        if (maxScrollShift > 0) {
            if (isVWM) {
                progressionRatio = scrollElement.scrollTop / maxScrollShift;
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                extraShift = ENABLE_EXTRA_COLUMN_SHIFT_METHOD ? (scrollElement as any).scrollLeftExtra : 0;
                // extraShift === maxScrollShiftAdjusted - maxScrollShift

                // console.log("&&&&& EXTRA");
                // console.log(extraShift);
                // console.log(maxScrollShiftAdjusted);
                // console.log(maxScrollShift);
                // console.log(maxScrollShiftAdjusted - maxScrollShift);

                if (extraShift) {
                    progressionRatio = (((isRTL() ? -1 : 1) * scrollElement.scrollLeft) + extraShift) /
                        maxScrollShiftAdjusted;
                } else {
                    progressionRatio = ((isRTL() ? -1 : 1) * scrollElement.scrollLeft) / maxScrollShift;
                }
            }
        }

        // console.log(")))))))) 0 progressionRatio");
        // console.log(progressionRatio);

        // because maxScrollShift excludes whole viewport width of content (0%-100% scroll but minus last page/spread)
        const adjustedTotalColumns = (extraShift ? (totalColumns + 1) : totalColumns) - (isTwoPage ? 2 : 1);
        // tslint:disable-next-line:max-line-length
        // const adjustedTotalColumns = totalColumns - (isTwoPage ? ((maxScrollShiftAdjusted > maxScrollShift) ? 1 : 2) : 1);

        currentColumn = adjustedTotalColumns * progressionRatio;
        // console.log("%%%%%%%% 0 currentColumn");
        // console.log(currentColumn);

        currentColumn = Math.round(currentColumn);
    } else {
        if (maxScrollShift > 0) {
            if (isVWM) {
                // (isRTL() ? -1 : 1) * scrollElement.scrollLeft
                // CSS quirk? scrollLeft should always be negative?!
                // ... using abs() instead
                progressionRatio = Math.abs(scrollElement.scrollLeft) / maxScrollShift;
            } else {
                progressionRatio = scrollElement.scrollTop / maxScrollShift;
            }
        }
    }

    if (win.READIUM2.locationHashOverride) {
        const element = win.READIUM2.locationHashOverride as HTMLElement;

        // imprecise
        // const offsetTop = computeOffsetTop(element);

        let offset = 0;

        if (isPaged) {

            if (isVisible(false, element, undefined)) {
                // because clientRect is based on visual rendering,
                // which does not account for extra shift (CSS transform X-translate of the webview)
                const curCol = extraShift ? (currentColumn - 1) : currentColumn;

                const columnDimension = calculateColumnDimension();
                // console.log("##### columnDimension");
                // console.log(columnDimension);

                if (isVWM) {
                    const rect = element.getBoundingClientRect();
                    offset = (curCol * scrollElement.scrollWidth) + rect.left +
                        (rect.top >= columnDimension ? scrollElement.scrollWidth : 0);
                } else {
                    const boundingRect = element.getBoundingClientRect();
                    const clientRects = getClientRectsNoOverlap(DOMRectListToArray(element.getClientRects()), false, isVWM);
                    let rectangle: IRect | undefined;
                    for (const rect of clientRects) {
                        if (!rectangle) {
                            rectangle = rect;
                            continue;
                        }
                        if (isRTL()) {
                            if ((rect.left + rect.width) > (columnDimension * (isTwoPage ? 2 : 1))) {
                                continue;
                            }
                            if (isTwoPage) {
                                if ((boundingRect.left + boundingRect.width) >= columnDimension &&
                                    (rect.left + rect.width) < columnDimension) {
                                    continue;
                                }
                            }
                            if ((boundingRect.left + boundingRect.width) >= 0 &&
                                (rect.left + rect.width) < 0) {
                                continue;
                            }
                        } else {
                            if (rect.left < 0) {
                                continue;
                            }
                            if (boundingRect.left < columnDimension &&
                                rect.left >= columnDimension) {
                                continue;
                            }
                            if (isTwoPage) {
                                const boundary = 2 * columnDimension;
                                if (boundingRect.left < boundary &&
                                    rect.left >= boundary) {
                                    continue;
                                }
                            }
                        }
                        if (rect.top < rectangle.top) {
                            rectangle = rect;
                            continue;
                        }
                    }
                    if (!rectangle) {
                        rectangle = element.getBoundingClientRect();
                    }

                    // console.log("##### RECT TOP LEFT");
                    // console.log(rectangle.top);
                    // console.log(rectangle.left);

                    offset = (curCol * scrollElement.scrollHeight) + rectangle.top;
                    if (isTwoPage) {
                        if (isRTL()) {
                            if (rectangle.left < columnDimension) {
                                offset += scrollElement.scrollHeight;
                            }
                        } else {
                            if (rectangle.left >= columnDimension) {
                                offset += scrollElement.scrollHeight;
                            }
                        }
                    }
                }

                // console.log("##### offset");
                // console.log(offset);

                // includes whitespace beyond bottom/end of document, to fill the unnocupied remainder of the column
                const totalDocumentDimension = ((isVWM ? scrollElement.scrollWidth :
                    scrollElement.scrollHeight) * totalColumns);
                // console.log("##### totalDocumentDimension");
                // console.log(totalDocumentDimension);
                progressionRatio = offset / totalDocumentDimension;

                // console.log(")))))))) 1 progressionRatio");
                // console.log(progressionRatio);

                currentColumn = totalColumns * progressionRatio;

                // console.log("%%%%%%%% 1 currentColumn");
                // console.log(currentColumn);

                currentColumn = Math.floor(currentColumn);
            }
        } else {

            const rect = element.getBoundingClientRect();
            if (isVWM) {
                offset = scrollElement.scrollLeft + rect.left;
            } else {
                offset = scrollElement.scrollTop + rect.top;
            }

            // (isRTL() ? -1 : 1) * offset (derived from scrollElement.scrollLeft)
            // CSS quirk? scrollLeft should always be negative?!
            // ... using abs() instead
            progressionRatio =
                (isVWM ? Math.abs(offset - win.document.documentElement.clientWidth) : offset)
                /
                (isVWM ? scrollElement.scrollWidth : scrollElement.scrollHeight);
        }
    }

    let spreadIndex = 0;
    if (isPaged) {
        spreadIndex = isTwoPage ? Math.floor(currentColumn / 2) : currentColumn;
    }

    return {
        paginationInfo: isPaged ? {
            currentColumn,
            isTwoPageSpread: isTwoPage,
            spreadIndex,
            totalColumns,
        } : undefined,
        percentRatio: progressionRatio,
    };
};

// tslint:disable-next-line:max-line-length
const _blacklistIdClassForCssSelectors = [EXTRA_COLUMN_PAD_ID, LINK_TARGET_CLASS, LINK_TARGET_ALT_CLASS, CSS_CLASS_NO_FOCUS_OUTLINE, SKIP_LINK_ID, POPUP_DIALOG_CLASS, ID_HIGHLIGHTS_CONTAINER, ID_HIGHLIGHTS_FLOATING, ID_HIGHLIGHTS_FLOATING + "_", CLASS_HIGHLIGHT_CONTAINER, CLASS_HIGHLIGHT_CONTOUR, CLASS_HIGHLIGHT_CONTOUR_MARGIN, TTS_ID_SPEAKING_DOC_ELEMENT, ROOT_CLASS_KEYBOARD_INTERACT, ROOT_CLASS_INVISIBLE_MASK, ROOT_CLASS_INVISIBLE_MASK_REMOVED, CLASS_PAGINATED, ROOT_CLASS_NO_FOOTNOTES, ROOT_CLASS_NO_RUBY];
const _blacklistIdClassForCssSelectorsMathJax = ["mathjax", "ctxt", "mjx", "r2-wbr"];

// tslint:disable-next-line:max-line-length
const _blacklistIdClassForCFI = [EXTRA_COLUMN_PAD_ID, SKIP_LINK_ID, POPUP_DIALOG_CLASS, ID_HIGHLIGHTS_CONTAINER, ID_HIGHLIGHTS_FLOATING, ID_HIGHLIGHTS_FLOATING + "_", CLASS_HIGHLIGHT_CONTAINER, CLASS_HIGHLIGHT_CONTOUR, CLASS_HIGHLIGHT_CONTOUR_MARGIN];
// "CtxtMenu_MenuFrame", "CtxtMenu_Info", "CtxtMenu_MenuItem", "CtxtMenu_ContextMenu",
// "CtxtMenu_MenuArrow", "CtxtMenu_Attached_0", "mjx-container", "MathJax"
const _blacklistIdClassForCFIMathJax = ["mathjax", "ctxt", "mjx", "r2-wbr"];

const computeCFI = (node: Node): string | undefined => {

    // TODO: handle character position inside text node
    if (node.nodeType !== Node.ELEMENT_NODE) {
        // if (node.parentNode) {
        //     return computeCFI(node.parentNode);
        // }
        return undefined;
    }

    // fast path: static cache
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((node as any).__r2Cfi) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (node as any).__r2Cfi;
    }

    let cfi = "";

    let currentElement = node as Element;
    while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {
        const blacklisted = checkBlacklisted(currentElement);
        if (!blacklisted) {
            const currentElementParentChildren = (currentElement.parentNode as Element).children;
            let currentElementIndex = -1;
            let j = 0;
            for (let i = 0; i < currentElementParentChildren.length; i++) {
                const childBlacklisted = checkBlacklisted(currentElementParentChildren[i]);
                if (childBlacklisted) {
                    j++;
                }
                if (currentElement === currentElementParentChildren[i]) {
                    currentElementIndex = i;
                    break;
                }
            }
            if (currentElementIndex >= 0) {
                const cfiIndex = (currentElementIndex - j + 1) * 2;
                cfi = cfiIndex +
                    (currentElement.id ? ("[" + currentElement.id + "]") : "") +
                    (cfi.length ? ("/" + cfi) : "");
            }
        } else {
            cfi = "";
        }
        currentElement = currentElement.parentNode as Element;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node as any).__r2Cfi = "/" + cfi;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (node as any).__r2Cfi;
};

// const computeCFI = (node: Node): string | undefined => {

//     if (node.nodeType !== Node.ELEMENT_NODE) {
//         if (node.parentNode) {
//             return computeCFI(node.parentNode);
//         }
//         return undefined;
//     }

//     let cfi = "";

//     let currentElement = node as Element;
//     while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {
//         const currentElementParentChildren = (currentElement.parentNode as Element).children;
//         let currentElementIndex = -1;
//         for (let i = 0; i < currentElementParentChildren.length; i++) {
//             if (currentElement === currentElementParentChildren[i]) {
//                 currentElementIndex = i;
//                 break;
//             }
//         }
//         if (currentElementIndex >= 0) {
//             const cfiIndex = (currentElementIndex + 1) * 2;
//             cfi = cfiIndex +
//                 (currentElement.id ? ("[" + currentElement.id + "]") : "") +
//                 (cfi.length ? ("/" + cfi) : "");
//         }
//         currentElement = currentElement.parentNode as Element;
//     }

//     return "/" + cfi;
// };

const computeXPath = (node: Node): string | undefined => {

    // TODO: handle character position inside text node
    if (node.nodeType !== Node.ELEMENT_NODE) {
        // if (node.parentNode) {
        //     return computeXPath(node.parentNode);
        // }
        return undefined;
    }

    // fast path: static cache
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((node as any).__r2Xpath) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (node as any).__r2Xpath;
    }

    let xpath = "";

    let currentElement = node as Element;
    while (currentElement.parentNode && (currentElement.parentNode.nodeType === Node.ELEMENT_NODE || currentElement.parentNode.nodeType === Node.DOCUMENT_NODE)) {
        const blacklisted = checkBlacklisted(currentElement);
        if (!blacklisted) {
            const currentElementParentChildren = currentElement.parentNode.nodeType === Node.ELEMENT_NODE ?
                (currentElement.parentNode as Element).children :
                [(currentElement.parentNode as Document).documentElement]; // parentIsDocument
            let currentElementIndex = -1;
            let j = 0;
            let k = -1;
            for (let i = 0; i < currentElementParentChildren.length; i++) {
                const child = currentElementParentChildren[i];
                if (child.tagName === currentElement.tagName) {
                    k++;
                    const childBlacklisted = checkBlacklisted(child);
                    if (childBlacklisted) {
                        j++;
                    }
                }
                if (currentElement === child) {
                    currentElementIndex = k;
                    break;
                }
            }
            if (currentElementIndex >= 0) {
                const nodeIndex = currentElementIndex - j + 1;
                // see $_namespaceResolver
                const nsPrefix =
                    currentElement.namespaceURI === "http://www.w3.org/1999/xhtml" ? "" :
                    currentElement.namespaceURI === "http://www.w3.org/2000/svg" ? "svg:" :
                    currentElement.namespaceURI === "http://www.w3.org/1998/Math/MathML" ? "m:" :
                    "";
                const idAssertion = currentElement.id ? `[@id="${currentElement.id}"]` : "";
                const qname =
                    // nsPrefix === "svg:" ?
                    // `*[local-name()="${currentElement.tagName}" and namespace-uri()="${currentElement.namespaceURI}"]` :
                    `${nsPrefix}${currentElement.tagName}`;
                xpath = `${qname}[${nodeIndex}]${idAssertion}` +
                    (xpath.length ? ("/" + xpath) : "");
            }
        } else {
            xpath = "";
        }
        currentElement = currentElement.parentNode as Element;
    }


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node as any).__r2Xpath = "/" + xpath;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (node as any).__r2Xpath;
};

const _getCssSelectorOptions = {
    // allow long CSS selectors with many steps, deep DOM element paths => minimise runtime querySelectorAll() calls to verify unicity in optimize() function (sacrifice memory footprint in locators for runtime efficiency and human readbility / debugging, better than CFI)
    // seedMinLength: 1000,
    // optimizedMinLength: 1001,
    className: (str: string) => {
        if (_blacklistIdClassForCssSelectors.indexOf(str) >= 0) {
            return false;
        }
        const mathJax = win.document.documentElement.classList.contains(ROOT_CLASS_MATHJAX);
        if (mathJax) {
            const low = str.toLowerCase();
            for (const item of _blacklistIdClassForCssSelectorsMathJax) {
                if (low.startsWith(item)) {
                    return false;
                }
            }
        }
        return true;
    },
    idName: (str: string) => {
        if (_blacklistIdClassForCssSelectors.indexOf(str) >= 0) {
            return false;
        }
        const mathJax = win.document.documentElement.classList.contains(ROOT_CLASS_MATHJAX);
        if (mathJax) {
            const low = str.toLowerCase();
            for (const item of _blacklistIdClassForCssSelectorsMathJax) {
                if (low.startsWith(item)) {
                    return false;
                }
            }
        }
        return true;
    },
    tagName: (str: string) => {
        // if (_blacklistIdClassForCssSelectors.indexOf(str) >= 0) {
        //     return false;
        // }
        const mathJax = win.document.documentElement.classList.contains(ROOT_CLASS_MATHJAX);
        if (mathJax) {
            for (const item of _blacklistIdClassForCssSelectorsMathJax) {
                if (str.startsWith(item)) {
                    return false;
                }
            }
        }
        return true;
    },
};
function getCssSelector(element: Element): string {
    try {
        return uniqueCssSelector(element, win.document, _getCssSelectorOptions);
    } catch (err) {
        debug("uniqueCssSelector:");
        debug(err);
        return "";
    }
}

const _htmlNamespaces: { [prefix: string]: string } = {
    epub: "http://www.idpf.org/2007/ops",
    xhtml: "http://www.w3.org/1999/xhtml",
    // svg: "http://www.w3.org/2000/svg",
    // m: "http://www.w3.org/1998/Math/MathML",
};
const _namespaceResolver = (prefix: string | null): string | null => {
    if (!prefix) {
        return null;
    }
    return _htmlNamespaces[prefix] || null;
};
// type XPathNSResolver =
// ((prefix: string | null) => string | null) |
// { lookupNamespaceURI(prefix: string | null): string | null; };
// const namespaceResolver = win.document.createNSResolver(win.document.documentElement);

interface IHeading {
    element: Element;
    level: number;
    id: string | undefined;
    text: string | undefined;
}
let _allHeadings: IHeading[] | undefined;
const findPrecedingAncestorSiblingHeadings = (element: Element):
    Array<{ id: string | undefined, txt: string | undefined, level: number }> | undefined => {

    if (!_allHeadings) {
        // const xpathResult = win.document.evaluate(
        //     "//h1 | //h2 | //h3 | //h4 | //h5 | //h6",
        //     win.document.body,
        //     _namespaceResolver,
        //     XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        //     null);

        // for (let i = 0; i < xpathResult.snapshotLength; i++) {
        //     const n = xpathResult.snapshotItem(i);
        const headingElements = Array.from(win.document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
        for (const n of headingElements) {
            if (n) {
                const el = n as Element;
                const t = el.textContent || el.getAttribute("title") || el.getAttribute("aria-label");
                let i = el.getAttribute("id");
                if (!i) { // common authoring pattern: parent section (or other container element) has the navigation target anchor
                    let cur = el;
                    let p: Element | null;
                    while ((p = (cur.parentNode as Element | null)) &&
                        p?.nodeType === Node.ELEMENT_NODE) {
                        // debug(`------ PARENT ID LOOP 1 ${cur.tagName} ${p.tagName} (${p.tagName} - ${t})`);

                        if (p.firstElementChild !== cur) {
                            // debug(`------ PARENT ID LOOP 2 ${cur.tagName} ${p.tagName} (${p.tagName} - ${t})`);
                            break;
                        }

                        const di = p.getAttribute("id");
                        if (di) {
                            // debug(`------ PARENT ID LOOP 3 ${cur.tagName} ${p.tagName} (${p.tagName} - ${t})`);
                            i = di;
                            break;
                        }

                        cur = p;
                    }
                }
                const heading: IHeading = {
                    element: el,
                    id: i ? i : undefined,
                    // level: el.localName.toLowerCase(),
                    level: parseInt(el.localName.substring(1), 10),
                    text: t ? t : undefined,
                };
                if (!_allHeadings) {
                    _allHeadings = [];
                }
                _allHeadings.push(heading);
            }
        }

        if (!_allHeadings) {
            _allHeadings = [];
        }

        // debug("_allHeadings", JSON.stringify(_allHeadings, null, 4));
        // JSON.stringify(_allHeadings, null, 4)
        debug("_allHeadings", _allHeadings.length, headingElements.length); // xpathResult.snapshotLength
    }

    let arr: Array<{ id: string | undefined, txt: string | undefined, level: number }> | undefined;
    for (let i = _allHeadings.length - 1; i >= 0; i--) {
        const heading = _allHeadings[i];

        const c = element.compareDocumentPosition(heading.element);
        // tslint:disable-next-line: no-bitwise
        if (c === 0 || (c & Node.DOCUMENT_POSITION_PRECEDING) || (c & Node.DOCUMENT_POSITION_CONTAINS)) {
            debug("preceding or containing heading", heading.id, heading.text);
            if (!arr) {
                arr = [];
            }
            arr.push({
                id: heading.id,
                level: heading.level,
                txt: heading.text,
            });
        }
    }

    return arr;
};

interface IPageBreak {
    element: Element;
    text: string;
}
let _allEpubPageBreaks: IPageBreak[] | undefined;
const findPrecedingAncestorSiblingEpubPageBreak = (element: Element): { epubPage: string | undefined, epubPageID: string | undefined } => {
    if (!_allEpubPageBreaks) {
        // // @namespace epub "http://www.idpf.org/2007/ops";
        // // [epub|type~="pagebreak"]
        // const cssSelectorResult = win.document.documentElement.querySelectorAll(`*[epub\\:type~="pagebreak"]`);
        // cssSelectorResult.forEach((el) => {
        //     if (el.textContent) {
        //         const pageBreak: IPageBreak = {
        //             element: el,
        //             text: el.textContent,
        //         };
        //         if (!_allEpubPageBreaks) {
        //             _allEpubPageBreaks = [];
        //         }
        //         _allEpubPageBreaks.push(pageBreak);
        //     }
        // });
        // // debug("_allEpubPageBreaks CSS selector", JSON.stringify(_allEpubPageBreaks, null, 4));
        // debug("_allEpubPageBreaks CSS selector", _allEpubPageBreaks.length);
        // _allEpubPageBreaks = undefined;

        const xpathResult = win.document.evaluate(
            // `//*[contains(@epub:type,'pagebreak')]`,
            // `//*[tokenize(@epub:type,'\s+')='pagebreak']`
            "//*[contains(concat(' ', normalize-space(@role), ' '), ' doc-pagebreak ')] | //*[contains(concat(' ', normalize-space(@epub:type), ' '), ' pagebreak ')]",
            win.document.body,
            _namespaceResolver,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null);

        for (let i = 0; i < xpathResult.snapshotLength; i++) {
            const n = xpathResult.snapshotItem(i);
            if (n) {
                const el = n as Element;
                const elTitle = el.getAttribute("title");
                const elLabel = el.getAttribute("aria-label");
                const elText = el.textContent;
                const pageLabel = elTitle || elLabel || elText || " "; // ("_" + (el.getAttribute("id") || ""));
                if (pageLabel) {
                    const pageBreak: IPageBreak = {
                        element: el,
                        text: pageLabel,
                    };
                    if (!_allEpubPageBreaks) {
                        _allEpubPageBreaks = [];
                    }
                    _allEpubPageBreaks.push(pageBreak);
                }
            }
        }

        if (!_allEpubPageBreaks) {
            _allEpubPageBreaks = [];
        }

        // debug("_allEpubPageBreaks XPath", JSON.stringify(_allEpubPageBreaks, null, 4));
        debug("_allEpubPageBreaks XPath", _allEpubPageBreaks.length, xpathResult.snapshotLength);

        if (ENABLE_PAGEBREAK_MARGIN_TEXT_EXPERIMENT) {
            destroyHighlightsGroup(win.document, HIGHLIGHT_GROUP_PAGEBREAK);
            const highlightDefinitions: IHighlightDefinition[] = [];
            for (const pageBreak of _allEpubPageBreaks) {

                const range = new Range(); // document.createRange()
                // range.setStart(pageBreak.element, 0);
                // range.setEnd(pageBreak.element, 0);
                range.selectNode(pageBreak.element);

                highlightDefinitions.push(
                    {
                        // https://htmlcolorcodes.com/
                        color: {
                            blue: 60,
                            green: 76,
                            red:  231,
                        },
                        // drawType: HighlightDrawTypeUnderline,
                        // expand: ENABLE_CSS_HIGHLIGHTS ? 0 : 2,
                        drawType: HighlightDrawTypeOutline,
                        expand: 1,
                        selectionInfo: undefined,
                        group: HIGHLIGHT_GROUP_PAGEBREAK,
                        range,
                        marginText: pageBreak.text ? pageBreak.text : undefined,
                        textPopup: undefined,
                    },
                );
            }
            createHighlights(
                win,
                highlightDefinitions,
                true, // mouse / pointer interaction
            );
        }
    }

    for (let i = _allEpubPageBreaks.length - 1; i >= 0; i--) {
        const pageBreak = _allEpubPageBreaks[i];

        const c = element.compareDocumentPosition(pageBreak.element);
        // tslint:disable-next-line: no-bitwise
        if (c === 0 || (c & Node.DOCUMENT_POSITION_PRECEDING) || (c & Node.DOCUMENT_POSITION_CONTAINS)) {
            debug("preceding or containing EPUB page break", pageBreak.text);
            return { epubPage: pageBreak.text, epubPageID: pageBreak.element.getAttribute("id") || undefined };
        }
    }

    const nil = { epubPage: undefined, epubPageID: undefined } as { epubPage: string | undefined, epubPageID: string | undefined };
    if (_allEpubPageBreaks.length > 0) {
        const first = { epubPage: _allEpubPageBreaks[0].text, epubPageID: _allEpubPageBreaks[0].element.getAttribute("id") || undefined };

        if (win.document.body.firstChild === _allEpubPageBreaks[0].element) {
            debug("pagebreak first", first);
            return first;
        }

        const range = new Range(); // document.createRange()
        range.setStart(win.document.body, 0);
        range.setEnd(_allEpubPageBreaks[0].element, 0);
        let txt = range.toString() || "";
        if (txt) {
            // txt = txt.trim().replace(new RegExp(`^${INJECTED_LINK_TXT}`), "").trim();
            txt = txt.trim();
        }
        const pass = txt.length <= 10;
        debug("pagebreak first? txt", first, txt.length, pass ? txt : "");
        return pass ? first : nil;
    }
    return nil;
};

// TODO: is that a sensible default?
const MAX_FOLLOWING_ELEMENTS_IDS = 100;
let _elementsWithID: Array<Element> | undefined;
const findFollowingDescendantSiblingElementsWithID = (el: Element): string[] | undefined => {
    let followingElementIDs: string[] | undefined;

    // debug("findFollowingDescendantSiblingElementsWithID 1", win.document.documentElement.classList);
    // classes missing on very first document load, but see URL_PARAM_EPUBMEDIAOVERLAYS
    if (win.document.documentElement.classList.contains(R2_MO_CLASS_PLAYING) ||
        win.document.documentElement.classList.contains(R2_MO_CLASS_PAUSED) ||
        win.document.documentElement.classList.contains(R2_MO_CLASS_STOPPED)) {

        if (!_elementsWithID) {
            const elHighlightsContainer = win.document.getElementById(ID_HIGHLIGHTS_CONTAINER);
            const elPopupDialog = win.document.getElementById(POPUP_DIALOG_CLASS);
            const elSkipLink = ENABLE_SKIP_LINK ? win.document.getElementById(SKIP_LINK_ID) : null;
            const elPad = win.document.getElementById(EXTRA_COLUMN_PAD_ID);

            _elementsWithID = Array.from(win.document.querySelectorAll(`*:not(#${ID_HIGHLIGHTS_CONTAINER}):not(#${ID_HIGHLIGHTS_FLOATING}):not(#${ID_HIGHLIGHTS_FLOATING}_):not(#${POPUP_DIALOG_CLASS}):not(#${EXTRA_COLUMN_PAD_ID}):not(#${SKIP_LINK_ID}) *[id]:not(#${ID_HIGHLIGHTS_CONTAINER}):not(#${ID_HIGHLIGHTS_FLOATING}):not(#${ID_HIGHLIGHTS_FLOATING}_):not(#${POPUP_DIALOG_CLASS}):not(#${EXTRA_COLUMN_PAD_ID}):not(#${SKIP_LINK_ID})`));

            for (let i = 0; i < _elementsWithID.length; i++) {
                const elementWithID = _elementsWithID[i];
                const id = elementWithID.id || elementWithID.getAttribute("id");
                if (!id) {
                    _elementsWithID[i] = null;
                    continue;
                }
                let keep = true;
                if (elHighlightsContainer) {
                    const c1 = elHighlightsContainer.compareDocumentPosition(elementWithID);
                    if (c1 === 0 || (c1 & Node.DOCUMENT_POSITION_CONTAINED_BY)) {
                        keep = false;
                        debug("findFollowingDescendantSiblingElementsWithID CSS selector failed? (highlights) " + id);
                    }
                }
                if (elPopupDialog) {
                    const c2 = elPopupDialog.compareDocumentPosition(elementWithID);
                    if (c2 === 0 || (c2 & Node.DOCUMENT_POSITION_CONTAINED_BY)) {
                        keep = false;
                        debug("findFollowingDescendantSiblingElementsWithID CSS selector failed? (popup dialog) " + id);
                    }
                }
                if (elSkipLink) {
                    const c3 = elSkipLink.compareDocumentPosition(elementWithID);
                    if (c3 === 0 || (c3 & Node.DOCUMENT_POSITION_CONTAINED_BY)) {
                        keep = false;
                        debug("findFollowingDescendantSiblingElementsWithID CSS selector failed? (skip link) " + id);
                    }
                }
                if (elPad) {
                    const c4 = elPad.compareDocumentPosition(elementWithID);
                    if (c4 === 0 || (c4 & Node.DOCUMENT_POSITION_CONTAINED_BY)) {
                        keep = false;
                        debug("findFollowingDescendantSiblingElementsWithID CSS selector failed? (extra col pad) " + id);
                    }
                }

                if (!keep) {
                    _elementsWithID[i] = null;
                }
            }

            _elementsWithID = _elementsWithID.filter((el) => !!el);
        }

        followingElementIDs = [];

        // for (let i = _elementsWithID.length - 1; i >= 0; i--) {
        for (let i = 0; i < _elementsWithID.length; i++) {
            const elementWithID = _elementsWithID[i];
            const id = elementWithID.id || elementWithID.getAttribute("id");
            if (!id) {
                continue; // should never happen, see filter eject above
            }

            const c = el.compareDocumentPosition(elementWithID);
            // tslint:disable-next-line: no-bitwise
            if (// c === 0 ||
                (c & Node.DOCUMENT_POSITION_FOLLOWING) || (c & Node.DOCUMENT_POSITION_CONTAINED_BY)) {

                followingElementIDs.push(id);
                if (followingElementIDs.length >= MAX_FOLLOWING_ELEMENTS_IDS) {
                    return followingElementIDs;
                }
            }
        }
    }
    return followingElementIDs;
};

const $_htmlNamespaces: { [prefix: string]: string } = {
    // epub: "http://www.idpf.org/2007/ops",
    xhtml: "http://www.w3.org/1999/xhtml",
    svg: "http://www.w3.org/2000/svg",
    m: "http://www.w3.org/1998/Math/MathML",
};
const $_namespaceResolver = (prefix: string | null): string | null => {
    if (!prefix) {
        return null; // $_htmlNamespaces.xhtml
    }
    return $_htmlNamespaces[prefix] || null;
};

const notifyReadingLocationRaw = (userInteract?: boolean, ignoreMediaOverlays?: boolean, doNotFocus?: boolean) => {
    if (DEBUG_TRACE) debug("notifyReadingLocationRaw", win.READIUM2.locationHashOverride ? getCssSelector(win.READIUM2.locationHashOverride) : "!!!? win.READIUM2.locationHashOverride");

    if (!win.READIUM2.locationHashOverride) {
        return;
    }

    // skips the first render notification because the first primary webview takes precedence
    // as it has been explicitly linked into (contrary to the second webview which is ancillary)
    if (// !userInteract &&
        win.READIUM2.urlQueryParams && win.READIUM2.urlQueryParams[URL_PARAM_SECOND_WEBVIEW] === "1") {
        win.READIUM2.urlQueryParams[URL_PARAM_SECOND_WEBVIEW] = "2";
        return;
    }

    const blacklisted = checkBlacklisted(win.READIUM2.locationHashOverride);
    if (blacklisted) {
        return;
    }

    // win.READIUM2.locationHashOverride.nodeType === ELEMENT_NODE

    let progressionData: IProgressionData | undefined;

    const cssSelector = getCssSelector(win.READIUM2.locationHashOverride);
    const cfi = computeCFI(win.READIUM2.locationHashOverride);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xpathalreadychecked = !!(win.READIUM2.locationHashOverride as any).__r2Xpath;
    const xpath = computeXPath(win.READIUM2.locationHashOverride);
    if (IS_DEV && xpath && !xpathalreadychecked) {
        debug(">>> XPATH original: " + xpath);
        // const xpath_ = xpath.replace(/\/([^\[\/]+)/g, "/*[name()=\"$1\"]");
        // const xpath_ = xpath.replace(/\/([^\[:]+)/g, "/xhtml:$1");
        const xpath_ = xpath.replace(/\/([^\/]+)/g, (m) => {
            if (m.startsWith("/*") || // m.startsWith("/child::*") || m.startsWith("/descendant::*") ||
                /^\/[a-zA-Z0-9\-_]+:[a-zA-Z0-9\-_]+.*$/.test(m)) { // replace("/body", "/xxx:body") to test
                return m;
            }
            return m.replace(/\/(.+)/g, "/xhtml:$1");
        });
        debug(">>> XPATH adapted: " + xpath_);

        const xpathResult = win.document.evaluate(
            // `//*[contains(@epub:type,'pagebreak')]`,
            // `//*[tokenize(@epub:type,'\s+')='pagebreak']`
            // "//*[contains(concat(' ', normalize-space(@role), ' '), ' doc-pagebreak ')] | //*[contains(concat(' ', normalize-space(@epub:type), ' '), ' pagebreak ')]",
            xpath_,
            win.document,
            $_namespaceResolver, // win.document.documentElement,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, // FIRST_ORDERED_NODE_TYPE
            null);

            debug(">>> XPATH snap: " + xpathResult.snapshotLength);
            if (xpathResult.snapshotLength === 1 && xpathResult.snapshotItem(0) === win.READIUM2.locationHashOverride) {
                debug(">>> XPATH OK :)");
            } else {
                debug(">>> XPATH NOK :(");
            }

            // for (let i = 0; i < xpathResult.snapshotLength; i++) {
            //     const n = xpathResult.snapshotItem(i);
            //     if (n) {
            //         const el = n as Element;
            //     }
            // }
    }
    let progression = 0;
    if (win.READIUM2.isFixedLayout) {
        progression = 1;
    } else {
        progressionData = computeProgressionData();
        progression = progressionData.percentRatio;
    }

    const pinfo = (progressionData && progressionData.paginationInfo) ?
        progressionData.paginationInfo : undefined;

    const selInfo = getCurrentSelectionInfo(win, getCssSelector, /* computeCFI, */ computeXPath);
    // if (IS_DEV) { // && win.READIUM2.DEBUG_VISUALS
    //     if (selInfo) {
    //         createHighlight(win,
    //             selInfo,
    //             undefined, // default background color
    //             true, // mouse / pointer interaction
    //         );
    //     }
    // }

    // text selections created by screen readers do not trigger mouse click on container element,
    // and this makes sense anyway in the general case (start position of the selection is the location to focus on)
    // ... but this only works if win.READIUM2.locationHashOverride is entirely reset so that progressionData, blacklisted, etc. is correctly updated
    // ... plus, in a scroll view, the selection can remain active while the user-scrolled-to location is distant from the selection, so this would introduce inconsistencies
    // if (selInfo) {
    //     cssSelector = selInfo.rangeInfo.startContainerElementCssSelector;
    //     cfi = selInfo.rangeInfo.startContainerElementCFI;
    //     xpath = selInfo.rangeInfo.startContainerElementXPath;
    // }

    const text = selInfo ? {
        after: selInfo.cleanAfter,
        before: selInfo.cleanBefore,
        highlight: selInfo.cleanText,
        afterRaw: selInfo.rawAfter,
        beforeRaw: selInfo.rawBefore,
        highlightRaw: selInfo.rawText,
    } as LocatorText : undefined;

    let selectionIsNew: boolean | undefined;
    if (selInfo) {
        selectionIsNew =
            !win.READIUM2.locationHashOverrideInfo ||
            !win.READIUM2.locationHashOverrideInfo.selectionInfo ||
            !sameSelections(win.READIUM2.locationHashOverrideInfo.selectionInfo, selInfo);
    }

    const { epubPage, epubPageID } = findPrecedingAncestorSiblingEpubPageBreak(win.READIUM2.locationHashOverride);
    const headings = findPrecedingAncestorSiblingHeadings(win.READIUM2.locationHashOverride);
    const followingElementIDs = findFollowingDescendantSiblingElementsWithID(win.READIUM2.locationHashOverride);

    let secondWebViewHref = win.READIUM2.urlQueryParams &&
        win.READIUM2.urlQueryParams[URL_PARAM_SECOND_WEBVIEW] &&
        win.READIUM2.urlQueryParams[URL_PARAM_SECOND_WEBVIEW].length > 1 &&
        win.READIUM2.urlQueryParams[URL_PARAM_SECOND_WEBVIEW].startsWith("0") ?
        win.READIUM2.urlQueryParams[URL_PARAM_SECOND_WEBVIEW].substr(1) :
        undefined;
    if (!secondWebViewHref) { // includes empty string
        secondWebViewHref = undefined;
    }

    let caretInfo: ISelectionInfo | undefined;
    if (win.READIUM2.lastClickedTextChar && win.READIUM2.lastClickedTextChar.textNode?.nodeValue?.length) {
        const range = win.document.createRange();
        const startOffset = win.READIUM2.lastClickedTextChar.textNodeOffset >= win.READIUM2.lastClickedTextChar.textNode.nodeValue.length ? win.READIUM2.lastClickedTextChar.textNodeOffset - 1 : win.READIUM2.lastClickedTextChar.textNodeOffset;
        range.setStart(win.READIUM2.lastClickedTextChar.textNode, startOffset);
        range.setEnd(win.READIUM2.lastClickedTextChar.textNode, startOffset + 1);

        const tuple = convertRange(range, getCssSelector, /* computeCFI, */ computeXPath);
        if (tuple) {
            const rangeInfo = tuple[0];
            const textInfo = tuple[1];
            if (rangeInfo && textInfo) {
                caretInfo = {
                    textFragment: undefined,

                    rangeInfo,

                    cleanBefore: textInfo.cleanBefore,
                    cleanText: textInfo.cleanText,
                    cleanAfter: textInfo.cleanAfter,

                    rawBefore: textInfo.rawBefore,
                    rawText: textInfo.rawText,
                    rawAfter: textInfo.rawAfter,
                };
            }
        }
    }

    if (__locEventID >= Number.MAX_SAFE_INTEGER) {
        __locEventID = 0;
    }
    win.READIUM2.locationHashOverrideInfo = {
        locEventID: ++__locEventID, // 1-based
        audioPlaybackInfo: undefined,
        docInfo: {
            isFixedLayout: win.READIUM2.isFixedLayout,
            isRightToLeft: isRTL(),
            isVerticalWritingMode: isVerticalWritingMode(),
        },
        epubPage,
        epubPageID,
        headings,
        href: "", // filled-in from host index.js renderer
        locations: {
            cfi,
            cssSelector,
            position: undefined, // calculated in host index.js renderer, where publication object is available
            progression,
            caretInfo,
            xpath,
        },
        paginationInfo: pinfo,
        secondWebViewHref,
        selectionInfo: selInfo,
        selectionIsNew,
        text,
        title: _docTitle,
        userInteract: userInteract ? true : false,
        followingElementIDs,
    };
    // if (followingElementIDs) {
    //     win.READIUM2.locationHashOverrideInfo.followingElementIDs = followingElementIDs;
    // }
    if (DEBUG_TRACE) debug("notifyReadingLocationRaw: locationHashOverrideInfo", win.READIUM2.locationHashOverrideInfo);

    const payload: IEventPayload_R2_EVENT_READING_LOCATION = win.READIUM2.locationHashOverrideInfo;
    ipcRenderer.sendToHost(R2_EVENT_READING_LOCATION, payload);

    if (!ignoreMediaOverlays) {
        mediaOverlaysClickRaw(win.READIUM2.locationHashOverride, userInteract ? true : false);
    }

    if (
        // !win.document.documentElement.classList.contains(R2_MO_CLASS_PAUSED) &&
        !win.document.documentElement.classList.contains(R2_MO_CLASS_PLAYING)
    ) {
        tempLinkTargetOutline(win.READIUM2.locationHashOverride, 1000, true);
    }

    if (!doNotFocus) {
        if (DEBUG_TRACE) debug("notifyReadingLocationRaw: focusElement()...");
        // CONTEXT: notifyReadingLocationRaw()
        focusElement(win.READIUM2.locationHashOverride, true /*, focusHost */);
    }

    if (win.READIUM2.DEBUG_VISUALS) {
        const existings = win.document.querySelectorAll(`*[${readPosCssStylesAttr4}]`);
        existings.forEach((existing) => {
            existing.removeAttribute(`${readPosCssStylesAttr4}`);
        });
        win.READIUM2.locationHashOverride.setAttribute(readPosCssStylesAttr4, "notifyReadingLocationRaw");
    }
};
const notifyReadingLocationDebounced = debounce((userInteract?: boolean, ignoreMediaOverlays?: boolean, doNotFocus?: boolean) => {
    if (DEBUG_TRACE) debug("notifyReadingLocationDebounced: notifyReadingLocationRaw()...");
    // CONTEXT: notifyReadingLocationDebounced()
    notifyReadingLocationRaw(userInteract, ignoreMediaOverlays, doNotFocus);
}, 250);
const notifyReadingLocationDebouncedImmediate = debounce((userInteract?: boolean, ignoreMediaOverlays?: boolean) => {
    if (DEBUG_TRACE) debug("notifyReadingLocationDebouncedImmediate: notifyReadingLocationRaw()...");
    // CONTEXT: notifyReadingLocationDebouncedImmediate()
    notifyReadingLocationRaw(userInteract, ignoreMediaOverlays);
}, 250, { immediate: true });

if (!win.READIUM2.isAudio) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_TTS_DO_PLAY, (_event: any, payload: IEventPayload_R2_EVENT_TTS_DO_PLAY) => {
        const rootElement = win.document.querySelector(payload.rootElement);
        const startElement = payload.startElement ? win.document.querySelector(payload.startElement) : null;

        let startTextNode: Node | undefined;
        let startTextNodeOffset: number = -1;
        if (payload.rangeInfo) {
            if (DEBUG_TRACE) debug("R2_EVENT_TTS_DO_PLAY: payload.rangeInfo", payload.rangeInfo);
            const textNodeParentElement = win.document.querySelector(payload.rangeInfo.startContainerElementCssSelector);
            if (textNodeParentElement && payload.rangeInfo.startContainerChildTextNodeIndex >= 0 && payload.rangeInfo.startContainerChildTextNodeIndex < textNodeParentElement.childNodes.length) {
                const textNode = textNodeParentElement.childNodes[payload.rangeInfo.startContainerChildTextNodeIndex];
                if (textNode && textNode.nodeValue && payload.rangeInfo.startOffset >= 0 && payload.rangeInfo.startOffset < textNode.nodeValue.length) {
                    startTextNode = textNode;
                    startTextNodeOffset = payload.rangeInfo.startOffset;
                }
            }
        }
        if (!startTextNode && startElement) {
            if (DEBUG_TRACE) debug("R2_EVENT_TTS_DO_PLAY: payload.rangeInfo fallback");
            const rects = startElement.getClientRects();
            if (rects?.length) {
                for (const rect of rects) {
                    if (rect.width <= 2 || rect.height <= 2) {
                        continue;
                    }
                    const domPointData = domDataFromPoint(rect.x + 1, rect.y + 1);
                    if (DEBUG_TRACE && domPointData.element) debug("R2_EVENT_TTS_DO_PLAY: domDataFromPoint clientrects method", rect.x, rect.y, " ==> ", getCssSelector(domPointData.element), " --- ", getCssSelector(startElement));
                    if (!domPointData.element || domPointData.element !== startElement) {
                        continue;
                    }
                    startTextNode = domPointData.textNode;
                    startTextNodeOffset = domPointData.textNodeOffset;
                    break;
                }
            }
            if (!startTextNode) {
                const bbox = startElement.getBoundingClientRect();
                if (bbox.width > 2 && bbox.height > 2) {
                    const domPointData = domDataFromPoint(bbox.x + 1, bbox.y + 1);
                    if (DEBUG_TRACE && domPointData.element) debug("R2_EVENT_TTS_DO_PLAY: domDataFromPoint clientrects method", bbox.x, bbox.y, " ==> ", getCssSelector(domPointData.element), " --- ", getCssSelector(startElement));
                    if (domPointData.element && domPointData.element === startElement) {
                        startTextNode = domPointData.textNode;
                        startTextNodeOffset = domPointData.textNodeOffset;
                    }
                }
                if (!startTextNode) {
                    // the following fallback doesn't work? need to account for scroll
                    let el = startElement as HTMLElement | null;
                    let top = 0;
                    let left = 0;
                    while (el) {
                        top += el.offsetTop || 0;
                        left += el.offsetLeft || 0;
                        el = el.offsetParent as HTMLElement | null;
                    }
                    const domPointData = domDataFromPoint(left, top);
                    if (DEBUG_TRACE && domPointData.element) debug("R2_EVENT_TTS_DO_PLAY: domDataFromPoint offset method", left, top, " ==> ", getCssSelector(domPointData.element), " --- ", getCssSelector(startElement));
                    if (domPointData.element && domPointData.element === startElement) {
                        startTextNode = domPointData.textNode;
                        startTextNodeOffset = domPointData.textNodeOffset;
                    }
                }
            }
        }

        ttsPlay(
            payload.speed,
            payload.voices,
            focusScrollRaw,
            rootElement ? rootElement : undefined,
            startElement ? startElement : undefined,
            startTextNode,
            startTextNodeOffset,
            ensureTwoPageSpreadWithOddColumnsIsOffsetTempDisable,
            ensureTwoPageSpreadWithOddColumnsIsOffsetReEnable);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_TTS_DO_STOP, (_event: any) => {
        ttsStop();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_TTS_DO_PAUSE, (_event: any) => {
        ttsPause();
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_TTS_DO_RESUME, (_event: any) => {
        ttsResume();
    });

    ipcRenderer.on(R2_EVENT_TTS_DO_NEXT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (_event: any, payload?: IEventPayload_R2_EVENT_TTS_DO_NEXT_OR_PREVIOUS) => {
        ttsNext(payload?.skipSentences || false, payload?.escape || false);
    });

    ipcRenderer.on(R2_EVENT_TTS_DO_PREVIOUS,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (_event: any, payload?: IEventPayload_R2_EVENT_TTS_DO_NEXT_OR_PREVIOUS) => {
        ttsPrevious(payload?.skipSentences || false, payload?.escape || false);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_TTS_PLAYBACK_RATE, (_event: any, payload: IEventPayload_R2_EVENT_TTS_PLAYBACK_RATE) => {
        ttsPlaybackRate(payload.speed);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_TTS_VOICE, (_event: any, payload: IEventPayload_R2_EVENT_TTS_VOICE) => {
        ttsVoices(payload.voices);
    });

    ipcRenderer.on(R2_EVENT_TTS_MEDIAOVERLAYS_MANUAL_PLAY_NEXT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (_event: any, payload: IEventPayload_R2_EVENT_TTS_MEDIAOVERLAYS_MANUAL_PLAY_NEXT) => {
        win.READIUM2.ttsAndMediaOverlaysManualPlayNext = payload.doEnable;
    });
    ipcRenderer.on(R2_EVENT_TTS_SKIP_ENABLE,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (_event: any, payload: IEventPayload_R2_EVENT_TTS_SKIP_ENABLE) => {
        win.READIUM2.ttsSkippabilityEnabled = payload.doEnable;
    });
    ipcRenderer.on(R2_EVENT_TTS_HIGHLIGHT_STYLE,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (_event: any, payload: IEventPayload_R2_EVENT_TTS_HIGHLIGHT_STYLE) => {
            win.READIUM2.ttsHighlightStyle = payload.ttsHighlightStyle;
            win.READIUM2.ttsHighlightColor = payload.ttsHighlightColor;
            win.READIUM2.ttsHighlightStyle_WORD = payload.ttsHighlightStyle_WORD;
            win.READIUM2.ttsHighlightColor_WORD = payload.ttsHighlightColor_WORD;
    });
    ipcRenderer.on(R2_EVENT_TTS_SENTENCE_DETECT_ENABLE,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (_event: any, payload: IEventPayload_R2_EVENT_TTS_SENTENCE_DETECT_ENABLE) => {
        win.READIUM2.ttsSentenceDetectionEnabled = payload.doEnable;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_TTS_CLICK_ENABLE, (_event: any, payload: IEventPayload_R2_EVENT_TTS_CLICK_ENABLE) => {
        win.READIUM2.ttsClickEnabled = payload.doEnable;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_TTS_OVERLAY_ENABLE, (_event: any, payload: IEventPayload_R2_EVENT_TTS_OVERLAY_ENABLE) => {
        win.READIUM2.ttsOverlayEnabled = payload.doEnable;
    });

    ipcRenderer.on(R2_EVENT_MEDIA_OVERLAY_STATE,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (_event: any, payload: IEventPayload_R2_EVENT_MEDIA_OVERLAY_STATE) => {

        clearImageZoomOutlineDebounced();

        win.document.documentElement.classList.remove(R2_MO_CLASS_PAUSED, R2_MO_CLASS_PLAYING, R2_MO_CLASS_STOPPED);

        win.document.documentElement.classList.add(payload.state === MediaOverlaysStateEnum.PAUSED ? R2_MO_CLASS_PAUSED :
            (payload.state === MediaOverlaysStateEnum.PLAYING ? R2_MO_CLASS_PLAYING : R2_MO_CLASS_STOPPED));
    });

    let _textToSpeechUtterance: SpeechSynthesisUtterance | undefined;

    ipcRenderer.on(R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT,
        (_event: Electron.IpcRendererEvent, payload: IEventPayload_R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, eventID: number) => {

            destroyHighlightsGroup(win.document, HIGHLIGHT_GROUP_TTS);

            const styleAttr = win.document.documentElement.getAttribute("style");
            const isNight = styleAttr ? styleAttr.indexOf("readium-night-on") > 0 : false;
            const isSepia = styleAttr ? styleAttr.indexOf("readium-sepia-on") > 0 : false;
            // "--USER__backgroundColor" "--USER__backgroundColor"

            const activeClass = (isNight || isSepia) ? R2_MO_CLASS_ACTIVE :
                (payload.classActive ? payload.classActive : R2_MO_CLASS_ACTIVE);
            const activeClassPlayback =
                payload.classActivePlayback ? payload.classActivePlayback : R2_MO_CLASS_ACTIVE_PLAYBACK;

            if (payload.classActive) {
                const activeMoElements = win.document.body.querySelectorAll(`.${payload.classActive}`);
                activeMoElements.forEach((elem) => {
                    if (payload.classActive) {
                        elem.classList.remove(payload.classActive);
                    }
                });
            }
            const activeMoElements_ = win.document.body.querySelectorAll(`.${R2_MO_CLASS_ACTIVE}`);
            activeMoElements_.forEach((elem) => {
                elem.classList.remove(R2_MO_CLASS_ACTIVE);
            });

            if (_textToSpeechUtterance) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const p = (_textToSpeechUtterance as any)._textToSpeechPayload;
                _textToSpeechUtterance = undefined;
                if (p) {
                    p.id = undefined;
                    // console.log("Cancelling _textToSpeechUtterance payload.");
                    // console.log(JSON.stringify(p, null, 4));
                    ipcRenderer.sendToHost(R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, p, eventID);
                }
                try {
                    if (true || win.speechSynthesis.speaking || win.speechSynthesis.pending || win.speechSynthesis.paused) {
                        win.speechSynthesis.cancel();
                    }
                } catch (_ex) {
                    // noop
                }
            }

            let removeCaptionContainer = true;
            if (!payload.id) {
                win.document.documentElement.classList.remove(R2_MO_CLASS_ACTIVE_PLAYBACK, activeClassPlayback);
            } else {
                if (true || !payload.captionsMode) {
                    clearCurrentSelection(win);
                    if (isPopupDialogOpen(win.document)) {
                        closePopupDialogs(win.document);
                    }
                }

                win.document.documentElement.classList.add(activeClassPlayback);

                let range: Range | undefined;
                const isTextFragment = payload.id.startsWith(":~:text=");
                if (isTextFragment) {
                    console.log("====> TEXT FRAGMENT str: ", payload.id);
                    try {
                        const textFragment = parseTextFragmentDirective(payload.id.substring(":~:text=".length));
                        console.log("====> TEXT FRAGMENT struct: ", JSON.stringify(textFragment, null, 4));
                        const ranges = convertTextFragmentToRanges(textFragment, win.document);
                        console.log("====> TEXT FRAGMENT DOM RANGES OK: ", ranges.length);
                        range = ranges?.length > 0 ? ranges[0] : undefined;
                    } catch (err) {
                        console.log("====> TEXT FRAGMENT DOM RANGES NOK: ", err);
                    }
                }
                let targetEl = isTextFragment ? undefined : win.document.getElementById(payload.id);
                if (targetEl || !!range) {
                    if (!!range) {
                        const ancestor = range.commonAncestorContainer;
                        if (ancestor?.nodeType === 1) { // Node.ELEMENT_NODE
                            targetEl = ancestor as HTMLElement;
                        }
                    }
                    if (payload.useTTSHighlights || !!range) {
                        const ttsHighlightStyle = typeof win.READIUM2?.ttsHighlightStyle !== "undefined" ? win.READIUM2.ttsHighlightStyle : HighlightDrawTypeBackground;
                        if (ttsHighlightStyle !== HighlightDrawTypeNONE) {
                            if (!range) {
                                range = new Range(); // document.createRange()
                                range.selectNode(targetEl);
                                // range.setStart(el, 0);
                                // range.setEnd(el, 0);
                            }

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
                            createHighlights(
                                win,
                                highlightDefinitions,
                                false, // mouse / pointer interaction
                            );
                        }
                    } else if (targetEl) {
                        targetEl.classList.add(activeClass);
                    }

                    let text: string | null = null;
                    if (targetEl  && (payload.captionsMode || payload.speech)) {
                        text = targetEl.textContent;
                    }
                    if (payload.speech) {
                        if (text) {
                            const utterance = new SpeechSynthesisUtterance(text);
                            _textToSpeechUtterance = utterance;

                            const lang = getLanguage(targetEl);
                            utterance.lang = lang; // || "en";

                            assignUtteranceVoice(utterance);

                            if (payload.speechRate) {
                                utterance.rate = payload.speechRate;
                            } else if (win.READIUM2.ttsPlaybackRate >= 0.1 && win.READIUM2.ttsPlaybackRate <= 10) {
                                utterance.rate = win.READIUM2.ttsPlaybackRate;
                            }

                            // utterance.onboundary = (ev: SpeechSynthesisEvent) => {
                            // };

                            utterance.onend = (_ev: SpeechSynthesisEvent) => {
                                if (utterance === _textToSpeechUtterance) {
                                    _textToSpeechUtterance = undefined;

                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    if ((utterance as any)._textToSpeechPayload?.id) {
                                        // console.log("utterance end _textToSpeechPayload payload.");
                                        // // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        // console.log(JSON.stringify((utterance as any)._textToSpeechPayload, null, 4));
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        ipcRenderer.sendToHost(R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, (utterance as any)._textToSpeechPayload, eventID);
                                    }
                                }
                            };

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (utterance as any)._textToSpeechPayload = payload;

                            // setTimeout(() => {
                            win.speechSynthesis.speak(utterance);
                            // }, 0);
                        } else {
                            ipcRenderer.sendToHost(R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT, payload, eventID);
                        }
                    }

                    if (payload.captionsMode) {
                        if (text) {
                            // text = text.trim().replace(/[\r\n]/g, " ").replace(/\s+/g, " ");
                            text = normalizeText(text).trim();

                            if (text) {
                                removeCaptionContainer = false;
                                const isUserBackground = styleAttr ?
                                    styleAttr.indexOf("--USER__backgroundColor") >= 0 : false;
                                const isUserColor = styleAttr ?
                                    styleAttr.indexOf("--USER__textColor") >= 0 : false;
                                const docStyle = win.getComputedStyle(win.document.documentElement);
                                let containerStyle = "background-color: white; color: black;";
                                if (isNight || isSepia) {
                                    const rsBackground = docStyle.getPropertyValue("--RS__backgroundColor");
                                    const rsColor = docStyle.getPropertyValue("--RS__textColor");
                                    containerStyle = `background-color: ${rsBackground}; color: ${rsColor};`;
                                } else {
                                    if (isUserBackground || isUserColor) {
                                        containerStyle = "";
                                    }
                                    if (isUserBackground) {
                                        const usrBackground = docStyle.getPropertyValue("--USER__backgroundColor");
                                        containerStyle += `background-color: ${usrBackground};`;
                                    }
                                    if (isUserColor) {
                                        const usrColor = docStyle.getPropertyValue("--USER__textColor");
                                        containerStyle += `color: ${usrColor};`;
                                    }
                                }
                                const isUserFontSize = styleAttr ?
                                    styleAttr.indexOf("--USER__fontSize") >= 0 : false;
                                if (isUserFontSize) {
                                    const usrFontSize = docStyle.getPropertyValue("--USER__fontSize");
                                    containerStyle += `font-size: ${usrFontSize};`;
                                } else {
                                    containerStyle += "font-size: 120%;";
                                }
                                const isUserLineHeight = styleAttr ?
                                    styleAttr.indexOf("--USER__lineHeight") >= 0 : false;
                                if (isUserLineHeight) {
                                    const usrLineHeight = docStyle.getPropertyValue("--USER__lineHeight");
                                    containerStyle += `line-height: ${usrLineHeight};`;
                                } else {
                                    containerStyle += "line-height: 1.2;";
                                }
                                const isUserFont = styleAttr ?
                                    styleAttr.indexOf("--USER__fontFamily") >= 0 : false;
                                if (isUserFont) {
                                    const usrFont = docStyle.getPropertyValue("--USER__fontFamily");
                                    containerStyle += `font-family: ${usrFont};`;
                                }

                                const payloadCaptions: IEventPayload_R2_EVENT_CAPTIONS = {
                                    containerStyle,
                                    text,
                                    textStyle: "font-size: 120%;",
                                };
                                ipcRenderer.sendToHost(R2_EVENT_CAPTIONS, payloadCaptions);
                            }
                        }
                    }

                    debug(".hashElement = 7");
                    if (targetEl) {
                        // underscore special link will prioritise hashElement!
                        win.READIUM2.hashElement = targetEl;
                        win.READIUM2.locationHashOverride = targetEl;

                        if (
                            // !isPaginated(win.document) &&
                            !isVisible(false, targetEl, undefined)) {

                            if (DEBUG_TRACE) debug("R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT: scrollElementIntoView()...");
                            // CONTEXT: R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT()
                            scrollElementIntoView(targetEl, false, true, undefined /*, false */);
                        }
                    }

                    scrollToHashDebounced.clear();

                    if (DEBUG_TRACE) debug("R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT: notifyReadingLocationRaw()...");
                    // CONTEXT: R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT()
                    notifyReadingLocationRaw(false, true);

                    if (win.READIUM2.DEBUG_VISUALS) {
                        const el = win.READIUM2.locationHashOverride;
                        const existings = win.document.querySelectorAll(`*[${readPosCssStylesAttr2}]`);
                        existings.forEach((existing) => {
                            existing.removeAttribute(`${readPosCssStylesAttr2}`);
                        });
                        el.setAttribute(readPosCssStylesAttr2, "R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT");
                    }
                }
            }

            if (removeCaptionContainer) {
                const payloadCaptions: IEventPayload_R2_EVENT_CAPTIONS = {
                    containerStyle: undefined,
                    text: undefined,
                    textStyle: undefined,
                };
                ipcRenderer.sendToHost(R2_EVENT_CAPTIONS, payloadCaptions);
            }
        });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_HIGHLIGHT_CREATE, (_event: any, payloadPing: IEventPayload_R2_EVENT_HIGHLIGHT_CREATE, eventID: number) => {

        if (payloadPing.highlightDefinitions &&
            payloadPing.highlightDefinitions.length === 1 &&
            payloadPing.highlightDefinitions[0].selectionInfo) {
            clearCurrentSelection(win);
        }
        const highlightDefinitions = !payloadPing.highlightDefinitions ?
            [
                {
                    color: undefined,
                    drawType: undefined,
                    expand: undefined,
                    selectionInfo: undefined,
                    group: undefined,
                } satisfies IHighlightDefinition,
            ] :
            payloadPing.highlightDefinitions;

        const selInfo = getCurrentSelectionInfo(win, getCssSelector, /* computeCFI, */ computeXPath);
        for (const highlightDefinition of highlightDefinitions) {
            if (!highlightDefinition.selectionInfo) {
                highlightDefinition.selectionInfo = selInfo;
            }
        }
        const highlights = createHighlights(
            win,
            highlightDefinitions,
            true, // mouse / pointer interaction
        );
        const payloadPong: IEventPayload_R2_EVENT_HIGHLIGHT_CREATE = {
            highlightDefinitions: payloadPing.highlightDefinitions,
            highlights: highlights.length ? highlights : undefined,
        };
        ipcRenderer.sendToHost(R2_EVENT_HIGHLIGHT_CREATE, payloadPong, eventID);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_HIGHLIGHT_REMOVE, (_event: any, payload: IEventPayload_R2_EVENT_HIGHLIGHT_REMOVE) => {
        payload.highlightIDs.forEach((highlightID) => {
            destroyHighlight(win.document, highlightID);
        });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_HIGHLIGHT_DRAW_MARGIN, (_event: any, payload: IEventPayload_R2_EVENT_HIGHLIGHT_DRAW_MARGIN) => {
        setDrawMargin(win, payload.drawMargin);
    });

    // // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // ipcRenderer.on(R2_EVENT_DISABLE_TEMPORARY_NAV_TARGET_OUTLINE, (_event: any, payload: IEventPayload_R2_EVENT_DISABLE_TEMPORARY_NAV_TARGET_OUTLINE) => {
    //     win.READIUM2.disableTemporaryNavigationTargetOutline = payload.disableTemporaryNavigationTargetOutline;
    // });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_HIGHLIGHT_REMOVE_ALL, (_event: any, payload: IEventPayload_R2_EVENT_HIGHLIGHT_REMOVE_ALL) => {
        if (payload.groups) {
            for (const group of payload.groups) {
                destroyHighlightsGroup(win.document, group);
            }
        } else {
            destroyAllhighlights(win.document);
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer.on(R2_EVENT_FOCUS_READING_LOC, (_event: any, _payload: any) => {
        if (DEBUG_TRACE) debug("R2_EVENT_FOCUS_READING_LOC: focusCurrentReadingLocationElement()...");
        // CONTEXT: R2_EVENT_FOCUS_READING_LOC
        focusCurrentReadingLocationElement(true);
    });
}

// -------------------------------------------------
// https://mermaid.live/edit#pako:eNqtVu9vqjAU_VdM92VLlKiIMj68xAhTMpQFnXl7IWk66JQMWsOP7W2L__srqDwYgs3LMzG29Z7TnnvvKXwBh7oYKCCKUYxVD21CFHTe-jZptSB8oU4SaT4OMImvb1qdzg-2KGSr1zc2uUo_aeQVhJETUt8_xuokpmsPv-eYMlEJsqIzFG0t1BQM4S6kDo6in0-XAgmNvZcPCyPXIxuDOij2KGkCVUVUT1Qj7ojKGJdZCD_I6kNtrS1WcK6p-hiaa80yxk9wpk9nBvuuLpEcj33VMg21BR3fc14FQVje6w_Q0Bf3UFcPG-X73JmTxyW0tLGqL6bQMCcsPDv5JAlDRv4tZXmGTmEHgSp-pglxsFvOZ0H9UZ9qzieUxIzCoMjFLqPx2eD4k-JPxB5hoy0iro_v0rlOCpt8_6tSydLOxVrmwpcTyzSMlVnKaKHGZ2pfVXkGxdM45bY9dCgl1V6pxjHSgCYRTnZ5CubpXHs7VSXH5KfVgwC7HvNxM29dZr4H5wJrXFXNUr35eGiqx2_m43dRE09B5akyBWEHfKlkNW32MJ5qcPVoLVhpmH3SMj2gDV4lIcn1nNmA6_qswfG57EDdxFTUw-VbljwceZ-Y5eOMP6rquEgPlOZzhMM3HP4n3ks0JRNjHztpZzjMbxvMWCIcL0-Lk2xxnI2bG7R6zjrHccLrbhdOeM3ziRPNnWMevpoH-WVowaX_wFC4WWwC2iDAYYA8l732fKWcNoi3zHg2UNjQReGrDWyyZ3EoienygzhAicMEt0FIk80WKC_Ij9gs2bl_35ny1R0ivygNThA2BcoX-A0USRQGtwNJFCVRlnuyOGyDD6D0pJEw6srdoSwPRkNp2Jf2bfCZEXQFeXjbHfUG3X5PEnuyLO7_AEh-OrI
// -------------------------------------------------
// stateDiagram-v2
//   __focusElement() --> __.focus()
// #####
//   #__scrollElementIntoView() --> __focusElement()
//   #__scrollToHashRaw() --> __focusElement()
//   __processXYRaw() --> __focusElement()
//   __notifyReadingLocationRaw() --> __focusElement()
// #####
//   #__scrollToHashRaw() --> __scrollElementIntoView()
//   #__focusScrollRaw() --> __scrollElementIntoView()
//   #__R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT --> __scrollElementIntoView()
// #####
// # OLD _click...SKIP_LINK_ID
//   #_R2_EVENT_FOCUS_READING_LOC...focusCurrentReadingLocationElement()...focusScrollDebounced() --> __focusScrollRaw()
//   #__DOMContentLoaded...load...loaded()...focusin...handleFocusInDebounced()...handleFocusInRaw() --> __focusScrollRaw()
// #####
//   #__R2_EVENT_SCROLLTO --> __scrollToHashRaw()
//   #__scrollToHashDebounced() --> __scrollToHashRaw()
// #####
//   #__scrollToHashRaw() --> __processXYRaw()
//   __onScrollRaw() --> __processXYRaw()
//   #__mouseup...handleMouseEvent()...processXYDebouncedImmediate() --> __processXYRaw()
//   #__R2_EVENT_SCROLLTO --> __processXYRaw()
// #####
//   __notifyReadingLocationDebounced() --> __notifyReadingLocationRaw()
//   __notifyReadingLocationDebouncedImmediate() --> __notifyReadingLocationRaw()
//   #__R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT --> __notifyReadingLocationRaw()
// #####
//   __onScrollDebounced()--> __onScrollRaw()
// #####
//   #__R2_EVENT_PAGE_TURN...onEventPageTurn() --> __onScrollDebounced()
//   #__scrollElementIntoView() --> __onScrollDebounced()
//   __DOMContentLoaded...load...loaded()..scroll --> __onScrollDebounced()
// #####
//   #__DOMContentLoaded...load...loaded()...onResizeRaw --> __scrollToHashDebounced()
//   #__DOMContentLoaded...load...loaded()...ResizeObserver --> __scrollToHashDebounced()
//   #__DOMContentLoaded...load...loaded() --> __scrollToHashDebounced()
// #####
//   #__selectionchange...setSelectionChangeAction() --> __notifyReadingLocationDebounced()
//   #__R2_EVENT_SCROLLTO --> __notifyReadingLocationDebounced()
//   #__scrollToHashRaw() --> __notifyReadingLocationDebounced()
//   #__focusScrollRaw() --> __notifyReadingLocationDebounced()
//   #__DOMContentLoaded...load...loaded() --> __notifyReadingLocationDebounced()
//   __processXYRaw() --> __notifyReadingLocationDebounced()
// #####
//   __processXYRaw() --> __notifyReadingLocationDebouncedImmediate()
