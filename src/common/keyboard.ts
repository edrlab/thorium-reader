// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

import { sortObject } from "@r2-utils-js/_utils/JsonUtils";

export const DEBUG_KEYBOARD = false;

export interface TKeyboardShortcut {
    alt?: boolean;
    control?: boolean;
    shift?: boolean;
    meta?: boolean;

    key: string;
}
// should not be exported publicly,
// but needed here for TypeScript typing,
// and elsewhere for the actual data :(
// the process.platform usage is really only relevant in the main Electron process
// as the renderer process actually fetches data from apiAction("keyboard/getAll")
// or from the shared keyboard state
const _defaults_ = Object.freeze({
    // help: Object.freeze<TKeyboardShortcut>({
    //     alt: false,
    //     control: true,
    //     shift: false,
    //     key: "F1",
    // }),
    OpenReaderInfo: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyI",
    }),
    OpenReaderInfoWhereAmI: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: true,
        key: "KeyI",
    }),

    FocusMain: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "F10",
    }),
    FocusToolbar: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyT",
    }),
    // focus_cycle_landmarks: Object.freeze<TKeyboardShortcut>({
    //     alt: false,
    //     control: true,
    //     shift: false,
    //     key: "F6",
    // }),

    FocusReaderNavigation: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyN",
    }),
    FocusReaderNavigationTOC: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: true,
        key: "KeyN",
    }),
    FocusReaderGotoPage: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: true,
        key: "KeyP",
    }),
    FocusReaderSettings: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyS",
    }),

    ToggleBookmark: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyB",
    }),

    ToggleReaderFullscreen: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "F11",
    }),

    FocusSearch: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyF",
    }),
    SearchNext: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: false,
        shift: false,
        key: "F3",
    }),
    SearchPrevious: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: false,
        shift: true,
        key: "F3",
    }),
    SearchNextAlt: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyG",
    }),
    SearchPreviousAlt: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: true,
        key: "KeyG",
    }),

    NavigatePreviousOPDSPage: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: true,
        key: "ArrowLeft",
    }),
    NavigateNextOPDSPage: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: true,
        key: "ArrowRight",
    }),

    NavigatePreviousOPDSPageAlt: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: true,
        key: "Comma",
    }),
    NavigateNextOPDSPageAlt: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: true,
        key: "Period",
    }),

    CloseReader: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyW",
    }),

    NavigatePreviousPage: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: false,
        shift: false,
        key: "ArrowLeft",
    }),
    NavigateNextPage: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: false,
        shift: false,
        key: "ArrowRight",
    }),

    NavigatePreviousPageAlt: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "Comma",
    }),
    NavigateNextPageAlt: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "Period",
    }),

    NavigatePreviousChapter: Object.freeze<TKeyboardShortcut>({
        alt: process && process.platform !== "darwin",
        control: true,
        shift: true,
        key: "ArrowLeft",
    }),
    NavigateNextChapter: Object.freeze<TKeyboardShortcut>({
        alt: process && process.platform !== "darwin",
        control: true,
        shift: true,
        key: "ArrowRight",
    }),

    NavigatePreviousChapterAlt: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "PageUp",
    }),
    NavigateNextChapterAlt: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "PageDown",
    }),

    NavigateToBegin: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "Home",
    }),
    NavigateToEnd: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "End",
    }),

    AudioPlayPause: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "Digit2",
    }),
    AudioPrevious: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "Digit1",
    }),
    AudioNext: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "Digit3",
    }),
    AudioPreviousAlt: Object.freeze<TKeyboardShortcut>({
        alt: true,
        control: true,
        shift: true,
        key: "Digit1",
    }),
    AudioNextAlt: Object.freeze<TKeyboardShortcut>({
        alt: true,
        control: true,
        shift: true,
        key: "Digit3",
    }),
    AudioStop: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "Digit4",
    }),
});
export const _defaults = sortObject(_defaults_);

export type TKeyboardShortcutsMapReadOnly = typeof _defaults_;
export type TKeyboardShortcutId = keyof TKeyboardShortcutsMapReadOnly;
export type TKeyboardShortcutsMap = {
    [id in TKeyboardShortcutId]: TKeyboardShortcut;
};
export type TKeyboardShortcutReadOnly = Readonly<TKeyboardShortcut>;

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
    const match = ks.key === e.code // not e.key! (physical code, instead of logical key)
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
    kss1: TKeyboardShortcutsMapReadOnly,
    kss2: TKeyboardShortcutsMapReadOnly): boolean {

    const ids = ObjectKeys(kss1);
    for (const id of ids) {
        const ks1 = kss1[id];
        const ks2 = kss2[id];
        if (!keyboardShortcutMatch_(ks1, ks2)) {
            return false;
        }
    }
    return true;
}
