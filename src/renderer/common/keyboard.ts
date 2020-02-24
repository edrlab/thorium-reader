// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values

type TDocument = typeof document;
export interface TKeyboardDocument extends TDocument {
    _keyModifierShift: boolean;
    _keyModifierControl: boolean;
    _keyModifierAlt: boolean;
    _keyModifierMeta: boolean;

    _keyCode: string;

    _keyboardListenerIsInstalled: boolean;
}

export const DEBUG_KEYBOARD = false;

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

// because the shift/ctrl/alt/meta key modifier booleans on the DOM keyboard events are not reliable
// (at least, as tested on Widows, for example when ALT is added to CTRL SHIFT with U, O and some other key codes)
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

    document.addEventListener("keydown", (ev) => {
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
        }
    }, {
        once: false,
        passive: false,
        capture: true,
    });
    document.addEventListener("keyup", (ev) => {
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
        }
    }, {
        once: false,
        passive: false,
        capture: true,
    });
}
