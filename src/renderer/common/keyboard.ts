// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values

import {
    IKeyboardEvent, keyboardShortcutMatch, TKeyboardShortcutReadOnly,
} from "readium-desktop/common/keyboard";

type TDocument = typeof document;
export interface TKeyboardDocument extends TDocument {
    _keyModifierShift: boolean;
    _keyModifierControl: boolean;
    _keyModifierAlt: boolean;
    _keyModifierMeta: boolean;

    _keyCode: string;

    _keyboardListenerIsInstalled: boolean;
}

export const DEBUG_KEYBOARD = true;

const _keyOptionsFunctions = [];
for (let i = 1; i <= 12; i++) {
    _keyOptionsFunctions.push(`F${i}`);
}
const _keyOptionsNumbers = [];
for (let i = 0; i <= 9; i++) {
    _keyOptionsNumbers.push(`Digit${i}`);
}
const _keyOptionsNumpads = [];
for (let i = 0; i <= 9; i++) {
    _keyOptionsNumpads.push(`Numpad${i}`);
}
const _keyOptionsAlpha = [];
for (let i = 0; i < 26; i++) {
    const upper = String.fromCharCode(65 + i); // 97 is lowercase "a"
    _keyOptionsAlpha.push(`Key${upper}`);
}

// const, but can be augmented from client code when new Key codes are "discovered" (platform-specific detection)
export const KEY_CODES = [].concat(
    _keyOptionsFunctions,
    _keyOptionsNumbers,
    _keyOptionsAlpha,
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"],
    ["Space", "Enter", "Backspace", "Delete", "BracketRight", "BracketLeft"],
    ["Slash", "Backslash", "IntlBackslash"],
    ["Period", "Comma", "Quote", "Backquote", "Minus", "Equal", "Semicolon"],
    ["CapsLock", "Insert", "PrintScreen"],
    ["NumLock", "NumpadMultiply", "NumpadEqual", "NumpadSubtract", "NumpadDecimal", "NumpadEnter", "NumpadDivide"],
    _keyOptionsNumpads,
);
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values

const _elementNameBlacklist = ["INPUT"];

export const keyDownEventHandler = (ev: IKeyboardEvent, elementName?: string) => {
    const doc = document as TKeyboardDocument;

    document.documentElement.classList.add("R2_CSS_CLASS__KEYBOARD_INTERACT");

    if (DEBUG_KEYBOARD) {
        console.log("installKeyboardListener KEY DOWN:", ev.code);
    }

    if (!ev.code) {
        return;
    }
    // ev.preventDefault();

    if (ev.code.startsWith("Shift")) {
        doc._keyModifierShift = true;
    } else if (ev.code.startsWith("Control")) {
        doc._keyModifierControl = true;
    } else if (ev.code.startsWith("Meta")) {
        doc._keyModifierMeta = true;
    } else if (ev.code.startsWith("Alt")) {
        doc._keyModifierAlt = true;
    } else {
        if (elementName && _elementNameBlacklist.includes(elementName)) {
            return;
        }
        const ev_: IKeyboardEvent = {
            altKey: doc._keyModifierAlt, // ev.altKey
            ctrlKey: doc._keyModifierControl, // ev.ctrlKey
            metaKey: doc._keyModifierMeta, // ev.metaKey
            shiftKey: doc._keyModifierShift, // ev.shiftKey

            code: ev.code,
        };
        for (const keyboardShortcutPairing of _keyboardShortcutPairings) {
            if (keyboardShortcutPairing.up) {
                continue; // this is KEY DOWN
            }
            if (keyboardShortcutMatch(keyboardShortcutPairing.keyboardShortcut, ev_)) {

                if (DEBUG_KEYBOARD) {
                    console.log("keyboardShortcutMatch KEY DOWN:",
                        JSON.stringify(keyboardShortcutPairing.keyboardShortcut, null, 4));
                }
                keyboardShortcutPairing.callback();
                return; // execute first match only
            }
        }
    }
};
export const keyUpEventHandler = (ev: IKeyboardEvent, elementName?: string) => {
    const doc = document as TKeyboardDocument;

    if (DEBUG_KEYBOARD) {
        console.log("installKeyboardListener KEY UP:", ev.code);
    }
    if (!ev.code) {
        return;
    }
    // ev.preventDefault();

    if (ev.code.startsWith("Shift")) {
        doc._keyModifierShift = false;
    } else if (ev.code.startsWith("Control")) {
        doc._keyModifierControl = false;
    } else if (ev.code.startsWith("Meta")) {
        doc._keyModifierMeta = false;
    } else if (ev.code.startsWith("Alt")) {
        doc._keyModifierAlt = false;
    } else {
        if (elementName && _elementNameBlacklist.includes(elementName)) {
            if (DEBUG_KEYBOARD) {
                console.log("_elementNameBlacklist KEY UP:", ev.code);
            }
            return;
        }
        const ev_: IKeyboardEvent = {
            altKey: doc._keyModifierAlt, // ev.altKey
            ctrlKey: doc._keyModifierControl, // ev.ctrlKey
            metaKey: doc._keyModifierMeta, // ev.metaKey
            shiftKey: doc._keyModifierShift, // ev.shiftKey

            code: ev.code,
        };
        for (const keyboardShortcutPairing of _keyboardShortcutPairings) {
            if (!keyboardShortcutPairing.up) {
                continue; // this is KEY UP
            }
            if (keyboardShortcutMatch(keyboardShortcutPairing.keyboardShortcut, ev_)) {

                if (DEBUG_KEYBOARD) {
                    console.log("keyboardShortcutMatch KEY UP:",
                        JSON.stringify(keyboardShortcutPairing.keyboardShortcut, null, 4));
                }
                keyboardShortcutPairing.callback();
                return; // execute first match only
            }
        }
    }
};

