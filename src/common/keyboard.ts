// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

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
    info: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyI",
    }),

    focus_main: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "F10",
    }),
    focus_toolbar: Object.freeze<TKeyboardShortcut>({
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

    reader_focus_navigation: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyN",
    }),
    reader_focus_settings: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyS",
    }),

    toggle_bookmark: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyB",
    }),

    toggle_fullscreen: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "F11",
    }),

    focus_search: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: false,
        key: "KeyF",
    }),
    // search_next: Object.freeze<TKeyboardShortcut>({
    //     alt: false,
    //     control: false,
    //     shift: false,
    //     key: "F3",
    // }),
    // search_previous: Object.freeze<TKeyboardShortcut>({
    //     alt: false,
    //     control: false,
    //     shift: true,
    //     key: "F3",
    // }),

    library_opds_PageNavigationPrevious: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: true,
        key: "ArrowLeft",
    }),
    library_opds_PageNavigationNext: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: true,
        shift: true,
        key: "ArrowRight",
    }),

    reader_PageNavigationPrevious: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: false,
        shift: false,
        key: "ArrowLeft",
    }),
    reader_PageNavigationNext: Object.freeze<TKeyboardShortcut>({
        alt: false,
        control: false,
        shift: false,
        key: "ArrowRight",
    }),

    reader_SpineNavigationPrevious: Object.freeze<TKeyboardShortcut>({
        alt: process && process.platform !== "darwin",
        control: true,
        shift: true,
        key: "ArrowLeft",
    }),
    reader_SpineNavigationNext: Object.freeze<TKeyboardShortcut>({
        alt: process && process.platform !== "darwin",
        control: true,
        shift: true,
        key: "ArrowRight",
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
    if (DEBUG_KEYBOARD) {
        console.log(`K1: ${ks.shift} ${ks.control} ${ks.alt} ${ks.meta} ${ks.key}`);
        console.log(`K2: ${e.shiftKey} ${e.ctrlKey} ${e.altKey} ${e.metaKey} ${e.code}`);
        console.log(`MATCH: ${match}`);
    }
    return match;
}
// export function keyboardShortcutMatch_(ks: TKeyboardShortcut, e: TKeyboardShortcut): boolean {
//     return ks.key === e.key
//         && (ks.alt && e.alt || !ks.alt && !e.alt)
//         && (ks.control && e.control || !ks.control && !e.control)
//         && (ks.meta && e.meta || !ks.meta && !e.meta)
//         && (ks.shift && e.shift || !ks.shift && !e.shift);
// }
