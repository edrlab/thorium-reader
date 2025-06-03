// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

import { sortObject } from "@r2-utils-js/_utils/JsonUtils";

export const DEBUG_KEYBOARD = false;

export interface TKeyboardShortcutModifiers {
    alt: boolean;
    control: boolean;
    shift: boolean;
    meta: boolean;
}
export interface TKeyboardShortcutFull extends TKeyboardShortcutModifiers {
    key: string;
}

export interface TKeyboardShortcut extends Partial<TKeyboardShortcutModifiers> {
    key: string;
}
// export type TKeyboardShortcutReadOnly = Readonly<TKeyboardShortcut>;

const _defaults_ = {
    // help: {
    //     meta: false,
    //     alt: false,
    //     control: true,
    //     shift: false,
    //     key: "F1",
    // } satisfies TKeyboardShortcutFull,
    OpenReaderInfo: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "KeyI",
    } satisfies TKeyboardShortcutFull,
    OpenReaderInfoWhereAmI: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "KeyI",
    } satisfies TKeyboardShortcutFull,
    SpeakReaderInfoWhereAmI: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "KeyK",
    } satisfies TKeyboardShortcutFull,

    FocusMain: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "F10",
    } satisfies TKeyboardShortcutFull,
    FocusMainDeep: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "F10",
    } satisfies TKeyboardShortcutFull,

    FocusToolbar: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "KeyT",
    } satisfies TKeyboardShortcutFull,
    // focus_cycle_landmarks: {
    //     meta: false,
    //     alt: false,
    //     control: true,
    //     shift: false,
    //     key: "F6",
    // } satisfies TKeyboardShortcutFull,

    FocusReaderNavigation: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "KeyN",
    } satisfies TKeyboardShortcutFull,
    FocusReaderNavigationTOC: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "KeyN",
    } satisfies TKeyboardShortcutFull,
    FocusReaderNavigationBookmarks: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "KeyB",
    } satisfies TKeyboardShortcutFull,
    FocusReaderNavigationAnnotations: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "KeyA",
    } satisfies TKeyboardShortcutFull,
    FocusReaderNavigationSearch: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "KeyF",
    } satisfies TKeyboardShortcutFull,
    FocusReaderGotoPage: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "KeyP",
    } satisfies TKeyboardShortcutFull,
    FocusReaderSettings: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "KeyS",
    } satisfies TKeyboardShortcutFull,

    ToggleBookmark: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "KeyB",
    } satisfies TKeyboardShortcutFull,

    // AddBookmarkWithLabelAlt: {
    //     meta: false,
    //     alt: true,
    //     control: true,
    //     shift: true,
    //     key: "KeyB",
    // } satisfies TKeyboardShortcutFull,
    AddBookmarkWithLabel: {
        meta: false,
        alt: true,
        control: false,
        shift: true,
        key: "KeyB",
    } satisfies TKeyboardShortcutFull,

    ToggleReaderFullscreen: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "F11",
    } satisfies TKeyboardShortcutFull,

    FocusSearch: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "KeyF",
    } satisfies TKeyboardShortcutFull,
    SearchNext: {
        meta: false,
        alt: false,
        control: false,
        shift: false,
        key: "F3",
    } satisfies TKeyboardShortcutFull,
    SearchPrevious: {
        meta: false,
        alt: false,
        control: false,
        shift: true,
        key: "F3",
    } satisfies TKeyboardShortcutFull,
    SearchNextAlt: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "KeyG",
    } satisfies TKeyboardShortcutFull,
    SearchPreviousAlt: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "KeyG",
    } satisfies TKeyboardShortcutFull,

    NavigatePreviousOPDSPage: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "ArrowLeft",
    } satisfies TKeyboardShortcutFull,
    NavigateNextOPDSPage: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "ArrowRight",
    } satisfies TKeyboardShortcutFull,

    NavigatePreviousOPDSPageAlt: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "Comma",
    } satisfies TKeyboardShortcutFull,
    NavigateNextOPDSPageAlt: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "Period",
    } satisfies TKeyboardShortcutFull,

    NavigatePreviousLibraryPage: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "ArrowLeft",
    } satisfies TKeyboardShortcutFull,
    NavigateNextLibraryPage: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "ArrowRight",
    } satisfies TKeyboardShortcutFull,

    NavigatePreviousLibraryPageAlt: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "Comma",
    } satisfies TKeyboardShortcutFull,
    NavigateNextLibraryPageAlt: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "Period",
    } satisfies TKeyboardShortcutFull,

    CloseReader: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "KeyW",
    } satisfies TKeyboardShortcutFull,

    NavigatePreviousHistory: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "Backspace",
    } satisfies TKeyboardShortcutFull,
    NavigateNextHistory: {
        meta: false,
        alt: false,
        control: true,
        shift: true,
        key: "Backspace",
    } satisfies TKeyboardShortcutFull,

    NavigatePreviousPage: {
        meta: false,
        alt: false,
        control: false,
        shift: false,
        key: "ArrowLeft",
    } satisfies TKeyboardShortcutFull,
    NavigateNextPage: {
        meta: false,
        alt: false,
        control: false,
        shift: false,
        key: "ArrowRight",
    } satisfies TKeyboardShortcutFull,

    NavigatePreviousPageAlt: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "Comma",
    } satisfies TKeyboardShortcutFull,
    NavigateNextPageAlt: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "Period",
    } satisfies TKeyboardShortcutFull,

    NavigatePreviousChapter: {
        meta: false,
        alt: process && process.platform !== "darwin",
        control: true,
        shift: true,
        key: "ArrowLeft",
    } satisfies TKeyboardShortcutFull,
    NavigateNextChapter: {
        meta: false,
        alt: process && process.platform !== "darwin",
        control: true,
        shift: true,
        key: "ArrowRight",
    } satisfies TKeyboardShortcutFull,

    NavigatePreviousChapterAlt: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "PageUp",
    } satisfies TKeyboardShortcutFull,
    NavigateNextChapterAlt: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "PageDown",
    } satisfies TKeyboardShortcutFull,

    NavigateToBegin: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "Home",
    } satisfies TKeyboardShortcutFull,
    NavigateToEnd: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "End",
    } satisfies TKeyboardShortcutFull,

    AudioPlayPause: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "Digit2",
    } satisfies TKeyboardShortcutFull,
    AudioPrevious: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "Digit1",
    } satisfies TKeyboardShortcutFull,
    AudioNext: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "Digit3",
    } satisfies TKeyboardShortcutFull,
    AudioPreviousAlt: {
        meta: false,
        alt: true,
        control: true,
        shift: true,
        key: "Digit1",
    } satisfies TKeyboardShortcutFull,
    AudioNextAlt: {
        meta: false,
        alt: true,
        control: true,
        shift: true,
        key: "Digit3",
    } satisfies TKeyboardShortcutFull,
    AudioStop: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "Digit4",
    } satisfies TKeyboardShortcutFull,
    FXLZoomReset: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "Digit0",
    } satisfies TKeyboardShortcutFull,
    FXLZoomOut: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "Digit8",
    } satisfies TKeyboardShortcutFull,
    FXLZoomIn: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "Digit9",
    } satisfies TKeyboardShortcutFull,

    AnnotationsToggleMargin: {
        meta: false,
        alt: true,
        control: true,
        shift: true,
        key: "KeyZ",
    } satisfies TKeyboardShortcutFull,
    // AnnotationsCreateAlt: {
    //     meta: false,
    //     alt: true,
    //     control: true,
    //     shift: true,
    //     key: "KeyA",
    // } satisfies TKeyboardShortcutFull,
    AnnotationsCreate: {
        meta: false,
        alt: true,
        control: false,
        shift: true,
        key: "KeyA",
    } satisfies TKeyboardShortcutFull,
    AnnotationsCreateQuick: {
        meta: false,
        alt: true,
        control: false,
        shift: true,
        key: "KeyQ",
    } satisfies TKeyboardShortcutFull,
    Print: {
        meta: false,
        alt: false,
        control: true,
        shift: false,
        key: "KeyP",
    } satisfies TKeyboardShortcutFull,
} as const;
export type TKeyboardShortcutsMapDEFAULT = typeof _defaults_;
export const defaultKeyboardShortcuts = sortObject(_defaults_) as TKeyboardShortcutsMapDEFAULT;

