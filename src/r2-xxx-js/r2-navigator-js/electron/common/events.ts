// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Locator, LocatorLocations } from "./locator";

import { IAudioPlaybackInfo } from "./audiobook";
import { IDocInfo } from "./document";
import { IwidthHeight } from "./fxl";
import { IColor, IHighlight, IHighlightDefinition } from "./highlight";
import { IPaginationInfo } from "./pagination";
import { IReadiumCSS } from "./readium-css-settings";
import { IRangeInfo, ISelectionInfo } from "./selection";

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
//
// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_IMAGE_CLICK = "R2_EVENT_IMAGE_CLICK";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_IMAGE_CLICK {
    hostDocumentURL: string;
    isSVGFragment: boolean;
    isSVGImage: boolean;
    HTMLImgSrc_SVGImageHref_SVGFragmentMarkup: string;
    cssSelectorOf_HTMLImg_SVGImage_SVGFragment: string;
    languageOf_HTMLImg_SVGImage_SVGFragment: string | undefined;
    directionOf_HTMLImg_SVGImage_SVGFragment: string | undefined;
    naturalWidthOf_HTMLImg_SVGImage: number | undefined; // undefined with isSVGFragment and normally undefined with isSVGImage (HTMLImageElement.naturalWidth/Height exists, not SVGImageElement.naturalWidth/Height) ... but, we load the image href into an HTML image in order to extract the natural dimensions
    naturalHeightOf_HTMLImg_SVGImage: number | undefined; // (same comment as above)
    altAttributeOf_HTMLImg_SVGImage_SVGFragment: string | null;
    titleAttributeOf_HTMLImg_SVGImage_SVGFragment: string | null;
    ariaLabelAttributeOf_HTMLImg_SVGImage_SVGFragment: string | null;
    // isFigure: boolean;
    // figureCssSelector: string | undefined;
    // figcaptionCssSelector: string | undefined;
    // ariaDescribedbyAttribute: string | undefined;
    // ariaDetailsAttribute: string | undefined;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_LOCATOR_VISIBLE = "R2_EVENT_LOCATOR_VISIBLE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_LOCATOR_VISIBLE {
    visible: boolean;
    location: LocatorLocations;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_READIUMCSS = "R2_EVENT_READIUMCSS";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_READIUMCSS {
    setCSS: IReadiumCSS | undefined;
    isFixedLayout?: boolean;
    fixedLayoutWebViewWidth?: number;
    fixedLayoutWebViewHeight?: number;
    fixedLayoutZoomPercent?: number;
    urlRoot?: string;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_DEBUG_VISUALS = "R2_EVENT_DEBUG_VISUALS";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_DEBUG_VISUALS {
    debugVisuals: boolean;

    cssSelector?: string;
    cssClass?: string;
    cssStyles?: string;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_SCROLLTO = "R2_EVENT_SCROLLTO";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_SCROLLTO {
    goto: string | undefined;
    gotoDomRange: string | undefined;
    hash: string | undefined;
    previous: boolean;
    isSecondWebView: boolean;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_FOCUS_READING_LOC = "R2_EVENT_FOCUS_READING_LOC";

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_PAGE_TURN = "R2_EVENT_PAGE_TURN";

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_PAGE_TURN_RES = "R2_EVENT_PAGE_TURN_RES";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_PAGE_TURN {
    // direction: string; // RTL, LTR
    go: string; // PREVIOUS, NEXT
    nav?: boolean;
}

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_FXL_CONFIGURE = "R2_EVENT_FXL_CONFIGURE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_FXL_CONFIGURE {
    fxl: IwidthHeight | null;
}

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_SHOW = "R2_EVENT_SHOW";

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_KEYBOARD_FOCUS_REQUEST = "R2_EVENT_KEYBOARD_FOCUS_REQUEST";

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_READING_LOCATION = "R2_EVENT_READING_LOCATION";
export const R2_EVENT_READING_LOCATION_CLEAR_SELECTION = "R2_EVENT_READING_LOCATION_CLEAR_SELECTION";

// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_READING_LOCATION extends Locator {
    locEventID?: number, // 1-based
    audioPlaybackInfo: IAudioPlaybackInfo | undefined;
    paginationInfo: IPaginationInfo | undefined;
    selectionInfo: ISelectionInfo | undefined;
    docInfo: IDocInfo | undefined;
    selectionIsNew: boolean | undefined;

    // not NavDoc epub:type="page-list",
    // but target HTML document's epub:type="pagebreak" / role="doc-pagebreak"
    // (nearest preceding ancestor/sibling)
    epubPage: string | undefined;
    epubPageID: string | undefined;

    headings: Array<{ id: string | undefined, txt: string | undefined, level: number }> | undefined;

    userInteract: boolean;

    secondWebViewHref: string | undefined;

    followingElementIDs?: string[];
}

// in MAIN: browserWindow.webContents.send()
// in RENDERER: ipcRenderer.on()
// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_LINK = "R2_EVENT_LINK";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_LINK {
    url: string;
    rcss?: IEventPayload_R2_EVENT_READIUMCSS | undefined;
}

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_AUDIO_SOUNDTRACK = "R2_EVENT_AUDIO_SOUNDTRACK";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_AUDIO_SOUNDTRACK {
    url: string;
}

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_MEDIA_OVERLAY_CLICK = "R2_EVENT_MEDIA_OVERLAY_CLICK";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_MEDIA_OVERLAY_CLICK {
    locationHashOverrideInfo: IEventPayload_R2_EVENT_READING_LOCATION | undefined;
    textFragmentIDChain: Array<string | null> | undefined;
    userInteract: boolean;
}

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_MEDIA_OVERLAY_STARTSTOP = "R2_EVENT_MEDIA_OVERLAY_STARTSTOP";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_MEDIA_OVERLAY_STARTSTOP {
    start: boolean | undefined;
    stop: boolean | undefined;
    startstop: boolean | undefined;
}

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_MEDIA_OVERLAY_INTERRUPT = "R2_EVENT_MEDIA_OVERLAY_INTERRUPT";

