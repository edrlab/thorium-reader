// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as classNames from "classnames";
import * as markJS from "mark.js";
import * as path from "path";
import * as r from "ramda";
import * as React from "react";
import { connect } from "react-redux";
import { computeReadiumCssJsonMessage } from "readium-desktop/common/computeReadiumCssJsonMessage";
import { DEBUG_KEYBOARD, keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import {
    ReaderConfig, ReaderConfigBooleans, ReaderConfigStrings, ReaderConfigStringsAdjustables,
    ReaderMode,
} from "readium-desktop/common/models/reader";
import { dialogActions, readerActions } from "readium-desktop/common/redux/actions";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { formatTime } from "readium-desktop/common/utils/time";
import { LocatorView } from "readium-desktop/common/views/locator";
import {
    _APP_NAME, _APP_VERSION, _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL,
    IS_DEV,
} from "readium-desktop/preprocessor-directives";
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SkipLink from "readium-desktop/renderer/common/components/SkipLink";
import {
    ensureKeyboardListenerIsInstalled, keyDownEventHandler, keyUpEventHandler,
    registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import { apiAction } from "readium-desktop/renderer/reader/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/reader/apiSubscribe";
import ReaderFooter from "readium-desktop/renderer/reader/components/ReaderFooter";
import ReaderHeader from "readium-desktop/renderer/reader/components/ReaderHeader";
import {
    TChangeEventOnInput, TChangeEventOnSelect, TFormEvent, TKeyboardEventOnAnchor,
    TMouseEventOnAnchor, TMouseEventOnSpan,
} from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { ContentType } from "readium-desktop/utils/content-type";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
// import { encodeURIComponent_RFC3986 } from "readium-desktop/utils/url";
import { Unsubscribe } from "redux";

import { IEventPayload_R2_EVENT_CLIPBOARD_COPY } from "@r2-navigator-js/electron/common/events";
import { IHighlight, IHighlightDefinition } from "@r2-navigator-js/electron/common/highlight";
import { IRangeInfo } from "@r2-navigator-js/electron/common/selection";
import {
    audioForward, audioPause, audioRewind, audioTogglePlayPause,
} from "@r2-navigator-js/electron/renderer/audiobook";
import { uniqueCssSelector } from "@r2-navigator-js/electron/renderer/common/cssselector2";
import {
    highlightsClickListen, highlightsCreate, highlightsRemove, highlightsRemoveAll,
} from "@r2-navigator-js/electron/renderer/highlight";
import {
    getCurrentReadingLocation, handleLinkLocator, handleLinkUrl, installNavigatorDOM,
    isLocatorVisible, LocatorExtended, mediaOverlaysClickEnable, mediaOverlaysEnableCaptionsMode,
    mediaOverlaysEnableSkippability, mediaOverlaysListen, mediaOverlaysNext, mediaOverlaysPause,
    mediaOverlaysPlay, mediaOverlaysPlaybackRate, mediaOverlaysPrevious, mediaOverlaysResume,
    MediaOverlaysStateEnum, mediaOverlaysStop, navLeftOrRight, publicationHasMediaOverlays,
    readiumCssUpdate, setEpubReadingSystemInfo, setKeyDownEventHandler, setKeyUpEventHandler,
    setReadingLocationSaver, ttsClickEnable, ttsListen, ttsNext, ttsOverlayEnable, ttsPause,
    ttsPlay, ttsPlaybackRate, ttsPrevious, ttsResume, TTSStateEnum, ttsStop,
} from "@r2-navigator-js/electron/renderer/index";
import { reloadContent } from "@r2-navigator-js/electron/renderer/location";
import { convertRange } from "@r2-navigator-js/electron/renderer/webview/selection";
import { Locator as R2Locator } from "@r2-shared-js/models/locator";

import { readerLocalActionSetConfig, readerLocalActionSetLocator } from "../redux/actions";
import optionsValues, {
    AdjustableSettingsNumber, IReaderMenuProps, IReaderOptionsProps,
} from "./options-values";

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

// import * as jsonDiff from "json-diff";

// import * as domSeek from "dom-seek";
// https://github.com/tilgovi/dom-seek/blob/master/src/index.js
// function domSeek(iter: NodeIterator, where: number | Node) {
//     if (iter.whatToShow !== NodeFilter.SHOW_TEXT) { // 4
//         throw new Error("NodeIterator..whatToShow !== NodeFilter.SHOW_TEXT");
//     }

//     let count = 0;
//     let node = iter.referenceNode;
//     let predicates: {
//         forward: () => boolean;
//         backward: () => boolean;
//     } = null;

//     // is integer?
//     if (typeof where === "number" && isFinite(where) && Math.floor(where) === where) {
//         const n = where as number;

//         const forward = () => count < n;
//         const backward = () => count > n || !iter.pointerBeforeReferenceNode;

//         predicates = {forward, backward};

//     // is text node?
//     } else if ((where as Node).nodeType === Node.TEXT_NODE) {
//         const n = where as Node;

//         // tslint:disable-next-line: no-bitwise
//         const forward = node.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING ? // 2
//             () => false :
//             () => node !== n;
//         const backward = () => node !== n || !iter.pointerBeforeReferenceNode;

//         predicates = {forward, backward};
//     } else {
//         throw new Error("'where' is neither integer nor text node?!");
//     }

//     while (predicates.forward()) {
//         node = iter.nextNode();

//         if (!node) {
//             throw new Error("predicates.forward() !node");
//         }

//         const txt = normalizeDiacriticsAndLigatures(node.nodeValue);
//         count += txt.length;
//     }

//     if (iter.nextNode()) {
//         node = iter.previousNode();
//     }

//     while (predicates.backward()) {
//         node = iter.previousNode();

//         if (!node) {
//             throw new Error("predicates.backward() !node");
//         }

//         const txt = normalizeDiacriticsAndLigatures(node.nodeValue);
//         count -= txt.length;
//     }

//     if (iter.referenceNode.nodeType !== Node.TEXT_NODE) {
//         throw new Error("iter.referenceNode.nodeType !== Node.TEXT_NODE");
//     }

//     return count;
// }

// https://github.com/julmot/mark.js/blob/master/src/lib/regexpcreator.js#L157
// https://github.com/lodash/lodash/blob/master/escapeRegExp.js
const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
// const reRegExpChar = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;
const reHasRegExpChar = RegExp(reRegExpChar.source);
function escapeRegExp(str: string) {
    return (str && reHasRegExpChar.test(str))
        ? str.replace(reRegExpChar, "\\$&")
        : (str || "");
}

// const computeElementCFI = (node: Node): string | undefined => {

//     // TODO: handle character position inside text node
//     if (node.nodeType !== Node.ELEMENT_NODE) {
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

const _getCssSelectorOptions = {
    className: (_str: string) => {
        return true;
    },
    idName: (_str: string) => {
        return true;
    },
    tagName: (_str: string) => {
        return true;
    },
};
const getCssSelector_ = (doc: Document) => (element: Element): string => {
    try {
        return uniqueCssSelector(element, doc, _getCssSelectorOptions);
    } catch (err) {
        console.log("uniqueCssSelector:");
        console.log(err);
        return "";
    }
};

interface ISearchResult {
    match: string;
    textBefore: string;
    textAfter: string;
    rangeInfo: IRangeInfo | undefined;
}

// https://github.com/julmot/mark.js/blob/master/src/lib/regexpcreator.js#L297
// https://unpkg.com/browse/mark.js@8.11.1/src/lib/
// https://github.com/julmot/mark.js/compare/8.11.1...master#diff-85bc0f1e27eec3e33acf3037a575bcea

// https://github.com/sindresorhus/transliterate/
// https://github.com/diacritics/database

// https://github.com/lodash/lodash/blob/master/deburr.js
// https://github.com/lodash/lodash/blob/master/.internal/deburrLetter.js

// https://github.com/walling/unorm
// https://github.com/andrewrk/node-diacritics/blob/master/index.js
// https://github.com/tyxla/remove-accents/blob/master/index.js
// https://github.com/fedeguzman/remove-accents-diacritics/blob/master/index.js
// https://github.com/kennygrant/sanitize/blob/master/sanitize.go#L216
//
// Javascript string length (UCS-2), see UTF16 and surrogate pairs

// const unicodeToAsciiMap2 = {
//     "Æ": "AE",
//     "Ꜻ": "AV",
//     "Ǆ": "DZ",
//     "Ꝫ": "ET",
//     "Ꝭ": "IS",
//     "Ƣ": "OI",
//     "Œ": "OE",
//     "ᴁ": "AE",
//     "Ȣ": "OU",
//     "ɶ": "OE",
//     "ᴕ": "OU",
//     "æ": "ae",
//     "ꜻ": "av",
//     "œ": "oe",
//     "ȣ": "ou",
//     "ƣ": "oi",
//     "ᵫ": "ue",
//     "ꝸ": "um",
//     "ᴔ": "oe",
//     "ᴂ": "ae",
//     "ᵺ": "th",
//     "ꝭ": "is",
//     "ƕ": "hv",
//     "ǆ": "dz",
//     "ꝫ": "et",
// };

// const unicodeToAsciiMap1 = {
//     "Ё": "E",
//     "ё": "e",
//     "Ќ": "K",
//     "ќ": "k",
//     "Ї": "I",
//     "ї": "i",
//     "€": "E",
//     "–": "-",
//     "—": "-",
//     "−": "-",
//     "‒": "-",
//     "Ⱥ": "A",
//     "Ɓ": "B",
//     "Ƀ": "B",
//     "Ƃ": "B",
//     "Ƈ": "C",
//     "Ȼ": "C",
//     "Ɗ": "D",
//     "ǲ": "D",
//     "ǅ": "D",
//     "Đ": "D",
//     "Ƌ": "D",
//     "Ɇ": "E",
//     "Ƒ": "F",
//     "Ɠ": "G",
//     "Ǥ": "G",
//     "Ⱨ": "H",
//     "Ħ": "H",
//     "Ɨ": "I",
//     "Ꝺ": "D",
//     "Ꝼ": "F",
//     "Ᵹ": "G",
//     "Ꞃ": "R",
//     "Ꞅ": "S",
//     "Ꞇ": "T",
//     "Ɉ": "J",
//     "Ⱪ": "K",
//     "Ꝃ": "K",
//     "Ƙ": "K",
//     "Ꝁ": "K",
//     "Ꝅ": "K",
//     "Ƚ": "L",
//     "Ⱡ": "L",
//     "Ꝉ": "L",
//     "Ŀ": "L",
//     "Ɫ": "L",
//     "ǈ": "L",
//     "Ł": "L",
//     "Ɱ": "M",
//     "Ɲ": "N",
//     "Ƞ": "N",
//     "ǋ": "N",
//     "Ꝋ": "O",
//     "Ꝍ": "O",
//     "Ɵ": "O",
//     "Ø": "O",
//     "Ɛ": "E",
//     "Ɔ": "O",
//     "Ꝓ": "P",
//     "Ƥ": "P",
//     "Ꝕ": "P",
//     "Ᵽ": "P",
//     "Ꝑ": "P",
//     "Ꝙ": "Q",
//     "Ꝗ": "Q",
//     "Ɍ": "R",
//     "Ɽ": "R",
//     "Ꜿ": "C",
//     "Ǝ": "E",
//     "Ⱦ": "T",
//     "Ƭ": "T",
//     "Ʈ": "T",
//     "Ŧ": "T",
//     "Ɐ": "A",
//     "Ꞁ": "L",
//     "Ɯ": "M",
//     "Ʌ": "V",
//     "Ꝟ": "V",
//     "Ʋ": "V",
//     "Ⱳ": "W",
//     "Ƴ": "Y",
//     "Ỿ": "Y",
//     "Ɏ": "Y",
//     "Ⱬ": "Z",
//     "Ȥ": "Z",
//     "Ƶ": "Z",
//     "ᴀ": "A",
//     "ʙ": "B",
//     "ᴃ": "B",
//     "ᴄ": "C",
//     "ᴅ": "D",
//     "ᴇ": "E",
//     "ꜰ": "F",
//     "ɢ": "G",
//     "ʛ": "G",
//     "ʜ": "H",
//     "ɪ": "I",
//     "ʁ": "R",
//     "ᴊ": "J",
//     "ᴋ": "K",
//     "ʟ": "L",
//     "ᴌ": "L",
//     "ᴍ": "M",
//     "ɴ": "N",
//     "ᴏ": "O",
//     "ᴐ": "O",
//     "ᴘ": "P",
//     "ʀ": "R",
//     "ᴎ": "N",
//     "ᴙ": "R",
//     "ꜱ": "S",
//     "ᴛ": "T",
//     "ⱻ": "E",
//     "ᴚ": "R",
//     "ᴜ": "U",
//     "ᴠ": "V",
//     "ᴡ": "W",
//     "ʏ": "Y",
//     "ᴢ": "Z",
//     "ᶏ": "a",
//     "ẚ": "a",
//     "ⱥ": "a",
//     "ɓ": "b",
//     "ᵬ": "b",
//     "ᶀ": "b",
//     "ƀ": "b",
//     "ƃ": "b",
//     "ɵ": "o",
//     "ɕ": "c",
//     "ƈ": "c",
//     "ȼ": "c",
//     "ȡ": "d",
//     "ɗ": "d",
//     "ᶑ": "d",
//     "ᵭ": "d",
//     "ᶁ": "d",
//     "đ": "d",
//     "ɖ": "d",
//     "ƌ": "d",
//     "ı": "i",
//     "ȷ": "j",
//     "ɟ": "j",
//     "ʄ": "j",
//     "ⱸ": "e",
//     "ᶒ": "e",
//     "ɇ": "e",
//     "ƒ": "f",
//     "ᵮ": "f",
//     "ᶂ": "f",
//     "ɠ": "g",
//     "ᶃ": "g",
//     "ǥ": "g",
//     "ⱨ": "h",
//     "ɦ": "h",
//     "ħ": "h",
//     "ᶖ": "i",
//     "ɨ": "i",
//     "ꝺ": "d",
//     "ꝼ": "f",
//     "ᵹ": "g",
//     "ꞃ": "r",
//     "ꞅ": "s",
//     "ꞇ": "t",
//     "ʝ": "j",
//     "ɉ": "j",
//     "ⱪ": "k",
//     "ꝃ": "k",
//     "ƙ": "k",
//     "ᶄ": "k",
//     "ꝁ": "k",
//     "ꝅ": "k",
//     "ƚ": "l",
//     "ɬ": "l",
//     "ȴ": "l",
//     "ⱡ": "l",
//     "ꝉ": "l",
//     "ŀ": "l",
//     "ɫ": "l",
//     "ᶅ": "l",
//     "ɭ": "l",
//     "ł": "l",
//     "ſ": "s",
//     "ẜ": "s",
//     "ẝ": "s",
//     "ɱ": "m",
//     "ᵯ": "m",
//     "ᶆ": "m",
//     "ȵ": "n",
//     "ɲ": "n",
//     "ƞ": "n",
//     "ᵰ": "n",
//     "ᶇ": "n",
//     "ɳ": "n",
//     "ꝋ": "o",
//     "ꝍ": "o",
//     "ⱺ": "o",
//     "ø": "o",
//     "ɛ": "e",
//     "ᶓ": "e",
//     "ɔ": "o",
//     "ᶗ": "o",
//     "ꝓ": "p",
//     "ƥ": "p",
//     "ᵱ": "p",
//     "ᶈ": "p",
//     "ꝕ": "p",
//     "ᵽ": "p",
//     "ꝑ": "p",
//     "ꝙ": "q",
//     "ʠ": "q",
//     "ɋ": "q",
//     "ꝗ": "q",
//     "ɾ": "r",
//     "ᵳ": "r",
//     "ɼ": "r",
//     "ᵲ": "r",
//     "ᶉ": "r",
//     "ɍ": "r",
//     "ɽ": "r",
//     "ↄ": "c",
//     "ꜿ": "c",
//     "ɘ": "e",
//     "ɿ": "r",
//     "ʂ": "s",
//     "ᵴ": "s",
//     "ᶊ": "s",
//     "ȿ": "s",
//     "ɡ": "g",
//     "ᴑ": "o",
//     "ᴓ": "o",
//     "ᴝ": "u",
//     "ȶ": "t",
//     "ⱦ": "t",
//     "ƭ": "t",
//     "ᵵ": "t",
//     "ƫ": "t",
//     "ʈ": "t",
//     "ŧ": "t",
//     "ɐ": "a",
//     "ǝ": "e",
//     "ᵷ": "g",
//     "ɥ": "h",
//     "ʮ": "h",
//     "ʯ": "h",
//     "ᴉ": "i",
//     "ʞ": "k",
//     "ꞁ": "l",
//     "ɯ": "m",
//     "ɰ": "m",
//     "ɹ": "r",
//     "ɻ": "r",
//     "ɺ": "r",
//     "ⱹ": "r",
//     "ʇ": "t",
//     "ʌ": "v",
//     "ʍ": "w",
//     "ʎ": "y",
//     "ᶙ": "u",
//     "ⱴ": "v",
//     "ꝟ": "v",
//     "ʋ": "v",
//     "ᶌ": "v",
//     "ⱱ": "v",
//     "ⱳ": "w",
//     "ᶍ": "x",
//     "ƴ": "y",
//     "ỿ": "y",
//     "ɏ": "y",
//     "ʑ": "z",
//     "ⱬ": "z",
//     "ȥ": "z",
//     "ᵶ": "z",
//     "ᶎ": "z",
//     "ʐ": "z",
//     "ƶ": "z",
//     "ɀ": "z",
//     "ₓ": "x",
// };

// const transliterates = [
//     // German umlauts
//     ["ß", "ss"],
//     ["ä", "ae"],
//     ["Ä", "Ae"],
//     ["ö", "oe"],
//     ["Ö", "Oe"],
//     ["ü", "ue"],
//     ["Ü", "Ue"],

//     // Latin
//     ["À", "A"],
//     ["Á", "A"],
//     ["Â", "A"],
//     ["Ã", "A"],
//     ["Ä", "Ae"],
//     ["Å", "A"],
//     ["Æ", "AE"],
//     ["Ç", "C"],
//     ["È", "E"],
//     ["É", "E"],
//     ["Ê", "E"],
//     ["Ë", "E"],
//     ["Ì", "I"],
//     ["Í", "I"],
//     ["Î", "I"],
//     ["Ï", "I"],
//     ["Ð", "D"],
//     ["Ñ", "N"],
//     ["Ò", "O"],
//     ["Ó", "O"],
//     ["Ô", "O"],
//     ["Õ", "O"],
//     ["Ö", "Oe"],
//     ["Ő", "O"],
//     ["Ø", "O"],
//     ["Ù", "U"],
//     ["Ú", "U"],
//     ["Û", "U"],
//     ["Ü", "Ue"],
//     ["Ű", "U"],
//     ["Ý", "Y"],
//     ["Þ", "TH"],
//     ["ß", "ss"],
//     ["à", "a"],
//     ["á", "a"],
//     ["â", "a"],
//     ["ã", "a"],
//     ["ä", "ae"],
//     ["å", "a"],
//     ["æ", "ae"],
//     ["ç", "c"],
//     ["è", "e"],
//     ["é", "e"],
//     ["ê", "e"],
//     ["ë", "e"],
//     ["ì", "i"],
//     ["í", "i"],
//     ["î", "i"],
//     ["ï", "i"],
//     ["ð", "d"],
//     ["ñ", "n"],
//     ["ò", "o"],
//     ["ó", "o"],
//     ["ô", "o"],
//     ["õ", "o"],
//     ["ö", "oe"],
//     ["ő", "o"],
//     ["ø", "o"],
//     ["ù", "u"],
//     ["ú", "u"],
//     ["û", "u"],
//     ["ü", "ue"],
//     ["ű", "u"],
//     ["ý", "y"],
//     ["þ", "th"],
//     ["ÿ", "y"],
//     ["ẞ", "SS"],

//     // Vietnamese
//     ["à", "a"],
//     ["À", "A"],
//     ["á", "a"],
//     ["Á", "A"],
//     ["â", "a"],
//     ["Â", "A"],
//     ["ã", "a"],
//     ["Ã", "A"],
//     ["è", "e"],
//     ["È", "E"],
//     ["é", "e"],
//     ["É", "E"],
//     ["ê", "e"],
//     ["Ê", "E"],
//     ["ì", "i"],
//     ["Ì", "I"],
//     ["í", "i"],
//     ["Í", "I"],
//     ["ò", "o"],
//     ["Ò", "O"],
//     ["ó", "o"],
//     ["Ó", "O"],
//     ["ô", "o"],
//     ["Ô", "O"],
//     ["õ", "o"],
//     ["Õ", "O"],
//     ["ù", "u"],
//     ["Ù", "U"],
//     ["ú", "u"],
//     ["Ú", "U"],
//     ["ý", "y"],
//     ["Ý", "Y"],
//     ["ă", "a"],
//     ["Ă", "A"],
//     ["Đ", "D"],
//     ["đ", "d"],
//     ["ĩ", "i"],
//     ["Ĩ", "I"],
//     ["ũ", "u"],
//     ["Ũ", "U"],
//     ["ơ", "o"],
//     ["Ơ", "O"],
//     ["ư", "u"],
//     ["Ư", "U"],
//     ["ạ", "a"],
//     ["Ạ", "A"],
//     ["ả", "a"],
//     ["Ả", "A"],
//     ["ấ", "a"],
//     ["Ấ", "A"],
//     ["ầ", "a"],
//     ["Ầ", "A"],
//     ["ẩ", "a"],
//     ["Ẩ", "A"],
//     ["ẫ", "a"],
//     ["Ẫ", "A"],
//     ["ậ", "a"],
//     ["Ậ", "A"],
//     ["ắ", "a"],
//     ["Ắ", "A"],
//     ["ằ", "a"],
//     ["Ằ", "A"],
//     ["ẳ", "a"],
//     ["Ẳ", "A"],
//     ["ẵ", "a"],
//     ["Ẵ", "A"],
//     ["ặ", "a"],
//     ["Ặ", "A"],
//     ["ẹ", "e"],
//     ["Ẹ", "E"],
//     ["ẻ", "e"],
//     ["Ẻ", "E"],
//     ["ẽ", "e"],
//     ["Ẽ", "E"],
//     ["ế", "e"],
//     ["Ế", "E"],
//     ["ề", "e"],
//     ["Ề", "E"],
//     ["ể", "e"],
//     ["Ể", "E"],
//     ["ễ", "e"],
//     ["Ễ", "E"],
//     ["ệ", "e"],
//     ["Ệ", "E"],
//     ["ỉ", "i"],
//     ["Ỉ", "I"],
//     ["ị", "i"],
//     ["Ị", "I"],
//     ["ọ", "o"],
//     ["Ọ", "O"],
//     ["ỏ", "o"],
//     ["Ỏ", "O"],
//     ["ố", "o"],
//     ["Ố", "O"],
//     ["ồ", "o"],
//     ["Ồ", "O"],
//     ["ổ", "o"],
//     ["Ổ", "O"],
//     ["ỗ", "o"],
//     ["Ỗ", "O"],
//     ["ộ", "o"],
//     ["Ộ", "O"],
//     ["ớ", "o"],
//     ["Ớ", "O"],
//     ["ờ", "o"],
//     ["Ờ", "O"],
//     ["ở", "o"],
//     ["Ở", "O"],
//     ["ỡ", "o"],
//     ["Ỡ", "O"],
//     ["ợ", "o"],
//     ["Ợ", "O"],
//     ["ụ", "u"],
//     ["Ụ", "U"],
//     ["ủ", "u"],
//     ["Ủ", "U"],
//     ["ứ", "u"],
//     ["Ứ", "U"],
//     ["ừ", "u"],
//     ["Ừ", "U"],
//     ["ử", "u"],
//     ["Ử", "U"],
//     ["ữ", "u"],
//     ["Ữ", "U"],
//     ["ự", "u"],
//     ["Ự", "U"],
//     ["ỳ", "y"],
//     ["Ỳ", "Y"],
//     ["ỵ", "y"],
//     ["Ỵ", "Y"],
//     ["ỷ", "y"],
//     ["Ỷ", "Y"],
//     ["ỹ", "y"],
//     ["Ỹ", "Y"],

//     // Arabic
//     ["ء", "e"],
//     ["آ", "a"],
//     ["أ", "a"],
//     ["ؤ", "w"],
//     ["إ", "a"],
//     ["ئ", "y"],
//     ["ا", "a"],
//     ["ب", "b"],
//     ["ة", "t"],
//     ["ت", "t"],
//     ["ث", "th"],
//     ["ج", "j"],
//     ["ح", "h"],
//     ["خ", "kh"],
//     ["د", "d"],
//     ["ذ", "dh"],
//     ["ر", "r"],
//     ["ز", "z"],
//     ["س", "s"],
//     ["ش", "sh"],
//     ["ص", "s"],
//     ["ض", "d"],
//     ["ط", "t"],
//     ["ظ", "z"],
//     ["ع", "e"],
//     ["غ", "gh"],
//     ["ـ", "_"],
//     ["ف", "f"],
//     ["ق", "q"],
//     ["ك", "k"],
//     ["ل", "l"],
//     ["م", "m"],
//     ["ن", "n"],
//     ["ه", "h"],
//     ["و", "w"],
//     ["ى", "a"],
//     ["ي", "y"],
//     ["َ‎", "a"],
//     ["ُ", "u"],
//     ["ِ‎", "i"],
//     ["٠", "0"],
//     ["١", "1"],
//     ["٢", "2"],
//     ["٣", "3"],
//     ["٤", "4"],
//     ["٥", "5"],
//     ["٦", "6"],
//     ["٧", "7"],
//     ["٨", "8"],
//     ["٩", "9"],

//     // Persian / Farsi
//     ["چ", "ch"],
//     ["ک", "k"],
//     ["گ", "g"],
//     ["پ", "p"],
//     ["ژ", "zh"],
//     ["ی", "y"],
//     ["۰", "0"],
//     ["۱", "1"],
//     ["۲", "2"],
//     ["۳", "3"],
//     ["۴", "4"],
//     ["۵", "5"],
//     ["۶", "6"],
//     ["۷", "7"],
//     ["۸", "8"],
//     ["۹", "9"],

//     // Pashto
//     ["ټ", "p"],
//     ["ځ", "z"],
//     ["څ", "c"],
//     ["ډ", "d"],
//     ["ﺫ", "d"],
//     ["ﺭ", "r"],
//     ["ړ", "r"],
//     ["ﺯ", "z"],
//     ["ږ", "g"],
//     ["ښ", "x"],
//     ["ګ", "g"],
//     ["ڼ", "n"],
//     ["ۀ", "e"],
//     ["ې", "e"],
//     ["ۍ", "ai"],

//     // Urdu
//     ["ٹ", "t"],
//     ["ڈ", "d"],
//     ["ڑ", "r"],
//     ["ں", "n"],
//     ["ہ", "h"],
//     ["ھ", "h"],
//     ["ے", "e"],

//     // Russian
//     ["А", "A"],
//     ["а", "a"],
//     ["Б", "B"],
//     ["б", "b"],
//     ["В", "V"],
//     ["в", "v"],
//     ["Г", "G"],
//     ["г", "g"],
//     ["Д", "D"],
//     ["д", "d"],
//     ["Е", "E"],
//     ["е", "e"],
//     ["Ж", "Zh"],
//     ["ж", "zh"],
//     ["З", "Z"],
//     ["з", "z"],
//     ["И", "I"],
//     ["и", "i"],
//     ["Й", "J"],
//     ["й", "j"],
//     ["К", "K"],
//     ["к", "k"],
//     ["Л", "L"],
//     ["л", "l"],
//     ["М", "M"],
//     ["м", "m"],
//     ["Н", "N"],
//     ["н", "n"],
//     ["О", "O"],
//     ["о", "o"],
//     ["П", "P"],
//     ["п", "p"],
//     ["Р", "R"],
//     ["р", "r"],
//     ["С", "S"],
//     ["с", "s"],
//     ["Т", "T"],
//     ["т", "t"],
//     ["У", "U"],
//     ["у", "u"],
//     ["Ф", "F"],
//     ["ф", "f"],
//     ["Х", "H"],
//     ["х", "h"],
//     ["Ц", "Cz"],
//     ["ц", "cz"],
//     ["Ч", "Ch"],
//     ["ч", "ch"],
//     ["Ш", "Sh"],
//     ["ш", "sh"],
//     ["Щ", "Shh"],
//     ["щ", "shh"],
//     ["Ъ", ""],
//     ["ъ", ""],
//     ["Ы", "Y"],
//     ["ы", "y"],
//     ["Ь", ""],
//     ["ь", ""],
//     ["Э", "E"],
//     ["э", "e"],
//     ["Ю", "Yu"],
//     ["ю", "yu"],
//     ["Я", "Ya"],
//     ["я", "ya"],
//     ["Ё", "Yo"],
//     ["ё", "yo"],

//     // Romanian
//     ["ă", "a"],
//     ["Ă", "A"],
//     ["ș", "s"],
//     ["Ș", "S"],
//     ["ț", "t"],
//     ["Ț", "T"],
//     ["ţ", "t"],
//     ["Ţ", "T"],

//     // Turkish
//     ["ş", "s"],
//     ["Ş", "s"],
//     ["ç", "c"],
//     ["Ç", "C"],
//     ["ğ", "g"],
//     ["Ğ", "G"],
//     ["ı", "i"],
//     ["İ", "I"],

//     // Armenian
//     ["ա", "a"],
//     ["բ", "b"],
//     ["գ", "g"],
//     ["դ", "d"],
//     ["ե", "ye"],
//     ["զ", "z"],
//     ["է", "e"],
//     ["ը", "u"],
//     ["թ", "t"],
//     ["ժ", "zh"],
//     ["ի", "i"],
//     ["լ", "l"],
//     ["խ", "kh"],
//     ["ծ", "ts"],
//     ["կ", "k"],
//     ["հ", "h"],
//     ["ձ", "dz"],
//     ["ղ", "r"],
//     ["ճ", "j"],
//     ["մ", "m"],
//     ["յ", "j"],
//     ["ն", "n"],
//     ["շ", "sh"],
//     ["ո", "vo"],
//     ["չ", "ch"],
//     ["պ", "p"],
//     ["ջ", "j"],
//     ["ռ", "r"],
//     ["ս", "s"],
//     ["վ", "v"],
//     ["տ", "t"],
//     ["ր", "re"],
//     ["ց", "ts"],
//     ["ու", "u"],
//     ["ւ", "v"],
//     ["փ", "p"],
//     ["ք", "q"],
//     ["օ", "o"],
//     ["ֆ", "f"],
//     ["և", "yev"],

//     // Georgian
//     ["ა", "a"],
//     ["ბ", "b"],
//     ["გ", "g"],
//     ["დ", "d"],
//     ["ე", "e"],
//     ["ვ", "v"],
//     ["ზ", "z"],
//     ["თ", "t"],
//     ["ი", "i"],
//     ["კ", "k"],
//     ["ლ", "l"],
//     ["მ", "m"],
//     ["ნ", "n"],
//     ["ო", "o"],
//     ["პ", "p"],
//     ["ჟ", "zh"],
//     ["რ", "r"],
//     ["ს", "s"],
//     ["ტ", "t"],
//     ["უ", "u"],
//     ["ფ", "ph"],
//     ["ქ", "q"],
//     ["ღ", "gh"],
//     ["ყ", "k"],
//     ["შ", "sh"],
//     ["ჩ", "ch"],
//     ["ც", "ts"],
//     ["ძ", "dz"],
//     ["წ", "ts"],
//     ["ჭ", "tch"],
//     ["ხ", "kh"],
//     ["ჯ", "j"],
//     ["ჰ", "h"],

//     // Czech
//     ["č", "c"],
//     ["ď", "d"],
//     ["ě", "e"],
//     ["ň", "n"],
//     ["ř", "r"],
//     ["š", "s"],
//     ["ť", "t"],
//     ["ů", "u"],
//     ["ž", "z"],
//     ["Č", "C"],
//     ["Ď", "D"],
//     ["Ě", "E"],
//     ["Ň", "N"],
//     ["Ř", "R"],
//     ["Š", "S"],
//     ["Ť", "T"],
//     ["Ů", "U"],
//     ["Ž", "Z"],

//     // Dhivehi
//     ["ހ", "h"],
//     ["ށ", "sh"],
//     ["ނ", "n"],
//     ["ރ", "r"],
//     ["ބ", "b"],
//     ["ޅ", "lh"],
//     ["ކ", "k"],
//     ["އ", "a"],
//     ["ވ", "v"],
//     ["މ", "m"],
//     ["ފ", "f"],
//     ["ދ", "dh"],
//     ["ތ", "th"],
//     ["ލ", "l"],
//     ["ގ", "g"],
//     ["ޏ", "gn"],
//     ["ސ", "s"],
//     ["ޑ", "d"],
//     ["ޒ", "z"],
//     ["ޓ", "t"],
//     ["ޔ", "y"],
//     ["ޕ", "p"],
//     ["ޖ", "j"],
//     ["ޗ", "ch"],
//     ["ޘ", "tt"],
//     ["ޙ", "hh"],
//     ["ޚ", "kh"],
//     ["ޛ", "th"],
//     ["ޜ", "z"],
//     ["ޝ", "sh"],
//     ["ޞ", "s"],
//     ["ޟ", "d"],
//     ["ޠ", "t"],
//     ["ޡ", "z"],
//     ["ޢ", "a"],
//     ["ޣ", "gh"],
//     ["ޤ", "q"],
//     ["ޥ", "w"],
//     ["ަ", "a"],
//     ["ާ", "aa"],
//     ["ި", "i"],
//     ["ީ", "ee"],
//     ["ު", "u"],
//     ["ޫ", "oo"],
//     ["ެ", "e"],
//     ["ޭ", "ey"],
//     ["ޮ", "o"],
//     ["ޯ", "oa"],
//     ["ް", ""],

//     // Greek
//     ["α", "a"],
//     ["β", "v"],
//     ["γ", "g"],
//     ["δ", "d"],
//     ["ε", "e"],
//     ["ζ", "z"],
//     ["η", "i"],
//     ["θ", "th"],
//     ["ι", "i"],
//     ["κ", "k"],
//     ["λ", "l"],
//     ["μ", "m"],
//     ["ν", "n"],
//     ["ξ", "ks"],
//     ["ο", "o"],
//     ["π", "p"],
//     ["ρ", "r"],
//     ["σ", "s"],
//     ["τ", "t"],
//     ["υ", "y"],
//     ["φ", "f"],
//     ["χ", "x"],
//     ["ψ", "ps"],
//     ["ω", "o"],
//     ["ά", "a"],
//     ["έ", "e"],
//     ["ί", "i"],
//     ["ό", "o"],
//     ["ύ", "y"],
//     ["ή", "i"],
//     ["ώ", "o"],
//     ["ς", "s"],
//     ["ϊ", "i"],
//     ["ΰ", "y"],
//     ["ϋ", "y"],
//     ["ΐ", "i"],
//     ["Α", "A"],
//     ["Β", "B"],
//     ["Γ", "G"],
//     ["Δ", "D"],
//     ["Ε", "E"],
//     ["Ζ", "Z"],
//     ["Η", "I"],
//     ["Θ", "TH"],
//     ["Ι", "I"],
//     ["Κ", "K"],
//     ["Λ", "L"],
//     ["Μ", "M"],
//     ["Ν", "N"],
//     ["Ξ", "KS"],
//     ["Ο", "O"],
//     ["Π", "P"],
//     ["Ρ", "R"],
//     ["Σ", "S"],
//     ["Τ", "T"],
//     ["Υ", "Y"],
//     ["Φ", "F"],
//     ["Χ", "X"],
//     ["Ψ", "PS"],
//     ["Ω", "O"],
//     ["Ά", "A"],
//     ["Έ", "E"],
//     ["Ί", "I"],
//     ["Ό", "O"],
//     ["Ύ", "Y"],
//     ["Ή", "I"],
//     ["Ώ", "O"],
//     ["Ϊ", "I"],
//     ["Ϋ", "Y"],

//     // Disabled as it conflicts with German and Latin.
//     // Hungarian
//     // ["ä", "a"],
//     // ["Ä", "A"],
//     // ["ö", "o"],
//     // ["Ö", "O"],
//     // ["ü", "u"],
//     // ["Ü", "U"],
//     // ["ű", "u"],
//     // ["Ű", "U"],

//     // Latvian
//     ["ā", "a"],
//     ["ē", "e"],
//     ["ģ", "g"],
//     ["ī", "i"],
//     ["ķ", "k"],
//     ["ļ", "l"],
//     ["ņ", "n"],
//     ["ū", "u"],
//     ["Ā", "A"],
//     ["Ē", "E"],
//     ["Ģ", "G"],
//     ["Ī", "I"],
//     ["Ķ", "k"],
//     ["Ļ", "L"],
//     ["Ņ", "N"],
//     ["Ū", "U"],
//     ["č", "c"],
//     ["š", "s"],
//     ["ž", "z"],
//     ["Č", "C"],
//     ["Š", "S"],
//     ["Ž", "Z"],

//     // Lithuanian
//     ["ą", "a"],
//     ["č", "c"],
//     ["ę", "e"],
//     ["ė", "e"],
//     ["į", "i"],
//     ["š", "s"],
//     ["ų", "u"],
//     ["ū", "u"],
//     ["ž", "z"],
//     ["Ą", "A"],
//     ["Č", "C"],
//     ["Ę", "E"],
//     ["Ė", "E"],
//     ["Į", "I"],
//     ["Š", "S"],
//     ["Ų", "U"],
//     ["Ū", "U"],

//     // Macedonian
//     ["Ќ", "Kj"],
//     ["ќ", "kj"],
//     ["Љ", "Lj"],
//     ["љ", "lj"],
//     ["Њ", "Nj"],
//     ["њ", "nj"],
//     ["Тс", "Ts"],
//     ["тс", "ts"],

//     // Polish
//     ["ą", "a"],
//     ["ć", "c"],
//     ["ę", "e"],
//     ["ł", "l"],
//     ["ń", "n"],
//     ["ś", "s"],
//     ["ź", "z"],
//     ["ż", "z"],
//     ["Ą", "A"],
//     ["Ć", "C"],
//     ["Ę", "E"],
//     ["Ł", "L"],
//     ["Ń", "N"],
//     ["Ś", "S"],
//     ["Ź", "Z"],
//     ["Ż", "Z"],

//     // Disabled as it conflicts with Vietnamese.
//     // Serbian
//     // ["љ", "lj"],
//     // ["њ", "nj"],
//     // ["Љ", "Lj"],
//     // ["Њ", "Nj"],
//     // ["đ", "dj"],
//     // ["Đ", "Dj"],
//     // ["ђ", "dj"],
//     // ["ј", "j"],
//     // ["ћ", "c"],
//     // ["џ", "dz"],
//     // ["Ђ", "Dj"],
//     // ["Ј", "j"],
//     // ["Ћ", "C"],
//     // ["Џ", "Dz"],

//     // Disabled as it conflicts with German and Latin.
//     // Slovak
//     // ["ä", "a"],
//     // ["Ä", "A"],
//     // ["ľ", "l"],
//     // ["ĺ", "l"],
//     // ["ŕ", "r"],
//     // ["Ľ", "L"],
//     // ["Ĺ", "L"],
//     // ["Ŕ", "R"],

//     // Disabled as it conflicts with German and Latin.
//     // Swedish
//     // ["å", "o"],
//     // ["Å", "o"],
//     // ["ä", "a"],
//     // ["Ä", "A"],
//     // ["ë", "e"],
//     // ["Ë", "E"],
//     // ["ö", "o"],
//     // ["Ö", "O"],

//     // Ukrainian
//     ["Є", "Ye"],
//     ["І", "I"],
//     ["Ї", "Yi"],
//     ["Ґ", "G"],
//     ["є", "ye"],
//     ["і", "i"],
//     ["ї", "yi"],
//     ["ґ", "g"],

//     // Danish
//     // ["Æ", "Ae"],
//     // ["Ø", "Oe"],
//     // ["Å", "Aa"],
//     // ["æ", "ae"],
//     // ["ø", "oe"],
//     // ["å", "aa"]
// ];

// const transliteratesSameLengths = {};
// const transliteratesDifferentLengths = {};

// for (const tr of transliterates) {
//     const key = tr[0];
//     const val = tr[1];
//     if (key.length !== 1 && key.length !== 2) {
//         console.log("1 key.length?? ", key.length, tr);
//         process.exit(1);
//     }
//     if (val.length !== 0 && val.length !== 1 && val.length !== 2 && val.length !== 3) {
//         console.log("1 val.length?? ", key.length, val.length, tr);
//         process.exit(1);
//     }
//     const map =  key.length !== val.length ? transliteratesDifferentLengths : transliteratesSameLengths;
//     if (typeof map[key] !== "undefined") {
//         if (map[key] !== val) {
//             console.log("1 dupe key and diff val?? ", tr, map[key]);
//             process.exit(1);
//         }
//     } else {
//         map[key] = val;
//     }
// }

// for (const tr of Object.entries(unicodeToAsciiMap1)) {
//     const key = tr[0];
//     const val = tr[1];
//     if (key.length !== 1) {
//         console.log("2 key.length?? ", key.length, tr);
//         process.exit(1);
//     }
//     if (val.length !== 1) {
//         console.log("2 val.length?? ", val.length, tr);
//         process.exit(1);
//     }
//     const map = transliteratesSameLengths;
//     if (typeof map[key] !== "undefined") {
//         if (map[key] !== val) {
//             console.log("2 dupe key and diff val?? ", tr, map[key]);
//             process.exit(1);
//         } else {
//             console.log("2 idem ", tr);
//             // process.exit(1);
//         }
//     } else {
//         console.log("2 adding ", tr);
//         map[key] = val;
//     }
// }

// for (const tr of Object.entries(unicodeToAsciiMap2)) {
//     const key = tr[0];
//     const val = tr[1];
//     if (key.length !== 1) {
//         console.log("3 key.length?? ", key.length, tr);
//         process.exit(1);
//     }
//     if (val.length !== 2) {
//         console.log("3 val.length?? ", val.length, tr);
//         process.exit(1);
//     }
//     const map = transliteratesDifferentLengths;
//     if (typeof map[key] !== "undefined") {
//         if (map[key] !== val) {
//             console.log("3 dupe key and diff val?? ", tr, map[key]);
//             process.exit(1);
//         } else {
//             console.log("3 idem ", tr);
//             // process.exit(1);
//         }
//     } else {
//         console.log("3 adding ", tr);
//         map[key] = val;
//     }
// }

// function dumpUnicode(label, str) {
//     console.log(label + ":");
//     console.log(str);
//     console.log(str.codePointAt(0) ? str.codePointAt(0).toString(16) : "",
// str.codePointAt(1) ? str.codePointAt(1).toString(16) : "",
// str.codePointAt(2) ? str.codePointAt(2).toString(16) : "");
// }

// console.log("********************* PASS 1");
// for (const tr of Object.entries(transliteratesSameLengths)) {
//     const key = tr[0];
//     const val = tr[1];
//     const normal = key.normalize("NFD").
//         replace(/[\u0300-\u036f]/g, ""). // diacritics removal of accented part (retains base part)
//         replace(/[\u0653-\u0655]/g, "").
//         replace(/[^\u0000-\u007E]/g, (c) => transliteratesSameLengths[c] || c);
//     if (normal === key) {
//         console.log("############################################\n normal is key?? ");
//         dumpUnicode("key", key);
//         dumpUnicode("val", val);
//         dumpUnicode("normal", normal);
//         console.log("####\n");
//         process.exit(1);
//     }
//     if (normal !== val) {
//         console.log("###############################################\n normal not val?? ");
//         dumpUnicode("key", key);
//         dumpUnicode("val", val);
//         dumpUnicode("normal", normal);
//         console.log("####\n");
//         const diacriticsRemoved = key.normalize("NFD").
//             replace(/[\u0300-\u036f]/g, "").
//             replace(/[\u0653-\u0655]/g, "");
//         if (normal === diacriticsRemoved) {
//             if (!/^[a-zA-Z0-9_\-]+$/.test(diacriticsRemoved)) {
//             // if (/[^\u0000-\u007E]/g.test(diacriticsRemoved)) {
//                 console.log("normal === diacriticsRemoved (NO correction)");
//             } else {
//                 console.log("normal <<<<<<<<<<<<<<<<<<<< diacriticsRemoved (correction)");
//                 if (key.length === diacriticsRemoved.length) {
//                     transliteratesSameLengths[key] = diacriticsRemoved;
//                 } else {
//                     delete transliteratesSameLengths[key];
//                     transliteratesDifferentLengths[key] = diacriticsRemoved;
//                 }
//             }
//         } else {
//             console.log("------ normal !== diacriticsRemoved ");
//             dumpUnicode("diacriticsRemoved", diacriticsRemoved);

//             const replaced1 = key.normalize("NFD").
//                 replace(/[^\u0000-\u007E]/g, (c) => transliteratesSameLengths[c] || c).
//                 replace(/[\u0300-\u036f]/g, "").
//                 replace(/[\u0653-\u0655]/g, "");
//             dumpUnicode("replaced1", replaced1);

//             const replaced2 = key.normalize("NFD").
//                 replace(/[^\u0000-\u007E]/g, (c) => transliteratesSameLengths[c] || c);
//             dumpUnicode("replaced2", replaced2);
//             console.log("------");
//         }
//     }
// }

// console.log("********************* PASS 2");
// for (const tr of Object.entries(transliteratesDifferentLengths)) {
//     const key = tr[0];
//     const val = tr[1];
//     const normal = key.normalize("NFD").
//         replace(/[\u0300-\u036f]/g, ""). // diacritics removal of accented part (retains base part)
//         replace(/[\u0653-\u0655]/g, "").
//         replace(/[^\u0000-\u007E]/g, (c) => transliteratesDifferentLengths[c] || c);
//     if (normal === key) {
//         console.log("############################################\n normal is key?? ");
//         dumpUnicode("key", key);
//         dumpUnicode("val", val);
//         dumpUnicode("normal", normal);
//         console.log("####\n");
//         // process.exit(1);
//     }
//     if (normal !== val) {
//         console.log("###############################################\n normal not val?? ");
//         dumpUnicode("key", key);
//         dumpUnicode("val", val);
//         dumpUnicode("normal", normal);
//         console.log("####\n");
//         const diacriticsRemoved = key.normalize("NFD").
//             replace(/[\u0300-\u036f]/g, "").
//             replace(/[\u0653-\u0655]/g, "");
//         if (normal === diacriticsRemoved) {
//             if (!/^[a-zA-Z0-9_\-]+$/.test(diacriticsRemoved)) {
//             // if (/[^\u0000-\u007E]/g.test(diacriticsRemoved)) {
//                 console.log("normal === diacriticsRemoved (NO correction)");
//             } else {
//                 console.log("normal <<<<<<<<<<<<<<<<<<<< diacriticsRemoved (correction)");
//                 if (key.length === diacriticsRemoved.length) {
//                     delete transliteratesDifferentLengths[key];
//                     transliteratesSameLengths[key] = diacriticsRemoved;
//                 } else {
//                     transliteratesDifferentLengths[key] = diacriticsRemoved;
//                 }
//             }
//         } else {
//             console.log("------ normal !== diacriticsRemoved ");
//             dumpUnicode("diacriticsRemoved", diacriticsRemoved);

//             const replaced1 = key.normalize("NFD").
//                 replace(/[^\u0000-\u007E]/g, (c) => transliteratesDifferentLengths[c] || c).
//                 replace(/[\u0300-\u036f]/g, "").
//                 replace(/[\u0653-\u0655]/g, "");
//             dumpUnicode("replaced1", replaced1);

//             const replaced2 = key.normalize("NFD").
//                 replace(/[^\u0000-\u007E]/g, (c) => transliteratesDifferentLengths[c] || c);
//             dumpUnicode("replaced2", replaced2);
//             console.log("------");
//         }
//     }
// }

// console.log("********************* PASS 2.1");
// for (const tr of Object.entries(transliteratesDifferentLengths)) {
//     const key = tr[0];
//     const val = tr[1];
//     const normal = key.normalize("NFD").
//         replace(/[\u0300-\u036f]/g, ""). // diacritics removal of accented part (retains base part)
//         replace(/[\u0653-\u0655]/g, "");
//     if (normal !== key) {
//         console.log("############################################\n normal not key?? ");
//         dumpUnicode("key", key);
//         dumpUnicode("val", val);
//         dumpUnicode("normal", normal);
//         console.log("####\n");
//         if (key.length === normal.length) {
//             if (!transliteratesSameLengths[key]) {
//                 process.exit(1);
//             }
//         }
//     }
// }

// // console.log("EXTI");
// // process.exit(1);

// const transliteratesPureDiacriticsUpper = {};
// const transliteratesPureDiacriticsLower = {};
// const transliteratesPureDiacriticsEXTRA = {};

// console.log("********************* PASS 3");
// for (const tr of Object.entries(transliteratesSameLengths)) {
//     const key = tr[0];
//     const val = tr[1];
//     const normal = key.normalize("NFD").
//         replace(/[\u0300-\u036f]/g, ""). // diacritics removal of accented part (retains base part)
//         replace(/[\u0653-\u0655]/g, "");
//     // if (normal === key) {
//     //     console.log("############################################\n normal is key?? ");
//     //     dumpUnicode("key", key);
//     //     dumpUnicode("val", val);
//     //     dumpUnicode("normal", normal);
//     //     console.log("####\n");
//     // }
//     if (normal === val) {
//         // console.log("###############################################\n normal is val ... moving ");
//         // dumpUnicode("key", key);
//         // dumpUnicode("val", val);
//         // dumpUnicode("normal", normal);
//         // console.log("####\n");

//         delete transliteratesSameLengths[key];
//         const isLower = /^[a-z]$/.test(val);
//         const isUpper = /^[A-Z]$/.test(val);
//         if (!isLower && !isUpper) {
//             console.log("!!!!!!!!!!!!!!!!!!!!!!! NO UPPER LOWER??!");
//             process.exit(1);
//         }
//         const map = isLower ? transliteratesPureDiacriticsLower : transliteratesPureDiacriticsUpper;
//         map[key] = val;
//     } else if (normal !== key) {
//         console.log("--------------->>>>>>>>>>>>>>>>>\n");
//         dumpUnicode("key", key);
//         dumpUnicode("val", val);
//         dumpUnicode("normal", normal);
//         console.log("####\n");
//         transliteratesPureDiacriticsEXTRA[key] = normal;
//     }
// }

// const transliteratesSameLengthsUpper = {};
// const transliteratesSameLengthsLower = {};

// console.log("********************* PASS 4");
// for (const tr of Object.entries(transliteratesSameLengths)) {
//     const key = tr[0];
//     const val = tr[1];

//     if (!val) {
//         continue;
//     }

//     const isLower = /^[a-z]$/.test(val[0]);
//     const isUpper = /^[A-Z]$/.test(val[0]);
//     const isNumber = /^[0-9]$/.test(val[0]);
//     const isSymbol = /^[_\-]$/.test(val[0]);
//     if (!isLower && !isUpper && !isNumber && !isSymbol) {
//         console.log("!!!!!!!!!!!!!!!!!!!!!!! NO UPPER LOWER NUMBER??!");
//         dumpUnicode("key", key);
//         dumpUnicode("val", val);
//         console.log("####\n");
//         process.exit(1);
//     }

//     if (isLower) {
//         delete transliteratesSameLengths[key];
//         transliteratesSameLengthsLower[key] = val;
//     } else if (isUpper) {
//         delete transliteratesSameLengths[key];
//         transliteratesSameLengthsUpper[key] = val;
//     }
// }

// const transliteratesDifferentLengthsUpper = {};
// const transliteratesDifferentLengthsLower = {};

// console.log("********************* PASS 5");
// for (const tr of Object.entries(transliteratesDifferentLengths)) {
//     const key = tr[0];
//     const val = tr[1];

//     if (!val) {
//         continue;
//     }

//     const isLower = /^[a-z]$/.test(val[0]);
//     const isUpper = /^[A-Z]$/.test(val[0]);
//     const isNumber = /^[0-9]$/.test(val[0]);
//     const isSymbol = /^[_\-]$/.test(val[0]);
//     if (!isLower && !isUpper && !isNumber && !isSymbol) {
//         console.log("!!!!!!!!!!!!!!!!!!!!!!! NO UPPER LOWER NUMBER??!");
//         dumpUnicode("key", key);
//         dumpUnicode("val", val);
//         console.log("####\n");
//         process.exit(1);
//     }

//     if (isLower) {
//         delete transliteratesDifferentLengths[key];
//         transliteratesDifferentLengthsLower[key] = val;
//     } else if (isUpper) {
//         delete transliteratesDifferentLengths[key];
//         transliteratesDifferentLengthsUpper[key] = val;
//     }
// }

// const combined = [transliteratesDifferentLengths, transliteratesDifferentLengthsLower,
// transliteratesDifferentLengthsUpper, transliteratesSameLengths, transliteratesSameLengthsLower,
// transliteratesSameLengthsUpper, transliteratesPureDiacriticsLower, transliteratesPureDiacriticsUpper];
// for (const c of combined) {
//     for (const tr of Object.entries(c)) {
//         const key = tr[0];
//         const val = tr[1];
//         if (!val) {
//             console.log("---- DELETE");
//             dumpUnicode("key", key);
//             dumpUnicode("val", val);
//             console.log("####\n");
//             delete c[key];
//             continue;
//         }
//         if (key.length !== 1) {
//             console.log("---- KEY LEN NOT ONE:");
//             dumpUnicode("key", key);
//             dumpUnicode("val", val);
//             console.log("####\n");
//             // process.exit(1);
//             continue;
//         }

//         if (!/^[a-zA-Z0-9_\-]+$/.test(val)) {
//             console.log("---- VAL INVALID??:");
//             dumpUnicode("key", key);
//             dumpUnicode("val", val);
//             console.log("####\n");
//             process.exit(1);
//             continue;
//         }
//     }
// }

// console.log("const transliteratesDifferentLengths =",
// JSON.stringify(transliteratesDifferentLengths, null, 4), "as { [str: string]: string };");
// console.log("const transliteratesDifferentLengthsLower =",
// JSON.stringify(transliteratesDifferentLengthsLower, null, 4), "as { [str: string]: string };");
// console.log("const transliteratesDifferentLengthsUpper =",
// JSON.stringify(transliteratesDifferentLengthsUpper, null, 4), "as { [str: string]: string };");

// console.log("const transliteratesSameLengths =", JSON.stringify(transliteratesSameLengths, null, 4),
// "as { [str: string]: string };");
// console.log("const transliteratesSameLengthsLower =", JSON.stringify(transliteratesSameLengthsLower, null, 4),
// "as { [str: string]: string };");
// console.log("const transliteratesSameLengthsUpper =", JSON.stringify(transliteratesSameLengthsUpper, null, 4),
// "as { [str: string]: string };");

// console.log("const transliteratesPureDiacriticsLower =", JSON.stringify(transliteratesPureDiacriticsLower, null, 4),
// "as { [str: string]: string };");
// console.log("const transliteratesPureDiacriticsUpper =", JSON.stringify(transliteratesPureDiacriticsUpper, null, 4),
// "as { [str: string]: string };");

// console.log("const transliteratesPureDiacriticsEXTRA =", JSON.stringify(transliteratesPureDiacriticsEXTRA, null, 4),
// "as { [str: string]: string };");

// tslint:disable:object-literal-key-quotes

// @ts-ignore
const transliteratesDifferentLengthsLower = {
    "ß": "ss",
    "æ": "ae",
    "þ": "th",
    "ث": "th",
    "خ": "kh",
    "ذ": "dh",
    "ش": "sh",
    "غ": "gh",
    "َ‎": "a",
    "ِ‎": "i",
    "چ": "ch",
    "ژ": "zh",
    "ۍ": "ai",
    "ж": "zh",
    "ц": "cz",
    "ч": "ch",
    "ш": "sh",
    "щ": "shh",
    "ю": "yu",
    "я": "ya",
    "ё": "yo",
    "ե": "ye",
    "ժ": "zh",
    "խ": "kh",
    "ծ": "ts",
    "ձ": "dz",
    "շ": "sh",
    "ո": "vo",
    "չ": "ch",
    "ր": "re",
    "ց": "ts",
    "ու": "u",
    "և": "yev",
    "ჟ": "zh",
    "ფ": "ph",
    "ღ": "gh",
    "შ": "sh",
    "ჩ": "ch",
    "ც": "ts",
    "ძ": "dz",
    "წ": "ts",
    "ჭ": "tch",
    "ხ": "kh",
    "ށ": "sh",
    "ޅ": "lh",
    "ދ": "dh",
    "ތ": "th",
    "ޏ": "gn",
    "ޗ": "ch",
    "ޘ": "tt",
    "ޙ": "hh",
    "ޚ": "kh",
    "ޛ": "th",
    "ޝ": "sh",
    "ޣ": "gh",
    "ާ": "aa",
    "ީ": "ee",
    "ޫ": "oo",
    "ޭ": "ey",
    "ޯ": "oa",
    "θ": "th",
    "ξ": "ks",
    "ψ": "ps",
    "ќ": "kj",
    "љ": "lj",
    "њ": "nj",
    "є": "ye",
    "ї": "yi",
    "ꜻ": "av",
    "œ": "oe",
    "ȣ": "ou",
    "ƣ": "oi",
    "ᵫ": "ue",
    "ꝸ": "um",
    "ᴔ": "oe",
    "ᴂ": "ae",
    "ᵺ": "th",
    "ꝭ": "is",
    "ƕ": "hv",
    "ǆ": "dz",
    "ꝫ": "et",
} as { [str: string]: string };
// @ts-ignore
const transliteratesDifferentLengthsUpper = {
    "Æ": "AE",
    "Þ": "TH",
    "ẞ": "SS",
    "Ж": "Zh",
    "Ц": "Cz",
    "Ч": "Ch",
    "Ш": "Sh",
    "Щ": "Shh",
    "Ю": "Yu",
    "Я": "Ya",
    "Ё": "Yo",
    "Θ": "TH",
    "Ξ": "KS",
    "Ψ": "PS",
    "Ќ": "Kj",
    "Љ": "Lj",
    "Њ": "Nj",
    "Є": "Ye",
    "Ї": "Yi",
    "Ꜻ": "AV",
    "Ǆ": "DZ",
    "Ꝫ": "ET",
    "Ꝭ": "IS",
    "Ƣ": "OI",
    "Œ": "OE",
    "ᴁ": "AE",
    "Ȣ": "OU",
    "ɶ": "OE",
    "ᴕ": "OU",
} as { [str: string]: string };
// @ts-ignore
const transliteratesSameLengths = {
    "ـ": "_",
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
    "–": "-",
    "—": "-",
    "−": "-",
    "‒": "-",
} as { [str: string]: string };
// @ts-ignore
const transliteratesSameLengthsLower = {
    "ð": "d",
    "ø": "o",
    "đ": "d",
    "ء": "e",
    "آ": "a",
    "أ": "a",
    "ؤ": "w",
    "إ": "a",
    "ئ": "y",
    "ا": "a",
    "ب": "b",
    "ة": "t",
    "ت": "t",
    "ج": "j",
    "ح": "h",
    "د": "d",
    "ر": "r",
    "ز": "z",
    "س": "s",
    "ص": "s",
    "ض": "d",
    "ط": "t",
    "ظ": "z",
    "ع": "e",
    "ف": "f",
    "ق": "q",
    "ك": "k",
    "ل": "l",
    "م": "m",
    "ن": "n",
    "ه": "h",
    "و": "w",
    "ى": "a",
    "ي": "y",
    "ُ": "u",
    "ک": "k",
    "گ": "g",
    "پ": "p",
    "ی": "y",
    "ټ": "p",
    "ځ": "z",
    "څ": "c",
    "ډ": "d",
    "ﺫ": "d",
    "ﺭ": "r",
    "ړ": "r",
    "ﺯ": "z",
    "ږ": "g",
    "ښ": "x",
    "ګ": "g",
    "ڼ": "n",
    "ۀ": "e",
    "ې": "e",
    "ٹ": "t",
    "ڈ": "d",
    "ڑ": "r",
    "ں": "n",
    "ہ": "h",
    "ھ": "h",
    "ے": "e",
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "з": "z",
    "и": "i",
    "й": "j",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ы": "y",
    "э": "e",
    "ı": "i",
    "ա": "a",
    "բ": "b",
    "գ": "g",
    "դ": "d",
    "զ": "z",
    "է": "e",
    "ը": "u",
    "թ": "t",
    "ի": "i",
    "լ": "l",
    "կ": "k",
    "հ": "h",
    "ղ": "r",
    "ճ": "j",
    "մ": "m",
    "յ": "j",
    "ն": "n",
    "պ": "p",
    "ջ": "j",
    "ռ": "r",
    "ս": "s",
    "վ": "v",
    "տ": "t",
    "ւ": "v",
    "փ": "p",
    "ք": "q",
    "օ": "o",
    "ֆ": "f",
    "ა": "a",
    "ბ": "b",
    "გ": "g",
    "დ": "d",
    "ე": "e",
    "ვ": "v",
    "ზ": "z",
    "თ": "t",
    "ი": "i",
    "კ": "k",
    "ლ": "l",
    "მ": "m",
    "ნ": "n",
    "ო": "o",
    "პ": "p",
    "რ": "r",
    "ს": "s",
    "ტ": "t",
    "უ": "u",
    "ქ": "q",
    "ყ": "k",
    "ჯ": "j",
    "ჰ": "h",
    "ހ": "h",
    "ނ": "n",
    "ރ": "r",
    "ބ": "b",
    "ކ": "k",
    "އ": "a",
    "ވ": "v",
    "މ": "m",
    "ފ": "f",
    "ލ": "l",
    "ގ": "g",
    "ސ": "s",
    "ޑ": "d",
    "ޒ": "z",
    "ޓ": "t",
    "ޔ": "y",
    "ޕ": "p",
    "ޖ": "j",
    "ޜ": "z",
    "ޞ": "s",
    "ޟ": "d",
    "ޠ": "t",
    "ޡ": "z",
    "ޢ": "a",
    "ޤ": "q",
    "ޥ": "w",
    "ަ": "a",
    "ި": "i",
    "ު": "u",
    "ެ": "e",
    "ޮ": "o",
    "α": "a",
    "β": "v",
    "γ": "g",
    "δ": "d",
    "ε": "e",
    "ζ": "z",
    "η": "i",
    "ι": "i",
    "κ": "k",
    "λ": "l",
    "μ": "m",
    "ν": "n",
    "ο": "o",
    "π": "p",
    "ρ": "r",
    "σ": "s",
    "τ": "t",
    "υ": "y",
    "φ": "f",
    "χ": "x",
    "ω": "o",
    "ά": "a",
    "έ": "e",
    "ί": "i",
    "ό": "o",
    "ύ": "y",
    "ή": "i",
    "ώ": "o",
    "ς": "s",
    "ϊ": "i",
    "ΰ": "y",
    "ϋ": "y",
    "ΐ": "i",
    "тс": "ts",
    "ł": "l",
    "і": "i",
    "ґ": "g",
    "ё": "e",
    "ќ": "k",
    "ї": "i",
    "ᶏ": "a",
    "ẚ": "a",
    "ⱥ": "a",
    "ɓ": "b",
    "ᵬ": "b",
    "ᶀ": "b",
    "ƀ": "b",
    "ƃ": "b",
    "ɵ": "o",
    "ɕ": "c",
    "ƈ": "c",
    "ȼ": "c",
    "ȡ": "d",
    "ɗ": "d",
    "ᶑ": "d",
    "ᵭ": "d",
    "ᶁ": "d",
    "ɖ": "d",
    "ƌ": "d",
    "ȷ": "j",
    "ɟ": "j",
    "ʄ": "j",
    "ⱸ": "e",
    "ᶒ": "e",
    "ɇ": "e",
    "ƒ": "f",
    "ᵮ": "f",
    "ᶂ": "f",
    "ɠ": "g",
    "ᶃ": "g",
    "ǥ": "g",
    "ⱨ": "h",
    "ɦ": "h",
    "ħ": "h",
    "ᶖ": "i",
    "ɨ": "i",
    "ꝺ": "d",
    "ꝼ": "f",
    "ᵹ": "g",
    "ꞃ": "r",
    "ꞅ": "s",
    "ꞇ": "t",
    "ʝ": "j",
    "ɉ": "j",
    "ⱪ": "k",
    "ꝃ": "k",
    "ƙ": "k",
    "ᶄ": "k",
    "ꝁ": "k",
    "ꝅ": "k",
    "ƚ": "l",
    "ɬ": "l",
    "ȴ": "l",
    "ⱡ": "l",
    "ꝉ": "l",
    "ŀ": "l",
    "ɫ": "l",
    "ᶅ": "l",
    "ɭ": "l",
    "ſ": "s",
    "ẜ": "s",
    "ẝ": "s",
    "ɱ": "m",
    "ᵯ": "m",
    "ᶆ": "m",
    "ȵ": "n",
    "ɲ": "n",
    "ƞ": "n",
    "ᵰ": "n",
    "ᶇ": "n",
    "ɳ": "n",
    "ꝋ": "o",
    "ꝍ": "o",
    "ⱺ": "o",
    "ɛ": "e",
    "ᶓ": "e",
    "ɔ": "o",
    "ᶗ": "o",
    "ꝓ": "p",
    "ƥ": "p",
    "ᵱ": "p",
    "ᶈ": "p",
    "ꝕ": "p",
    "ᵽ": "p",
    "ꝑ": "p",
    "ꝙ": "q",
    "ʠ": "q",
    "ɋ": "q",
    "ꝗ": "q",
    "ɾ": "r",
    "ᵳ": "r",
    "ɼ": "r",
    "ᵲ": "r",
    "ᶉ": "r",
    "ɍ": "r",
    "ɽ": "r",
    "ↄ": "c",
    "ꜿ": "c",
    "ɘ": "e",
    "ɿ": "r",
    "ʂ": "s",
    "ᵴ": "s",
    "ᶊ": "s",
    "ȿ": "s",
    "ɡ": "g",
    "ᴑ": "o",
    "ᴓ": "o",
    "ᴝ": "u",
    "ȶ": "t",
    "ⱦ": "t",
    "ƭ": "t",
    "ᵵ": "t",
    "ƫ": "t",
    "ʈ": "t",
    "ŧ": "t",
    "ɐ": "a",
    "ǝ": "e",
    "ᵷ": "g",
    "ɥ": "h",
    "ʮ": "h",
    "ʯ": "h",
    "ᴉ": "i",
    "ʞ": "k",
    "ꞁ": "l",
    "ɯ": "m",
    "ɰ": "m",
    "ɹ": "r",
    "ɻ": "r",
    "ɺ": "r",
    "ⱹ": "r",
    "ʇ": "t",
    "ʌ": "v",
    "ʍ": "w",
    "ʎ": "y",
    "ᶙ": "u",
    "ⱴ": "v",
    "ꝟ": "v",
    "ʋ": "v",
    "ᶌ": "v",
    "ⱱ": "v",
    "ⱳ": "w",
    "ᶍ": "x",
    "ƴ": "y",
    "ỿ": "y",
    "ɏ": "y",
    "ʑ": "z",
    "ⱬ": "z",
    "ȥ": "z",
    "ᵶ": "z",
    "ᶎ": "z",
    "ʐ": "z",
    "ƶ": "z",
    "ɀ": "z",
    "ₓ": "x",
} as { [str: string]: string };
// @ts-ignore
const transliteratesSameLengthsUpper = {
    "Ð": "D",
    "Ø": "O",
    "Đ": "D",
    "А": "A",
    "Б": "B",
    "В": "V",
    "Г": "G",
    "Д": "D",
    "Е": "E",
    "З": "Z",
    "И": "I",
    "Й": "J",
    "К": "K",
    "Л": "L",
    "М": "M",
    "Н": "N",
    "О": "O",
    "П": "P",
    "Р": "R",
    "С": "S",
    "Т": "T",
    "У": "U",
    "Ф": "F",
    "Х": "H",
    "Ы": "Y",
    "Э": "E",
    "Α": "A",
    "Β": "B",
    "Γ": "G",
    "Δ": "D",
    "Ε": "E",
    "Ζ": "Z",
    "Η": "I",
    "Ι": "I",
    "Κ": "K",
    "Λ": "L",
    "Μ": "M",
    "Ν": "N",
    "Ο": "O",
    "Π": "P",
    "Ρ": "R",
    "Σ": "S",
    "Τ": "T",
    "Υ": "Y",
    "Φ": "F",
    "Χ": "X",
    "Ω": "O",
    "Ά": "A",
    "Έ": "E",
    "Ί": "I",
    "Ό": "O",
    "Ύ": "Y",
    "Ή": "I",
    "Ώ": "O",
    "Ϊ": "I",
    "Ϋ": "Y",
    "Тс": "Ts",
    "Ł": "L",
    "І": "I",
    "Ґ": "G",
    "Ё": "E",
    "Ќ": "K",
    "Ї": "I",
    "€": "E",
    "Ⱥ": "A",
    "Ɓ": "B",
    "Ƀ": "B",
    "Ƃ": "B",
    "Ƈ": "C",
    "Ȼ": "C",
    "Ɗ": "D",
    "ǲ": "D",
    "ǅ": "D",
    "Ƌ": "D",
    "Ɇ": "E",
    "Ƒ": "F",
    "Ɠ": "G",
    "Ǥ": "G",
    "Ⱨ": "H",
    "Ħ": "H",
    "Ɨ": "I",
    "Ꝺ": "D",
    "Ꝼ": "F",
    "Ᵹ": "G",
    "Ꞃ": "R",
    "Ꞅ": "S",
    "Ꞇ": "T",
    "Ɉ": "J",
    "Ⱪ": "K",
    "Ꝃ": "K",
    "Ƙ": "K",
    "Ꝁ": "K",
    "Ꝅ": "K",
    "Ƚ": "L",
    "Ⱡ": "L",
    "Ꝉ": "L",
    "Ŀ": "L",
    "Ɫ": "L",
    "ǈ": "L",
    "Ɱ": "M",
    "Ɲ": "N",
    "Ƞ": "N",
    "ǋ": "N",
    "Ꝋ": "O",
    "Ꝍ": "O",
    "Ɵ": "O",
    "Ɛ": "E",
    "Ɔ": "O",
    "Ꝓ": "P",
    "Ƥ": "P",
    "Ꝕ": "P",
    "Ᵽ": "P",
    "Ꝑ": "P",
    "Ꝙ": "Q",
    "Ꝗ": "Q",
    "Ɍ": "R",
    "Ɽ": "R",
    "Ꜿ": "C",
    "Ǝ": "E",
    "Ⱦ": "T",
    "Ƭ": "T",
    "Ʈ": "T",
    "Ŧ": "T",
    "Ɐ": "A",
    "Ꞁ": "L",
    "Ɯ": "M",
    "Ʌ": "V",
    "Ꝟ": "V",
    "Ʋ": "V",
    "Ⱳ": "W",
    "Ƴ": "Y",
    "Ỿ": "Y",
    "Ɏ": "Y",
    "Ⱬ": "Z",
    "Ȥ": "Z",
    "Ƶ": "Z",
    "ᴀ": "A",
    "ʙ": "B",
    "ᴃ": "B",
    "ᴄ": "C",
    "ᴅ": "D",
    "ᴇ": "E",
    "ꜰ": "F",
    "ɢ": "G",
    "ʛ": "G",
    "ʜ": "H",
    "ɪ": "I",
    "ʁ": "R",
    "ᴊ": "J",
    "ᴋ": "K",
    "ʟ": "L",
    "ᴌ": "L",
    "ᴍ": "M",
    "ɴ": "N",
    "ᴏ": "O",
    "ᴐ": "O",
    "ᴘ": "P",
    "ʀ": "R",
    "ᴎ": "N",
    "ᴙ": "R",
    "ꜱ": "S",
    "ᴛ": "T",
    "ⱻ": "E",
    "ᴚ": "R",
    "ᴜ": "U",
    "ᴠ": "V",
    "ᴡ": "W",
    "ʏ": "Y",
    "ᴢ": "Z",
} as { [str: string]: string };
// @ts-ignore
const transliteratesPureDiacriticsLower = {
    "à": "a",
    "á": "a",
    "â": "a",
    "ã": "a",
    "å": "a",
    "ç": "c",
    "è": "e",
    "é": "e",
    "ê": "e",
    "ë": "e",
    "ì": "i",
    "í": "i",
    "î": "i",
    "ï": "i",
    "ñ": "n",
    "ò": "o",
    "ó": "o",
    "ô": "o",
    "õ": "o",
    "ő": "o",
    "ù": "u",
    "ú": "u",
    "û": "u",
    "ű": "u",
    "ý": "y",
    "ÿ": "y",
    "ă": "a",
    "ĩ": "i",
    "ũ": "u",
    "ơ": "o",
    "ư": "u",
    "ạ": "a",
    "ả": "a",
    "ấ": "a",
    "ầ": "a",
    "ẩ": "a",
    "ẫ": "a",
    "ậ": "a",
    "ắ": "a",
    "ằ": "a",
    "ẳ": "a",
    "ẵ": "a",
    "ặ": "a",
    "ẹ": "e",
    "ẻ": "e",
    "ẽ": "e",
    "ế": "e",
    "ề": "e",
    "ể": "e",
    "ễ": "e",
    "ệ": "e",
    "ỉ": "i",
    "ị": "i",
    "ọ": "o",
    "ỏ": "o",
    "ố": "o",
    "ồ": "o",
    "ổ": "o",
    "ỗ": "o",
    "ộ": "o",
    "ớ": "o",
    "ờ": "o",
    "ở": "o",
    "ỡ": "o",
    "ợ": "o",
    "ụ": "u",
    "ủ": "u",
    "ứ": "u",
    "ừ": "u",
    "ử": "u",
    "ữ": "u",
    "ự": "u",
    "ỳ": "y",
    "ỵ": "y",
    "ỷ": "y",
    "ỹ": "y",
    "ș": "s",
    "ț": "t",
    "ţ": "t",
    "ş": "s",
    "ğ": "g",
    "č": "c",
    "ď": "d",
    "ě": "e",
    "ň": "n",
    "ř": "r",
    "š": "s",
    "ť": "t",
    "ů": "u",
    "ž": "z",
    "ā": "a",
    "ē": "e",
    "ģ": "g",
    "ī": "i",
    "ķ": "k",
    "ļ": "l",
    "ņ": "n",
    "ū": "u",
    "ą": "a",
    "ę": "e",
    "ė": "e",
    "į": "i",
    "ų": "u",
    "ć": "c",
    "ń": "n",
    "ś": "s",
    "ź": "z",
    "ż": "z",
    "ä": "a",
    "ö": "o",
    "ü": "u",
} as { [str: string]: string };
// @ts-ignore
const transliteratesPureDiacriticsUpper = {
    "À": "A",
    "Á": "A",
    "Â": "A",
    "Ã": "A",
    "Å": "A",
    "Ç": "C",
    "È": "E",
    "É": "E",
    "Ê": "E",
    "Ë": "E",
    "Ì": "I",
    "Í": "I",
    "Î": "I",
    "Ï": "I",
    "Ñ": "N",
    "Ò": "O",
    "Ó": "O",
    "Ô": "O",
    "Õ": "O",
    "Ő": "O",
    "Ù": "U",
    "Ú": "U",
    "Û": "U",
    "Ű": "U",
    "Ý": "Y",
    "Ă": "A",
    "Ĩ": "I",
    "Ũ": "U",
    "Ơ": "O",
    "Ư": "U",
    "Ạ": "A",
    "Ả": "A",
    "Ấ": "A",
    "Ầ": "A",
    "Ẩ": "A",
    "Ẫ": "A",
    "Ậ": "A",
    "Ắ": "A",
    "Ằ": "A",
    "Ẳ": "A",
    "Ẵ": "A",
    "Ặ": "A",
    "Ẹ": "E",
    "Ẻ": "E",
    "Ẽ": "E",
    "Ế": "E",
    "Ề": "E",
    "Ể": "E",
    "Ễ": "E",
    "Ệ": "E",
    "Ỉ": "I",
    "Ị": "I",
    "Ọ": "O",
    "Ỏ": "O",
    "Ố": "O",
    "Ồ": "O",
    "Ổ": "O",
    "Ỗ": "O",
    "Ộ": "O",
    "Ớ": "O",
    "Ờ": "O",
    "Ở": "O",
    "Ỡ": "O",
    "Ợ": "O",
    "Ụ": "U",
    "Ủ": "U",
    "Ứ": "U",
    "Ừ": "U",
    "Ử": "U",
    "Ữ": "U",
    "Ự": "U",
    "Ỳ": "Y",
    "Ỵ": "Y",
    "Ỷ": "Y",
    "Ỹ": "Y",
    "Ș": "S",
    "Ț": "T",
    "Ţ": "T",
    "Ş": "S",
    "Ğ": "G",
    "İ": "I",
    "Č": "C",
    "Ď": "D",
    "Ě": "E",
    "Ň": "N",
    "Ř": "R",
    "Š": "S",
    "Ť": "T",
    "Ů": "U",
    "Ž": "Z",
    "Ā": "A",
    "Ē": "E",
    "Ģ": "G",
    "Ī": "I",
    "Ķ": "K",
    "Ļ": "L",
    "Ņ": "N",
    "Ū": "U",
    "Ą": "A",
    "Ę": "E",
    "Ė": "E",
    "Į": "I",
    "Ų": "U",
    "Ć": "C",
    "Ń": "N",
    "Ś": "S",
    "Ź": "Z",
    "Ż": "Z",
    "Ä": "A",
    "Ö": "O",
    "Ü": "U",
} as { [str: string]: string };
// @ts-ignore
const transliteratesPureDiacriticsEXTRA = {
    "آ": "ا",
    "أ": "ا",
    "ؤ": "و",
    "إ": "ا",
    "ئ": "ي",
    "ۀ": "ە",
    "Й": "И",
    "й": "и",
    "ά": "α",
    "έ": "ε",
    "ί": "ι",
    "ό": "ο",
    "ύ": "υ",
    "ή": "η",
    "ώ": "ω",
    "ϊ": "ι",
    "ΰ": "υ",
    "ϋ": "υ",
    "ΐ": "ι",
    "Ά": "Α",
    "Έ": "Ε",
    "Ί": "Ι",
    "Ό": "Ο",
    "Ύ": "Υ",
    "Ή": "Η",
    "Ώ": "Ω",
    "Ϊ": "Ι",
    "Ϋ": "Υ",
    "Ё": "Е",
    "ё": "е",
    "Ќ": "К",
    "ќ": "к",
    "Ї": "І",
    "ї": "і",
} as { [str: string]: string };

// const normalizeDiacriticsAndLigatures = (s: string) => {
//     // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
//     return s.normalize("NFD").
//         replace(/[\u0300-\u036f]/g, "").
//         replace(/[^\u0000-\u007E]/g, (c) => transliteratesSameLengths[c] || c);
// };
// const normalizeString = (s: string) => {
//     return collapseWhitespaces(normalizeDiacriticsAndLigatures(s));
// };
const collapseWhitespaces = (str: string) => {
    return str.replace(/\n/g, " ").replace(/\s\s+/g, " ");
};
const cleanupStr = (str: string) => {
    return collapseWhitespaces(str).trim();
};
// import {
//     convertCustomSchemeToHttpUrl, READIUM2_ELECTRON_HTTP_PROTOCOL,
// } from "@r2-navigator-js/electron/common/sessions";

// import { registerProtocol } from "@r2-navigator-js/electron/renderer/common/protocol";
// registerProtocol();
// import { webFrame } from "electron";
// webFrame.registerURLSchemeAsSecure(READIUM2_ELECTRON_HTTP_PROTOCOL);
// webFrame.registerURLSchemeAsPrivileged(READIUM2_ELECTRON_HTTP_PROTOCOL, {
//     allowServiceWorkers: false,
//     bypassCSP: false,
//     corsEnabled: true,
//     secure: true,
//     supportFetchAPI: true,
// });

// const queryParams = getURLQueryParams();
// const lcpHint = queryParams.lcpHint;
// pub is undefined when loaded in dependency injection by library webview.
// Dependency injection is shared between all the renderer view
// const publicationJsonUrl = queryParams.pub?.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL)
//     ? convertCustomSchemeToHttpUrl(queryParams.pub)
//     : queryParams.pub;

// const pathBase64Raw = publicationJsonUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
// const pathBase64 = decodeURIComponent(pathBase64Raw);
// const pathDecoded = window.atob(pathBase64);
// const pathFileName = pathDecoded.substr(
//     pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1,
//     pathDecoded.length - 1);

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    r2PublicationHasMediaOverlays: boolean;

    contentTableOpen: boolean;
    settingsOpen: boolean;
    shortcutEnable: boolean;
    landmarksOpen: boolean;
    landmarkTabOpen: number;
    menuOpen: boolean;
    fullscreen: boolean;

    ttsState: TTSStateEnum;
    ttsPlaybackRate: string;
    mediaOverlaysState: MediaOverlaysStateEnum;
    mediaOverlaysPlaybackRate: string;

    visibleBookmarkList: LocatorView[];
    currentLocation: LocatorExtended;
    bookmarks: LocatorView[] | undefined;

    readerMode: ReaderMode;
}

// import { debounce } from "debounce";
// const handleTTSPlayRaw = (that: Reader) => {
//     that.handleTTSPlay_();
// };
// const handleTTSPlayDebounced = debounce(handleTTSPlayRaw, 500);

class Reader extends React.Component<IProps, IState> {

    private searchRef: React.RefObject<HTMLDivElement>;
    private inputRef: React.RefObject<HTMLInputElement>;
    private fastLinkRef: React.RefObject<HTMLAnchorElement>;
    private refToolbar: React.RefObject<HTMLAnchorElement>;

    // can be get back with withTranslator HOC
    // to remove
    // @lazyInject(diRendererSymbolTable.translator)
    // private translator: Translator;

    private unsubscribe: Unsubscribe;

    private ttsOverlayEnableNeedsSync: boolean;

    private pendingHighlights: {
        href: string,
        data: IHighlightDefinition[],
    } = undefined;
    private searchCache: {
        [url: string]: {
            source: string,
            // document: Document,
            // charLength: number,
        },
    } = {};

    constructor(props: IProps) {
        super(props);

        this.ttsOverlayEnableNeedsSync = true;

        this.onKeyboardPageNavigationPrevious = this.onKeyboardPageNavigationPrevious.bind(this);
        this.onKeyboardPageNavigationNext = this.onKeyboardPageNavigationNext.bind(this);
        this.onKeyboardSpineNavigationPrevious = this.onKeyboardSpineNavigationPrevious.bind(this);
        this.onKeyboardSpineNavigationNext = this.onKeyboardSpineNavigationNext.bind(this);
        this.onKeyboardFocusMain = this.onKeyboardFocusMain.bind(this);
        this.onKeyboardFocusToolbar = this.onKeyboardFocusToolbar.bind(this);
        this.onKeyboardFullScreen = this.onKeyboardFullScreen.bind(this);
        this.onKeyboardBookmark = this.onKeyboardBookmark.bind(this);
        this.onKeyboardInfo = this.onKeyboardInfo.bind(this);
        this.onKeyboardFocusSettings = this.onKeyboardFocusSettings.bind(this);
        this.onKeyboardFocusNav = this.onKeyboardFocusNav.bind(this);

        this.searchRef = React.createRef<HTMLDivElement>();
        this.inputRef = React.createRef<HTMLInputElement>();
        this.fastLinkRef = React.createRef<HTMLAnchorElement>();
        this.refToolbar = React.createRef<HTMLAnchorElement>();

        this.state = {
            contentTableOpen: false,
            settingsOpen: false,
            shortcutEnable: true,
            landmarksOpen: false,
            landmarkTabOpen: 0,

            r2PublicationHasMediaOverlays: false,

            menuOpen: false,
            fullscreen: false,

            ttsState: TTSStateEnum.STOPPED,
            ttsPlaybackRate: "1",
            mediaOverlaysState: MediaOverlaysStateEnum.STOPPED,
            mediaOverlaysPlaybackRate: "1",

            visibleBookmarkList: [],
            currentLocation: undefined,
            bookmarks: undefined,

            readerMode: ReaderMode.Attached,
        };

        ttsListen((ttss: TTSStateEnum) => {
            this.setState({ttsState: ttss});
        });
        mediaOverlaysListen((mos: MediaOverlaysStateEnum) => {
            this.setState({mediaOverlaysState: mos});
        });

        this.handleTTSPlay = this.handleTTSPlay.bind(this);
        this.handleTTSPause = this.handleTTSPause.bind(this);
        this.handleTTSStop = this.handleTTSStop.bind(this);
        this.handleTTSResume = this.handleTTSResume.bind(this);
        this.handleTTSPrevious = this.handleTTSPrevious.bind(this);
        this.handleTTSNext = this.handleTTSNext.bind(this);
        this.handleTTSPlaybackRate = this.handleTTSPlaybackRate.bind(this);

        this.handleMediaOverlaysPlay = this.handleMediaOverlaysPlay.bind(this);
        this.handleMediaOverlaysPause = this.handleMediaOverlaysPause.bind(this);
        this.handleMediaOverlaysStop = this.handleMediaOverlaysStop.bind(this);
        this.handleMediaOverlaysResume = this.handleMediaOverlaysResume.bind(this);
        this.handleMediaOverlaysPrevious = this.handleMediaOverlaysPrevious.bind(this);
        this.handleMediaOverlaysNext = this.handleMediaOverlaysNext.bind(this);
        this.handleMediaOverlaysPlaybackRate = this.handleMediaOverlaysPlaybackRate.bind(this);

        this.handleMenuButtonClick = this.handleMenuButtonClick.bind(this);
        this.handleSettingsClick = this.handleSettingsClick.bind(this);
        this.handleFullscreenClick = this.handleFullscreenClick.bind(this);
        this.handleReaderClose = this.handleReaderClose.bind(this);
        this.handleReaderDetach = this.handleReaderDetach.bind(this);
        this.setSettings = this.setSettings.bind(this);
        this.handleReadingLocationChange = this.handleReadingLocationChange.bind(this);
        this.handleToggleBookmark = this.handleToggleBookmark.bind(this);
        this.goToLocator = this.goToLocator.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
        this.findBookmarks = this.findBookmarks.bind(this);
        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);

    }

    public async componentDidMount() {
        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();

        setKeyDownEventHandler(keyDownEventHandler);
        setKeyUpEventHandler(keyUpEventHandler);

        // TODO: this is a short-term hack.
        // Can we instead subscribe to Redux action type == CloseRequest,
        // but narrow it down specically to a reader window instance (not application-wide)
        window.document.addEventListener("Thorium:DialogClose", (_ev: Event) => {
            this.setState({
                shortcutEnable: true,
            });
        });

        setReadingLocationSaver(this.handleReadingLocationChange);

        setEpubReadingSystemInfo({ name: _APP_NAME, version: _APP_VERSION });

        this.unsubscribe = apiSubscribe([
            "reader/deleteBookmark",
            "reader/addBookmark",
        ], this.findBookmarks);

        await this.loadPublicationIntoViewport();

        this.getReaderMode();
    }

    public async componentDidUpdate(oldProps: IProps, oldState: IState) {
        if (oldState.bookmarks !== this.state.bookmarks) {
            await this.checkBookmarks();
        }
        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            console.log("READER RELOAD KEYBOARD SHORTCUTS");
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
    }

    public componentWillUnmount() {
        this.unregisterAllKeyboardListeners();

        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public render(): React.ReactElement<{}> {

        const readerMenuProps: IReaderMenuProps = {
            open: this.state.menuOpen,
            r2Publication: this.props.r2Publication,
            handleLinkClick: this.handleLinkClick,
            handleBookmarkClick: this.goToLocator,
            toggleMenu: this.handleMenuButtonClick,
        };

        const readerOptionsProps: IReaderOptionsProps = {
            open: this.state.settingsOpen,
            indexes: this.props.indexes,
            readerConfig: this.props.readerConfig,
            handleSettingChange: this.handleSettingChange.bind(this),
            handleIndexChange: this.handleIndexChange.bind(this),
            setSettings: this.setSettings,
            toggleMenu: this.handleSettingsClick,
            r2Publication: this.props.r2Publication,
        };

        return (
            <div className={classNames(
                    this.props.readerConfig.night && styles.nightMode,
                    this.props.readerConfig.sepia && styles.sepiaMode,
                )}
                role="region" aria-label={this.props.__("accessibility.toolbar")}>
                <a
                    role="region"
                    className={styles.anchor_link}
                    ref={this.refToolbar}
                    id="main-toolbar"
                    title={this.props.__("accessibility.toolbar")}
                    aria-label={this.props.__("accessibility.toolbar")}
                    tabIndex={-1}>{this.props.__("accessibility.toolbar")}</a>
                <SkipLink
                    className={styles.skip_link}
                    anchorId="main-content"
                    label={this.props.__("accessibility.skipLink")}
                />
                <div className={styles.root}>
                    <ReaderHeader
                        infoOpen={this.props.infoOpen}
                        menuOpen={this.state.menuOpen}
                        settingsOpen={this.state.settingsOpen}

                        handleTTSPlay={this.handleTTSPlay}
                        handleTTSResume={this.handleTTSResume}
                        handleTTSStop={this.handleTTSStop}
                        handleTTSPrevious={this.handleTTSPrevious}
                        handleTTSNext={this.handleTTSNext}
                        handleTTSPause={this.handleTTSPause}
                        handleTTSPlaybackRate={this.handleTTSPlaybackRate}
                        ttsState={this.state.ttsState}
                        ttsPlaybackRate={this.state.ttsPlaybackRate}

                        handleMediaOverlaysPlay={this.handleMediaOverlaysPlay}
                        handleMediaOverlaysResume={this.handleMediaOverlaysResume}
                        handleMediaOverlaysStop={this.handleMediaOverlaysStop}
                        handleMediaOverlaysPrevious={this.handleMediaOverlaysPrevious}
                        handleMediaOverlaysNext={this.handleMediaOverlaysNext}
                        handleMediaOverlaysPause={this.handleMediaOverlaysPause}
                        handleMediaOverlaysPlaybackRate={this.handleMediaOverlaysPlaybackRate}
                        mediaOverlaysState={this.state.mediaOverlaysState}
                        mediaOverlaysPlaybackRate={this.state.mediaOverlaysPlaybackRate}
                        publicationHasMediaOverlays={this.state.r2PublicationHasMediaOverlays}

                        handleMenuClick={this.handleMenuButtonClick}
                        handleSettingsClick={this.handleSettingsClick}
                        fullscreen={this.state.fullscreen}
                        mode={this.state.readerMode}
                        handleFullscreenClick={this.handleFullscreenClick}
                        handleReaderDetach={this.handleReaderDetach}
                        handleReaderClose={this.handleReaderClose}
                        toggleBookmark={ async () => { await this.handleToggleBookmark(false); } }
                        isOnBookmark={this.state.visibleBookmarkList.length > 0}
                        readerOptionsProps={readerOptionsProps}
                        readerMenuProps={readerMenuProps}
                        displayPublicationInfo={this.displayPublicationInfo}
                        currentLocation={this.state.currentLocation}
                    />
                    <div className={classNames(styles.content_root,
                            this.state.fullscreen ? styles.content_root_fullscreen : undefined)}>
                        <div className={styles.reader}>
                            <main
                                id="main"
                                role="main"
                                aria-label={this.props.__("accessibility.mainContent")}
                                className={styles.publication_viewport_container}>
                                <a
                                    role="region"
                                    className={styles.anchor_link}
                                    ref={this.fastLinkRef}
                                    id="main-content"
                                    title={this.props.__("accessibility.mainContent")}
                                    aria-label={this.props.__("accessibility.mainContent")}
                                    tabIndex={-1}>{this.props.__("accessibility.mainContent")}</a>

                                <div style={{
                                    position: "absolute",
                                    display: "block",
                                    boxSizing: "border-box",
                                    padding: "3px",
                                    margin: "0",
                                    height: "auto",
                                    maxHeight: "99%",
                                    left: "3px",
                                    right: "3px",
                                    top: "0px",
                                    border: "2px solid green",
                                    background: "rgba(255,255,255,0.5)",
                                    color: "black",
                                    zIndex: 99999,
                                    overflowY: "auto",
                                    overflowX: "hidden",
                                }}
                                ref={this.searchRef}>
                                    <form
                                        onSubmit={this.submitSearch}
                                        role="search"
                                    >
                                        <input
                                            onFocus={() => {
                                                const div = document.getElementById("SEARCH_RESULTS_LIST");
                                                if (div) {
                                                    div.style.display = "block";
                                                }
                                            }}
                                            style={{
                                                display: "inline-block",
                                                boxSizing: "border-box",
                                                padding: "2px",
                                                margin: "0",
                                                border: "1px solid magenta",
                                                background: "white",
                                                color: "blue",
                                                width: "200px",
                                            }}
                                            ref={this.inputRef}
                                            type="search"
                                            aria-label={this.props.__("accessibility.searchBook")}
                                            placeholder={this.props.__("header.searchPlaceholder")}
                                        />
                                        <button
                                            style={{
                                                display: "inline-block",
                                                boxSizing: "border-box",
                                                padding: "3px",
                                                marginLeft: "3px",
                                                border: "1px solid red",
                                                background: "white",
                                                color: "blue",
                                                width: "160px",
                                            }}>
                                            {this.props.__("header.searchTitle")}
                                        </button>
                                    </form>
                                </div>
                                <div id="publication_viewport" className={styles.publication_viewport}> </div>
                            </main>
                        </div>
                    </div>
                </div>
                <ReaderFooter
                    navLeftOrRight={this.navLeftOrRight_.bind(this)}
                    fullscreen={this.state.fullscreen}
                    currentLocation={this.state.currentLocation}
                    r2Publication={this.props.r2Publication}
                    handleLinkClick={this.handleLinkClick}
                    goToLocator={this.goToLocator}
                />
            </div>
        );
    }

    public setTTSState(ttss: TTSStateEnum) {
        this.setState({ttsState : ttss});
    }
    public setMediaOverlaysState(mos: MediaOverlaysStateEnum) {
        this.setState({mediaOverlaysState : mos});
    }

    public handleTTSPlay_() {
        this.handleTTSPlay();
    }

    private submitSearch = async (e: TFormEvent) => {
        e.preventDefault();
        if (!this.inputRef?.current) {
            return;
        }
        let txt = this.inputRef.current.value;
        if (!txt) {
            return;
        }
        txt = txt.trim();
        if (!txt) {
            return;
        }
        await this.search(txt);
    }

    private registerAllKeyboardListeners() {

        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.NavigatePreviousPage,
            this.onKeyboardPageNavigationPrevious);
        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.NavigateNextPage,
            this.onKeyboardPageNavigationNext);

        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.NavigatePreviousPageAlt,
            this.onKeyboardPageNavigationPrevious);
        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.NavigateNextPageAlt,
            this.onKeyboardPageNavigationNext);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.NavigatePreviousChapter,
            this.onKeyboardSpineNavigationPrevious);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.NavigateNextChapter,
            this.onKeyboardSpineNavigationNext);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.NavigatePreviousChapterAlt,
            this.onKeyboardSpineNavigationPrevious);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.NavigateNextChapterAlt,
            this.onKeyboardSpineNavigationNext);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusMain,
            this.onKeyboardFocusMain);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusToolbar,
            this.onKeyboardFocusToolbar);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.ToggleReaderFullscreen,
            this.onKeyboardFullScreen);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.ToggleBookmark,
            this.onKeyboardBookmark);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.OpenReaderInfo,
            this.onKeyboardInfo);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusReaderSettings,
            this.onKeyboardFocusSettings);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusReaderNavigation,
            this.onKeyboardFocusNav);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.CloseReader,
            this.onKeyboardCloseReader);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.AudioPlayPause,
            this.onKeyboardAudioPlayPause);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.AudioPrevious,
            this.onKeyboardAudioPrevious);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.AudioNext,
            this.onKeyboardAudioNext);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.AudioStop,
            this.onKeyboardAudioStop);
    }

    private unregisterAllKeyboardListeners() {
        unregisterKeyboardListener(this.onKeyboardPageNavigationPrevious);
        unregisterKeyboardListener(this.onKeyboardPageNavigationNext);
        unregisterKeyboardListener(this.onKeyboardSpineNavigationPrevious);
        unregisterKeyboardListener(this.onKeyboardSpineNavigationNext);
        unregisterKeyboardListener(this.onKeyboardFocusMain);
        unregisterKeyboardListener(this.onKeyboardFocusToolbar);
        unregisterKeyboardListener(this.onKeyboardFullScreen);
        unregisterKeyboardListener(this.onKeyboardBookmark);
        unregisterKeyboardListener(this.onKeyboardInfo);
        unregisterKeyboardListener(this.onKeyboardFocusSettings);
        unregisterKeyboardListener(this.onKeyboardFocusNav);
        unregisterKeyboardListener(this.onKeyboardCloseReader);
        unregisterKeyboardListener(this.onKeyboardAudioPlayPause);
        unregisterKeyboardListener(this.onKeyboardAudioPrevious);
        unregisterKeyboardListener(this.onKeyboardAudioNext);
        unregisterKeyboardListener(this.onKeyboardAudioStop);
    }

    private onKeyboardAudioStop = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardAudioPlayPause)");
            }
            return;
        }

        if (!this.state.currentLocation) {
            return;
        }

        if (this.state.r2PublicationHasMediaOverlays) {
            if (this.state.mediaOverlaysState !== MediaOverlaysStateEnum.STOPPED) {
                this.handleMediaOverlaysStop();
            }
        } else if (this.state.currentLocation.audioPlaybackInfo) {
            audioPause();
        } else {
            if (this.state.ttsState !== TTSStateEnum.STOPPED) {
                this.handleTTSStop();
            }
        }
    }

    private onKeyboardAudioPlayPause = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardAudioPlayPause)");
            }
            return;
        }

        if (!this.state.currentLocation) {
            return;
        }

        if (this.state.r2PublicationHasMediaOverlays) {
            if (this.state.mediaOverlaysState === MediaOverlaysStateEnum.PLAYING) {
                this.handleMediaOverlaysPause();
            } else if (this.state.mediaOverlaysState === MediaOverlaysStateEnum.PAUSED) {
                this.handleMediaOverlaysResume();
            } else if (this.state.mediaOverlaysState === MediaOverlaysStateEnum.STOPPED) {
                this.handleMediaOverlaysPlay();
            }
        } else if (this.state.currentLocation.audioPlaybackInfo) {
            audioTogglePlayPause();
        } else {
            if (this.state.ttsState === TTSStateEnum.PLAYING) {
                this.handleTTSPause();
            } else if (this.state.ttsState === TTSStateEnum.PAUSED) {
                this.handleTTSResume();
            } else if (this.state.ttsState === TTSStateEnum.STOPPED) {
                this.handleTTSPlay();
            }
        }
    }

    private onKeyboardAudioPrevious = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardAudioPrevious)");
            }
            return;
        }

        if (!this.state.currentLocation) {
            return;
        }

        if (this.state.r2PublicationHasMediaOverlays) {
            this.handleMediaOverlaysPrevious();
        } else if (this.state.currentLocation.audioPlaybackInfo) {
            audioRewind();
        } else {
            this.handleTTSPrevious();
        }
    }

    private onKeyboardAudioNext = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardAudioNext)");
            }
            return;
        }

        if (!this.state.currentLocation) {
            return;
        }

        if (this.state.r2PublicationHasMediaOverlays) {
            this.handleMediaOverlaysNext();
        } else if (this.state.currentLocation.audioPlaybackInfo) {
            audioForward();
        } else {
            this.handleTTSNext();
        }
    }

    private onKeyboardFullScreen = () => {
        this.handleFullscreenClick();
    }

    private onKeyboardCloseReader = () => {
        // if (!this.state.shortcutEnable) {
        //     if (DEBUG_KEYBOARD) {
        //         console.log("!shortcutEnable (onKeyboardInfo)");
        //     }
        //     return;
        // }
        this.handleReaderClose();
    }

    private onKeyboardInfo = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardInfo)");
            }
            return;
        }
        this.displayPublicationInfo();
    }

    private onKeyboardFocusNav = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFocusNav)");
            }
            return;
        }
        this.handleMenuButtonClick();
    }
    private onKeyboardFocusSettings = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFocusSettings)");
            }
            return;
        }
        this.handleSettingsClick();
    }

    private onKeyboardBookmark = async () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardBookmark)");
            }
            return;
        }
        await this.handleToggleBookmark(true);
    }

    private onKeyboardFocusMain = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFocusMain)");
            }
            return;
        }

        if (this.fastLinkRef?.current) {
            this.fastLinkRef.current.focus();
        }
    }

    private onKeyboardFocusToolbar = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFocusToolbar)");
            }
            return;
        }

        if (this.refToolbar?.current) {
            this.refToolbar.current.focus();
        }
    }

    private onKeyboardPageNavigationNext = () => {
        this.onKeyboardPageNavigationPreviousNext(false);
    }
    private onKeyboardPageNavigationPrevious = () => {
        this.onKeyboardPageNavigationPreviousNext(true);
    }
    private onKeyboardPageNavigationPreviousNext = (isPrevious: boolean) => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardPageNavigationPreviousNext)");
            }
            return;
        }

        this.navLeftOrRight_(isPrevious, false);
    }

    private onKeyboardSpineNavigationNext = () => {
        this.onKeyboardSpineNavigationPreviousNext(false);
    }
    private onKeyboardSpineNavigationPrevious = () => {
        this.onKeyboardSpineNavigationPreviousNext(true);
    }
    private onKeyboardSpineNavigationPreviousNext = (isPrevious: boolean) => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardSpineNavigationPreviousNext)");
            }
            return;
        }

        this.navLeftOrRight_(isPrevious, true);

        if (this.fastLinkRef?.current) {
            setTimeout(() => {
                this.onKeyboardFocusMain();
            }, 200);
        }
    }

    private displayPublicationInfo() {
        if (this.props.publicationView) {
            // TODO: subscribe to Redux action type == CloseRequest
            // in order to reset shortcutEnable to true? Problem: must be specific to this reader window.
            // So instead we subscribe to DOM event "Thorium:DialogClose", but this is a short-term hack!
            this.setState({
                shortcutEnable: false,
            });
            this.props.displayPublicationInfo(this.props.publicationView.identifier);
        }
    }
    private async ensureHighlights(loc: LocatorExtended) {
        if (this.pendingHighlights && this.pendingHighlights.href === loc.locator.href) {
            highlightsRemoveAll(this.pendingHighlights.href);
            setTimeout(async () => {

                const time2 = process.hrtime();

                await highlightsCreate(this.pendingHighlights.href, this.pendingHighlights.data);

                console.log("+++++++++++ highlightsCreate done");
                const diff2 = process.hrtime(time2);
                console.log(`${this.pendingHighlights.href} __ ${diff2[0]} seconds + ${diff2[1]} nanoseconds`);

                this.pendingHighlights = undefined;
            }, 500);
        }
    }

    // private async searchTextNode(searchInput: string, n: Node): Promise<ISearchResult[]> {
    //     let text = n.nodeValue;
    //     if (!text) {
    //         return [];
    //     }
    //     // text = text.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
    //     // if (!text.length) {
    //     //     return [];
    //     // }
    //     const originalLength = text.length;
    //     text = normalizeDiacriticsAndLigatures(text);
    //     if (text.length !== originalLength) {
    //         console.log(`###{{{{!!!!! normalizeDiacriticsAndLigatures DIFF ${text.length} !== ${originalLength}`);
    //     }

    //     searchInput = cleanupStr(searchInput);
    //     if (!searchInput.length) {
    //         return [];
    //     }

    //     const regexp = new RegExp(
        // escapeRegExp(normalizeDiacriticsAndLigatures(searchInput)).replace(/ /g, "\\s+"), "gim");

    //     const searchResults: ISearchResult[] = [];

    //     const snippetLength = 100;
    //     const snippetLengthNormalized = 30;

    //     let matches: RegExpExecArray;
    //     // tslint:disable-next-line: no-conditional-assignment
    //     while (matches = regexp.exec(text)) {
    //         // console.log(matches.input);
    //         // // console.log(matches);
    //         // // console.log(JSON.stringify(matches, null, 4));
    //         // console.log(regexp.lastIndex);
    //         // console.log(matches.index);
    //         // console.log(matches[0].length);

    //         let i = Math.max(0, matches.index - snippetLength);
    //         let l = Math.min(snippetLength, matches.index);
    //         let textBefore = collapseWhitespaces(text.substr(i, l));
    //         textBefore = textBefore.substr(textBefore.length - snippetLengthNormalized);

    //         i = regexp.lastIndex;
    //         l = Math.min(snippetLength, text.length - i);
    //         const textAfter = collapseWhitespaces(text.substr(i, l)).substr(0, snippetLengthNormalized);

    //         const range = new Range(); // document.createRange()
    //         range.setStart(n, matches.index);
    //         range.setEnd(n, matches.index + matches[0].length);
    //         if (!(n.ownerDocument as any).getCssSelector) {
    //             (n.ownerDocument as any).getCssSelector = getCssSelector_(n.ownerDocument);
    //         }
    //         const rangeInfo = convertRange(range, (n.ownerDocument as any).getCssSelector, computeElementCFI);

    //         searchResults.push({
    //             match: collapseWhitespaces(matches[0]),
    //             textBefore,
    //             textAfter,
    //             rangeInfo,
    //         });
    //     }

    //     return searchResults;
    // }
    // private async searchElement(searchInput: string, el: Element): Promise<ISearchResult[]> {
    //     let searchResults: ISearchResult[] = [];
    //     const children = Array.from(el.childNodes);
    //     for (const child of children) {
    //         if (child.nodeType === Node.ELEMENT_NODE) {
    //             searchResults = searchResults.concat(await this.searchElement(searchInput, child as Element));
    //         } else if (child.nodeType === Node.TEXT_NODE) {
    //             searchResults = searchResults.concat(await this.searchTextNode(searchInput, child));
    //         }
    //     }
    //     return searchResults;
    // }
    // private async searchDoc(searchInput: string, doc: Document): Promise<ISearchResult[]> {
    //     return this.searchElement(searchInput, doc.body);
    // }
    // private compareSearchResults(r1: ISearchResult[], r2: ISearchResult[]) {
    //     console.log("Compare search results...");
    //     let same = true;
    //     for (let i = 0; i < Math.max(r1.length, r2.length); i++) {
    //         const res1 = r1[i];
    //         if (!res1) {
    //             same = false;
    //             break;
    //         }
    //         const res2 = r2[i];
    //         if (!res2) {
    //             same = false;
    //             break;
    //         }
    //         if (res1.match !== res2.match) {
    //             same = false;
    //             break;
    //         }
    //         if (res1.textAfter !== res2.textAfter) {
    //             same = false;
    //             break;
    //         }
    //         if (res1.textBefore !== res2.textBefore) {
    //             same = false;
    //             break;
    //         }
    //         if (res1.rangeInfo.startContainerElementCssSelector !==
    // res2.rangeInfo.startContainerElementCssSelector) {
    //             same = false;
    //             break;
    //         }
    //         if (res1.rangeInfo.startContainerChildTextNodeIndex !==
    // res2.rangeInfo.startContainerChildTextNodeIndex) {
    //             same = false;
    //             break;
    //         }
    //         if (res1.rangeInfo.startOffset !== res2.rangeInfo.startOffset) {
    //             same = false;
    //             break;
    //         }
    //         if (res1.rangeInfo.endContainerElementCssSelector !== res2.rangeInfo.endContainerElementCssSelector) {
    //             same = false;
    //             break;
    //         }
    //         if (res1.rangeInfo.endContainerChildTextNodeIndex !== res2.rangeInfo.endContainerChildTextNodeIndex) {
    //             same = false;
    //             break;
    //         }
    //         if (res1.rangeInfo.endOffset !== res2.rangeInfo.endOffset) {
    //             same = false;
    //             break;
    //         }
    //     }
    //     if (!same) {
    //         console.log("€€€€€€€€€€");
    //         console.log("€€€€€€€€€€");
    //         console.log("€€€€€€€€€€");
    //         console.log("€€€€€€€€€€");
    //         console.log("€€€€€€€€€€");
    //         console.log("€€€€€€€€€€ Search results not identical!");
    //         console.log(jsonDiff.diffString({r: r1}, {r: r2}));
    //     }
    // }
    private async searchDocDomSeek(searchInput: string, doc: Document): Promise<ISearchResult[]> {
        const text = doc.body.textContent;
        if (!text) {
            return [];
        }
        // text = text.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
        // if (!text.length) {
        //     return [];
        // }
        const originalLength = text.length;
        // text = normalizeDiacriticsAndLigatures(text);
        if (text.length !== originalLength) {
            console.log(`###{{{{!!!!! normalizeDiacriticsAndLigatures DIFF ${text.length} !== ${originalLength}`);
        }

        searchInput = cleanupStr(searchInput);
        if (!searchInput.length) {
            return [];
        }

        const iter = doc.createNodeIterator(
            doc.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (_node) => NodeFilter.FILTER_ACCEPT,
            },
            );

        // normalizeDiacriticsAndLigatures(searchInput)
        const regexp = new RegExp(escapeRegExp(searchInput).replace(/ /g, "\\s+"), "gim");

        const searchResults: ISearchResult[] = [];

        const snippetLength = 100;
        const snippetLengthNormalized = 30;

        // let consumed = 0;
        let accumulated = 0;

        let matches: RegExpExecArray;
        // tslint:disable-next-line: no-conditional-assignment
        while (matches = regexp.exec(text)) {
            // console.log("matches.input: ", matches.input);
            // // console.log(matches);
            // // console.log(JSON.stringify(matches, null, 4));
            // console.log("regexp.lastIndex: ", regexp.lastIndex);
            // console.log("matches.index: ", matches.index);
            // console.log("matches[0].length: ", matches[0].length);

            let i = Math.max(0, matches.index - snippetLength);
            let l = Math.min(snippetLength, matches.index);
            let textBefore = collapseWhitespaces(text.substr(i, l));
            textBefore = textBefore.substr(textBefore.length - snippetLengthNormalized);

            i = regexp.lastIndex;
            l = Math.min(snippetLength, text.length - i);
            const textAfter = collapseWhitespaces(text.substr(i, l)).substr(0, snippetLengthNormalized);

            const range = new Range(); // document.createRange()

            let offset = matches.index;
            while (accumulated <= offset) {
                const nextNode = iter.nextNode();
                accumulated += nextNode.nodeValue.length;
            }
            let localOffset = iter.referenceNode.nodeValue.length - (accumulated - offset);
            // console.log("start accumulated: ", accumulated);
            // console.log("start localNodeOffset: ", localOffset);
            // console.log("start iter.referenceNode.nodeValue: ", iter.referenceNode.nodeValue);
            // console.log("start iter.referenceNode.nodeValue.length: ", iter.referenceNode.nodeValue.length);
            range.setStart(iter.referenceNode, localOffset);

            offset = matches.index + matches[0].length;
            while (accumulated <= offset) {
                const nextNode = iter.nextNode();
                accumulated += nextNode.nodeValue.length;
            }
            localOffset = iter.referenceNode.nodeValue.length - (accumulated - offset);
            // console.log("end accumulated: ", accumulated);
            // console.log("end localNodeOffset: ", localOffset);
            // console.log("end iter.referenceNode.nodeValue: ", iter.referenceNode.nodeValue);
            // console.log("end iter.referenceNode.nodeValue.length: ", iter.referenceNode.nodeValue.length);
            range.setEnd(iter.referenceNode, localOffset);

            // let moveForwardBy = matches.index - consumed;
            // consumed += moveForwardBy;
            // console.log("start moveForwardBy: ", moveForwardBy);
            // let actualMovedForward = domSeek(iter, moveForwardBy);
            // let remainderToMoveForward = moveForwardBy - actualMovedForward;
            // console.log("start actualMovedForward: ", actualMovedForward);
            // console.log("start remainderToMoveForward: ", remainderToMoveForward);
            // console.log("start iter.referenceNode.nodeValue: ", iter.referenceNode.nodeValue);
            // console.log("start iter.referenceNode.nodeValue.length: ", iter.referenceNode.nodeValue.length);
            // // if (remainderToMoveForward) {
            // //     const previousRef = iter.referenceNode;
            // //     actualMovedForward = domSeek(iter, remainderToMoveForward);
            // //     console.log("start actualMovedForward (2): ", actualMovedForward);
            // //     if (previousRef !== iter.referenceNode) {
            // //         console.log("start previousRef !== iter.referenceNode: ", iter.referenceNode.nodeValue);
            // //     }
            // // }
            // range.setStart(iter.referenceNode, remainderToMoveForward);

            // moveForwardBy = matches[0].length;
            // consumed += moveForwardBy;
            // console.log("end moveForwardBy: ", moveForwardBy);
            // actualMovedForward = domSeek(iter, moveForwardBy);
            // remainderToMoveForward = moveForwardBy - actualMovedForward;
            // console.log("end actualMovedForward: ", actualMovedForward);
            // console.log("end remainderToMoveForward: ", remainderToMoveForward);
            // if (range.startContainer !== iter.referenceNode) {
            //     console.log("end RANGE SPANS ACROSS NODES:");
            //     console.log("end iter.referenceNode.nodeValue: ", iter.referenceNode.nodeValue);
            //     console.log("end iter.referenceNode.nodeValue.length: ", iter.referenceNode.nodeValue.length);
            // }
            // // if (remainderToMoveForward) {
            // //     const previousRef = iter.referenceNode;
            // //     actualMovedForward = domSeek(iter, remainderToMoveForward);
            // //     console.log("end actualMovedForward (2): ", actualMovedForward);
            // //     if (previousRef !== iter.referenceNode) {
            // //         console.log("end previousRef !== iter.referenceNode: ", iter.referenceNode.nodeValue);
            // //     }
            // // }
            // range.setEnd(iter.referenceNode, range.startContainer === iter.referenceNode ?
            //     range.startOffset + remainderToMoveForward : remainderToMoveForward);

            // // should be equal
            // console.log("consumed (1): ", consumed);
            // consumed = regexp.lastIndex;
            // console.log("consumed (2): ", consumed);

            if (!(doc as any).getCssSelector) {
                (doc as any).getCssSelector = getCssSelector_(doc);
            }
            const rangeInfo = convertRange(
                range,
                (doc as any).getCssSelector,
                (_node: Node) => ""); // computeElementCFI

            searchResults.push({
                match: collapseWhitespaces(matches[0]),
                textBefore,
                textAfter,
                rangeInfo,
            });
        }

        return searchResults;
    }

    private async search(searchInput: string) {

        console.log(`#### search: ${searchInput}`);

        const existingDiv = document.getElementById("SEARCH_RESULTS_LIST");
        if (existingDiv && existingDiv.parentNode) {
            existingDiv.parentNode.removeChild(existingDiv);
        }
        const divEl = document.createElement("div");
        divEl.setAttribute("id", "SEARCH_RESULTS_LIST");
        divEl.setAttribute("style", "display: block; background-color: white; color: black; border: 2px solid yellow; margin: 0; padding: 3px;");
        const ulEl = document.createElement("ul");
        ulEl.setAttribute("style", "margin: 0; padding: 0;");
        divEl.appendChild(ulEl);
        if (this.searchRef.current) {
            this.searchRef.current.appendChild(divEl);
        }

        // console.log(this.state.publicationJsonUrl);
        // let response: Response;
        // try {
        //     response = await fetch(this.state.publicationJsonUrl);
        // } catch (e) {
        //     console.log(e);
        //     return;
        // }
        // if (!response.ok) {
        //     console.log("BAD RESPONSE?!");
        //     return;
        // }
        // let r2PublicationJson: any;
        // try {
        //     r2PublicationJson = await response.json();
        // } catch (e) {
        //     console.log(e);
        //     return;
        // }
        // const r2Publication = TaJsonDeserialize<R2Publication>(r2PublicationJson, R2Publication);
        const r2Publication = this.props.r2Publication;

        if (!r2Publication.Spine) {
            console.log("No spine.");
            return;
        }

        const nanoPerSecond = 1000 * 1000000;
        // const totalTime1 = [0, 0];
        const totalTime2 = [0, 0];
        const totalTime3 = [0, 0];
        let totalN2 = 0;
        let totalN3 = 0;

        // const timeTotal = process.hrtime();

        // const bypass = true;

        for (const link of r2Publication.Spine) {
            if (!link.TypeLink || !link.TypeLink.includes("html")) {
                continue;
            }
            const url = new URL(link.Href, this.props.manifestUrlR2Protocol);
            const urlStr = url.toString();
            // console.log(urlStr);
            // const urlStr_ = urlStr.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL) ?
            //     convertCustomSchemeToHttpUrl(urlStr) : urlStr;
            // console.log(urlStr_);
            // const url_ = new URL(urlStr_);

            if (!this.searchCache[urlStr]) {
                let res: Response;
                try {
                    res = await fetch(urlStr);
                } catch (e) {
                    console.log(e);
                    continue;
                }
                if (!res.ok) {
                    console.log("BAD RESPONSE?!");
                    continue;
                }
                let linkText: string;
                try {
                    linkText = await res.text();
                } catch (e) {
                    console.log(e);
                    continue;
                }

                // const xmlDom = (new DOMParser()).parseFromString(linkText, ContentType.TextXml);
                this.searchCache[urlStr] = {
                    source: linkText,
                    // document: xmlDom,
                    // charLength: linkText.length,
                };
                if (IS_DEV) {
                    // console.log(linkText.length);
                    // const xmlTxt = (new XMLSerializer()).serializeToString(xmlDom);
                    // console.log(xmlTxt.substr(0, 1000));
                }
            }
            if (!this.searchCache[urlStr]) {
                continue;
            }

            const arr = url.pathname.split("/");
            arr.splice(0, 1);
            arr.splice(0, 1);
            arr.splice(0, 1);
            arr.splice(0, 1);
            const p = arr.join("/");
            console.log(p);

            // const time1 = process.hrtime();
            // // @ts-ignore
            // const xmlDom1 = (new DOMParser()).parseFromString(
            //     this.searchCache[urlStr].source,
            //     ContentType.Html);
            // const diff1 = process.hrtime(time1);
            // console.log(
            // `${p} HTML PARSE (${this.searchCache[urlStr].source.length})
            // __ ${diff1[0]} seconds + ${diff1[1]} nanoseconds`);

            const time1b = process.hrtime();
            const xmlDom = (new DOMParser()).parseFromString(
                this.searchCache[urlStr].source,
                ContentType.TextXml);
            const diff1b = process.hrtime(time1b);
            console.log(`${p} XML PARSE (${this.searchCache[urlStr].source.length}) __ ${diff1b[0]} seconds + ${diff1b[1]} nanoseconds`);

            // const time1 = process.hrtime();
            // const searchResults1 = bypass ? [] :
            // await this.searchDoc(searchInput, this.searchCache[urlStr].document);
            // const diff1 = process.hrtime(time1);
            // console.log(`${p} (1) __ ${diff1[0]} seconds + ${diff1[1]} nanoseconds`);
            // totalTime1[0] += diff1[0];
            // totalTime1[1] += diff1[1];

            const time2 = process.hrtime();
            const searchResults2 =
                await this.searchDocDomSeek(searchInput, xmlDom);
            console.log("+++++++++++ DOM Seek done");
            console.log(searchResults2.length);
            totalN2 += searchResults2.length;
            const diff2 = process.hrtime(time2);
            console.log(`${p} (2) __ ${diff2[0]} seconds + ${diff2[1]} nanoseconds`);
            totalTime2[0] += diff2[0];
            totalTime2[1] += diff2[1];
            let wholeSeconds = Math.floor(totalTime2[1] / nanoPerSecond);
            totalTime2[0] += wholeSeconds;
            totalTime2[1] -= (wholeSeconds * nanoPerSecond);

            // if (!bypass) {
            //     this.compareSearchResults(searchResults1, searchResults2);
            // }

            // For a fair comparison of MarkJS search algo, we must disable the DOM highlighting.
            // in node_modules/mark.js/dist/mark.js
            // in the "wrapMatchesAcrossElements" function
            // comment-out the entire "wrapRangeInMappedTextNode" call,
            // and replace with "eachCb(null);"
            const time3 = process.hrtime();
            if (true) { // !bypass
                const markJSInstance = new markJS(xmlDom.body);
                await new Promise((res, _rej) => {

                    markJSInstance.mark(searchInput, {
                        element: "mark",
                        className: "",
                        exclude: [],
                        separateWordSearch: false,
                        accuracy: "partially",

                        // crashes infinite loop with because bidirectional mapping with short recurring pairs of chars
                        // synonyms: unicodeToAsciiMap,

                        diacritics: true,
                        iframes: false,
                        iframesTimeout: 5000,
                        acrossElements: true,
                        caseSensitive: false,
                        ignoreJoiners: false,
                        ignorePunctuation: [],
                        wildcards: "disabled",
                        debug: false,
                        log: console,
                        // noMatch: () => {
                        // },
                        // filter: () => {
                        // },
                        // each: () => {
                        // },
                        done: (n: number) => {
                            console.log("+++++++++++ MarkJS mark done");
                            console.log(n);
                            totalN3 += n;
                            const diff3 = process.hrtime(time3);
                            console.log(`${p} (3) __ ${diff3[0]} seconds + ${diff3[1]} nanoseconds`);
                            totalTime3[0] += diff3[0];
                            totalTime3[1] += diff3[1];
                            wholeSeconds = Math.floor(totalTime3[1] / nanoPerSecond);
                            totalTime3[0] += wholeSeconds;
                            totalTime3[1] -= (wholeSeconds * nanoPerSecond);

                            // markJSInstance.unmark({
                            //     element: "",
                            //     className: "",
                            //     exclude: [],
                            //     iframes: false,
                            //     iframesTimeout: 5000,
                            //     debug: false,
                            //     log: console,
                            //     done: () => {
                            //         console.log("+++++++++++ MarkJS unmark done");
                            //     },
                            // });

                            res();
                        },
                    });
                });
            }

            const searchResults = searchResults2;

            if (!searchResults.length) {
                const liEl = document.createElement("li");
                // tslint:disable-next-line: max-line-length
                // liEl.setAttribute("style", "display: block; background-color: white; color: black; border: 1px solid orange; margin: 0; padding: 3px;");
                const spanEl1 = document.createElement("span");
                spanEl1.setAttribute("style", "font-family: monospace; background-color: silver;");
                const t1 = document.createTextNode(`${p}`);
                spanEl1.appendChild(t1);
                const spanEl2 = document.createElement("span");
                spanEl2.setAttribute("style", "margin-left: 2em;");
                const t2 = document.createTextNode(" ");
                spanEl2.appendChild(t2);
                liEl.appendChild(spanEl1);
                liEl.appendChild(spanEl2);
                ulEl.appendChild(liEl);
            } else {
                const subliEl = document.createElement("li");
                const subspanEl1 = document.createElement("span");
                subspanEl1.setAttribute("style", "font-family: monospace; background-color: silver;");
                const subt1 = document.createTextNode(`${p}`);
                subspanEl1.appendChild(subt1);
                subliEl.appendChild(subspanEl1);
                const allRangeInfos = searchResults.map((ri) => {
                    return ri.rangeInfo;
                });
                for (const searchResult of searchResults) {
                    const subulEl = document.createElement("ul");
                    subulEl.setAttribute("style", "margin: 0; padding: 0; margin-left: 1em;");
                    const liEl = document.createElement("li");
                    liEl.setAttribute("style", "display: block; background-color: white; color: black; border: 1px solid orange; margin: 0; padding: 3px;");
                    const aEl = document.createElement("a");
                    aEl.setAttribute("href", "#");
                    const t1 = document.createTextNode("LINK");
                    aEl.appendChild(t1);
                    (aEl as any).searchResultAllRangeInfos = allRangeInfos;
                    (aEl as any).searchResultRangeInfo = searchResult.rangeInfo;
                    (aEl as any).searchResultHref = p;
                    aEl.addEventListener("click", (ev) => {
                        ev.preventDefault();
                        const rangeInfos = (ev.currentTarget as any).searchResultAllRangeInfos as IRangeInfo[];
                        const rangeInfo = (ev.currentTarget as any).searchResultRangeInfo as IRangeInfo;
                        const href = (ev.currentTarget as any).searchResultHref as string;
                        console.log(JSON.stringify(rangeInfo, null, 4));
                        const locator: R2Locator = {
                            href,
                            locations: {
                                cssSelector: rangeInfo.startContainerElementCssSelector,
                            },
                        };
                        console.log(JSON.stringify(locator, null, 4));

                        const div = document.getElementById("SEARCH_RESULTS_LIST");
                        if (div) {
                            div.style.display = "none";
                        }

                        this.pendingHighlights = {
                            href: locator.href,
                            // data: [{
                            //     selectionInfo: {
                            //         cleanText: "",
                            //         rawText: "",
                            //         rangeInfo,
                            //     },
                            //     color: {
                            //         red: 255,
                            //         green: 255,
                            //         blue: 0,
                            //     },
                            // }],
                            data: rangeInfos.map((ri) => {
                                return {
                                    selectionInfo: {
                                        cleanText: "",
                                        rawText: "",
                                        rangeInfo: ri,
                                    },
                                    color: {
                                        red: 255,
                                        green: 0,
                                        blue: 0,
                                    },
                                };
                            }),
                        };
                        handleLinkLocator(locator, undefined, rangeInfo);
                    });
                    const spanEl2 = document.createElement("span");
                    spanEl2.setAttribute("style", "font-family: serif; margin-left: 2em;");
                    const t2b = document.createTextNode(`...${searchResult.textBefore}`);
                    spanEl2.appendChild(t2b);
                    const spanEl3 = document.createElement("span");
                    spanEl3.setAttribute("style", "background-color: yellow");
                    const t3 = document.createTextNode(`${searchResult.match}`);
                    spanEl3.appendChild(t3);
                    spanEl2.appendChild(spanEl3);
                    const t2a = document.createTextNode(`${searchResult.textAfter}...`);
                    spanEl2.appendChild(t2a);
                    liEl.appendChild(aEl);
                    liEl.appendChild(spanEl2);
                    subulEl.appendChild(liEl);
                    subliEl.appendChild(subulEl);
                }

                ulEl.appendChild(subliEl);
            }
        }

        // const timeTotalElapsed = process.hrtime(timeTotal);
        // console.log(`__ TOTAL: ${timeTotalElapsed[0]} seconds + ${timeTotalElapsed[1]} nanoseconds`);

        // console.log("_________________________________");
        // if (!bypass) {
        //     console.log(`__ TOTAL 1 ${totalTime1[0]} seconds + ${totalTime1[1]} nanoseconds`);
        // }
        console.log(`__ TOTAL 2: [${totalN2}] ${totalTime2[0]} seconds + ${totalTime2[1]} nanoseconds`);
        console.log("_________________________________");

        console.log(`__ TOTAL 3: [${totalN3}] ${totalTime3[0]} seconds + ${totalTime3[1]} nanoseconds`);
        console.log("_________________________________");
    }

    private async loadPublicationIntoViewport() {

        highlightsClickListen((href: string, highlight: IHighlight) => {
            highlightsRemove(href, [highlight.id]);
        });

        this.setState({
            r2PublicationHasMediaOverlays: publicationHasMediaOverlays(this.props.r2Publication),
        });

        if (this.props.r2Publication.Metadata && this.props.r2Publication.Metadata.Title) {
            const title = this.props.translator.translateContentField(this.props.r2Publication.Metadata.Title);

            window.document.title = capitalizedAppName;
            if (title) {
                window.document.title = `${capitalizedAppName} - ${title}`;
                // this.setState({
                //     title,
                // });
            }
        }

        let preloadPath = "preload.js";
        if (_PACKAGING === "1") {
            preloadPath = "file://" + path.normalize(path.join((global as any).__dirname, preloadPath));
        } else {
            preloadPath = "r2-navigator-js/dist/" +
                "es6-es2015" +
                "/src/electron/renderer/webview/preload.js";

            if (_RENDERER_READER_BASE_URL === "file://") {
                // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
                preloadPath = "file://" +
                    path.normalize(path.join((global as any).__dirname, _NODE_MODULE_RELATIVE_URL, preloadPath));
            } else {
                // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
                preloadPath = "file://" + path.normalize(path.join(process.cwd(), "node_modules", preloadPath));
            }
        }

        preloadPath = preloadPath.replace(/\\/g, "/");

        const clipboardInterceptor = !this.props.publicationView.lcp ? undefined :
            (clipboardData: IEventPayload_R2_EVENT_CLIPBOARD_COPY) => {
                apiAction("reader/clipboardCopy", this.props.pubId, clipboardData)
                    .catch((error) => console.error("Error to fetch api reader/clipboardCopy", error));
            };

        installNavigatorDOM(
            this.props.r2Publication,
            this.props.manifestUrlR2Protocol,
            "publication_viewport",
            preloadPath,
            this.props.locator?.locator?.href ? this.props.locator.locator : undefined,
            true,
            clipboardInterceptor,
            this.props.winId,
            computeReadiumCssJsonMessage(this.props.readerConfig),
        );
    }

    private handleMenuButtonClick() {
        this.setState({
            menuOpen: !this.state.menuOpen,
            shortcutEnable: this.state.menuOpen,
            settingsOpen: false,
        });
    }

    private saveReadingLocation(loc: LocatorExtended) {
        this.props.setLocator(loc);
    }

    private async handleReadingLocationChange(loc: LocatorExtended) {
        if (this.ttsOverlayEnableNeedsSync) {
            ttsOverlayEnable(this.props.readerConfig.ttsEnableOverlayMode);
        }
        this.ttsOverlayEnableNeedsSync = false;

        this.findBookmarks();
        this.saveReadingLocation(loc);
        this.setState({ currentLocation: getCurrentReadingLocation() });
        // No need to explicitly refresh the bookmarks status here,
        // as componentDidUpdate() will call the function after setState():
        // await this.checkBookmarks();

        await this.ensureHighlights(loc);
    }

    // check if a bookmark is on the screen
    private async checkBookmarks() {
        if (!this.state.bookmarks) {
            return;
        }

        const locator = this.state.currentLocation ? this.state.currentLocation.locator : undefined;

        const visibleBookmarkList = [];
        for (const bookmark of this.state.bookmarks) {
            // calling into the webview via IPC is expensive,
            // let's filter out ahead of time based on document href
            if (!locator || locator.href === bookmark.locator.href) {
                if (this.props.r2Publication) { // isLocatorVisible() API only once navigator ready
                    const isVisible = await isLocatorVisible(bookmark.locator);
                    if (isVisible) {
                        visibleBookmarkList.push(bookmark);
                    }
                }
            }
        }
        this.setState({ visibleBookmarkList });
    }

    private focusMainAreaLandmarkAndCloseMenu() {
        if (this.fastLinkRef?.current) {
            setTimeout(() => {
                this.onKeyboardFocusMain();
            }, 200);
        }

        if (this.state.menuOpen) {
            setTimeout(() => {
                this.handleMenuButtonClick();
            }, 100);
        }
    }

    private navLeftOrRight_(left: boolean, spineNav?: boolean) {
        const wasPlaying = this.state.r2PublicationHasMediaOverlays ?
            this.state.mediaOverlaysState === MediaOverlaysStateEnum.PLAYING :
            this.state.ttsState === TTSStateEnum.PLAYING;
        const wasPaused = this.state.r2PublicationHasMediaOverlays ?
            this.state.mediaOverlaysState === MediaOverlaysStateEnum.PAUSED :
            this.state.ttsState === TTSStateEnum.PAUSED;

        if (wasPaused || wasPlaying) {
            navLeftOrRight(left, false); // !this.state.r2PublicationHasMediaOverlays
            // if (!this.state.r2PublicationHasMediaOverlays) {
            //     handleTTSPlayDebounced(this);
            // }
        } else {
            navLeftOrRight(left, spineNav);
        }
    }

    private goToLocator(locator: R2Locator) {

        this.focusMainAreaLandmarkAndCloseMenu();

        handleLinkLocator(locator);
    }

    // tslint:disable-next-line: max-line-length
    private handleLinkClick(event: TMouseEventOnSpan | TMouseEventOnAnchor | TKeyboardEventOnAnchor | undefined, url: string) {
        if (event) {
            event.preventDefault();
        }
        if (!url) {
            return;
        }

        this.focusMainAreaLandmarkAndCloseMenu();

        const newUrl = this.props.manifestUrlR2Protocol + "/../" + url;
        handleLinkUrl(newUrl);
    }

    private async handleToggleBookmark(fromKeyboard?: boolean) {

        if ( !this.state.currentLocation?.locator) {
            return;
        }

        const locator = this.state.currentLocation.locator;
        const visibleBookmark = this.state.visibleBookmarkList;

        await this.checkBookmarks(); // updates this.state.visibleBookmarkList

        const deleteAllVisibleBookmarks =

            // "toggle" only if there is a single bookmark in the content visible inside the viewport
            // otherwise preserve existing, and add new one (see addCurrentLocationToBookmarks below)
            visibleBookmark.length === 1 &&

            // CTRL-B (keyboard interaction) and audiobooks:
            // do not toggle: never delete, just add current reading location to bookmarks
            !fromKeyboard &&
            !this.state.currentLocation.audioPlaybackInfo &&
            (!locator.text?.highlight ||

            // "toggle" only if visible bookmark == current reading location
            visibleBookmark[0].locator.href === locator.href &&
            visibleBookmark[0].locator.locations.cssSelector === locator.locations.cssSelector &&
            visibleBookmark[0].locator.text?.highlight === locator.text.highlight
            )
        ;

        if (deleteAllVisibleBookmarks) {
            for (const bookmark of visibleBookmark) {
                try {
                    await apiAction("reader/deleteBookmark", bookmark.identifier);
                } catch (e) {
                    console.error("Error to fetch api reader/deleteBookmark", e);
                }
            }

            // we do not add the current reading location to bookmarks (just toggle)
            return;
        }

        const addCurrentLocationToBookmarks =
            !visibleBookmark.length ||
            !visibleBookmark.find((b) => {
                const identical =
                    b.locator.href === locator.href &&
                    (b.locator.locations.progression === locator.locations.progression ||
                        b.locator.locations.cssSelector && locator.locations.cssSelector &&
                        b.locator.locations.cssSelector === locator.locations.cssSelector) &&
                    b.locator.text?.highlight === locator.text?.highlight;

                return identical;
            }) &&
            (this.state.currentLocation.audioPlaybackInfo || locator.text?.highlight);

        if (addCurrentLocationToBookmarks) {

            let name: string | undefined;
            if (locator?.text?.highlight) {
                name = locator.text.highlight;
            } else if (this.state.currentLocation.selectionInfo?.cleanText) {
                name = this.state.currentLocation.selectionInfo.cleanText;
            } else if (this.state.currentLocation.audioPlaybackInfo) {
                const percent = Math.floor(100 * this.state.currentLocation.audioPlaybackInfo.globalProgression);
                // this.state.currentLocation.audioPlaybackInfo.globalTime /
                // this.state.currentLocation.audioPlaybackInfo.globalDuration
                const timestamp = formatTime(this.state.currentLocation.audioPlaybackInfo.globalTime);
                name = `${timestamp} (${percent}%)`;
            }

            try {
                await apiAction("reader/addBookmark", this.props.pubId, locator, name);
            } catch (e) {
                console.error("Error to fetch api reader/addBookmark", e);
            }
        }
    }

    private handleReaderClose() {
        this.props.closeReader();
    }

    private handleReaderDetach() {
        this.props.detachReader();
        this.setState({ readerMode: ReaderMode.Detached });
    }

    private handleFullscreenClick() {
        this.props.toggleFullscreen(!this.state.fullscreen);
        this.setState({ fullscreen: !this.state.fullscreen });
    }

    private handleSettingsClick() {
        this.setState({
            settingsOpen: !this.state.settingsOpen,
            shortcutEnable: this.state.settingsOpen,
            menuOpen: false,
        });
    }

    private handleTTSPlay() {
        ttsClickEnable(true);
        ttsPlay(parseFloat(this.state.ttsPlaybackRate));
    }
    private handleTTSPause() {
        ttsPause();
    }
    private handleTTSStop() {
        ttsClickEnable(false);
        ttsStop();
    }
    private handleTTSResume() {
        ttsResume();
    }
    private handleTTSNext() {
        ttsNext();
    }
    private handleTTSPrevious() {
        ttsPrevious();
    }
    private handleTTSPlaybackRate(speed: string) {
        ttsPlaybackRate(parseFloat(speed));
        this.setState({ttsPlaybackRate: speed});
    }

    private handleMediaOverlaysPlay() {
        mediaOverlaysClickEnable(true);
        mediaOverlaysPlay(parseFloat(this.state.mediaOverlaysPlaybackRate));
    }
    private handleMediaOverlaysPause() {
        mediaOverlaysPause();
    }
    private handleMediaOverlaysStop() {
        mediaOverlaysClickEnable(false);
        mediaOverlaysStop();
    }
    private handleMediaOverlaysResume() {
        mediaOverlaysResume();
    }
    private handleMediaOverlaysNext() {
        mediaOverlaysNext();
    }
    private handleMediaOverlaysPrevious() {
        mediaOverlaysPrevious();
    }
    private handleMediaOverlaysPlaybackRate(speed: string) {
        mediaOverlaysPlaybackRate(parseFloat(speed));
        this.setState({mediaOverlaysPlaybackRate: speed});
    }

    private handleSettingsSave(readerConfig: ReaderConfig) {
        const moWasPlaying = this.state.r2PublicationHasMediaOverlays &&
            this.state.mediaOverlaysState === MediaOverlaysStateEnum.PLAYING;
        const ttsWasPlaying = this.state.ttsState !== TTSStateEnum.STOPPED;

        mediaOverlaysEnableSkippability(readerConfig.mediaOverlaysEnableSkippability);
        mediaOverlaysEnableCaptionsMode(readerConfig.mediaOverlaysEnableCaptionsMode);
        ttsOverlayEnable(readerConfig.ttsEnableOverlayMode);

        if (moWasPlaying) {
            mediaOverlaysPause();
            setTimeout(() => {
                mediaOverlaysResume();
            }, 300);
        }
        if (ttsWasPlaying) {
            ttsStop();
            setTimeout(() => {
                ttsPlay(parseFloat(this.state.ttsPlaybackRate));
            }, 300);
        }

        apiAction("session/isEnabled")
            .then((isEnabled) => this.props.setConfig(readerConfig, isEnabled))
            .catch((e) => {
                console.error("Error to fetch api session/isEnabled", e);
                this.props.setConfig(readerConfig, false);
            });

        if (this.props.r2Publication) {
            readiumCssUpdate(computeReadiumCssJsonMessage(readerConfig));

            if (readerConfig.enableMathJax !== this.props.readerConfig.enableMathJax) {
                setTimeout(() => {
                    // window.location.reload();
                    reloadContent();
                }, 1000);
            }
        }
    }

    private handleSettingChange(
        event: TChangeEventOnInput | TChangeEventOnSelect | undefined,
        name: keyof ReaderConfig,
        givenValue?: string | boolean) {

        let value = givenValue;
        if (value === null || value === undefined) {
            if (event) {
                value = event.target.value.toString();
            } else {
                return;
            }
        }

        const readerConfig = r.clone(this.props.readerConfig);

        const typedName =
            name as (typeof value extends string ? keyof ReaderConfigStrings : keyof ReaderConfigBooleans);
        const typedValue =
            value as (typeof value extends string ? string : boolean);
        readerConfig[typedName] = typedValue;

        if (readerConfig.paged) {
            readerConfig.enableMathJax = false;
        }

        this.handleSettingsSave(readerConfig);
    }

    private handleIndexChange(event: TChangeEventOnInput, name: keyof ReaderConfigStringsAdjustables) {

        let valueNum = event.target.valueAsNumber;
        if (typeof valueNum !== "number") {
            const valueStr = event.target.value.toString();
            valueNum = parseInt(valueStr, 10);
            if (typeof valueNum !== "number") {
                console.log(`valueNum?!! ${valueNum}`);
                return;
            }
        }

        const readerConfig = r.clone(this.props.readerConfig);

        readerConfig[name] = optionsValues[name][valueNum];

        this.handleSettingsSave(readerConfig);
    }

    private setSettings(readerConfig: ReaderConfig) {
        // TODO: with TypeScript strictNullChecks this test condition should not be necessary!
        if (!readerConfig) {
            return;
        }

        this.handleSettingsSave(readerConfig);
    }

    private findBookmarks() {
        apiAction("reader/findBookmarks", this.props.pubId)
            .then((bookmarks) => this.setState({ bookmarks }))
            .catch((error) => console.error("Error to fetch api reader/findBookmarks", error));
    }

    // TODO
    // replaced getMode API with an action broadcasted to every reader and catch by reducers
    private getReaderMode = () => {
        apiAction("reader/getMode")
            .then((mode) => this.setState({ readerMode: mode }))
            .catch((error) => console.error("Error to fetch api reader/getMode", error));
    }
}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {

    const indexes: AdjustableSettingsNumber = {
        fontSize: 3,
        pageMargins: 0,
        wordSpacing: 0,
        letterSpacing: 0,
        paraSpacing: 0,
        lineHeight: 0,
    };
    for (const key of ObjectKeys(indexes)) {
        let i = 0;
        for (const value of optionsValues[key]) {
            if (state.reader.config[key] === value) {
                indexes[key] = i;
                break;
            }
            i++;
        }
    }

    mediaOverlaysEnableSkippability(state.reader.config.mediaOverlaysEnableSkippability);
    mediaOverlaysEnableCaptionsMode(state.reader.config.mediaOverlaysEnableCaptionsMode);

    // too early in navigator lifecycle (READIUM2 context not instantiated)
    // see this.ttsOverlayEnableNeedsSync
    // ttsOverlayEnable(state.reader.config.ttsEnableOverlayMode);

    return {
        publicationView: state.reader.info.publicationView,
        r2Publication: state.reader.info.r2Publication,
        readerConfig: state.reader.config,
        indexes,
        keyboardShortcuts: state.keyboard.shortcuts,
        infoOpen: state.dialog.open &&
            state.dialog.type === DialogTypeName.PublicationInfoReader,
        pubId: state.reader.info.publicationIdentifier,
        locator: state.reader.locator,
        manifestUrlR2Protocol: state.reader.info.manifestUrlR2Protocol,
        winId: state.win.identifier,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        toggleFullscreen: (fullscreenOn: boolean) => {
            if (fullscreenOn) {
                dispatch(readerActions.fullScreenRequest.build(true));
            } else {
                dispatch(readerActions.fullScreenRequest.build(false));
            }
        },
        closeReader: () => {
            dispatch(readerActions.closeRequest.build());
        },
        detachReader: () => {
            dispatch(readerActions.detachModeRequest.build());
        },
        displayPublicationInfo: (pubId: string) => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoReader,
                {
                    publicationIdentifier: pubId,
                },
            ));
        },
        setLocator: (locator: LocatorExtended) => {
            dispatch(readerLocalActionSetLocator.build(locator));
        },
        setConfig: (config: ReaderConfig, sessionEnabled: boolean) => {
            dispatch(readerLocalActionSetConfig.build(config));

            if (!sessionEnabled) {

                dispatch(readerActions.configSetDefault.build(config));
            }
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Reader));
