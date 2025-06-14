// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values

import {
    DEBUG_KEYBOARD, IKeyboardEvent, keyboardShortcutMatch, TKeyboardShortcut,
} from "readium-desktop/common/keyboard";

import { ipcRenderer } from "electron";

type TDocument = typeof document;
export interface TKeyboardDocument extends TDocument {
    _keyModifierShift: boolean;
    _keyModifierControl: boolean;
    _keyModifierAlt: boolean;
    _keyModifierMeta: boolean;

    _keyCode: string;

    _keyboardListenerIsInstalled: boolean;
}

const _keyOptionsFunctions: string[] = [];
for (let i = 1; i <= 12; i++) {
    _keyOptionsFunctions.push(`F${i}`);
}
const _keyOptionsNumbers: string[] = [];
for (let i = 0; i <= 9; i++) {
    _keyOptionsNumbers.push(`Digit${i}`);
}
const _keyOptionsNumpads: string[] = [];
for (let i = 0; i <= 9; i++) {
    _keyOptionsNumpads.push(`Numpad${i}`);
}
const _keyOptionsAlpha: string[] = [];
for (let i = 0; i < 26; i++) {
    const upper = String.fromCharCode(65 + i); // 97 is lowercase "a"
    _keyOptionsAlpha.push(`Key${upper}`);
}
const _keyOptionsArrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
const _keyOptionsEnterReturnSpace = ["Space", "Enter", "Return"];

// const, but can be augmented from client code when new Key codes are "discovered" (platform-specific detection)
export const KEY_CODES = _keyOptionsNumpads.concat(
    _keyOptionsFunctions,
    _keyOptionsNumbers,
    _keyOptionsAlpha,
    _keyOptionsArrows,
    _keyOptionsEnterReturnSpace,
    ["Backspace", "Delete", "BracketRight", "BracketLeft"],
    ["Slash", "Backslash", "IntlBackslash"],
    ["Period", "Comma", "Quote", "Backquote", "Minus", "Equal", "Semicolon"],
    ["CapsLock", "Insert", "PrintScreen"],
    ["NumLock", "NumpadMultiply", "NumpadEqual", "NumpadSubtract", "NumpadDecimal", "NumpadEnter", "NumpadDivide"],
);
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values

const _elementNameBlacklist: string[] = [];

