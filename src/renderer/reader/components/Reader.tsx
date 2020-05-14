// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as classNames from "classnames";
import * as jsonDiff from "json-diff";
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
import { PublicationView } from "readium-desktop/common/views/publication";
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
import { diReaderGet } from "readium-desktop/renderer/reader/di";
import {
    TChangeEventOnInput, TChangeEventOnSelect, TFormEvent, TKeyboardEventOnAnchor,
    TMouseEventOnAnchor, TMouseEventOnSpan,
} from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { ContentType } from "readium-desktop/utils/content-type";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
// import { encodeURIComponent_RFC3986 } from "readium-desktop/utils/url";
import { Unsubscribe } from "redux";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { IEventPayload_R2_EVENT_CLIPBOARD_COPY } from "@r2-navigator-js/electron/common/events";
import { IHighlight, IHighlightDefinition } from "@r2-navigator-js/electron/common/highlight";
import { IRangeInfo } from "@r2-navigator-js/electron/common/selection";
import {
    convertHttpUrlToCustomScheme, READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "@r2-navigator-js/electron/common/sessions";
import { uniqueCssSelector } from "@r2-navigator-js/electron/renderer/common/cssselector2";
import {
    highlightsClickListen, highlightsCreate, highlightsRemove, highlightsRemoveAll,
} from "@r2-navigator-js/electron/renderer/highlight";
import {
    getCurrentReadingLocation, handleLinkLocator, handleLinkUrl, installNavigatorDOM,
    isLocatorVisible, LocatorExtended, navLeftOrRight, readiumCssUpdate, setEpubReadingSystemInfo,
    setKeyDownEventHandler, setKeyUpEventHandler, setReadingLocationSaver, ttsListen, ttsNext,
    ttsPause, ttsPlay, ttsPlaybackRate, ttsPrevious, ttsResume, TTSStateEnum, ttsStop,
} from "@r2-navigator-js/electron/renderer/index";
import { reloadContent } from "@r2-navigator-js/electron/renderer/location";
import { convertRange } from "@r2-navigator-js/electron/renderer/webview/selection";
import { Locator as R2Locator } from "@r2-shared-js/models/locator";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { readerLocalActionSetConfig, readerLocalActionSetLocator } from "../redux/actions";
import optionsValues, {
    AdjustableSettingsNumber, IReaderMenuProps, IReaderOptionsProps,
} from "./options-values";

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

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

// https://github.com/lodash/lodash/blob/master/escapeRegExp.js
const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
const reHasRegExpChar = RegExp(reRegExpChar.source);
function escapeRegExp(str: string) {
    return (str && reHasRegExpChar.test(str))
        ? str.replace(reRegExpChar, "\\$&")
        : (str || "");
}

const computeElementCFI = (node: Node): string | undefined => {

    // TODO: handle character position inside text node
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return undefined;
    }

    let cfi = "";

    let currentElement = node as Element;
    while (currentElement.parentNode && currentElement.parentNode.nodeType === Node.ELEMENT_NODE) {

        const currentElementParentChildren = (currentElement.parentNode as Element).children;
        let currentElementIndex = -1;
        for (let i = 0; i < currentElementParentChildren.length; i++) {
            if (currentElement === currentElementParentChildren[i]) {
                currentElementIndex = i;
                break;
            }
        }
        if (currentElementIndex >= 0) {
            const cfiIndex = (currentElementIndex + 1) * 2;
            cfi = cfiIndex +
                (currentElement.id ? ("[" + currentElement.id + "]") : "") +
                (cfi.length ? ("/" + cfi) : "");
        }
        currentElement = currentElement.parentNode as Element;
    }

    return "/" + cfi;
};

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
// https://github.com/lodash/lodash/blob/master/deburr.js
// https://github.com/lodash/lodash/blob/master/.internal/deburrLetter.js
// https://github.com/julmot/mark.js/blob/master/src/lib/regexpcreator.js#L297
// https://github.com/walling/unorm
// https://github.com/andrewrk/node-diacritics/blob/master/index.js
// https://github.com/tyxla/remove-accents/blob/master/index.js
// https://github.com/fedeguzman/remove-accents-diacritics/blob/master/index.js
// https://github.com/kennygrant/sanitize/blob/master/sanitize.go#L216
// tslint:disable-next-line
const unicodeToAsciiMap = {"Ⱥ": "A", "Æ": "AE", "Ꜻ": "AV", "Ɓ": "B", "Ƀ": "B", "Ƃ": "B", "Ƈ": "C", "Ȼ": "C", "Ɗ": "D", "ǲ": "D", "ǅ": "D", "Đ": "D", "Ƌ": "D", "Ǆ": "DZ", "Ɇ": "E", "Ꝫ": "ET", "Ƒ": "F", "Ɠ": "G", "Ǥ": "G", "Ⱨ": "H", "Ħ": "H", "Ɨ": "I", "Ꝺ": "D", "Ꝼ": "F", "Ᵹ": "G", "Ꞃ": "R", "Ꞅ": "S", "Ꞇ": "T", "Ꝭ": "IS", "Ɉ": "J", "Ⱪ": "K", "Ꝃ": "K", "Ƙ": "K", "Ꝁ": "K", "Ꝅ": "K", "Ƚ": "L", "Ⱡ": "L", "Ꝉ": "L", "Ŀ": "L", "Ɫ": "L", "ǈ": "L", "Ł": "L", "Ɱ": "M", "Ɲ": "N", "Ƞ": "N", "ǋ": "N", "Ꝋ": "O", "Ꝍ": "O", "Ɵ": "O", "Ø": "O", "Ƣ": "OI", "Ɛ": "E", "Ɔ": "O", "Ȣ": "OU", "Ꝓ": "P", "Ƥ": "P", "Ꝕ": "P", "Ᵽ": "P", "Ꝑ": "P", "Ꝙ": "Q", "Ꝗ": "Q", "Ɍ": "R", "Ɽ": "R", "Ꜿ": "C", "Ǝ": "E", "Ⱦ": "T", "Ƭ": "T", "Ʈ": "T", "Ŧ": "T", "Ɐ": "A", "Ꞁ": "L", "Ɯ": "M", "Ʌ": "V", "Ꝟ": "V", "Ʋ": "V", "Ⱳ": "W", "Ƴ": "Y", "Ỿ": "Y", "Ɏ": "Y", "Ⱬ": "Z", "Ȥ": "Z", "Ƶ": "Z", "Œ": "OE", "ᴀ": "A", "ᴁ": "AE", "ʙ": "B", "ᴃ": "B", "ᴄ": "C", "ᴅ": "D", "ᴇ": "E", "ꜰ": "F", "ɢ": "G", "ʛ": "G", "ʜ": "H", "ɪ": "I", "ʁ": "R", "ᴊ": "J", "ᴋ": "K", "ʟ": "L", "ᴌ": "L", "ᴍ": "M", "ɴ": "N", "ᴏ": "O", "ɶ": "OE", "ᴐ": "O", "ᴕ": "OU", "ᴘ": "P", "ʀ": "R", "ᴎ": "N", "ᴙ": "R", "ꜱ": "S", "ᴛ": "T", "ⱻ": "E", "ᴚ": "R", "ᴜ": "U", "ᴠ": "V", "ᴡ": "W", "ʏ": "Y", "ᴢ": "Z", "ᶏ": "a", "ẚ": "a", "ⱥ": "a", "æ": "ae", "ꜻ": "av", "ɓ": "b", "ᵬ": "b", "ᶀ": "b", "ƀ": "b", "ƃ": "b", "ɵ": "o", "ɕ": "c", "ƈ": "c", "ȼ": "c", "ȡ": "d", "ɗ": "d", "ᶑ": "d", "ᵭ": "d", "ᶁ": "d", "đ": "d", "ɖ": "d", "ƌ": "d", "ı": "i", "ȷ": "j", "ɟ": "j", "ʄ": "j", "ǆ": "dz", "ⱸ": "e", "ᶒ": "e", "ɇ": "e", "ꝫ": "et", "ƒ": "f", "ᵮ": "f", "ᶂ": "f", "ɠ": "g", "ᶃ": "g", "ǥ": "g", "ⱨ": "h", "ɦ": "h", "ħ": "h", "ƕ": "hv", "ᶖ": "i", "ɨ": "i", "ꝺ": "d", "ꝼ": "f", "ᵹ": "g", "ꞃ": "r", "ꞅ": "s", "ꞇ": "t", "ꝭ": "is", "ʝ": "j", "ɉ": "j", "ⱪ": "k", "ꝃ": "k", "ƙ": "k", "ᶄ": "k", "ꝁ": "k", "ꝅ": "k", "ƚ": "l", "ɬ": "l", "ȴ": "l", "ⱡ": "l", "ꝉ": "l", "ŀ": "l", "ɫ": "l", "ᶅ": "l", "ɭ": "l", "ł": "l", "ſ": "s", "ẜ": "s", "ẝ": "s", "ɱ": "m", "ᵯ": "m", "ᶆ": "m", "ȵ": "n", "ɲ": "n", "ƞ": "n", "ᵰ": "n", "ᶇ": "n", "ɳ": "n", "ꝋ": "o", "ꝍ": "o", "ⱺ": "o", "ø": "o", "ƣ": "oi", "ɛ": "e", "ᶓ": "e", "ɔ": "o", "ᶗ": "o", "ȣ": "ou", "ꝓ": "p", "ƥ": "p", "ᵱ": "p", "ᶈ": "p", "ꝕ": "p", "ᵽ": "p", "ꝑ": "p", "ꝙ": "q", "ʠ": "q", "ɋ": "q", "ꝗ": "q", "ɾ": "r", "ᵳ": "r", "ɼ": "r", "ᵲ": "r", "ᶉ": "r", "ɍ": "r", "ɽ": "r", "ↄ": "c", "ꜿ": "c", "ɘ": "e", "ɿ": "r", "ʂ": "s", "ᵴ": "s", "ᶊ": "s", "ȿ": "s", "ɡ": "g", "ᴑ": "o", "ᴓ": "o", "ᴝ": "u", "ȶ": "t", "ⱦ": "t", "ƭ": "t", "ᵵ": "t", "ƫ": "t", "ʈ": "t", "ŧ": "t", "ᵺ": "th", "ɐ": "a", "ᴂ": "ae", "ǝ": "e", "ᵷ": "g", "ɥ": "h", "ʮ": "h", "ʯ": "h", "ᴉ": "i", "ʞ": "k", "ꞁ": "l", "ɯ": "m", "ɰ": "m", "ᴔ": "oe", "ɹ": "r", "ɻ": "r", "ɺ": "r", "ⱹ": "r", "ʇ": "t", "ʌ": "v", "ʍ": "w", "ʎ": "y", "ᶙ": "u", "ᵫ": "ue", "ꝸ": "um", "ⱴ": "v", "ꝟ": "v", "ʋ": "v", "ᶌ": "v", "ⱱ": "v", "ⱳ": "w", "ᶍ": "x", "ƴ": "y", "ỿ": "y", "ɏ": "y", "ʑ": "z", "ⱬ": "z", "ȥ": "z", "ᵶ": "z", "ᶎ": "z", "ʐ": "z", "ƶ": "z", "ɀ": "z", "œ": "oe", "ₓ": "x"} as any;
const normalizeDiacriticsAndLigatures = (s: string) => {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
    return s.normalize("NFD").
        replace(/[\u0300-\u036f]/g, "").
        replace(/[^\u0000-\u007E]/g, (c) => unicodeToAsciiMap[c] || c);
};
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

    publicationJsonUrl?: string;
    // title?: string;

    publicationView: PublicationView | undefined;
    r2Publication: R2Publication | undefined;

    lcpHint?: string;
    lcpPass?: string;

    contentTableOpen: boolean;
    settingsOpen: boolean;
    shortcutEnable: boolean;
    landmarksOpen: boolean;
    landmarkTabOpen: number;
    menuOpen: boolean;
    fullscreen: boolean;
    ttsState: TTSStateEnum;
    ttsPlaybackRate: string;
    visibleBookmarkList: LocatorView[];
    currentLocation: LocatorExtended;
    bookmarks: LocatorView[] | undefined;

    readerMode: ReaderMode;
}

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

    private ttsWasPlayingBeforeNavigate: boolean;
    private ttsAutoContinuePlayTimeout: number | undefined;

    private pendingHighlights: {
        href: string,
        data: IHighlightDefinition[],
    } = undefined;
    private searchCache: {
        [url: string]: {
            document: Document,
            charLength: number,
        },
    } = {};

    constructor(props: IProps) {
        super(props);

        this.ttsWasPlayingBeforeNavigate = false;

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
            publicationJsonUrl: "HTTP://URL",
            lcpHint: "LCP hint",
            // title: "TITLE",
            lcpPass: "LCP pass",
            contentTableOpen: false,
            settingsOpen: false,
            shortcutEnable: true,
            landmarksOpen: false,
            landmarkTabOpen: 0,

            publicationView: undefined,
            r2Publication: undefined,

            menuOpen: false,
            fullscreen: false,
            ttsState: TTSStateEnum.STOPPED,
            ttsPlaybackRate: "1",
            visibleBookmarkList: [],
            currentLocation: undefined,
            bookmarks: undefined,

            readerMode: ReaderMode.Attached,
        };

        ttsListen((ttss: TTSStateEnum) => {
            // if (ttss === TTSStateEnum.STOPPED) {
            //     this.ttsWasPlayingBeforeNavigate = false;
            // }
            this.setState({ttsState: ttss});
        });

        this.handleTTSPlay = this.handleTTSPlay.bind(this);
        this.handleTTSPause = this.handleTTSPause.bind(this);
        this.handleTTSStop = this.handleTTSStop.bind(this);
        this.handleTTSResume = this.handleTTSResume.bind(this);
        this.handleTTSPrevious = this.handleTTSPrevious.bind(this);
        this.handleTTSNext = this.handleTTSNext.bind(this);
        this.handleTTSPlaybackRate = this.handleTTSPlaybackRate.bind(this);

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

        // setReadiumCssJsonGetter(computeReadiumCssJsonMessage);
    }

    public async componentDidMount() {
        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();

        const store = diReaderGet("store");

        const pubId = store.getState().reader.info.publicationIdentifier;
        const locator = store.getState().reader.locator;
        const manifestUrl = store.getState().reader.info.manifestUrl;
        // const publicationJsonUrl = convertCustomSchemeToHttpUrl(
        //     encodeURIComponent_RFC3986(
        //         convertHttpUrlToCustomScheme(manifestUrl),
        //     ),
        // );
        // const publicationJsonUrl = manifestUrl;
        const publicationJsonUrl = manifestUrl.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL)
            ? manifestUrl : convertHttpUrlToCustomScheme(manifestUrl);

        this.setState({
            publicationJsonUrl,
        });

        setKeyDownEventHandler(keyDownEventHandler);
        setKeyUpEventHandler(keyUpEventHandler);

        // if (lcpHint) {
        //     this.setState({
        //         lcpHint,
        //         lcpPass: this.state.lcpPass + " [" + lcpHint + "]",
        //     });
        // }

        // TODO: this is a short-term hack.
        // Can we instead subscribe to Redux action type == CloseRequest,
        // but narrow it down specically to a reader window instance (not application-wide)
        window.document.addEventListener("Thorium:DialogClose", (_ev: Event) => {
            this.setState({
                shortcutEnable: true,
            });
        });

        // let docHref: string = queryParams.docHref;
        // let docSelector: string = queryParams.docSelector;

        // if (docHref && docSelector) {
        //     // Decode base64
        //     docHref = window.atob(docHref);
        //     docSelector = window.atob(docSelector);
        // }

        // Note that CFI, etc. can optionally be restored too,
        // but navigator currently uses cssSelector as the primary
        // const locator: R2Locator = {
        //     href: docHref,
        //     locations: {
        //         cfi: undefined,
        //         cssSelector: docSelector,
        //         position: undefined,
        //         progression: undefined,
        //     },
        // };

        setReadingLocationSaver(this.handleReadingLocationChange);

        setEpubReadingSystemInfo({ name: _APP_NAME, version: _APP_VERSION });

        this.unsubscribe = apiSubscribe([
            "reader/deleteBookmark",
            "reader/addBookmark",
        ], this.findBookmarks);

        apiAction("publication/get", pubId, false)
            .then(async (publicationView) => {
                this.setState({ publicationView });
                await this.loadPublicationIntoViewport(publicationView, locator.locator);
            })
            .catch((error) => console.error("Error to fetch api publication/get", error));

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
            r2Publication: this.state.r2Publication,
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
            r2Publication: this.state.r2Publication,
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
                        handleMenuClick={this.handleMenuButtonClick}
                        handleSettingsClick={this.handleSettingsClick}
                        fullscreen={this.state.fullscreen}
                        mode={this.state.readerMode}
                        handleFullscreenClick={this.handleFullscreenClick}
                        handleReaderDetach={this.handleReaderDetach}
                        handleReaderClose={this.handleReaderClose}
                        toggleBookmark={ async () => { await this.handleToggleBookmark(false); } }
                        ttsState={this.state.ttsState}
                        ttsPlaybackRate={this.state.ttsPlaybackRate}
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
                    r2Publication={this.state.r2Publication}
                    handleLinkClick={this.handleLinkClick}
                    goToLocator={this.goToLocator}
                />
            </div>
        );
    }

    public setTTSState(ttss: TTSStateEnum) {
        this.setState({ttsState : ttss});
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
        if (this.state.publicationView) {
            // TODO: subscribe to Redux action type == CloseRequest
            // in order to reset shortcutEnable to true? Problem: must be specific to this reader window.
            // So instead we subscribe to DOM event "Thorium:DialogClose", but this is a short-term hack!
            this.setState({
                shortcutEnable: false,
            });
            this.props.displayPublicationInfo(this.state.publicationView.identifier);
        }
    }
    private async ensureHighlights(loc: LocatorExtended) {
        if (this.pendingHighlights && this.pendingHighlights.href === loc.locator.href) {
            highlightsRemoveAll(this.pendingHighlights.href);
            setTimeout(async () => {
                await highlightsCreate(this.pendingHighlights.href, this.pendingHighlights.data);
                this.pendingHighlights = undefined;
            }, 500);
        }
    }
    private async searchTextNode(searchInput: string, n: Node): Promise<ISearchResult[]> {
        let text = n.nodeValue;
        if (!text) {
            return [];
        }
        // text = text.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
        // if (!text.length) {
        //     return [];
        // }
        const originalLength = text.length;
        text = normalizeDiacriticsAndLigatures(text);
        if (text.length !== originalLength) {
            console.log(`###{{{{!!!!! normalizeDiacriticsAndLigatures DIFF ${text.length} !== ${originalLength}`);
        }

        searchInput = cleanupStr(searchInput);
        if (!searchInput.length) {
            return [];
        }

        const regexp = new RegExp(escapeRegExp(normalizeDiacriticsAndLigatures(searchInput)).replace(/ /g, "\\s+"), "gim");

        const searchResults: ISearchResult[] = [];

        const snippetLength = 100;
        const snippetLengthNormalized = 30;

        let matches: RegExpExecArray;
        // tslint:disable-next-line: no-conditional-assignment
        while (matches = regexp.exec(text)) {
            // console.log(matches.input);
            // // console.log(matches);
            // // console.log(JSON.stringify(matches, null, 4));
            // console.log(regexp.lastIndex);
            // console.log(matches.index);
            // console.log(matches[0].length);

            let i = Math.max(0, matches.index - snippetLength);
            let l = Math.min(snippetLength, matches.index);
            let textBefore = collapseWhitespaces(text.substr(i, l));
            textBefore = textBefore.substr(textBefore.length - snippetLengthNormalized);

            i = regexp.lastIndex;
            l = Math.min(snippetLength, text.length - i);
            const textAfter = collapseWhitespaces(text.substr(i, l)).substr(0, snippetLengthNormalized);

            const range = new Range(); // document.createRange()
            range.setStart(n, matches.index);
            range.setEnd(n, matches.index + matches[0].length);
            if (!(n.ownerDocument as any).getCssSelector) {
                (n.ownerDocument as any).getCssSelector = getCssSelector_(n.ownerDocument);
            }
            const rangeInfo = convertRange(range, (n.ownerDocument as any).getCssSelector, computeElementCFI);

            searchResults.push({
                match: collapseWhitespaces(matches[0]),
                textBefore,
                textAfter,
                rangeInfo,
            });
        }

        return searchResults;
    }
    private async searchElement(searchInput: string, el: Element): Promise<ISearchResult[]> {
        let searchResults: ISearchResult[] = [];
        const children = Array.from(el.childNodes);
        for (const child of children) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                searchResults = searchResults.concat(await this.searchElement(searchInput, child as Element));
            } else if (child.nodeType === Node.TEXT_NODE) {
                searchResults = searchResults.concat(await this.searchTextNode(searchInput, child));
            }
        }
        return searchResults;
    }
    private async searchDoc(searchInput: string, doc: Document): Promise<ISearchResult[]> {
        return this.searchElement(searchInput, doc.body);
    }
    private compareSearchResults(r1: ISearchResult[], r2: ISearchResult[]) {
        console.log("Compare search results...");
        let same = true;
        for (let i = 0; i < Math.max(r1.length, r2.length); i++) {
            const res1 = r1[i];
            if (!res1) {
                same = false;
                break;
            }
            const res2 = r2[i];
            if (!res2) {
                same = false;
                break;
            }
            if (res1.match !== res2.match) {
                same = false;
                break;
            }
            if (res1.textAfter !== res2.textAfter) {
                same = false;
                break;
            }
            if (res1.textBefore !== res2.textBefore) {
                same = false;
                break;
            }
            if (res1.rangeInfo.startContainerElementCssSelector !== res2.rangeInfo.startContainerElementCssSelector) {
                same = false;
                break;
            }
            if (res1.rangeInfo.startContainerChildTextNodeIndex !== res2.rangeInfo.startContainerChildTextNodeIndex) {
                same = false;
                break;
            }
            if (res1.rangeInfo.startOffset !== res2.rangeInfo.startOffset) {
                same = false;
                break;
            }
            if (res1.rangeInfo.endContainerElementCssSelector !== res2.rangeInfo.endContainerElementCssSelector) {
                same = false;
                break;
            }
            if (res1.rangeInfo.endContainerChildTextNodeIndex !== res2.rangeInfo.endContainerChildTextNodeIndex) {
                same = false;
                break;
            }
            if (res1.rangeInfo.endOffset !== res2.rangeInfo.endOffset) {
                same = false;
                break;
            }
        }
        if (!same) {
            console.log("€€€€€€€€€€");
            console.log("€€€€€€€€€€");
            console.log("€€€€€€€€€€");
            console.log("€€€€€€€€€€");
            console.log("€€€€€€€€€€");
            console.log("€€€€€€€€€€ Search results not identical!");
            console.log(jsonDiff.diffString({r: r1}, {r: r2}));
        }
    }
    private async searchDocDomSeek(searchInput: string, doc: Document): Promise<ISearchResult[]> {
        let text = doc.body.textContent;
        if (!text) {
            return [];
        }
        // text = text.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
        // if (!text.length) {
        //     return [];
        // }
        const originalLength = text.length;
        text = normalizeDiacriticsAndLigatures(text);
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

        const regexp = new RegExp(escapeRegExp(normalizeDiacriticsAndLigatures(searchInput)).replace(/ /g, "\\s+"), "gim");

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
            const rangeInfo = convertRange(range, (doc as any).getCssSelector, computeElementCFI);

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
        const r2Publication = this.state.r2Publication;

        if (!r2Publication.Spine) {
            console.log("No spine.");
            return;
        }

        // const totalTime1 = [0, 0];
        // const totalTime2 = [0, 0];

        const timeTotal = process.hrtime();

        const bypass = true;

        for (const link of r2Publication.Spine) {
            if (!link.TypeLink || !link.TypeLink.includes("html")) {
                continue;
            }
            const url = new URL(link.Href, this.state.publicationJsonUrl);
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

                const xmlDom = (new DOMParser()).parseFromString(linkText, ContentType.TextXml);
                this.searchCache[urlStr] = {
                    document: xmlDom,
                    charLength: linkText.length,
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
            const searchResults1 = bypass ? [] : await this.searchDoc(searchInput, this.searchCache[urlStr].document);
            // const diff1 = process.hrtime(time1);
            // console.log(`${p} (1) __ ${diff1[0]} seconds + ${diff1[1]} nanoseconds`);
            // totalTime1[0] += diff1[0];
            // totalTime1[1] += diff1[1];

            // const time2 = process.hrtime();
            const searchResults2 =
                await this.searchDocDomSeek(searchInput, this.searchCache[urlStr].document);
            // const diff2 = process.hrtime(time2);
            // console.log(`${p} (2) __ ${diff2[0]} seconds + ${diff2[1]} nanoseconds`);
            // totalTime2[0] += diff2[0];
            // totalTime2[1] += diff2[1];

            if (!bypass) {
                this.compareSearchResults(searchResults1, searchResults2);
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
                        handleLinkLocator(locator);
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

        const timeTotalElapsed = process.hrtime(timeTotal);
        console.log(`__ TOTAL: ${timeTotalElapsed[0]} seconds + ${timeTotalElapsed[1]} nanoseconds`);

        // console.log("_________________________________");
        // if (!bypass) {
        //     console.log(`__ TOTAL 1 ${totalTime1[0]} seconds + ${totalTime1[1]} nanoseconds`);
        // }
        // console.log(`__ TOTAL 2 ${totalTime2[0]} seconds + ${totalTime2[1]} nanoseconds`);
        // console.log("_________________________________");
    }

    private async loadPublicationIntoViewport(
        publicationView: PublicationView,
        locator: R2Locator) {

        highlightsClickListen((href: string, highlight: IHighlight) => {
            highlightsRemove(href, [highlight.id]);
        });

        // let response: Response;
        // try {
        //     // https://github.com/electron/electron/blob/v3.0.0/docs/api/breaking-changes.md#webframe
        //     // queryParams.pub is READIUM2_ELECTRON_HTTP_PROTOCOL (see convertCustomSchemeToHttpUrl)
        //     // publicationJsonUrl is https://127.0.0.1:PORT
        //     response = await fetch(publicationJsonUrl);
        // } catch (e) {
        //     console.log(e);
        //     return;
        // }
        // if (!response.ok) {
        //     console.log("BAD RESPONSE?!");
        // }
        // let r2PublicationJson: any;
        // try {
        //     r2PublicationJson = await response.json();
        // } catch (e) {
        //     console.log(e);
        //     return;
        // }
        // const r2Publication = TaJsonDeserialize<R2Publication>(r2PublicationJson, R2Publication);
        const r2PublicationStr = Buffer.from(publicationView.r2PublicationBase64, "base64").toString("utf-8");
        const r2PublicationJson = JSON.parse(r2PublicationStr);
        const r2Publication = TaJsonDeserialize<R2Publication>(r2PublicationJson, R2Publication);
        this.setState({ r2Publication });

        if (r2Publication.Metadata && r2Publication.Metadata.Title) {
            const title = this.props.translator.translateContentField(r2Publication.Metadata.Title);

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

        const clipboardInterceptor = !publicationView.lcp ? undefined :
            (clipboardData: IEventPayload_R2_EVENT_CLIPBOARD_COPY) => {
                apiAction("reader/clipboardCopy", this.props.pubId, clipboardData)
                    .catch((error) => console.error("Error to fetch api reader/clipboardCopy", error));
            };

        const store = diReaderGet("store");
        const winId = store.getState().win.identifier;

        installNavigatorDOM(
            r2Publication,
            this.state.publicationJsonUrl,
            "publication_viewport",
            preloadPath,
            locator,
            true,
            clipboardInterceptor,
            winId,
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
        //        this.props.setLastReadingLocation(queryParams.pubId, loc.locator);
        // apiAction("reader/setLastReadingLocation", this.props.pubId, loc.locator)
        //     .catch((error) => console.error("Error to fetch api reader/setLastReadingLocation", error));
        this.props.setLocator(loc);
    }

    private async handleReadingLocationChange(loc: LocatorExtended) {

        this.findBookmarks();
        this.saveReadingLocation(loc);
        this.setState({ currentLocation: getCurrentReadingLocation() });
        // No need to explicitly refresh the bookmarks status here,
        // as componentDidUpdate() will call the function after setState():
        // await this.checkBookmarks();

        if (this.ttsWasPlayingBeforeNavigate) {
            this.ttsWasPlayingBeforeNavigate = false;

            if (this.ttsAutoContinuePlayTimeout) {
                clearTimeout(this.ttsAutoContinuePlayTimeout);
            }
            this.ttsAutoContinuePlayTimeout = window.setTimeout(() => {
                this.ttsAutoContinuePlayTimeout = undefined;
                this.handleTTSPlay();
            }, 500);
        }

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
                if (this.state.r2Publication) { // isLocatorVisible() API only once navigator ready
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

    private ensureTTSStateDuringNavigation(): boolean {
        const wasPlaying = this.state.ttsState === TTSStateEnum.PLAYING;
        const wasPaused = this.state.ttsState === TTSStateEnum.PAUSED;

        if (wasPaused || wasPlaying) {
            this.handleTTSStop();
            this.setState({ ttsState: TTSStateEnum.STOPPED }); // because not emmitted when switching docs
        }

        this.ttsWasPlayingBeforeNavigate = this.ttsAutoContinuePlayTimeout ? true : wasPaused || wasPlaying;
        return wasPaused || wasPlaying;
    }

    private navLeftOrRight_(left: boolean, spineNav?: boolean) {
        const wasPlaying = this.state.ttsState === TTSStateEnum.PLAYING;
        const wasPaused = this.state.ttsState === TTSStateEnum.PAUSED;

        if (this.ttsAutoContinuePlayTimeout || wasPaused || wasPlaying) {
            // if (left) {
            //     this.handleTTSPrevious();
            // } else {
            //     this.handleTTSNext();
            // }
            const wasStopped = this.ensureTTSStateDuringNavigation();
            const timeout = wasStopped ? 500 : 0;
            window.setTimeout(() => {
                navLeftOrRight(left, true);
            }, timeout);
        } else {
            this.ttsWasPlayingBeforeNavigate = false;
            navLeftOrRight(left, spineNav);
        }
    }

    private goToLocator(locator: R2Locator) {
        this.focusMainAreaLandmarkAndCloseMenu();

        const wasStopped = this.ensureTTSStateDuringNavigation();
        const timeout = wasStopped ? 500 : 0;
        window.setTimeout(() => {
            handleLinkLocator(locator);
        }, timeout);
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

        const wasStopped = this.ensureTTSStateDuringNavigation();
        const newUrl = this.state.publicationJsonUrl + "/../" + url;
        const timeout = wasStopped ? 500 : 0;
        window.setTimeout(() => {
            handleLinkUrl(newUrl);
        }, timeout);
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
        ttsPlay(parseFloat(this.state.ttsPlaybackRate));
    }
    private handleTTSPause() {
        this.ttsWasPlayingBeforeNavigate = false;
        if (this.ttsAutoContinuePlayTimeout) {
            clearTimeout(this.ttsAutoContinuePlayTimeout);
        }
        ttsPause();
    }
    private handleTTSStop() {
        this.ttsWasPlayingBeforeNavigate = false;
        if (this.ttsAutoContinuePlayTimeout) {
            clearTimeout(this.ttsAutoContinuePlayTimeout);
        }
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

    private handleSettingsSave(readerConfig: ReaderConfig) {
        this.props.setConfig(readerConfig);

        if (this.state.r2Publication) {
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

    return {
        readerInfo: state.reader.info,
        readerConfig: state.reader.config,
        indexes,
        keyboardShortcuts: state.keyboard.shortcuts,
        infoOpen: state.dialog.open &&
            state.dialog.type === DialogTypeName.PublicationInfoReader,
        pubId: state.reader.info.publicationIdentifier,
        locator: state.reader.locator,
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
        setConfig: (config: ReaderConfig) => {
            dispatch(readerLocalActionSetConfig.build(config));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Reader));