export type TKeyboardShortcutId = keyof TKeyboardShortcutsMapDEFAULT;
export type TKeyboardShortcutsMap = {
    [id in TKeyboardShortcutId]: TKeyboardShortcut;
};

// IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN
export interface IKeyboardEvent {
    readonly altKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;

    readonly code: string;
    // readonly key: string;
}

// DEPRECATED: if (ev.keyCode === 37 || ev.keyCode === 39) { // left / right
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
//
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
//
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
export function keyboardShortcutMatch(ks: TKeyboardShortcut, e: IKeyboardEvent): boolean {
    const match = ks.key === e.code // not e.key! (physical code / keycap position in QWERTY, instead of logical key generated by keystroke(s))
        && (ks.alt && e.altKey || !ks.alt && !e.altKey)
        && (ks.control && e.ctrlKey || !ks.control && !e.ctrlKey)
        && (ks.meta && e.metaKey || !ks.meta && !e.metaKey)
        && (ks.shift && e.shiftKey || !ks.shift && !e.shiftKey);
    // if (DEBUG_KEYBOARD) {
    //     console.log(`K1: ${ks.shift} ${ks.control} ${ks.alt} ${ks.meta} ${ks.key}`);
    //     console.log(`K2: ${e.shiftKey} ${e.ctrlKey} ${e.altKey} ${e.metaKey} ${e.code}`);
    //     console.log(`MATCH: ${match}`);
    // }
    return match;
}
function keyboardShortcutMatch_(ks1: TKeyboardShortcut, ks2: TKeyboardShortcut): boolean {
    return ks1.key === ks2.key
        && (ks1.alt && ks2.alt || !ks1.alt && !ks2.alt)
        && (ks1.control && ks2.control || !ks1.control && !ks2.control)
        && (ks1.meta && ks2.meta || !ks1.meta && !ks2.meta)
        && (ks1.shift && ks2.shift || !ks1.shift && !ks2.shift);
}
export function keyboardShortcutsMatch(
    kss1: TKeyboardShortcutsMap,
    kss2: TKeyboardShortcutsMap): boolean {

    const ids = ObjectKeys(kss1);
    for (const id of ids) {
        const ks1 = kss1[id];
        const ks2 = kss2[id];
        if (!ks2 || !keyboardShortcutMatch_(ks1, ks2)) {
            return false;
        }
    }

    // NOT NEEDED as usage of keyboardShortcutsMatch() is in React components to diff the before/after props that carry the state with identical JSON keys
    // const ids2 = ObjectKeys(kss2);
    // for (const id2 of ids2) {
    //     const ks1 = kss1[id2];
    //     const ks2 = kss2[id2];
    //     if (!ks1 || !keyboardShortcutMatch_(ks1, ks2)) {
    //         return false;
    //     }
    // }

    return true;
}