const keyDownUpEventHandler = (
    ev: IKeyboardEvent,
    elementName: string,
    elementAttributes: {[name: string]: string},
    internal = false,
    keyDown: boolean,
) => {
    const doc = document as TKeyboardDocument;
    let inputType = elementName === "INPUT" ? elementAttributes.type : undefined;
    if (!inputType && elementAttributes["data-input-type"]) {
        inputType = elementAttributes["data-input-type"];
    }
    const isArrows = _keyOptionsArrows.includes(ev.code);
    const isEnterReturnSpace = _keyOptionsEnterReturnSpace.includes(ev.code);
    const isBlackListed =
        inputType === "search" ||
        inputType === "text" ||
        inputType === "password" ||
        inputType === "range" && isArrows ||
        inputType === "radio" && isArrows ||
        inputType === "checkbox" && isEnterReturnSpace ||
        inputType === "file" && isEnterReturnSpace ||
        elementAttributes["contenteditable"] === "true" || // domElement.isContentEditable
        elementName === "TEXTAREA";

    document.documentElement.classList.add("R2_CSS_CLASS__KEYBOARD_INTERACT");

    if (DEBUG_KEYBOARD) {
        console.log("installKeyboardListener KEY " +
            (keyDown ? "DOWN" : "UP"), ev.code, internal ? "UI" : "WebView");
    }

    if (!ev.code) {
        return;
    }
    // ev.preventDefault();

    if (ev.code.startsWith("Shift")) {
        doc._keyModifierShift = keyDown;
    } else if (ev.code.startsWith("Control")) {
        doc._keyModifierControl = keyDown;
    } else if (ev.code.startsWith("Meta")) {
        doc._keyModifierMeta = keyDown;
    } else if (ev.code.startsWith("Alt")) {
        doc._keyModifierAlt = keyDown;
    } else {
        if (DEBUG_KEYBOARD) {
            console.log("blacklist check KEY " +
                (keyDown ? "DOWN" : "UP"), elementName, JSON.stringify(elementAttributes, null, 2));
        }
        if (isBlackListed || elementName && _elementNameBlacklist.includes(elementName)) {
            if (DEBUG_KEYBOARD) {
                console.log("_elementNameBlacklist KEY " +
                    (keyDown ? "DOWN" : "UP"), ev.code);
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
            if (keyDown && keyboardShortcutPairing.up) {
                continue;
            }
            if (!keyDown && !keyboardShortcutPairing.up) {
                continue;
            }
            if (keyboardShortcutMatch(keyboardShortcutPairing.keyboardShortcut, ev_)) {

                if (DEBUG_KEYBOARD) {
                    console.log("keyboardShortcutMatch KEY " +
                        (keyDown ? "DOWN" : "UP"),
                        JSON.stringify(keyboardShortcutPairing.keyboardShortcut, null, 4));
                }
                keyboardShortcutPairing.callback();
                return; // execute first match only
            }
        }
    }
};
export const keyDownEventHandler = (
    ev: IKeyboardEvent,
    elementName: string,
    elementAttributes: {[name: string]: string},
    internal = false,
) => {
    keyDownUpEventHandler(ev, elementName, elementAttributes, internal, true);
};

export const keyUpEventHandler = (
    ev: IKeyboardEvent,
    elementName: string,
    elementAttributes: {[name: string]: string},
    internal = false,
) => {
    keyDownUpEventHandler(ev, elementName, elementAttributes, internal, false);
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

    ipcRenderer.on("window-focus", () => {
        if (DEBUG_KEYBOARD) {
            console.log("electron window FOCUS");
        }
        doc._keyModifierShift = false;
        doc._keyModifierControl = false;
        doc._keyModifierMeta = false;
        doc._keyModifierAlt = false;
    });
    ipcRenderer.on("window-blur", () => {
        if (DEBUG_KEYBOARD) {
            console.log("electron window BLUR");
        }
        doc._keyModifierShift = false;
        doc._keyModifierControl = false;
        doc._keyModifierMeta = false;
        doc._keyModifierAlt = false;
    });

    window.addEventListener("blur", () => {
        if (DEBUG_KEYBOARD) {
            console.log("window BLUR");
        }
        doc._keyModifierShift = false;
        doc._keyModifierControl = false;
        doc._keyModifierMeta = false;
        doc._keyModifierAlt = false;
    }, true);
    window.addEventListener("focus", () => {
        if (DEBUG_KEYBOARD) {
            console.log("window FOCUS");
        }
        doc._keyModifierShift = false;
        doc._keyModifierControl = false;
        doc._keyModifierMeta = false;
        doc._keyModifierAlt = false;
    }, true);

    document.documentElement.addEventListener("mousedown", (_ev: MouseEvent) => {
        document.documentElement.classList.remove("R2_CSS_CLASS__KEYBOARD_INTERACT");
    }, true);

    document.addEventListener("keydown", (ev: KeyboardEvent) => {
        const elementName = (ev.target && (ev.target as Element).nodeName) ?
            (ev.target as Element).nodeName : "";
        const elementAttributes: {[name: string]: string} = {};
        if (ev.target && (ev.target as Element).attributes) {
            for (let i = 0; i < (ev.target as Element).attributes.length; i++) {
                const attr = (ev.target as Element).attributes[i];
                elementAttributes[attr.name] = attr.value;
            }
        }
        keyDownEventHandler(ev, elementName, elementAttributes, true);
    }, {
        once: false,
        passive: false,
        capture: true,
    });
    document.addEventListener("keyup", (ev: KeyboardEvent) => {
        const elementName = (ev.target && (ev.target as Element).nodeName) ?
            (ev.target as Element).nodeName : "";
        const elementAttributes: {[name: string]: string} = {};
        if (ev.target && (ev.target as Element).attributes) {
            for (let i = 0; i < (ev.target as Element).attributes.length; i++) {
                const attr = (ev.target as Element).attributes[i];
                elementAttributes[attr.name] = attr.value;
            }
        }
        keyUpEventHandler(ev, elementName, elementAttributes, true);
    }, {
        once: false,
        passive: false,
        capture: true,
    });
}

interface IKeyboardShortcutPairing {
    up: boolean; // otherwise, assumes down
    keyboardShortcut: TKeyboardShortcut;
    callback: () => void;
}
const _keyboardShortcutPairings: IKeyboardShortcutPairing[] = [];
export function registerKeyboardListener(
    up: boolean,
    keyboardShortcut: TKeyboardShortcut,
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
function keyboardShortcutPairingsFindIndex(callback: () => void): number {
    const i = _keyboardShortcutPairings.findIndex((keyboardShortcutPairing, _index, _arr) => {
        return keyboardShortcutPairing.callback === callback;
    });
    return i;
}
export function unregisterKeyboardListener(callback: () => void) {
    while (true) {
        const i = keyboardShortcutPairingsFindIndex(callback);
        if (i >= 0) {
            if (DEBUG_KEYBOARD) {
                console.log(`UNregisterKeyboardListener ${i}`,
                    JSON.stringify(_keyboardShortcutPairings[i].keyboardShortcut, null, 4));
            }
            _keyboardShortcutPairings.splice(i, 1);
        } else {
            break;
        }
    }
}