// because the shift/ctrl/alt/meta key modifier booleans on the DOM keyboard events are not reliable
// (at least, as tested on Widows, for example when ALT is added to CTRL SHIFT with U, O and some other key codes)
// Note that on MacOS, META seems to block the KEY UP event (DOWN okay),
// making it impossible to detect this key modifier in the keyboard capture / event sink input control
export function ensureKeyboardListenerIsInstalled() {
    const doc = document as TKeyboardDocument;

    if (doc._keyboardListenerIsInstalled) {
        return;
    }
    doc._keyboardListenerIsInstalled = true;

    doc._keyModifierShift = false;
    doc._keyModifierControl = false;
    doc._keyModifierMeta = false;
    doc._keyModifierAlt = false;

    document.documentElement.addEventListener("mousedown", (_ev: MouseEvent) => {
        document.documentElement.classList.remove("R2_CSS_CLASS__KEYBOARD_INTERACT");
    }, true);

    document.addEventListener("keydown", (ev: KeyboardEvent) => {
        const elementName = (ev.target as Element).nodeName;

        keyDownEventHandler(ev, elementName);
    }, {
        once: false,
        passive: false,
        capture: true,
    });
    document.addEventListener("keyup", (ev: KeyboardEvent) => {
        const elementName = (ev.target as Element).nodeName;

        keyUpEventHandler(ev, elementName);
    }, {
        once: false,
        passive: false,
        capture: true,
    });
}

interface IKeyboardShortcutPairing {
    up: boolean; // otherwise, assumes down
    keyboardShortcut: TKeyboardShortcutReadOnly;
    callback: () => void;
}
const _keyboardShortcutPairings: IKeyboardShortcutPairing[] = [];
export function registerKeyboardListener(
    up: boolean,
    keyboardShortcut: TKeyboardShortcutReadOnly,
    callback: () => void) {

    if (DEBUG_KEYBOARD) {
        console.log("registerKeyboardListener:",
            JSON.stringify(keyboardShortcut, null, 4));
    }
    _keyboardShortcutPairings.push({
        up,
        keyboardShortcut,
        callback,
    });
}
export function unregisterKeyboardListener(callback: () => void) {
    const i = _keyboardShortcutPairings.findIndex((keyboardShortcutPairing, _index, _arr) => {
        return keyboardShortcutPairing.callback === callback;
    });
    if (i >= 0) {

        if (DEBUG_KEYBOARD) {
            console.log(`UNregisterKeyboardListener ${i}`,
                JSON.stringify(_keyboardShortcutPairings[i].keyboardShortcut, null, 4));
        }
        _keyboardShortcutPairings.splice(i, 1);
    }
}