export enum MediaOverlaysStateEnum {
    PAUSED = "PAUSED",
    PLAYING = "PLAYING",
    STOPPED = "STOPPED",
}
// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_MEDIA_OVERLAY_STATE = "R2_EVENT_MEDIA_OVERLAY_STATE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_MEDIA_OVERLAY_STATE {
    state: MediaOverlaysStateEnum;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT = "R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_MEDIA_OVERLAY_HIGHLIGHT {
    id: string | undefined;
    classActive: string | undefined;
    classActivePlayback: string | undefined;
    captionsMode: boolean | undefined;
    useTTSHighlights: boolean | undefined;
    speech: string | undefined;
    speechRate: number | undefined;
}

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_SHIFT_VIEW_X = "R2_EVENT_SHIFT_VIEW_X";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_SHIFT_VIEW_X {
    offset: number;
    backgroundColor: string | undefined;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_CLICK_ENABLE = "R2_EVENT_TTS_CLICK_ENABLE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_TTS_CLICK_ENABLE {
    doEnable: boolean;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_OVERLAY_ENABLE = "R2_EVENT_TTS_OVERLAY_ENABLE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_TTS_OVERLAY_ENABLE {
    doEnable: boolean;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_AUDIO_DO_PLAY = "R2_EVENT_AUDIO_DO_PLAY";
export const R2_EVENT_AUDIO_DO_PAUSE = "R2_EVENT_AUDIO_DO_PAUSE";
export const R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE = "R2_EVENT_AUDIO_TOGGLE_PLAY_PAUSE";
export const R2_EVENT_AUDIO_REWIND = "R2_EVENT_AUDIO_REWIND";
export const R2_EVENT_AUDIO_FORWARD = "R2_EVENT_AUDIO_FORWARD";

// in MAIN: browserWindow.webContents.send()
// in RENDERER: ipcRenderer.on()
// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_AUDIO_PLAYBACK_RATE = "R2_EVENT_AUDIO_PLAYBACK_RATE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_AUDIO_PLAYBACK_RATE {
    speed: number;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_PLAYBACK_RATE = "R2_EVENT_TTS_PLAYBACK_RATE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_TTS_PLAYBACK_RATE {
    speed: number;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_VOICE = "R2_EVENT_TTS_VOICE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_TTS_VOICE {
    voices: SpeechSynthesisVoice[] | null;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_MEDIAOVERLAYS_MANUAL_PLAY_NEXT = "R2_EVENT_TTS_MEDIAOVERLAYS_MANUAL_PLAY_NEXT";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_TTS_MEDIAOVERLAYS_MANUAL_PLAY_NEXT {
    doEnable: boolean;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_SKIP_ENABLE = "R2_EVENT_TTS_SKIP_ENABLE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_TTS_SKIP_ENABLE {
    doEnable: boolean;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_SENTENCE_DETECT_ENABLE = "R2_EVENT_TTS_SENTENCE_DETECT_ENABLE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_TTS_SENTENCE_DETECT_ENABLE {
    doEnable: boolean;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_HIGHLIGHT_STYLE = "R2_EVENT_TTS_HIGHLIGHT_STYLE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_TTS_HIGHLIGHT_STYLE {
    ttsHighlightStyle: number;
    ttsHighlightColor: IColor | undefined;

    ttsHighlightStyle_WORD: number | undefined;
    ttsHighlightColor_WORD: IColor | undefined;

    // HighlightDrawTypeNONE
    // HighlightDrawTypeBackground
    // HighlightDrawTypeUnderline
    // HighlightDrawTypeStrikethrough
    // HighlightDrawTypeOutline
    // HighlightDrawTypeOpacityMask
    // HighlightDrawTypeOpacityMaskRuler
    // HighlightDrawTypeMarginBookmark
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_DO_PLAY = "R2_EVENT_TTS_DO_PLAY";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_TTS_DO_PLAY {
    rootElement: string; // CSS selector
    startElement: string | undefined; // CSS selector
    rangeInfo?: IRangeInfo | undefined;
    speed: number;
    voices: SpeechSynthesisVoice[] | null;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_DO_PAUSE = "R2_EVENT_TTS_DO_PAUSE";

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_DO_RESUME = "R2_EVENT_TTS_DO_RESUME";

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_DO_STOP = "R2_EVENT_TTS_DO_STOP";

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_TTS_IS_STOPPED = "R2_EVENT_TTS_IS_STOPPED";

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_TTS_IS_PAUSED = "R2_EVENT_TTS_IS_PAUSED";

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_TTS_IS_PLAYING = "R2_EVENT_TTS_IS_PLAYING";

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_TTS_DOC_END = "R2_EVENT_TTS_DOC_END";

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_TTS_DOC_BACK = "R2_EVENT_TTS_DOC_BACK";

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_DO_NEXT = "R2_EVENT_TTS_DO_NEXT";
// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_TTS_DO_PREVIOUS = "R2_EVENT_TTS_DO_PREVIOUS";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_TTS_DO_NEXT_OR_PREVIOUS {
    skipSentences: boolean | undefined;
    escape: boolean | undefined;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_CAPTIONS = "R2_EVENT_CAPTIONS";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_CAPTIONS {
    text: string | undefined;
    containerStyle: string | undefined;
    textStyle: string | undefined;
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_HIGHLIGHT_CREATE = "R2_EVENT_HIGHLIGHT_CREATE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_HIGHLIGHT_CREATE {
    highlightDefinitions: IHighlightDefinition[] | undefined;
    highlights: Array<IHighlight | null> | undefined; // return value, see below (R2_EVENT_HIGHLIGHT_CREATE_RES)
}
// // in WEBVIEW: ipcRenderer.sendToHost()
// // in RENDERER: webview.addEventListener("ipc-message")
// export const R2_EVENT_HIGHLIGHT_CREATE_RES = "R2_EVENT_HIGHLIGHT_CREATE_RES";
// // tslint:disable-next-line:class-name
// export interface IEventPayload_R2_EVENT_HIGHLIGHT_CREATE_RES {
//     highlightID: string;
// }

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_HIGHLIGHT_REMOVE = "R2_EVENT_HIGHLIGHT_REMOVE";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_HIGHLIGHT_REMOVE {
    highlightIDs: string[];
}

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_HIGHLIGHT_DRAW_MARGIN = "R2_EVENT_HIGHLIGHT_DRAW_MARGIN";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_HIGHLIGHT_DRAW_MARGIN {
    drawMargin: boolean | string[];
}

// // in RENDERER: webview.send()
// // in WEBVIEW: ipcRenderer.on()
// export const R2_EVENT_DISABLE_TEMPORARY_NAV_TARGET_OUTLINE = "R2_EVENT_DISABLE_TEMPORARY_NAV_TARGET_OUTLINE";
// // tslint:disable-next-line:class-name
// export interface IEventPayload_R2_EVENT_DISABLE_TEMPORARY_NAV_TARGET_OUTLINE {
//     disableTemporaryNavigationTargetOutline: boolean;
// }

// in RENDERER: webview.send()
// in WEBVIEW: ipcRenderer.on()
export const R2_EVENT_HIGHLIGHT_REMOVE_ALL = "R2_EVENT_HIGHLIGHT_REMOVE_ALL";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_HIGHLIGHT_REMOVE_ALL {
    groups: string[] | undefined;
}

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_HIGHLIGHT_CLICK = "R2_EVENT_HIGHLIGHT_CLICK";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_HIGHLIGHT_CLICK {
    highlight: IHighlight;
    event: {
        type: string;
        button: number;
        alt: boolean;
        shift: boolean;
        ctrl: boolean;
        meta: boolean;
        x: number;
        y: number;
    };
}

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_WEBVIEW_KEYDOWN = "R2_EVENT_WEBVIEW_KEYDOWN";
export const R2_EVENT_WEBVIEW_KEYUP = "R2_EVENT_WEBVIEW_KEYUP";
export interface IKeyboardEvent {
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;

    code: string;
    key?: string;
}
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN extends IKeyboardEvent {
    elementName: string;
    elementAttributes: {[name: string]: string};
}
export type IEventPayload_R2_EVENT_WEBVIEW_KEYUP = IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN;

// in WEBVIEW: ipcRenderer.sendToHost()
// in RENDERER: webview.addEventListener("ipc-message")
export const R2_EVENT_CLIPBOARD_COPY = "R2_EVENT_CLIPBOARD_COPY";
// tslint:disable-next-line:class-name
export interface IEventPayload_R2_EVENT_CLIPBOARD_COPY { // CliboardEvent
    txt: string;
    locator: IEventPayload_R2_EVENT_READING_LOCATION | undefined;
}
