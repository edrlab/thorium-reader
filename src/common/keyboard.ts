// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

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
export const _defaults = Object.freeze({
    opdsPageNavigationPrevious: Object.freeze({
        alt: false,
        control: true,
        shift: true,
        key: "ArrowLeft",
    }),
    opdsPageNavigationNext: Object.freeze({
        alt: false,
        control: true,
        shift: true,
        key: "ArrowRight",
    }),

    readerPageNavigationPrevious: Object.freeze({
        alt: false,
        control: false,
        shift: false,
        key: "ArrowLeft",
    }),
    readerPageNavigationNext: Object.freeze({
        alt: false,
        control: false,
        shift: false,
        key: "ArrowRight",
    }),

    readerSpineNavigationPrevious: Object.freeze({
        alt: process && process.platform !== "darwin",
        control: true,
        shift: true,
        key: "ArrowLeft",
    }),
    readerSpineNavigationNext: Object.freeze({
        alt: process && process.platform !== "darwin",
        control: true,
        shift: true,
        key: "ArrowRight",
    }),
});

export type TKeyboardShortcutsMap_ = typeof _defaults;
export type TKeyboardShortcutId = keyof TKeyboardShortcutsMap_;
export type TKeyboardShortcutsMap = {
    [id in TKeyboardShortcutId]: TKeyboardShortcut;
};
export type TKeyboardShortcutReadOnly = Readonly<TKeyboardShortcut>;
export type TKeyboardShortcutsMap__ = {
    [id in TKeyboardShortcutId]: TKeyboardShortcutReadOnly;
};
export type TKeyboardShortcutsMapReadOnly = Readonly<TKeyboardShortcutsMap__>;

// IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN
export interface KeyboardEvent {
    readonly altKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;

    readonly code: string;
    readonly key: string;
}

// DEPRECATED: if (ev.keyCode === 37 || ev.keyCode === 39) { // left / right
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
//
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
//
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
export function keyboardShortcutMatch(ks: TKeyboardShortcut, e: KeyboardEvent): boolean {
    return ks.key === e.code // not e.key! (physical code, instead of logical key)
        && (ks.alt && e.altKey || !ks.alt && !e.altKey)
        && (ks.control && e.ctrlKey || !ks.control && !e.ctrlKey)
        && (ks.meta && e.metaKey || !ks.meta && !e.metaKey)
        && (ks.shift && e.shiftKey || !ks.shift && !e.shiftKey);
}
export function keyboardShortcutMatch_(ks: TKeyboardShortcut, e: TKeyboardShortcut): boolean {
    return ks.key === e.key
        && (ks.alt && e.alt || !ks.alt && !e.alt)
        && (ks.control && e.control || !ks.control && !e.control)
        && (ks.meta && e.meta || !ks.meta && !e.meta)
        && (ks.shift && e.shift || !ks.shift && !e.shift);
}
