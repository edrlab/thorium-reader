// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.scss";
import * as stylesReaderFooter from "readium-desktop/renderer/assets/styles/components/readerFooter.scss";

// import { contextBridge } from "electron";
import { ipcRenderer } from "electron";
import classNames from "classnames";
import divinaPlayer from "divina-player-js";
import * as path from "path";
import * as r from "ramda";
import * as React from "react";
import { connect } from "react-redux";
import { computeReadiumCssJsonMessage } from "readium-desktop/common/computeReadiumCssJsonMessage";
import { isDivinaFn, isPdfFn } from "readium-desktop/common/isManifestType";
import { DEBUG_KEYBOARD, keyboardShortcutsMatch } from "readium-desktop/common/keyboard";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import {
    ReaderConfig,
} from "readium-desktop/common/models/reader";
import { ToastType } from "readium-desktop/common/models/toast";
import { dialogActions, readerActions, toastActions } from "readium-desktop/common/redux/actions";
import {
    IBookmarkState, IBookmarkStateWithoutUUID,
} from "readium-desktop/common/redux/states/bookmark";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { ok } from "readium-desktop/common/utils/assert";
import { formatTime } from "readium-desktop/common/utils/time";
import {
    _APP_NAME, _APP_VERSION, _DIST_RELATIVE_URL, _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL,
    IS_DEV,
} from "readium-desktop/preprocessor-directives";
import * as DoubleArrowDownIcon from "readium-desktop/renderer/assets/icons/double_arrow_down_black_24dp.svg";
import * as DoubleArrowLeftIcon from "readium-desktop/renderer/assets/icons/double_arrow_left_black_24dp.svg";
import * as DoubleArrowRightIcon from "readium-desktop/renderer/assets/icons/double_arrow_right_black_24dp.svg";
import * as DoubleArrowUpIcon from "readium-desktop/renderer/assets/icons/double_arrow_up_black_24dp.svg";
import * as exitZenModeIcon from "readium-desktop/renderer/assets/icons/fullscreenExit-icon.svg";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SkipLink from "readium-desktop/renderer/common/components/SkipLink";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    ensureKeyboardListenerIsInstalled, keyDownEventHandler, keyUpEventHandler,
    registerKeyboardListener, unregisterKeyboardListener,
} from "readium-desktop/renderer/common/keyboard";
import ReaderFooter from "readium-desktop/renderer/reader/components/ReaderFooter";
import ReaderHeader from "readium-desktop/renderer/reader/components/ReaderHeader";
import {
    TKeyboardEventOnAnchor, TMouseEventOnAnchor,
    TMouseEventOnSpan,
} from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { mimeTypes } from "readium-desktop/utils/mimeTypes";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
import { Unsubscribe } from "redux";

import { IEventPayload_R2_EVENT_CLIPBOARD_COPY, IEventPayload_R2_EVENT_LINK, R2_EVENT_LINK } from "@r2-navigator-js/electron/common/events";
import {
    convertCustomSchemeToHttpUrl, READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "@r2-navigator-js/electron/common/sessions";
import {
    audioForward, audioPause, audioRewind, audioTogglePlayPause,
} from "@r2-navigator-js/electron/renderer/audiobook";
import {
    getCurrentReadingLocation, handleLinkLocator as r2HandleLinkLocator, handleLinkUrl as r2HandleLinkUrl, installNavigatorDOM,
    isLocatorVisible, LocatorExtended, mediaOverlaysClickEnable, mediaOverlaysEnableCaptionsMode,
    mediaOverlaysEnableSkippability, mediaOverlaysNext, mediaOverlaysPause,
    mediaOverlaysPlay, mediaOverlaysPlaybackRate, mediaOverlaysPrevious, mediaOverlaysResume,
    MediaOverlaysStateEnum, mediaOverlaysStop, navLeftOrRight,
    setEpubReadingSystemInfo, setKeyDownEventHandler, setKeyUpEventHandler,
    setReadingLocationSaver, ttsClickEnable, ttsNext, ttsOverlayEnable, ttsPause,
    ttsPlay, ttsPlaybackRate, ttsPrevious, ttsResume, ttsSkippabilityEnable, ttsSentenceDetectionEnable, TTSStateEnum,
    ttsStop, ttsVoice, highlightsClickListen,
    // stealFocusDisable,
    keyboardFocusRequest,
    setImageClickHandler,
} from "@r2-navigator-js/electron/renderer/index";
import { Locator as R2Locator } from "@r2-navigator-js/electron/common/locator";

import { TToc } from "../pdf/common/pdfReader.type";
import { pdfMount } from "../pdf/driver";
import {
    readerLocalActionAnnotations,
    readerLocalActionDivina, readerLocalActionSetConfig,
    readerLocalActionSetLocator,
} from "../redux/actions";
import { TdivinaReadingMode, defaultReadingMode } from "readium-desktop/common/redux/states/renderer/divina";
import optionsValues, {
    AdjustableSettingsNumber, IReaderMenuProps, IReaderSettingsProps, isDivinaReadingMode,
} from "./options-values";
import { URL_PARAM_CLIPBOARD_INTERCEPT, URL_PARAM_CSS, URL_PARAM_DEBUG_VISUALS, URL_PARAM_EPUBREADINGSYSTEM, URL_PARAM_GOTO, URL_PARAM_GOTO_DOM_RANGE, URL_PARAM_IS_IFRAME, URL_PARAM_PREVIOUS, URL_PARAM_REFRESH, URL_PARAM_SECOND_WEBVIEW, URL_PARAM_SESSION_INFO, URL_PARAM_WEBVIEW_SLOT } from "@r2-navigator-js/electron/renderer/common/url-params";

import * as ArrowRightIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as ArrowLeftIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_left_ios-24px.svg";
import { isAudiobookFn } from "readium-desktop/common/isManifestType";

import { createOrGetPdfEventBus } from "readium-desktop/renderer/reader/pdf/driver";

import { winActions } from "readium-desktop/renderer/common/redux/actions";
import { apiDispatch } from "readium-desktop/renderer/common/redux/api/api";
import { MiniLocatorExtended, minimizeLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { translateContentFieldHelper } from "readium-desktop/common/services/translator";
import { getStore } from "../createStore";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL } from "readium-desktop/common/streamerProtocol";


import DOMPurify from "dompurify";
import { marked } from "marked";
// import {
//   AutoProcessor,
//   AutoModelForVision2Seq,
//   TextStreamer,
//   InterruptableStoppingCriteria,
//   load_image,
//   RawImage,
//   Processor,
//   PreTrainedModel,
// } from "@huggingface/transformers";
// let aiProcessor: Processor | undefined;
// let aiModel: PreTrainedModel | undefined;

function throttle(callback: (...args: any) => void, limit: number) {
    let waiting = false;
    return function(this: any) {
        if (!waiting) {
            // eslint-disable-next-line prefer-rest-params
            callback.apply(this, arguments);
            waiting = true;
            setTimeout(() => {
                waiting = false;
            }, limit);
        }
    };
}

// contextBridge.exposeInMainWorld("electronContextBridgeAPI", {
//     demoAI: (href: string) => ipcRenderer.invoke("R2_EVENT_IMAGE_CLICK", href),
// });

// TODO: key not used but translation kept for potential future use
// discard some not used key from i18n-scan cmd
// translate("catalog.sort")
// translate("catalog.emptyTagList")
// translate("reader.picker.search.results")

interface IWindowHistory extends History {
    _readerInstance: Reader | undefined;
    _length: number | undefined;
}
const windowHistory = window.history as IWindowHistory;

// see r2-navigator-js src/electron/renderer/location.ts
ipcRenderer.on(R2_EVENT_LINK, (event: Electron.IpcRendererEvent, payload: IEventPayload_R2_EVENT_LINK) => {
    console.log("R2_EVENT_LINK (ipcRenderer.on READER.TSX)");
    // see ipcRenderer.emit(R2_EVENT_LINK...) special case!
    const pay = (!payload && (event as unknown as IEventPayload_R2_EVENT_LINK).url) ? event as unknown as IEventPayload_R2_EVENT_LINK : payload;
    console.log(pay.url);
    handleLinkUrl_UpdateHistoryState(pay.url);
});

const handleLinkUrl_UpdateHistoryState = (url: string, isFromOnPopState = false) => {
    if (!windowHistory._length) {
        windowHistory._length = 0;
    }

    if (!isFromOnPopState) {
        let url_ = url;
        try {
            const u = new URL(url);
            u.searchParams.delete(URL_PARAM_SESSION_INFO);
            u.searchParams.delete(URL_PARAM_IS_IFRAME);
            u.searchParams.delete(URL_PARAM_PREVIOUS);
            u.searchParams.delete(URL_PARAM_GOTO);
            u.searchParams.delete(URL_PARAM_GOTO_DOM_RANGE);
            u.searchParams.delete(URL_PARAM_CSS);
            u.searchParams.delete(URL_PARAM_EPUBREADINGSYSTEM);
            u.searchParams.delete(URL_PARAM_DEBUG_VISUALS);
            u.searchParams.delete(URL_PARAM_CLIPBOARD_INTERCEPT);
            u.searchParams.delete(URL_PARAM_REFRESH);
            u.searchParams.delete(URL_PARAM_WEBVIEW_SLOT);
            u.searchParams.delete(URL_PARAM_SECOND_WEBVIEW);
            url_ = u.toString();
        } catch (ex) {
            console.log(ex);
        }
        // console.log("#+$%".repeat(5)  + " handleLinkClick history pushState()", JSON.stringify(url), JSON.stringify(url_), JSON.stringify(document.location), JSON.stringify(window.location), JSON.stringify(window.history.state), window.history.length, windowHistory._length);

        // if (/https?:\/\//.test(url_)) {
        if (!url_.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://") &&
            !url_.startsWith(THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
            console.log(">> HISTORY POP STATE SKIP URL (1)", url_);
            return;
        }
        // console.log(">> HISTORY POP STATE DO URL (1)", url_);

        if (window.history.state?.data === url_) {
            window.history.replaceState({ data: url_, index: windowHistory._length - 1 }, "");
        } else {
            windowHistory._length++;
            window.history.pushState({ data: url_, index: windowHistory._length - 1 }, "");
        }
        if (windowHistory._readerInstance) {
            windowHistory._readerInstance.setState({ historyCanGoForward: false, historyCanGoBack: windowHistory._length > 1 });
        }
    }
};

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

const isDivinaLocation = (data: any): data is { pageIndex: number | undefined, nbOfPages: number | undefined, locator: R2Locator } => {

    // isDivinaLocationduck typing hack with totalProgression injection!!
    const isDivina = typeof data === "object"
        // && typeof data.pageIndex === "number"
        // && typeof data.nbOfPages === "number"
        && typeof data.locator === "object"
        && typeof (data.locator as R2Locator).href === "string"
        && typeof (data.locator as R2Locator).locations === "object"
        && typeof (data.locator as R2Locator).locations.position === "number"
        // && typeof (data.locator as R2Locator).locations.progression === "number"
        && typeof ((data.locator as R2Locator).locations as any).totalProgression === "number"
        && ((data.locator as R2Locator).locations as any).totalProgression >= 0
        && ((data.locator as R2Locator).locations as any).totalProgression <= 1
        ;
    if (isDivina) {
        (data.locator as R2Locator).locations.progression = ((data.locator as R2Locator).locations as any).totalProgression;
    }
    return isDivina;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    publicationImageURL: string | undefined;
    publicationImageDESCRIPTION: string | undefined;

    contentTableOpen: boolean;
    settingsOpen: boolean;
    shortcutEnable: boolean;
    landmarksOpen: boolean;
    landmarkTabOpen: number;
    menuOpen: boolean;
    doFocus: number;
    fullscreen: boolean;
    zenMode: boolean;

    visibleBookmarkList: IBookmarkState[];
    currentLocation: MiniLocatorExtended;

    divinaReadingModeSupported: TdivinaReadingMode[];
    divinaNumberOfPages: number;
    divinaArrowEnabled: boolean;
    divinaContinousEqualTrue: boolean;

    pdfPlayerToc: TToc | undefined;
    pdfPlayerNumberOfPages: number | undefined;

    // openedSectionSettings: number | undefined;
    openedSectionMenu: string;
    annotationUUID: string;

    historyCanGoBack: boolean;
    historyCanGoForward: boolean;

    // bookmarkMessage: string | undefined;
}

class Reader extends React.Component<IProps, IState> {

    private fastLinkRef: React.RefObject<HTMLAnchorElement>;
    private refToolbar: React.RefObject<HTMLAnchorElement>;
    private mainElRef: React.RefObject<HTMLDivElement>;

    private currentDivinaPlayer: any;

    // can be get back wwith withTranslator HOC
    // to remove
    // @lazyInject(diRendererSymbolTable.translator)
    // private translator: Translator;

    private unsubscribe: Unsubscribe;

    private ttsOverlayEnableNeedsSync: boolean;

    private setStateThrottled(state: Pick<IState, "publicationImageDESCRIPTION">) {
        this.setState(state);
    }

    private imageDescriptionStream(_ev: any, txt: string, reset: boolean) {
        const onePixelImageDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        setTimeout(async () => {
            const tt = (reset ? "" : (this.state.publicationImageDESCRIPTION?.substring(0, this.state.publicationImageDESCRIPTION.indexOf("<!--XxX-->")) || "")) + txt;
            this.setState({
                publicationImageDESCRIPTION: (reset ? DOMPurify.sanitize(await marked.parse(tt.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ""), {
                    async: true,
                    pedantic: false,
                    gfm: true,
                    breaks: true,
                })).replace(/<a /g, "<u ").replace(/<\/a>/g, "</u>") : DOMPurify.sanitize(tt))
                + (reset ? `\n<img src="${onePixelImageDataURL}" onload="if (this.parentNode?.scrollHeight) this.parentNode.scrollTop=0">`
                    : `<!--XxX-->\n\n<hr><img src="${onePixelImageDataURL}" onload="/* this.focus({preventScroll:false,focusVisible:false}); */ if (this.parentNode?.scrollHeight) this.parentNode.scrollTop=this.parentNode.scrollHeight">`),
            });
        });
    }

    constructor(props: IProps) {
        super(props);

        this.setStateThrottled = throttle(this.setStateThrottled, 1000).bind(this);
        this.imageDescriptionStream = this.imageDescriptionStream.bind(this);

        this.ttsOverlayEnableNeedsSync = true;

        this.onKeyboardHistoryNavigationPrevious = this.onKeyboardHistoryNavigationPrevious.bind(this);
        this.onKeyboardHistoryNavigationNext = this.onKeyboardHistoryNavigationNext.bind(this);
        this.onKeyboardPageNavigationPrevious = this.onKeyboardPageNavigationPrevious.bind(this);
        this.onKeyboardPageNavigationNext = this.onKeyboardPageNavigationNext.bind(this);
        this.onKeyboardSpineNavigationPrevious = this.onKeyboardSpineNavigationPrevious.bind(this);
        this.onKeyboardSpineNavigationNext = this.onKeyboardSpineNavigationNext.bind(this);
        this.onKeyboardFocusMain = this.onKeyboardFocusMain.bind(this);
        this.onKeyboardFocusMainDeep = this.onKeyboardFocusMainDeep.bind(this);
        this.onKeyboardFocusToolbar = this.onKeyboardFocusToolbar.bind(this);
        this.onKeyboardFullScreen = this.onKeyboardFullScreen.bind(this);
        this.onKeyboardBookmark = this.onKeyboardBookmark.bind(this);
        this.onKeyboardInfo = this.onKeyboardInfo.bind(this);
        this.onKeyboardInfoWhereAmI = this.onKeyboardInfoWhereAmI.bind(this);
        this.onKeyboardInfoWhereAmISpeak = this.onKeyboardInfoWhereAmISpeak.bind(this);
        this.onKeyboardFocusSettings = this.onKeyboardFocusSettings.bind(this);
        this.onKeyboardFocusNav = this.onKeyboardFocusNav.bind(this);
        this.onKeyboardAnnotationMargin = this.onKeyboardAnnotationMargin.bind(this);
        this.onKeyboardAnnotation = this.onKeyboardAnnotation.bind(this);
        this.onKeyboardQuickAnnotation = this.onKeyboardQuickAnnotation.bind(this);
        this.navLeftOrRight_.bind(this);
        this.onKeyboardNavigationToBegin.bind(this);
        this.onKeyboardNavigationToEnd.bind(this);

        this.onPopState = this.onPopState.bind(this);

        this.fastLinkRef = React.createRef<HTMLAnchorElement>();
        this.refToolbar = React.createRef<HTMLAnchorElement>();
        this.mainElRef = React.createRef<HTMLDivElement>();

        this.state = {
            publicationImageURL: undefined,
            publicationImageDESCRIPTION: undefined,

            // bookmarkMessage: undefined,

            contentTableOpen: false,
            settingsOpen: false,
            shortcutEnable: true,
            landmarksOpen: false,
            landmarkTabOpen: 0,

            menuOpen: false,
            fullscreen: false,
            zenMode: false,

            visibleBookmarkList: [],
            currentLocation: undefined,

            divinaNumberOfPages: 0,
            divinaReadingModeSupported: [],

            pdfPlayerToc: undefined,
            pdfPlayerNumberOfPages: undefined,

            // openedSectionSettings: undefined,
            openedSectionMenu: "tab-toc",
            annotationUUID: "",

            divinaArrowEnabled: true,
            divinaContinousEqualTrue: false,

            historyCanGoBack: false,
            historyCanGoForward: false,

            doFocus: 1,
        };

        this.handleTTSPlay = this.handleTTSPlay.bind(this);
        this.handleTTSPause = this.handleTTSPause.bind(this);
        this.handleTTSStop = this.handleTTSStop.bind(this);
        this.handleTTSResume = this.handleTTSResume.bind(this);
        this.handleTTSPrevious = this.handleTTSPrevious.bind(this);
        this.handleTTSNext = this.handleTTSNext.bind(this);
        this.handleTTSPlaybackRate = this.handleTTSPlaybackRate.bind(this);
        this.handleTTSVoice = this.handleTTSVoice.bind(this);

        this.handleMediaOverlaysPlay = this.handleMediaOverlaysPlay.bind(this);
        this.handleMediaOverlaysPause = this.handleMediaOverlaysPause.bind(this);
        this.handleMediaOverlaysStop = this.handleMediaOverlaysStop.bind(this);
        this.handleMediaOverlaysResume = this.handleMediaOverlaysResume.bind(this);
        this.handleMediaOverlaysPrevious = this.handleMediaOverlaysPrevious.bind(this);
        this.handleMediaOverlaysNext = this.handleMediaOverlaysNext.bind(this);
        this.handleMediaOverlaysPlaybackRate = this.handleMediaOverlaysPlaybackRate.bind(this);

        this.showSearchResults = this.showSearchResults.bind(this);
        this.onKeyboardShowGotoPage = this.onKeyboardShowGotoPage.bind(this);
        this.onKeyboardShowTOC = this.onKeyboardShowTOC.bind(this);

        this.handleMenuButtonClick = this.handleMenuButtonClick.bind(this);
        this.handleSettingsClick = this.handleSettingsClick.bind(this);
        this.handleFullscreenClick = this.handleFullscreenClick.bind(this);
        this.handleReaderClose = this.handleReaderClose.bind(this);
        this.handleReaderDetach = this.handleReaderDetach.bind(this);
        this.handleReadingLocationChange = this.handleReadingLocationChange.bind(this);
        this.handleToggleBookmark = this.handleToggleBookmark.bind(this);
        this.goToLocator = this.goToLocator.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
        this.handlePublicationInfo = this.handlePublicationInfo.bind(this);

        this.handleDivinaSound = this.handleDivinaSound.bind(this);

        this.isRTLFlip = this.isRTLFlip.bind(this);
    }

    public async componentDidMount() {

        ipcRenderer.on("R2_EVENT_IMAGE_CLICK", this.imageDescriptionStream);

        windowHistory._readerInstance = this;

        const store = getStore(); // diRendererSymbolTable.store
        document.body.setAttribute("data-theme", store.getState().theme.name);

        const handleMouseKeyboard = (isKey: boolean) => {

            if (_mouseMoveTimeout) {
                window.clearTimeout(_mouseMoveTimeout);
                _mouseMoveTimeout = undefined;
            }
            window.document.documentElement.classList.remove("HIDE_CURSOR_CLASS");

            const nav = window.document.querySelector(`.${stylesReader.main_navigation}`);
            if (nav) {
                nav.classList.remove(stylesReader.HIDE_CURSOR_CLASS_head);
            }
            const foot = window.document.querySelector(`.${stylesReaderFooter.reader_footer}`);
            if (foot) {
                foot.classList.remove(stylesReaderFooter.HIDE_CURSOR_CLASS_foot);
            }

            // if (!window.document.fullscreenElement && !window.document.fullscreen) {
            if (!this.state.fullscreen) {
                return;
            }

            if (isKey) {
                return;
            }

            _mouseMoveTimeout = window.setTimeout(() => {
                window.document.documentElement.classList.add("HIDE_CURSOR_CLASS");
                const nav = window.document.querySelector(`.${stylesReader.main_navigation}`);
                if (nav) {
                    nav.classList.add(stylesReader.HIDE_CURSOR_CLASS_head);
                }
                const foot = window.document.querySelector(`.${stylesReaderFooter.reader_footer}`);
                if (foot) {
                    foot.classList.add(stylesReaderFooter.HIDE_CURSOR_CLASS_foot);
                }
            }, 1000);
        };

        let _mouseMoveTimeout: number | undefined;
        window.document.addEventListener("keydown", (_ev: KeyboardEvent) => {
            handleMouseKeyboard(true);
        }, {
            once: false,
            passive: false,
            capture: true,
        });
        window.document.documentElement.addEventListener("mousemove", (_ev: MouseEvent) => {
            handleMouseKeyboard(false);
        });

        // TODO: this is a short-term hack.
        // Can we instead subscribe to Redux action type == CloseRequest,
        // but narrow it down specically to a reader window instance (not application-wide)
        window.document.addEventListener("Thorium:DialogClose", (_ev: Event) => {
            this.setState({
                shortcutEnable: true,
            });
        });

        ensureKeyboardListenerIsInstalled();
        this.registerAllKeyboardListeners();

        window.addEventListener("popstate", this.onPopState);

        if (this.props.isPdf) {

            this.loadPublicationIntoViewport();

            createOrGetPdfEventBus().subscribe("page",
                (pageIndex) => {
                    // const numberOfPages = this.props.r2Publication?.Metadata?.NumberOfPages;
                    const locatorExtended: LocatorExtended = {
                        audioPlaybackInfo: undefined,
                        paginationInfo: undefined,
                        selectionInfo: undefined,
                        selectionIsNew: undefined,
                        docInfo: undefined,
                        epubPage: undefined,
                        epubPageID: undefined,
                        headings: undefined,
                        secondWebViewHref: undefined,
                        followingElementIDs: undefined,
                        locator: {
                            href: pageIndex.toString(),
                            locations: {
                                position: parseInt(pageIndex, 10),
                                // progression: numberOfPages ? (pageIndex / numberOfPages) : 0,
                                progression: 0,
                            },
                        },
                    };

                    console.log("pdf pageChange", pageIndex);

                    this.handleReadingLocationChange(locatorExtended);
                });

            const page = this.props.locator?.locator?.href || "";
            console.log("pdf page index", page);

            createOrGetPdfEventBus().subscribe("ready", () => {
                createOrGetPdfEventBus().dispatch("page", page);
            });


        } else if (this.props.isDivina) {

            this.loadPublicationIntoViewport();

            if (this.currentDivinaPlayer) {

                // let pageChangeEventDropFirst = false;
                // this.currentDivinaPlayer.eventEmitter.on("pagechange", (data: any) => {
                //     console.log("DIVINA: 'pagechange'", data);

                //     if (pageChangeEventDropFirst) {
                //         this.divinaSetLocation(data);
                //         console.log("PAGECHANGE setLocation not the first event");

                //     } else {
                //         pageChangeEventDropFirst = true;
                //         console.log("PAGECHANGE drop first");
                //     }

                // });

                this.currentDivinaPlayer.eventEmitter.on(
                    "initialload",
                    () => {

                        console.log("divina loaded");
                        // // nextTick update
                        // setTimeout(() => {

                        //     try {

                        //         const index = parseInt(this.props.locator?.locator?.href, 10);
                        //         if (typeof index !== "undefined" && index >= 0) {
                        //             console.log("index divina", index);
                        //             this.currentDivinaPlayer.goToPageWithIndex(index);
                        //         }
                        //     } catch (e) {
                        //         // ignore
                        //         console.log("currentDivinaPlayer.goToPageWithIndex", e);
                        //     }

                        // }, 0);

                        // Locator injected at initialization

                    },
                );

            } else {
                console.log("divinaPlayer not loaded");
            }
        } else {
            setKeyDownEventHandler(keyDownEventHandler);
            setKeyUpEventHandler(keyUpEventHandler);
            if (IS_DEV && process.env.THORIUM_IMAGE_CLICK)
            setImageClickHandler((href: string) => {
                console.log("R2_EVENT_IMAGE_CLICK (Thorium) href: " + href);
                this.setState({
                    publicationImageURL: href,
                    publicationImageDESCRIPTION: undefined,
                });
            });
            setReadingLocationSaver(this.handleReadingLocationChange);
            setEpubReadingSystemInfo({ name: _APP_NAME, version: _APP_VERSION });
            this.loadPublicationIntoViewport();
        }

        // sets state visibleBookmarkList
        await this.updateVisibleBookmarks();


        highlightsClickListen((href, highlight, event) => {

            if (highlight.group !== "annotation") {
                if (typeof (window as any).__hightlightClickChannelEmitFn === "function") {
                    (window as any).__hightlightClickChannelEmitFn([href, highlight, event]);
                }
                return ;
            }

            console.log("HIGHLIGHT Click from Reader.tsx");
            console.log(`href: ${href} | highlight: ${JSON.stringify(highlight, null, 4)} | event : ${JSON.stringify(event)}`);

            const store = getStore();
            const mounterStateMap = store.getState()?.reader.highlight.mounter;
            if (!mounterStateMap?.length) {
                console.log(`highlightsClickListen MOUNTER STATE EMPTY -- mounterStateMap: [${JSON.stringify(mounterStateMap, null, 4)}]`);
                return;
            }

            const mounterStateItem = mounterStateMap.find(([_uuid, mounterState]) => mounterState.ref.id === highlight.id && mounterState.href === href);

            if (!mounterStateItem) {
                console.log(`highlightsClickListen CANNOT FIND MOUNTER -- href: [${href}] ref.id: [${highlight.id}] mounterStateMap: [${JSON.stringify(mounterStateMap, null, 4)}]`);
                return;
            }

            const [mounterStateItemUuid] = mounterStateItem; // mounterStateItem[0]

            const handlerStateMap = store.getState()?.reader.highlight.handler;
            if (!handlerStateMap?.length) {
                console.log(`highlightsClickListen HANDLER STATE EMPTY -- handlerStateMap: [${JSON.stringify(handlerStateMap, null, 4)}]`);
                return;
            }

            const handlerStateItem = handlerStateMap.find(([uuid, _handlerState]) => uuid === mounterStateItemUuid);

            if (!handlerStateItem) {
                console.log(`dispatchClick CANNOT FIND HANDLER -- uuid: [${mounterStateItemUuid}] handlerStateMap: [${JSON.stringify(handlerStateMap, null, 4)}]`);
                return;
            }

            const [uuid, handlerState] = handlerStateItem;

            console.log(`dispatchClick CLICK ACTION ... -- uuid: [${uuid}] handlerState: [${JSON.stringify(handlerState, null, 4)}]`);

            this.handleMenuButtonClick(true, "tab-annotation", true, uuid);

            if (href && handlerState.def.selectionInfo?.rangeInfo) {
                this.handleLinkLocator({
                    href,
                    locations: {
                        cssSelector: handlerState.def.selectionInfo.rangeInfo.startContainerElementCssSelector,
                        rangeInfo: handlerState.def.selectionInfo.rangeInfo,
                    },
                });
            }
        });

        this.props.dispatchReaderTSXMountedAndPublicationIntoViewportLoaded();
    }

    public async componentDidUpdate(oldProps: IProps, oldState: IState) {
        // if (oldProps.readerMode !== this.props.readerMode) {
        // console.log("READER MODE = ", this.props.readerMode === ReaderMode.Detached ? "detached" : "attached");
        // }
        if (oldProps.bookmarks !== this.props.bookmarks ||
            oldState.currentLocation !== this.state.currentLocation) {

            // sets state visibleBookmarkList
            await this.updateVisibleBookmarks();
        }
        if (!keyboardShortcutsMatch(oldProps.keyboardShortcuts, this.props.keyboardShortcuts)) {
            console.log("READER RELOAD KEYBOARD SHORTCUTS");
            this.unregisterAllKeyboardListeners();
            this.registerAllKeyboardListeners();
        }
        if (oldProps.readerConfig.readerDockingMode !== "full" && this.props.readerConfig.readerDockingMode === "full") {
            this.setState({shortcutEnable: false});
        }
        if (oldProps.readerConfig.readerDockingMode === "full" && this.props.readerConfig.readerDockingMode !== "full") {
            this.setState({shortcutEnable: true});
        }
    }

    public componentWillUnmount() {
        ipcRenderer.off("R2_EVENT_IMAGE_CLICK", this.imageDescriptionStream);

        this.unregisterAllKeyboardListeners();

        window.removeEventListener("popstate", this.onPopState);

        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    private isFixedLayout(): boolean {
        let isFixedLayout: undefined | boolean;
        if (this.props.r2Publication?.Spine && this.state.currentLocation?.locator?.href) { // TODO this.props.locator??
            const link = this.props.r2Publication.Spine.find((item) => {
                return item.Href === this.state.currentLocation.locator.href;
            });
            if (link) {
                if (link.Properties?.Layout === "fixed") {
                    isFixedLayout = true;
                } else if (typeof link.Properties?.Layout !== "undefined") {
                    isFixedLayout = false;
                }
            }
        }
        if (typeof isFixedLayout === "undefined") {
            isFixedLayout = this.props.r2Publication?.Metadata?.Rendition?.Layout === "fixed";
        }
        return isFixedLayout;
    }
    private isRTL(isFixedLayout: boolean): boolean {
        const isRTL_PackageMeta = this.props.r2Publication?.Metadata?.Direction === "rtl" || this.props.r2Publication?.Metadata?.Direction === "ttb";
        return isFixedLayout ? isRTL_PackageMeta : (isRTL_PackageMeta || this.state.currentLocation?.docInfo?.isRightToLeft);
    }
    private isRTLFlip(): boolean {
        if (this.props.disableRTLFlip) {
            return false;
        }
        return this.isRTL(this.isFixedLayout());
    }

    public render(): React.ReactElement<{}> {

        const readerMenuProps: IReaderMenuProps = {
            open: this.state.menuOpen,
            doFocus: this.state.doFocus,
            handleLinkClick: this.handleLinkClick,
            goToLocator: this.goToLocator,
            toggleMenu: this.handleMenuButtonClick,
            focusMainAreaLandmarkAndCloseMenu: this.focusMainAreaLandmarkAndCloseMenu.bind(this),
            pdfToc: this.state.pdfPlayerToc,
            isPdf: this.props.isPdf,
            openedSection: this.state.openedSectionMenu,
            annotationUUID: this.state.annotationUUID,
            resetAnnotationUUID: () => { this.setState({ annotationUUID: "" }); },
            pdfNumberOfPages: this.state.pdfPlayerNumberOfPages,
            setOpenedSection: (v: string) => this.setState({ openedSectionMenu: v }),
        };

        const ReaderSettingsProps: IReaderSettingsProps = {
            open: this.state.settingsOpen,
            doFocus: this.state.doFocus,
            indexes: this.props.indexes,
            // readerConfig: this.props.readerConfig,
            // handleSettingChange: this.handleSettingChange.bind(this),
            // handleIndexChange: this.handleIndexChange.bind(this),
            toggleMenu: this.handleSettingsClick,
            // r2Publication: this.props.r2Publication,
            handleDivinaReadingMode: this.handleDivinaReadingMode.bind(this),

            setDisableRTLFlip: this.props.setDisableRTLFlip.bind(this),
            disableRTLFlip: this.props.disableRTLFlip,

            divinaReadingMode: this.props.divinaReadingMode,
            divinaReadingModeSupported: this.state.divinaReadingModeSupported,

            isDivina: this.props.isDivina,
            isPdf: this.props.isPdf,
            isFXL: this.props.publicationView.isFixedLayoutPublication,
            // openedSection: this.state.openedSectionSettings,
            zenMode: this.state.zenMode,
            setZenMode : () => this.setState({ zenMode : !this.state.zenMode}),
            searchEnable: this.props.searchEnable,
        };

        // {this.state.bookmarkMessage ? <div
        //     aria-live="assertive"
        //     aria-relevant="all"
        //     role="alert"

        //     style={{position: "absolute", left: "-1000px"}}
        // >
        //     {this.state.bookmarkMessage}
        // </div> : <></>}


        const isAudioBook = isAudiobookFn(this.props.r2Publication);
        const arrowDisabledNotEpub = isAudioBook || this.props.isPdf || this.props.isDivina;
        // const isFXL = this.isFixedLayout();
        const isPaginated = this.props.readerConfig.paged;

        // console.log(arrowDisabledNotEpub, isFXL, isPaginated);
        // epub non fxl (page)      : false false true  : true
        // epub non fxl (scroll)    : false false false : false
        // epub fxl                 : false true true :   true
        // epub fxl (scroll)        : false true false :  true
        // pdf                      : true false true :   false
        // audiobook                : true false true :   false
        // divina                   : true false true :   false

        const arrowEnabled = !arrowDisabledNotEpub /* && (isFXL || isPaginated) */;

        return (
            <>
            <div className={classNames(
                this.props.readerConfig.theme === "night" ? stylesReader.nightMode :
                this.props.readerConfig.theme === "sepia" ? stylesReader.sepiaMode :
                this.props.readerConfig.theme === "contrast1" ? stylesReader.contrast1Mode :
                this.props.readerConfig.theme === "contrast2" ? stylesReader.contrast2Mode :
                this.props.readerConfig.theme === "contrast3" ? stylesReader.contrast3Mode :
                this.props.readerConfig.theme === "contrast4" ? stylesReader.contrast4Mode :
                this.props.readerConfig.theme === "paper" ? stylesReader.paperMode :
                "",
            )}>
                {/* Reader Lock DEMO !!! */}
                {/* <h1 style={{zIndex: 999999, backgroundColor: "red", position: "absolute"}}>{this.props.lock ? "lock" : "no-lock"}</h1> */}
                {/* Reader Lock DEMO !!! */}
                <a
                    role="heading"
                    className={stylesReader.anchor_link}
                    ref={this.refToolbar}
                    id="main-toolbar"
                    title={this.props.__("accessibility.toolbar")}
                    aria-label={this.props.__("accessibility.toolbar")}
                    tabIndex={-1}>{this.props.__("accessibility.toolbar")}</a>
                <SkipLink
                    className={stylesReader.skip_link}
                    anchorId="main-content"
                    label={this.props.__("accessibility.skipLink")}
                />
                <div className={stylesReader.root}>
                    {!this.state.zenMode ?
                <ReaderHeader
                        shortcutEnable={this.state.shortcutEnable}
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
                        handleTTSVoice={this.handleTTSVoice}

                        handleMediaOverlaysPlay={this.handleMediaOverlaysPlay}
                        handleMediaOverlaysResume={this.handleMediaOverlaysResume}
                        handleMediaOverlaysStop={this.handleMediaOverlaysStop}
                        handleMediaOverlaysPrevious={this.handleMediaOverlaysPrevious}
                        handleMediaOverlaysNext={this.handleMediaOverlaysNext}
                        handleMediaOverlaysPause={this.handleMediaOverlaysPause}
                        handleMediaOverlaysPlaybackRate={this.handleMediaOverlaysPlaybackRate}

                        handleMenuClick={this.handleMenuButtonClick}
                        handleSettingsClick={this.handleSettingsClick}
                        fullscreen={this.state.fullscreen}
                        mode={this.props.readerMode}
                        handleFullscreenClick={this.handleFullscreenClick}
                        handleReaderDetach={this.handleReaderDetach}
                        handleReaderClose={this.handleReaderClose}
                        toggleBookmark={() => this.handleToggleBookmark(false)}
                        // isOnBookmark={this.state.visibleBookmarkList.length > 0}
                        numberOfVisibleBookmarks={this.state.visibleBookmarkList.length}
                        isOnSearch={this.props.searchEnable}
                        ReaderSettingsProps={ReaderSettingsProps}
                        readerMenuProps={readerMenuProps}
                        handlePublicationInfo={this.handlePublicationInfo}
                        // tslint:disable-next-line: max-line-length
                        currentLocation={this.props.isDivina || this.props.isPdf ? this.props.locator : this.state.currentLocation}
                        isDivina={this.props.isDivina}
                        isPdf={this.props.isPdf}
                        divinaSoundPlay={this.handleDivinaSound}

                        showSearchResults={this.showSearchResults}
                        disableRTLFlip={this.props.disableRTLFlip}
                        isRTLFlip={this.isRTLFlip}
                    />
                    :
                    <div className={stylesReader.exitZen_container}>
                        <button onClick={() => this.setState({ zenMode: false })}
                            className={stylesReader.button_exitZen}
                            style={{ opacity: isPaginated ? "1" : "0" }}
                            aria-label={this.props.__("reader.navigation.ZenModeExit")}
                            title={this.props.__("reader.navigation.ZenModeExit")}
                        >
                            <SVG ariaHidden svg={exitZenModeIcon} />
                        </button>
                    </div>
                    }

                    <div
                    style={{marginBottom: this.state.zenMode ? "0" : "44px"}}
                    className={classNames(stylesReader.content_root,
                        this.state.fullscreen ? stylesReader.content_root_fullscreen : undefined,
                        this.props.isPdf ? stylesReader.content_root_skip_bottom_spacing : undefined)}>
                        <div className={stylesReader.reader}>
                            <main
                                id="main"
                                aria-label={this.props.__("accessibility.mainContent")}
                                className={stylesReader.publication_viewport_container}
                                >
                                <a
                                    role="heading"
                                    className={stylesReader.anchor_link}
                                    ref={this.fastLinkRef}
                                    id="main-content"
                                    title={this.props.__("accessibility.mainContent")}
                                    aria-label={this.props.__("accessibility.mainContent")}
                                    tabIndex={-1}>{this.props.__("accessibility.mainContent")}</a>

                                <div
                                    id="publication_viewport"
                                    // className={stylesReader.publication_viewport}
                                    className={classNames(stylesReader.publication_viewport, (!this.state.zenMode && (this.state.settingsOpen || this.state.menuOpen)) ?
                                        (!this.props.isPdf ?
                                           this.props.readerConfig.readerDockingMode === "left" ? stylesReader.docked_left
                                            : this.props.readerConfig.readerDockingMode === "right" ? !this.props.readerConfig.paged ? stylesReader.docked_right_scrollable : stylesReader.docked_right
                                            : ""
                                        :
                                            this.props.readerConfig.readerDockingMode === "left" ? stylesReader.docked_left_pdf
                                            : this.props.readerConfig.readerDockingMode === "right" ? !this.props.readerConfig.paged ? stylesReader.docked_right_scrollable : stylesReader.docked_right_pdf
                                            : ""
                                        ) : undefined,
                                        (this.props.searchEnable && !this.props.isPdf && this.props.readerConfig.paged) ? stylesReader.isOnSearch
                                        : (this.props.searchEnable && this.props.isPdf) ? stylesReader.isOnSearchPdf :
                                        (this.props.searchEnable && !this.props.readerConfig.paged) ? stylesReader.isOnSearchScroll
                                        : "")}
                                    ref={this.mainElRef}
                                    style={{ inset: isAudioBook || !this.props.readerConfig.paged || this.props.isPdf || this.props.isDivina ? "0" : "75px 50px" }}>
                                </div>

                                {arrowEnabled && !this.state.zenMode ?
                                    <div className={stylesReaderFooter.arrows}>
                                        <button onClick={(ev) => {
                                            if (ev.shiftKey) {
                                                const isRTL = false; // TODO RTL (see ReaderMenu.tsx)
                                                if (isRTL) {
                                                    this.onKeyboardNavigationToEnd.bind(this);
                                                } else {
                                                    this.onKeyboardNavigationToBegin.bind(this);
                                                }
                                            } else {
                                                this.navLeftOrRight_(true);
                                            }
                                        }}
                                            title={this.props.__("reader.svg.left")}
                                            className={(this.state.settingsOpen || this.state.menuOpen) ? (this.props.readerConfig.readerDockingMode === "left" ? stylesReaderFooter.navigation_arrow_docked_left :  stylesReaderFooter.navigation_arrow_left) : stylesReaderFooter.navigation_arrow_left}
                                            style={{ opacity: isPaginated ? "1" : "0"}}
                                        >
                                            <SVG ariaHidden={true} svg={ArrowLeftIcon} />
                                        </button>
                                    </div>
                                    :
                                    <></>}

                                {
                                    this.props.isDivina && this.state.divinaArrowEnabled
                                        ?
                                        <div className={stylesReader.divina_grid_container} onClick={() => this.setState({ divinaArrowEnabled: false })}>
                                            <div></div>
                                            <div>
                                                {
                                                    this.props.r2Publication.Metadata.Direction === "btt"
                                                        ? <SVG className={stylesReader.divina_grid_item} svg={DoubleArrowUpIcon}></SVG>
                                                        : <></>
                                                }
                                            </div>
                                            <div></div>
                                            <div>
                                                {
                                                    this.props.r2Publication.Metadata.Direction === "rtl"
                                                        ? <SVG className={stylesReader.divina_grid_item} svg={DoubleArrowLeftIcon}></SVG>
                                                        : <></>
                                                }
                                            </div>
                                            <div></div>
                                            <div>
                                                {
                                                    this.props.r2Publication.Metadata.Direction === "ltr"
                                                        ? <SVG className={stylesReader.divina_grid_item} svg={DoubleArrowRightIcon}></SVG>
                                                        : <></>
                                                }
                                            </div>
                                            <div></div>
                                            <div>
                                                {
                                                    this.props.r2Publication.Metadata.Direction === "ttb"
                                                        ? <SVG className={stylesReader.divina_grid_item} svg={DoubleArrowDownIcon}></SVG>
                                                        : <></>
                                                }
                                            </div>
                                            <div></div>
                                        </div>
                                        : <></>
                                }
                                {arrowEnabled && !this.state.zenMode  ?
                                    <div className={stylesReaderFooter.arrows}>
                                        <button onClick={(ev) => {
                                            if (ev.shiftKey) {
                                                const isRTL = false; // TODO RTL (see ReaderMenu.tsx)
                                                if (isRTL) {
                                                    this.onKeyboardNavigationToBegin.bind(this);
                                                } else {
                                                    this.onKeyboardNavigationToEnd.bind(this);
                                                }
                                            } else {
                                                this.navLeftOrRight_(false);
                                            }
                                        }}
                                            title={this.props.__("reader.svg.right")}
                                            className={(this.state.settingsOpen || this.state.menuOpen) ? (this.props.readerConfig.readerDockingMode === "right" ? stylesReaderFooter.navigation_arrow_docked_right :  stylesReaderFooter.navigation_arrow_right) : stylesReaderFooter.navigation_arrow_right}
                                            style={{ opacity: isPaginated ? "1" : "0"}}
                                        >
                                            <SVG ariaHidden={true} svg={ArrowRightIcon} />
                                        </button>
                                    </div>
                                    :
                                    <></>}
                            </main>
                        </div>
                    </div>
                </div>
                { !this.state.zenMode ?
                <ReaderFooter
                    historyCanGoBack={this.state.historyCanGoBack}
                    historyCanGoForward={this.state.historyCanGoForward}
                    navLeftOrRight={this.navLeftOrRight_.bind(this)}
                    gotoBegin={this.onKeyboardNavigationToBegin.bind(this)}
                    gotoEnd={this.onKeyboardNavigationToEnd.bind(this)}
                    fullscreen={this.state.fullscreen}
                    // tslint:disable-next-line: max-line-length
                    currentLocation={this.props.isDivina || this.props.isPdf ? this.props.locator : this.state.currentLocation}
                    handleLinkClick={this.handleLinkClick}
                    goToLocator={this.goToLocator}
                    isDivina={this.props.isDivina}
                    isDivinaLocation={isDivinaLocation}
                    divinaNumberOfPages={this.state.divinaNumberOfPages}
                    divinaContinousEqualTrue={this.state.divinaContinousEqualTrue}
                    isPdf={this.props.isPdf}

                    disableRTLFlip={this.props.disableRTLFlip}
                    isRTLFlip={this.isRTLFlip}
                    publicationView={this.props.publicationView}

                />
                : <></>
    }
            </div>
            {
            this.state.publicationImageURL ?
            <>
            <div
                style={{ border: "red solid 2px", backgroundColor: "silver", zIndex: 999999991, boxSizing: "border-box", margin: 0, padding:0, top: 0, left: 0, bottom: 0, right: 0, display: "block", position: "absolute"}}>
            <img
                style={{ border: "magenta solid 2px", backgroundColor: "white", cursor: "pointer", objectFit: "contain", boxSizing: "border-box", margin: 0, padding:0, width: "100%", height: "100%", display: "block", position: "relative"}}
                src={`${this.state.publicationImageURL}`}
                alt="image"
                tabIndex={0}
                onLoad={async (_ev) => {

                    // const img = ev.currentTarget;
                    // const canvas = document.createElement("canvas");
                    // const ctx = canvas.getContext("2d");
                    // canvas.width = img.naturalWidth;
                    // canvas.height = img.naturalHeight;
                    // ctx.drawImage(img, 0, 0);

                    // RawImage.read();

                    // const dataUrl = canvas.toDataURL("image/jpg");
                    // const rawImage = await load_image(dataUrl);

                    // await window.electronContextBridgeAPI.demoAI(href);
                    const imageDescription = await ipcRenderer.invoke("R2_EVENT_IMAGE_CLICK", this.state.publicationImageURL); //, canvas.width, canvas.height , dataUrl
                    console.log("R2_EVENT_IMAGE_CLICK imageDescription: " + imageDescription);

                    // const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    // const rawImage = new RawImage(imgData, canvas.width, canvas.height, 4);

                    // const images = [rawImage];

                    // console.log("R2_EVENT_IMAGE_CLICK  RawImage() OK: " + `${this.state.publicationImageURL}`);
                    // this.setState({
                    //     publicationImageDESCRIPTION: `RawImage() OK: ${this.state.publicationImageURL}`,
                    // });

                    // const IS_WEBGPU_AVAILABLE = typeof navigator !== "undefined" && "gpu" in navigator;
                    // console.log("IS_WEBGPU_AVAILABLE: " + IS_WEBGPU_AVAILABLE);

                    // // @ts-expect-error navigator WebGPU
                    // const adapter = await navigator.gpu?.requestAdapter();
                    // if (!adapter) {
                    //     console.log("R2_EVENT_IMAGE_CLICK no WebGPU ADAPTER?!");
                    //     return;
                    // }

                    // const fp16 = adapter.features.has("shader-f16");

                    // console.log("R2_EVENT_IMAGE_CLICK WebGPU ADAPTER FP16: " + fp16);

                    // // await window.electronContextBridgeAPI.demoAI(href);
                    // const tmpDir = await ipcRenderer.invoke("R2_EVENT_IMAGE_CLICK", this.state.publicationImageURL, fp16);
                    // console.log("R2_EVENT_IMAGE_CLICK tmpDir: " + tmpDir);

                    // const MAX_NEW_TOKENS = 1024;
                    // const MODEL_ID = "HuggingFaceTB/SmolVLM-256M-Instruct";

                    // try {
                    //     aiProcessor = aiProcessor || await AutoProcessor.from_pretrained(MODEL_ID, {
                    //         cache_dir: tmpDir || undefined,
                    //         progress_callback: (payload: any) => {
                    //             // console.log("R2_EVENT_IMAGE_CLICK WebGPU AutoProcessor.from_pretrained", JSON.stringify(payload, null, 4));
                    //             // [2] AutoProcessor.from_pretrained {
                    //             // [2]     "status": "initiate",
                    //             // [2]     "name": "HuggingFaceTB/SmolVLM-256M-Instruct",
                    //             // [2]     "file": "preprocessor_config.json"
                    //             // [2] }
                    //             // [2] AutoProcessor.from_pretrained {
                    //             // [2]     "status": "download",
                    //             // [2]     "name": "HuggingFaceTB/SmolVLM-256M-Instruct",
                    //             // [2]     "file": "preprocessor_config.json"
                    //             // [2] }
                    //             // [2] AutoProcessor.from_pretrained {
                    //             // [2]     "status": "progress",
                    //             // [2]     "name": "HuggingFaceTB/SmolVLM-256M-Instruct",
                    //             // [2]     "file": "preprocessor_config.json",
                    //             // [2]     "progress": 100,
                    //             // [2]     "loaded": 486,
                    //             // [2]     "total": 486
                    //             // [2] }
                    //             // [2] AutoProcessor.from_pretrained {
                    //             // [2]     "status": "done",
                    //             // [2]     "name": "HuggingFaceTB/SmolVLM-256M-Instruct",
                    //             // [2]     "file": "preprocessor_config.json"
                    //             // [2] }

                    //             if (payload.status === "initiate" || payload.status === "download" || payload.status === "done") { // || payload.status === "progress"
                    //                 this.setState({
                    //                     publicationImageDESCRIPTION: `${payload.name} [${payload.file}] (${payload.status}) ${payload.progress ? ` ... ${payload.progress}%` : ""}`,
                    //                 });
                    //             }
                    //         },
                    //     });
                    // } catch (e) {
                    //     console.log("########################## AutoProcessor.from_pretrained WebGPU?!");
                    //     console.log(e);
                    // }
                    // console.log("R2_EVENT_IMAGE_CLICK WebGPU AutoProcessor.from_pretrained DONE");
                    // this.setState({
                    //     publicationImageDESCRIPTION: "AutoProcessor.from_pretrained DONE",
                    // });

                    // try {
                    //     aiModel = aiModel || await AutoModelForVision2Seq.from_pretrained(MODEL_ID, {
                    //         cache_dir: tmpDir || undefined,
                    //         dtype: "fp32",
                    //         // device: "webgpu", // Error: Unsupported device: "webgpu". Should be one of: "cpu" ===> need to force NodeJS non-detection and load to Worker Thread...
                    //         device: "cpu",
                    //         progress_callback: (payload: any) => {
                    //             // console.log("R2_EVENT_IMAGE_CLICK WebGPU AutoModelForVision2Seq.from_pretrained", JSON.stringify(payload, null, 4));
                    //             // [2] AutoModelForVision2Seq.from_pretrained {
                    //             // [2]     "status": "initiate",
                    //             // [2]     "name": "HuggingFaceTB/SmolVLM-256M-Instruct",
                    //             // [2]     "file": "generation_config.json"
                    //             // [2] }
                    //             // [2] AutoModelForVision2Seq.from_pretrained {
                    //             // [2]     "status": "download",
                    //             // [2]     "name": "HuggingFaceTB/SmolVLM-256M-Instruct",
                    //             // [2]     "file": "generation_config.json"
                    //             // [2] }
                    //             // [2] AutoModelForVision2Seq.from_pretrained {
                    //             // [2]     "status": "progress",
                    //             // [2]     "name": "HuggingFaceTB/SmolVLM-256M-Instruct",
                    //             // [2]     "file": "generation_config.json",
                    //             // [2]     "progress": 100,
                    //             // [2]     "loaded": 136,
                    //             // [2]     "total": 136
                    //             // [2] }
                    //             // [2] AutoModelForVision2Seq.from_pretrained {
                    //             // [2]     "status": "done",
                    //             // [2]     "name": "HuggingFaceTB/SmolVLM-256M-Instruct",
                    //             // [2]     "file": "generation_config.json"
                    //             // [2] }

                    //             if (payload.status === "initiate" || payload.status === "download" || payload.status === "done") { // || payload.status === "progress"
                    //                 this.setState({
                    //                     publicationImageDESCRIPTION: `${payload.name} [${payload.file}] (${payload.status}) ${payload.progress ? ` ... ${Math.round(payload.progress*100)/100}%` : ""}`,
                    //                 });
                    //             }
                    //         },
                    //     });
                    // } catch (e) {
                    //     console.log("########################## AutoModelForVision2Seq.from_pretrained WebGPU?!");
                    //     console.log(e);
                    // }
                    // console.log("R2_EVENT_IMAGE_CLICK WebGPU AutoModelForVision2Seq.from_pretrained DONE");
                    // this.setState({
                    //     publicationImageDESCRIPTION: "AutoModelForVision2Seq.from_pretrained DONE",
                    // });

                    // const text = aiProcessor.apply_chat_template([{
                    //     role: "user", // "user" | "assistant" | "system"
                    //     // @ts-expect-error
                    //     content: [{ type: "image", image: this.state.publicationImageURL }, { type: "text", text: "describe this image." }],
                    // }], {
                    //     add_generation_prompt: true,
                    //     tokenize: false, // default
                    // });

                    // console.log("R2_EVENT_IMAGE_CLICK  apply_chat_template() OK: " + `${this.state.publicationImageURL}`);
                    // this.setState({
                    //     publicationImageDESCRIPTION: `apply_chat_template() OK: ${this.state.publicationImageURL}`,
                    // });

                    // const inputs = await aiProcessor(text, images, {});

                    // console.log("R2_EVENT_IMAGE_CLICK  aiProcessor() OK: " + `${this.state.publicationImageURL}`);
                    // this.setState({
                    //     publicationImageDESCRIPTION: `aiProcessor() OK: ${this.state.publicationImageURL}`,
                    // });

                    // const streamer = new TextStreamer(aiProcessor.tokenizer, {
                    //     skip_prompt: true,
                    //     skip_special_tokens: true,
                    //     callback_function: (output) => {
                    //         console.log(JSON.stringify(output, null, 4));
                    //     },
                    //     token_callback_function: (tokens) => {
                    //         console.log(JSON.stringify(tokens, null, 4));
                    //     },
                    // });

                    // const stopping_criteria = new InterruptableStoppingCriteria();
                    // // stopping_criteria.reset(); // interrupt()

                    // console.log("R2_EVENT_IMAGE_CLICK  TextStreamer() OK: " + `${this.state.publicationImageURL}`);
                    // this.setState({
                    //     publicationImageDESCRIPTION: `TextStreamer() OK: ${this.state.publicationImageURL}`,
                    // });

                    // // :(
                    // // Error sending from webFrameMain:  Error: Render frame was disposed before WebFrameMain could be accessed

                    // // @ts-expect-error
                    // const { sequences } = await aiModel
                    //     .generate({
                    //         ...inputs,
                    //         do_sample: false,
                    //         repetition_penalty: 1.1,
                    //         // top_k: 3,
                    //         // temperature: 0.2,
                    //         max_new_tokens: MAX_NEW_TOKENS,
                    //         streamer,
                    //         stopping_criteria,
                    //         return_dict_in_generate: true,
                    //     })
                    //     .catch((e) => {
                    //         console.log("R2_EVENT_IMAGE_CLICK  generate() ERROR: " + `${JSON.stringify(e, null, 4)}`);
                    //         this.setState({
                    //             publicationImageDESCRIPTION: `generate() ERROR: ${JSON.stringify(e, null, 4)}`,
                    //         });
                    //     });

                    // console.log("R2_EVENT_IMAGE_CLICK  generate() OK: " + `${this.state.publicationImageURL}`);
                    // this.setState({
                    //     publicationImageDESCRIPTION: `generate() OK: ${this.state.publicationImageURL}`,
                    // });

                    // const decoded = aiProcessor.batch_decode(sequences, {
                    //     skip_special_tokens: true,
                    // });

                    // console.log("R2_EVENT_IMAGE_CLICK  batch_decode() OK: " + `${this.state.publicationImageURL}`);
                    // this.setState({
                    //     publicationImageDESCRIPTION: `batch_decode() OK: ${this.state.publicationImageURL}`,
                    // });

                    if (imageDescription) {
                        this.imageDescriptionStream({}, imageDescription, true);
                        // this.setState({
                        //     publicationImageDESCRIPTION: imageDescription,
                        // });
                    } else {
                        this.setState({
                            publicationImageDESCRIPTION: undefined,
                        });
                    }
                }}
                ref={(el) => {
                    if (el) setTimeout(() => { el.focus(); }, 100);
                }}
                onKeyUp={(e) => {
                    if (e.key === "Escape") {
                        this.setState({
                            publicationImageURL: undefined,
                            publicationImageDESCRIPTION: undefined,
                        });
                    }
                }}
                onClick={() => {
                    this.setState({
                        publicationImageURL: undefined,
                        publicationImageDESCRIPTION: undefined,
                    });
                }}
            />
            </div>
            {
            this.state.publicationImageDESCRIPTION ?
            <div
                className={stylesReader.imgDescOverlay}
                style={{ cursor: "text", userSelect: "text", fontSize: "1.5em", fontWeight: "bold", overflowY: "auto", border: "green solid 2px", backgroundColor: "rgba(0, 0, 0, 0.8)", color: "white", zIndex: 999999993, boxSizing: "border-box", margin: 0, padding: "1em", top: 0, left: 0, bottom: 0, right: 0, display: "block", position: "absolute"}}
                tabIndex={0}
                ref={(el) => {
                    if (el) setTimeout(() => { el.focus(); }, 200);
                }}
                onKeyUp={(e) => {
                    if (e.key === "Escape") {
                        this.setState({
                            publicationImageURL: undefined,
                            publicationImageDESCRIPTION: undefined,
                        });
                    }
                }}
                onClick={() => {
                    // this.setState({
                    //     publicationImageURL: undefined,
                    //     publicationImageDESCRIPTION: undefined,
                    // });
                }}
                dangerouslySetInnerHTML={{ __html: this.state.publicationImageDESCRIPTION }}
            ></div> :
            undefined
            }
            </>
            :
            <></>
            }
            </>
        );
    }

    public handleTTSPlay_() {
        this.handleTTSPlay();
    }

    private registerAllKeyboardListeners() {

        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.NavigatePreviousHistory,
            this.onKeyboardHistoryNavigationPrevious);
        registerKeyboardListener(
            false, // listen for key down (not key up)
            this.props.keyboardShortcuts.NavigateNextHistory,
            this.onKeyboardHistoryNavigationNext);

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
            this.props.keyboardShortcuts.NavigateToBegin,
            this.onKeyboardNavigationToBegin);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.NavigateToEnd,
            this.onKeyboardNavigationToEnd);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusMain,
            this.onKeyboardFocusMain);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusMainDeep,
            this.onKeyboardFocusMainDeep);

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
            this.props.keyboardShortcuts.OpenReaderInfoWhereAmI,
            this.onKeyboardInfoWhereAmI);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.SpeakReaderInfoWhereAmI,
            this.onKeyboardInfoWhereAmISpeak);

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
            this.props.keyboardShortcuts.FocusReaderGotoPage,
            this.onKeyboardShowGotoPage);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.FocusReaderNavigationTOC,
            this.onKeyboardShowTOC);

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
            this.onKeyboardAudioPrevious_);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.AudioNext,
            this.onKeyboardAudioNext_);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.AudioPreviousAlt,
            this.onKeyboardAudioPreviousAlt);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.AudioNextAlt,
            this.onKeyboardAudioNextAlt);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.AudioStop,
            this.onKeyboardAudioStop);

        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.AnnotationsToggleMargin,
            this.onKeyboardAnnotationMargin);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.AnnotationsCreate,
            this.onKeyboardAnnotation);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.AnnotationsCreateQuick,
            this.onKeyboardQuickAnnotation);
    }

    private unregisterAllKeyboardListeners() {
        unregisterKeyboardListener(this.onKeyboardHistoryNavigationPrevious);
        unregisterKeyboardListener(this.onKeyboardHistoryNavigationNext);
        unregisterKeyboardListener(this.onKeyboardPageNavigationPrevious);
        unregisterKeyboardListener(this.onKeyboardPageNavigationNext);
        unregisterKeyboardListener(this.onKeyboardSpineNavigationPrevious);
        unregisterKeyboardListener(this.onKeyboardSpineNavigationNext);
        unregisterKeyboardListener(this.onKeyboardFocusMain);
        unregisterKeyboardListener(this.onKeyboardFocusMainDeep);
        unregisterKeyboardListener(this.onKeyboardFocusToolbar);
        unregisterKeyboardListener(this.onKeyboardFullScreen);
        unregisterKeyboardListener(this.onKeyboardBookmark);
        unregisterKeyboardListener(this.onKeyboardInfo);
        unregisterKeyboardListener(this.onKeyboardInfoWhereAmI);
        unregisterKeyboardListener(this.onKeyboardInfoWhereAmISpeak);
        unregisterKeyboardListener(this.onKeyboardFocusSettings);
        unregisterKeyboardListener(this.onKeyboardFocusNav);
        unregisterKeyboardListener(this.onKeyboardShowGotoPage);
        unregisterKeyboardListener(this.onKeyboardShowTOC);
        unregisterKeyboardListener(this.onKeyboardCloseReader);
        unregisterKeyboardListener(this.onKeyboardAudioPlayPause);
        unregisterKeyboardListener(this.onKeyboardAudioPrevious_);
        unregisterKeyboardListener(this.onKeyboardAudioNext_);
        unregisterKeyboardListener(this.onKeyboardAudioPreviousAlt);
        unregisterKeyboardListener(this.onKeyboardAudioNextAlt);
        unregisterKeyboardListener(this.onKeyboardAudioStop);
        unregisterKeyboardListener(this.onKeyboardAnnotationMargin);
        unregisterKeyboardListener(this.onKeyboardAnnotation);
        unregisterKeyboardListener(this.onKeyboardQuickAnnotation);
    }

    private handleLinkLocator = (locator: R2Locator, isFromOnPopState = false) => {

        if (!windowHistory._length) {
            windowHistory._length = 0;
        }

        if (!isFromOnPopState) {
            // console.log("#+$%".repeat(5)  + " goToLocator history pushState()", JSON.stringify(locator), JSON.stringify(document.location), JSON.stringify(window.location), JSON.stringify(window.history.state), window.history.length, windowHistory._length);
            if (window.history.state && r.equals(locator, window.history.state.data)) {
                window.history.replaceState({ data: locator, index: windowHistory._length - 1 }, "");
            } else {
                windowHistory._length++;
                window.history.pushState({ data: locator, index: windowHistory._length - 1 }, "");
            }

            // windowHistory._readerInstance === this
            this.setState({ historyCanGoForward: false, historyCanGoBack: windowHistory._length > 1 });
        }
        r2HandleLinkLocator(locator);
    };

    private handleLinkUrl = (url: string, isFromOnPopState = false) => {
        handleLinkUrl_UpdateHistoryState(url, isFromOnPopState);
        r2HandleLinkUrl(url);
    };

    private onKeyboardAnnotationMargin = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardAnnotationMargin)");
            }
            return;
        }

        const annotation_defaultDrawView = this.props.readerConfig.annotation_defaultDrawView === "annotation" ? "margin" : "annotation";

        console.log(`onKeyboardAnnotationMargin : highlight=${annotation_defaultDrawView}`);
        this.props.setConfig({ annotation_defaultDrawView });
    };

    private onKeyboardAnnotation = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardAnnotate)");
            }
            return;
        }

        this.props.triggerAnnotationBtn();
    };

    private onKeyboardQuickAnnotation = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardQuickAnnotation)");
            }
            return;
        }

        if (this.props.readerConfig.annotation_popoverNotOpenOnNoteTaking) {
            this.props.triggerAnnotationBtn();
            return ;
        }

        let newReaderConfig: Partial<ReaderConfig> = {};
        const { annotation_popoverNotOpenOnNoteTaking } = newReaderConfig;
        newReaderConfig.annotation_popoverNotOpenOnNoteTaking = true;

        console.log(`onKeyboardQuickAnnotation : popoverNotOpenOnNoteTaking=${annotation_popoverNotOpenOnNoteTaking}`);
        this.props.setConfig(newReaderConfig);

        this.props.triggerAnnotationBtn();

        newReaderConfig = {};
        newReaderConfig.annotation_popoverNotOpenOnNoteTaking = annotation_popoverNotOpenOnNoteTaking;
        this.props.setConfig(newReaderConfig);
    };

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

        if (this.props.r2PublicationHasMediaOverlays) {
            if (this.props.mediaOverlaysState !== MediaOverlaysStateEnum.STOPPED) {
                this.handleMediaOverlaysStop();
            }
        } else if (this.state.currentLocation.audioPlaybackInfo) {
            audioPause();
        } else {
            if (this.props.ttsState !== TTSStateEnum.STOPPED) {
                this.handleTTSStop();
            }
        }
    };

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

        if (this.props.r2PublicationHasMediaOverlays) {
            if (this.props.mediaOverlaysState === MediaOverlaysStateEnum.PLAYING) {
                this.handleMediaOverlaysPause();
            } else if (this.props.mediaOverlaysState === MediaOverlaysStateEnum.PAUSED) {
                this.handleMediaOverlaysResume();
            } else if (this.props.mediaOverlaysState === MediaOverlaysStateEnum.STOPPED) {
                this.handleMediaOverlaysPlay();
            }
        } else if (this.state.currentLocation.audioPlaybackInfo) {
            audioTogglePlayPause();
        } else {
            if (this.props.ttsState === TTSStateEnum.PLAYING) {
                this.handleTTSPause();
            } else if (this.props.ttsState === TTSStateEnum.PAUSED) {
                this.handleTTSResume();
            } else if (this.props.ttsState === TTSStateEnum.STOPPED) {
                this.handleTTSPlay();
            }
        }
    };

    private onKeyboardAudioPreviousAlt = () => {
        this.onKeyboardAudioPrevious(false, true);
    };
    private onKeyboardAudioPrevious_ = () => {
        this.onKeyboardAudioPrevious(false, false);
    };
    private onKeyboardAudioPrevious = (skipSentences: boolean, escape: boolean) => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardAudioPrevious)");
            }
            return;
        }

        if (!this.state.currentLocation) {
            return;
        }

        if (this.props.r2PublicationHasMediaOverlays) {
            this.handleMediaOverlaysPrevious();
        } else if (this.state.currentLocation.audioPlaybackInfo) {
            audioRewind();
        } else {
            // const doc = document as TKeyboardDocument;
            // const skipSentences = doc._keyModifierShift && doc._keyModifierAlt;
            this.handleTTSPrevious(skipSentences, escape);
        }
    };

    private onKeyboardAudioNextAlt = () => {
        this.onKeyboardAudioNext(false, true);
    };
    private onKeyboardAudioNext_ = () => {
        this.onKeyboardAudioNext(false, false);
    };
    private onKeyboardAudioNext = (skipSentences: boolean, escape: boolean) => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardAudioNext)");
            }
            return;
        }

        if (!this.state.currentLocation) {
            return;
        }

        if (this.props.r2PublicationHasMediaOverlays) {
            this.handleMediaOverlaysNext();
        } else if (this.state.currentLocation.audioPlaybackInfo) {
            audioForward();
        } else {
            // const doc = document as TKeyboardDocument;
            // const skipSentences = doc._keyModifierShift && doc._keyModifierAlt;
            this.handleTTSNext(skipSentences, escape);
        }
    };

    private onKeyboardFullScreen = () => {
        this.handleFullscreenClick();
    };

    private onKeyboardCloseReader = () => {
        // if (!this.state.shortcutEnable) {
        //     if (DEBUG_KEYBOARD) {
        //         console.log("!shortcutEnable (onKeyboardCloseReader)");
        //     }
        //     return;
        // }
        this.handleReaderClose();
    };

    private onKeyboardInfoWhereAmI = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardInfoWhereAmI)");
            }
            return;
        }
        this.handlePublicationInfo(undefined, true);
    };

    private onKeyboardInfoWhereAmISpeak = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardInfoWhereAmISpeak)");
            }
            return;
        }
        if (!this.props.publicationView) {
            return;
        }

        // See "Progression" comp inside publicationInfoContent.tsx
        const readerReadingLocation = this.state.currentLocation ? this.state.currentLocation : undefined;
        const locatorExt = readerReadingLocation || this.props.publicationView.lastReadingLocation;
        if (typeof locatorExt?.locator?.locations?.progression !== "number") {
            return;
        }
        try {

            const isAudio = locatorExt.audioPlaybackInfo
                && locatorExt.audioPlaybackInfo.globalDuration
                && typeof locatorExt.locator.locations.position === "number";

            const isDivina = this.props.r2Publication && isDivinaFn(this.props.r2Publication);
            const isPdf = this.props.r2Publication && isPdfFn(this.props.r2Publication);

        const isFixedLayoutPublication = this.props.r2Publication &&
            this.props.r2Publication.Metadata?.Rendition?.Layout === "fixed";

            let txtProgression: string | undefined;
            let txtPagination: string | undefined;
            let txtHeadings: string | undefined;

            if (isAudio) {
                const percent = Math.round(locatorExt.locator.locations.position * 100);
                txtProgression = `${percent}% [${formatTime(Math.round(locatorExt.audioPlaybackInfo.globalTime))} / ${formatTime(Math.round(locatorExt.audioPlaybackInfo.globalDuration))}]`;
            } else if (isDivina) {
                let totalPages = (this.state.divinaNumberOfPages && !this.state.divinaContinousEqualTrue) ? this.state.divinaNumberOfPages : (this.props.r2Publication?.Spine?.length ? this.props.r2Publication.Spine.length : undefined);
                if (typeof totalPages === "string") {
                    try {
                        totalPages = parseInt(totalPages, 10);
                    } catch (_e) {
                        totalPages = 0;
                    }
                }

                let pageNum = !this.state.divinaContinousEqualTrue ?
                    (locatorExt.locator.locations.position || 0) :
                    (Math.floor(locatorExt.locator.locations.progression * this.props.r2Publication.Spine.length) - 1);
                if (typeof pageNum === "string") {
                    try {
                        pageNum = parseInt(pageNum, 10) + 1;
                    } catch (_e) {
                        pageNum = 0;
                    }
                } else if (typeof pageNum === "number") {
                    pageNum = pageNum + 1;
                }

                if (totalPages && typeof pageNum === "number") {
                    txtPagination = this.props.__("reader.navigation.currentPageTotal", { current: `${pageNum}`, total: `${totalPages}` });

                    txtProgression = `${Math.round(100 * (locatorExt.locator.locations.progression || 0))}%`;

                } else {
                    if (typeof pageNum === "number") {
                        txtPagination = this.props.__("reader.navigation.currentPage", { current: `${pageNum}` });
                    }

                    if (typeof locatorExt.locator.locations.progression === "number") {
                        const percent = Math.round(locatorExt.locator.locations.progression * 100);
                        txtProgression = `${percent}%`;
                    }
                }

            } else if (isPdf) {
                let totalPages = this.state.pdfPlayerNumberOfPages ?
                    this.state.pdfPlayerNumberOfPages :
                    (this.props.r2Publication?.Metadata?.NumberOfPages ? this.props.r2Publication.Metadata.NumberOfPages : undefined);

                if (typeof totalPages === "string") {
                    try {
                        totalPages = parseInt(totalPages, 10);
                    } catch (_e) {
                        totalPages = 0;
                    }
                }

                let pageNum = (locatorExt.locator?.href as unknown) as number;
                if (typeof pageNum === "string") {
                    try {
                        pageNum = parseInt(pageNum, 10);
                    } catch (_e) {
                        pageNum = 0;
                    }
                }

                if (totalPages) {
                    txtPagination = this.props.__("reader.navigation.currentPageTotal", { current: `${pageNum}`, total: `${totalPages}` });
                    txtProgression = `${Math.round(100 * (pageNum / totalPages))}%`;
                } else {
                    txtPagination = this.props.__("reader.navigation.currentPage", { current: `${pageNum}` });
                }

            } else if (this.props.r2Publication?.Spine && locatorExt.locator?.href) {

                const spineIndex = this.props.r2Publication.Spine.findIndex((l) => {
                    return l.Href === locatorExt.locator.href;
                });
                if (spineIndex >= 0) {
                    if (isFixedLayoutPublication) {
                        const pageNum = spineIndex + 1;
                        const totalPages = this.props.r2Publication.Spine.length;

                        txtPagination = this.props.__("reader.navigation.currentPageTotal", { current: `${pageNum}`, total: `${totalPages}` });
                        txtProgression = `${Math.round(100 * (pageNum / totalPages))}%`;

                    } else {

                        if (locatorExt.epubPage) {
                            let epubPage = locatorExt.epubPage;
                            if (epubPage.trim().length === 0 && locatorExt.epubPageID && this.props.r2Publication.PageList) {
                                const p = this.props.r2Publication.PageList.find((page) => {
                                    return page.Title && page.Href && page.Href.endsWith(`#${locatorExt.epubPageID}`);
                                });
                                if (p) {
                                    epubPage = p.Title;
                                }
                            }
                            txtPagination = this.props.__("reader.navigation.currentPage", { current: epubPage });
                        }

                        const percent = Math.round(locatorExt.locator.locations.progression * 100);
                        txtProgression = `${spineIndex + 1}/${this.props.r2Publication.Spine.length}${locatorExt.locator.title ? ` (${locatorExt.locator.title})` : ""} [${percent}%]`;

                        if (locatorExt.headings) {

                            let rank = 999;
                            const hs = locatorExt.headings.filter((h, _i) => {
                                if (h.level < rank) {

                                    rank = h.level;
                                    return true;
                                }
                                return false;
                            }).reverse();
                            const summary = hs.reduce((arr, h, i) => {
                                return arr.concat(
                                    i === 0 ? " " : " / ",
                                    `H${h.level} `,
                                    h.txt ? `${h.txt}` : `${h.id ? `[${h.id}]` : "_"}`,
                                );
                            }, []);

                            // const details = locatorExt.headings.slice().reverse().reduce((arr, h, i) => {
                            //     return arr.concat(i === 0 ? " " : " / ", `H${h.level} ${h.txt ? `${h.txt}` : `${h.id ? `[${h.id}]` : "_"}`}`);
                            // }, []);

                            // txtHeadings = `${summary.join("")} ${details.join("")}`;

                            txtHeadings = summary.join("");
                        }
                    }
                }
            }

            this.props.toasty(`${txtPagination ? `${txtPagination} -- ` : ""}${txtProgression ? `${this.props.__("publication.progression.title")} = ${txtProgression}` : ""}${txtHeadings ? ` -- ${txtHeadings}` : ""}`);

        } catch (_err) {
            this.props.toasty("ERROR");
        }
    };

    private onKeyboardInfo = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardInfo)");
            }
            return;
        }
        this.handlePublicationInfo();
    };

    private onKeyboardFocusNav = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFocusNav)");
            }
            return;
        }

        // lock focus outside webview for 400ms
        // if (this.props.readerConfig.readerDockingMode !== "full") {
        //     stealFocusDisable(true);
        //     setTimeout(() => stealFocusDisable(false), 400);
        // }

        this.handleMenuButtonClick(true, this.state.openedSectionMenu, true);
    };
    private onKeyboardFocusSettings = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFocusSettings)");
            }
            return;
        }
        this.handleSettingsClick(true, true);
    };

    private onKeyboardBookmark = async () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardBookmark)");
            }
            return;
        }
        await this.handleToggleBookmark(true);
    };

    private onKeyboardFocusMain = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFocusMain)");
            }
            return;
        }

        this.focusMainArea(false, true);
        // if (this.fastLinkRef?.current) {
        //     console.log("€€€€€ FOCUS READER MAIN");
        //     this.fastLinkRef.current.focus();
        // }
    };
    private onKeyboardFocusMainDeep = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFocusMainDeep)");
            }
            return;
        }

        this.focusMainArea(true, true);
        // if (this.fastLinkRef?.current) {
        //     console.log("€€€€€ FOCUS READER MAIN");
        //     this.fastLinkRef.current.focus();
        // }
    };

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
    };

    private onKeyboardHistoryNavigationNext = () => {
        // console.log("#+$%".repeat(5)  + " history forward()", JSON.stringify(document.location), JSON.stringify(window.location), JSON.stringify(window.history.state), window.history.length);
        window.history.forward();
        // window.history.go(1);
    };
    private onKeyboardHistoryNavigationPrevious = () => {
        // console.log("#+$%".repeat(5)  + " history back()", JSON.stringify(document.location), JSON.stringify(window.location), JSON.stringify(window.history.state), window.history.length);
        window.history.back();
        // window.history.go(-1);
    };

    private onKeyboardPageNavigationNext = () => {
        this.onKeyboardPageNavigationPreviousNext(false);
    };
    private onKeyboardPageNavigationPrevious = () => {
        this.onKeyboardPageNavigationPreviousNext(true);
    };
    private onKeyboardPageNavigationPreviousNext = (isPrevious: boolean) => {
        if (this.props.isDivina) {
            return;
        }
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardPageNavigationPreviousNext)");
            }
            return;
        }

        this.navLeftOrRight_(isPrevious, false);

    };

    private onKeyboardNavigationToBegin = () => {

        if (this.props.isPdf) {
            createOrGetPdfEventBus().dispatch("page", "1");
        } else if (this.props.isDivina) {
            this.currentDivinaPlayer.goToPageWithIndex(0);
        } else {
            if (this.props.r2Publication?.Spine) {
                const firstSpine = this.props.r2Publication.Spine[0];
                if (firstSpine?.Href) {
                    this.handleLinkLocator({
                        href: firstSpine.Href,
                        locations: {
                            progression: 0,
                        },
                    });
                }
            }
        }
    };
    private onKeyboardNavigationToEnd = () => {

        if (this.props.isPdf) {
            if (this.state.pdfPlayerNumberOfPages) {
                createOrGetPdfEventBus().dispatch("page",
                    this.state.pdfPlayerNumberOfPages.toString());
            }
        } else if (this.props.isDivina) {
            // TODO: Divina total number of pages? (last page index (number))

            //     this.currentDivinaPlayer.goToPageWithIndex(index);
        } else {
            if (this.props.r2Publication?.Spine) {
                const lastSpine = this.props.r2Publication.Spine[this.props.r2Publication.Spine.length - 1];
                if (lastSpine?.Href) {
                    this.handleLinkLocator({
                        href: lastSpine.Href,
                        locations: {
                            progression: 0.95, // because 1 (100%) tends to trip blankspace css columns :(
                        },
                    });
                }
            }
        }
    };

    private onKeyboardSpineNavigationNext = () => {
        this.onKeyboardSpineNavigationPreviousNext(false);
    };
    private onKeyboardSpineNavigationPrevious = () => {
        this.onKeyboardSpineNavigationPreviousNext(true);
    };
    private onKeyboardSpineNavigationPreviousNext = (isPrevious: boolean) => {
        if (this.props.isDivina) {
            return;
        }
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
    };


    // always triggered by window.history.back/forward/go()
    // not triggered by history.pushState() and history.replaceState()
    // depending on web browser engine (here, Chromium), not always triggered on initial page load
    // triggered when history.back() into the initial URL load which contains no state!
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/popstate_event
    private onPopState = (popState: PopStateEvent) => {
        // setTimeout(() => {
        //     // defer in the browser event loop => window.location and document objects are up to date with navigation popstate
        // }, 0);

        popState.preventDefault();
        // popState.stopPropagation();
        // popState.stopImmediatePropagation();

        // console.log("#+$%".repeat(5)  + " window EVENT 'popstate'", JSON.stringify(document.location), JSON.stringify(window.location), JSON.stringify(window.history.state), JSON.stringify(popState.state), window.history.length, windowHistory._length);

        // windowHistory._readerInstance === this

        const isDocked = this.props.readerConfig.readerDockingMode !== "full";

        if (popState.state?.data) {
            if (typeof popState.state.data === "object") {
                this.goToLocator(popState.state.data, !isDocked, true);
            } else if (typeof popState.state.data === "string") {
                // if (!/https?:\/\//.test(popState.state.data)) {
                if (popState.state.data.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ||
                    popState.state.data.startsWith(THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
                    this.handleLinkClick(undefined, popState.state.data, !isDocked, true);
                } else {
                    console.log(">> HISTORY POP STATE SKIP URL (2)", popState.state.data);
                }
            }
            this.setState({ historyCanGoForward: windowHistory._length > 1 && popState.state.index < windowHistory._length - 1, historyCanGoBack: windowHistory._length > 1 && popState.state.index > 0 });
        } else {
            this.setState({ historyCanGoForward: false, historyCanGoBack: false });
        }
    };

    private handlePublicationInfo(open?: boolean, focusWhereAmI?: boolean) {

        if (open === false) {
            this.setState({
                shortcutEnable: true,
            });
            this.props.closePublicationInfo();
        }
        else if (this.props.publicationView) {
            this.setState({
                shortcutEnable: false,
            });
            const readerReadingLocation = this.state.currentLocation ? this.state.currentLocation : undefined;
            this.props.displayPublicationInfo(this.props.publicationView.identifier, this.state.pdfPlayerNumberOfPages, this.state.divinaNumberOfPages, this.state.divinaContinousEqualTrue, readerReadingLocation, this.handleLinkUrl.bind(this), focusWhereAmI);
        }
    }

    private divinaSetLocation = (data: { percent: number | undefined, pageIndex: number | undefined, nbOfPages: number | undefined, locator: R2Locator }) => {

        // if (isDivinaLocation(data)) {

            // const loc = {
            //     locator: {
            //         href: pageIndex.toString(),
            //         locations: {
            //             position: pageIndex,
            //             progression: pageIndex / nbOfPages,
            //         },
            //     },
            // };
            // console.log("pageChange", pageIndex, nbOfPages);

            // SEE isDivinaLocation duck typing hack with totalProgression injection!!
            // data.locator.locations.progression = (data.locator.locations as any).totalProgression;
            const locatorExtended: LocatorExtended = {
                audioPlaybackInfo: undefined,
                paginationInfo: undefined,
                selectionInfo: undefined,
                selectionIsNew: undefined,
                docInfo: undefined,
                epubPage: undefined,
                epubPageID: undefined,
                headings: undefined,
                secondWebViewHref: undefined,
                followingElementIDs: undefined,

                locator: data.locator,
            };
            // console.log(JSON.stringify(LocatorExtended, null, 4));
            this.handleReadingLocationChange(locatorExtended);
        // } else {
        //     console.log("DIVINA: location bad formated ", data);
        // }
    };

    private loadPublicationIntoViewport() {

        if (this.props.r2Publication?.Metadata?.Title) {
            const title = translateContentFieldHelper(this.props.r2Publication.Metadata.Title, this.props.locale);

            window.document.title = capitalizedAppName;
            if (title) {
                window.document.title = `${capitalizedAppName} - ${title}`;
                // this.setState({
                //     title,
                // });
            }
        }

        const clipboardInterceptor = (clipboardData: IEventPayload_R2_EVENT_CLIPBOARD_COPY) => {
            this.props.clipboardCopy(this.props.pubId, clipboardData);
        };

        if (this.props.isPdf) {

            const publicationViewport = this.mainElRef.current;

            const readingOrder = this.props.r2Publication?.Spine;
            let pdfUrl = this.props.manifestUrlR2Protocol;
            if (Array.isArray(readingOrder)) {
                const link = readingOrder[0];
                if (link.TypeLink === mimeTypes.pdf) {

                    pdfUrl = this.props.manifestUrlR2Protocol + "/../" + link.Href;
                }
            } else {
                console.log("can't found pdf link");
            }

            console.log("pdf url", pdfUrl);

            pdfMount(
                pdfUrl,
                publicationViewport,
            );

            createOrGetPdfEventBus().subscribe("copy", (txt) => clipboardInterceptor({ txt, locator: undefined }));
            createOrGetPdfEventBus().subscribe("toc", (toc) => this.setState({ pdfPlayerToc: toc }));
            createOrGetPdfEventBus().subscribe("numberofpages", (pages) => this.setState({ pdfPlayerNumberOfPages: pages }));

            createOrGetPdfEventBus().subscribe("keydown", (payload) => {
                keyDownEventHandler(payload, payload.elementName, payload.elementAttributes);
            });
            createOrGetPdfEventBus().subscribe("keyup", (payload) => {
                keyUpEventHandler(payload, payload.elementName, payload.elementAttributes);
            });

            console.log("toc", this.state.pdfPlayerToc);

            // createOrGetPdfEventBus().subscribe("page", (pageNumber) => {

            //     console.log("pdfPlayer page changed", pageNumber);
            // });

            // createOrGetPdfEventBus().subscribe("scale", (scale) => {

            //     console.log("pdfPlayer scale changed", scale);
            // });

            // createOrGetPdfEventBus().subscribe("view", (view) => {

            //     console.log("pdfPlayer view changed", view);
            // });

            // createOrGetPdfEventBus().subscribe("column", (column) => {

            //     console.log("pdfPlayer column changed", column);
            // });

            // createOrGetPdfEventBus().subscribe("search", (search) => {

            //     console.log("pdfPlayer search word changed", search);
            // });

            // createOrGetPdfEventBus().subscribe("search-next", () => {

            //     console.log("pdfPlayer highlight next search word executed");
            // });

            // createOrGetPdfEventBus().subscribe("search-previous", () => {

            //     console.log("pdfPlayer highlight previous search word executed");
            // });

            // /* master subscribe */
            // createOrGetPdfEventBus().subscribe("page-next", () => {
            //     console.log("pdfPlayer next page requested");
            // });
            // createOrGetPdfEventBus().subscribe("page-previous", () => {
            //     console.log("pdfPlayer previous page requested");
            // });

        } else if (this.props.isDivina) {

            console.log("DIVINA !!");

            // TODO: this seems like a terrible hack,
            // why does R2 navigator need this internally, instead of declaring the styles in the app's DOM?
            const publicationViewport = document.getElementById("publication_viewport");
            if (publicationViewport) {
                // tslint:disable-next-line: max-line-length
                publicationViewport.setAttribute("style", "display: block; position: absolute; left: 0; right: 0; top: 0; bottom: 0; margin: 0; padding: 0; box-sizing: border-box; background: white; overflow: hidden;");
            }

            // @----ts-ignore TS2578
            // @ts-expect-error TS2872
            const readingModeFromPersistence = "test" || this.props.divinaReadingMode;
            console.log("Reading mode from persistence : ", readingModeFromPersistence);
            const locale = this.props.locale;

            // Options for the Divina Player
            const options = {
                //maxNbOfUnitsToLoadAfter: null, // Forcing null for this value will load all units
                initialNbOfResourcesToLoad: 1000,//null, // If 0 or null, the normal nb of initial resources will load
                allowsDestroy: true,
                allowsParallel: true,
                allowsZoomOnDoubleTap: true,
                allowsZoomOnCtrlOrAltScroll: true,
                allowsSwipe: true,
                allowsWheelScroll: true,
                allowsPaginatedScroll: true,
                isPaginationGridBased: true,
                isPaginationSticky: true,
                videoLoadTimeout: 2000,
                readingMode: readingModeFromPersistence,
                language: locale,
                //loadingMessage: "Loading",
            };

            this.currentDivinaPlayer = new divinaPlayer(this.mainElRef.current);

            let manifestUrl = this.props.manifestUrlR2Protocol;
            console.log("divina url", manifestUrl);
            if (manifestUrl.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL)) {
                manifestUrl = convertCustomSchemeToHttpUrl(manifestUrl);
            }
            console.log("divina url ADJUSTED", manifestUrl);

            const [url] = manifestUrl.split("/manifest.json");
            // Load the divina from its folder path
            const locator = this.props.locator;

            console.log("LOCATOR");
            console.log("LOCATOR");
            console.log("IS DIVINA LOCATOR", isDivinaLocation(locator));
            console.log(locator?.locator);

            console.log("LOCATOR");
            console.log("LOCATOR");

            this.currentDivinaPlayer.openDivinaFromFolderPath(url, locator?.locator, options);

            // Handle events emitted by the currentDivinaPlayer
            const eventEmitter = this.currentDivinaPlayer.eventEmitter;
            // deprecated
            // eventEmitter.on("jsonload", (data: any) => {
            //     console.log("JSON load", data);
            // });

            eventEmitter.on("dataparsing", (data: any) => {

                /**
                 * once the Divina JSON has been parsed and pageNavigatorsData created
                 * Data: { readingProgression, readingModesArray, languagesArray, continuous }, where readingProgression can be used to position navigation controls,
                 * readingModesArray the list of all possible page navigators for the story, and languages the list of all possible languages for the story
                 */

                console.log("DIVINA: 'dataparsing'", data);

                const isDataParsing = (data: any): data is { readingModesArray: TdivinaReadingMode[], languagesArray: string[], continuous: boolean } => {
                    return typeof data === "object" &&
                        Array.isArray(data.readingModesArray) &&
                        data.readingModesArray.reduce((pv: any, cv: any) => pv && isDivinaReadingMode(cv), true);
                };

                if (isDataParsing(data)) {

                    // readingMode

                    const modes = data.readingModesArray;
                    this.setState({ divinaReadingModeSupported: modes });

                    const readingModeFromPersistence = this.props.divinaReadingMode;

                    let readingMode = readingModeFromPersistence;
                    if (modes.includes(readingModeFromPersistence)) {
                        readingMode = readingModeFromPersistence;
                    } else if (modes.includes(defaultReadingMode)) {
                        readingMode = defaultReadingMode;
                    } else if (modes[0]) {
                        readingMode = modes[0];
                    } else {
                        readingMode = defaultReadingMode;
                    }
                    this.props.setReadingMode(readingMode);
                    this.handleDivinaReadingMode(readingMode);
                    console.log("DIVINA ReadingModeSupported", modes, "reading mode applied:", readingMode);

                    this.setState({ divinaContinousEqualTrue: data.continuous === true });
                    console.log("DIVINA is a webtoon with continous = true", this.state.divinaContinousEqualTrue);


                    // let locale = (data.languagesArray || [""])[0];
                    // if (
                    //     (data.languagesArray || []
                    //     ).includes(this.props.locale)
                    // ) {
                    //     locale = this.props.locale;
                    // }
                    // console.log("LOCALE: ", locale);

                    // if (locale) {
                    //     console.log("SET LANGUAGE: ", locale);

                    //     this.currentDivinaPlayer.setLanguage(locale);
                    // }

                } else {
                    console.error("DIVINA: 'dataparsing' evnt => unknow data", data);
                }

            });
            // deprecated
            // eventEmitter.on("pagenavigatorscreation", (data: any) => {
            //     console.log("Page navigators creation", data);

            //     // Page navigators creation { readingModesArray: [ 'scroll' ], languagesArray: [ 'unspecified' ] }

            // });
            eventEmitter.on("initialload", (data: any) => {
                console.log("Initial load", data);
            });
            eventEmitter.on("languagechange", (data: any) => {
                console.log("Language change", data);

                // Language change { language: 'unspecified' }
            });
            // let readingmodeDropFirst = false;
            eventEmitter.on("readingmodechange", (data: any) => {
                // console.log("READING MODE BEFORE DROP FIRST TEST");
                // if (!readingmodeDropFirst) {
                // readingmodeDropFirst = true;
                // return;
                // }
                console.log("DIVINA: 'readingmodechange'", data);

                /**
                 * once a reading mode change has been validated (do note that, on opening a Divina, this event does happen after dataparsing)
                 * Data: { readingMode, nbOfPages, hasSounds, isMuted }, where
                 *  readingMode is “single” | “double” | “scroll” | “guided”,
                 *  nbOfPages is that for the corresponding page navigator,
                 *  hasSounds is a boolean that specifies whether the page navigator has sound animations,
                 *  isMuted a boolead that specified whether the player is currently muted or not)
                 */

                const isReadingModeChangeData = (data: any): data is { readingMode: TdivinaReadingMode, nbOfPages: number, hasSounds: boolean, isMuted: boolean } => {

                    return typeof data === "object" &&
                        isDivinaReadingMode(data.readingMode) &&
                        typeof data.nbOfPages === "number" &&
                        typeof data.hasSounds === "boolean" &&
                        typeof data.isMuted === "boolean";
                };

                if (isReadingModeChangeData(data)) {

                    const readingMode = data.readingMode;
                    this.props.setReadingMode(readingMode);

                    this.setState({ divinaNumberOfPages: data.nbOfPages });
                } else {
                    console.error("DIVINA: readingModeChange event => unknow data", data);
                }

                // deprecated ??
                // Reading mode change { readingMode: 'scroll', nbOfPages: 1 }
                // const index = parseInt(this.props.locator?.locator?.href, 10);
                // if (typeof index === "number" && index >= 0) {
                //     console.log("index divina", index);
                // } else {
                //     this.divinaSetLocation({ pageIndex: 0, nbOfPages: data.nbOfPages });
                // }
            });
            eventEmitter.on("readingmodeupdate", (data: any) => {
                console.log("Reading mode update", data);

                const isReadingModeUpdateData = (data: any): data is { readingMode: TdivinaReadingMode } => {
                    return typeof data === "object" &&
                        isDivinaReadingMode(data.readingMode);
                };

                if (isReadingModeUpdateData(data)) {
                    const readingMode = data.readingMode;
                    this.props.setReadingMode(readingMode);
                } else {
                    console.error("DIVINA: readingModeUpdate event => unknow data", data);
                }

                // deprecated
                // this.setState({ divinaNumberOfPages: data.nbOfPages });
            });
            let pageChangeDropFirst = false;
            eventEmitter.on("pagechange", (data: any) => {
                console.log("DIVINA: 'pagechange'", data, pageChangeDropFirst);
                if (!pageChangeDropFirst) {
                    console.log("DIVINA: 'pagechange' SKIP");
                    pageChangeDropFirst = true;
                    // inpagescrollDropFirst = false;
                    if (locator?.locator?.href) {
                        setTimeout(() => {
                            this.currentDivinaPlayer.goTo({ href: locator.locator.href });
                        }, 500);
                    }
                    return;
                }

                this.setState({ divinaArrowEnabled: false });

                const isInPageChangeData = (data: any): data is { percent: number | undefined, pageIndex: number | undefined, nbOfPages: number | undefined, locator: R2Locator } => {
                    return isDivinaLocation(data)
                        // && typeof data.percent === "number"
                    ;
                };

                if (isInPageChangeData(data)) {
                    // inpagescrollDropFirst = false;
                    // pageChangeDropFirst = false;
                    this.divinaSetLocation(data);
                } else {
                    console.error("DIVINA: pagechange event => unknow data", data);
                    try {
                        console.error(isDivinaLocation(data));
                        console.dir(data);
                    } catch { };
                }

            });
            let inpagescrollDropFirst = false;
            eventEmitter.on("inpagescroll", (data: any) => {
                console.log("DIVINA: 'inpagescroll'", data, inpagescrollDropFirst);
                if (!inpagescrollDropFirst) {
                    console.log("DIVINA: 'inpagescroll' SKIP");
                    inpagescrollDropFirst = true;
                    return;
                }
                this.setState({ divinaArrowEnabled: false });

                const isInPagesScrollData = (data: any): data is { percent: number | undefined, pageIndex: number | undefined, nbOfPages: number | undefined, locator: R2Locator } => {
                    return isDivinaLocation(data)
                        // && typeof data.percent === "number"
                    ;
                };

                if (isInPagesScrollData(data)) {
                    // inpagescrollDropFirst = false;
                    // pageChangeDropFirst = false;
                    this.divinaSetLocation(data);
                } else
                    console.error("DIVINA: inpagescroll event => unknow data", data);
            });

        } else {

            // (global as any).__dirname
            // BROKEN when index_reader.js is not served via file://
            // ... so instead window.location.href provides dist/index_reader.html which is co-located:
            // path.normalize(path.join(window.location.pathname.replace(/^\/\//, "/"), "..")) etc.

            const PREPATH = "preload.js";
            let preloadPath = PREPATH;
            if (_PACKAGING === "1") {
                preloadPath = "file://" + path.normalize(path.join(window.location.pathname.replace(/^\/\//, "/"), "..", PREPATH)).replace(/\\/g, "/");
            } else {
                preloadPath = "r2-navigator-js/dist/" +
                    "es8-es2017" +
                    "/src/electron/renderer/webview/preload.js";

                if (_RENDERER_READER_BASE_URL === "filex://host/") {
                    // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
                    preloadPath = "file://" + path.normalize(path.join(window.location.pathname.replace(/^\/\//, "/"), "..", PREPATH)).replace(/\\/g, "/");

                    // preloadPath = "file://" + path.normalize(path.join(window.location.pathname.replace(/^\/\//, "/"), "..", _NODE_MODULE_RELATIVE_URL, preloadPath)).replace(/\\/g, "/");

                    // const debugStr = `[[READER.TSX ${preloadPath} >>> ${window.location.href} *** ${window.location.pathname} === ${process.cwd()} ^^^ ${(global as any).__dirname} --- ${_NODE_MODULE_RELATIVE_URL} @@@ ${preloadPath}]]`;
                    // if (document.body.firstElementChild) {
                    //     document.body.innerText = debugStr;
                    // } else {
                    //     document.body.innerText += debugStr;
                    // }
                } else {
                    // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
                    preloadPath = "file://" + path.normalize(path.join(process.cwd(), "node_modules", preloadPath)).replace(/\\/g, "/");
                }
            }

            const locator = this.props.locator?.locator?.href ? this.props.locator.locator : undefined;
            installNavigatorDOM(
                this.props.r2Publication,
                this.props.manifestUrlR2Protocol,
                "publication_viewport",
                preloadPath,
                locator,
                true,
                (this.props.publicationView.lcp) ? clipboardInterceptor : undefined,
                this.props.winId,
                computeReadiumCssJsonMessage(this.props.readerConfig),
            );
            // stealFocusDisable(true);

            windowHistory._length = 1;
            // console.log("#+$%".repeat(5)  + " installNavigatorDOM => window history replaceState() ...", JSON.stringify(locator), JSON.stringify(window.history.state), window.history.length, windowHistory._length, JSON.stringify(document.location), JSON.stringify(window.location));
            // does not trigger onPopState!
            window.history.replaceState(locator ? { data: locator, index: windowHistory._length - 1 } : null, "");
        }
    }

    private onKeyboardShowGotoPage() {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardShowGotoPage)");
            }
            return;
        }

        this.handleMenuButtonClick(true, "tab-gotopage", true);
    }

    private onKeyboardShowTOC() {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardShowTOC)");
            }
            return;
        }

        // lock focus outside webview for 400ms
        // if (this.props.readerConfig.readerDockingMode !== "full") {
        //     stealFocusDisable(true);
        //     setTimeout(() => stealFocusDisable(false), 400);
        // }

        this.handleMenuButtonClick(true, "tab-toc");

        setTimeout(() => {
            const anchor = document.getElementById("headingFocus");
            if (anchor) {
                anchor.focus();
            } else {
                console.error("headingFocus not found !!!!!!");
            }
        }, 1);
    }

    private showSearchResults() {
        this.handleMenuButtonClick(true, "tab-search", true);
    }

    private handleMenuButtonClick(open?: boolean, openedSectionMenu?: string, doFocus?: boolean, annotationUUID?: string) {
        console.log("handleMenuButtonClick", "menuOpen=", this.state.menuOpen ? "closeMenu" : "openMenu", open !== undefined ? `openFromParam=${open ? "openMenu" : "closeMenu"}` : "");

        const openToggle = !this.state.menuOpen;
        const menuOpen = open !== undefined ? open : openToggle;
        const shortcutEnable = (menuOpen && this.props.readerConfig.readerDockingMode === "full") ? false : true;

        this.setState({
            menuOpen: menuOpen,
            shortcutEnable: shortcutEnable,
            settingsOpen: false,
            openedSectionMenu: openedSectionMenu ? openedSectionMenu : this.state.openedSectionMenu,
            doFocus: doFocus ? this.state.doFocus + 1 : this.state.doFocus,
            annotationUUID: annotationUUID ? annotationUUID : "",
        });
    }

    private saveReadingLocation(miniLocatorExtended: MiniLocatorExtended) {
        this.props.setMiniLocatorExtended(miniLocatorExtended);
    }

    private handleReadingLocationChange(locatorExtended: LocatorExtended) {

        ok(locatorExtended, "handleReadingLocationChange loc KO");

        const miniLocatorExtended = minimizeLocatorExtended(locatorExtended);

        if (!this.props.isDivina && !this.props.isPdf && this.ttsOverlayEnableNeedsSync) {
            ttsOverlayEnable(this.props.readerConfig.ttsEnableOverlayMode);
            ttsSentenceDetectionEnable(this.props.readerConfig.ttsEnableSentenceDetection);
            ttsSkippabilityEnable(this.props.readerConfig.mediaOverlaysEnableSkippability);
        }
        this.ttsOverlayEnableNeedsSync = false;

        this.saveReadingLocation(miniLocatorExtended);

        const l = (this.props.isDivina || isDivinaLocation(locatorExtended)) ? locatorExtended : (this.props.isPdf ? locatorExtended : (getCurrentReadingLocation() || locatorExtended));
        this.setState({ currentLocation: l });

        if (locatorExtended?.locator?.href && window.history.length === 1 && !window.history.state) {

            // console.log("#+$%".repeat(5)  + " handleReadingLocationChange (INIT history state) => window history replaceState() ...", JSON.stringify(loc.locator), JSON.stringify(window.history.state), window.history.length, windowHistory._length, JSON.stringify(document.location), JSON.stringify(window.location));
            windowHistory._length = 1;
            // does not trigger onPopState!
            window.history.replaceState({ data: locatorExtended.locator, index: windowHistory._length - 1 }, "");
        }

        // No need to explicitly refresh the bookmarks status here,
        // as componentDidUpdate() will call the function after setState()!
        // sets state visibleBookmarkList:
        // await this.checkBookmupdateVisibleBookmarksarks();
    }

    // check if a bookmark is on the screen
    private async updateVisibleBookmarks(): Promise<IBookmarkState[] | undefined> {
        if (!this.props.bookmarks) {
            this.setState({ visibleBookmarkList: [] });
            return undefined;
        }

        const locator = this.state.currentLocation ? this.state.currentLocation.locator : undefined;

        const visibleBookmarkList = [];
        for (const bookmark of this.props.bookmarks) {
            // calling into the webview via IPC is expensive,
            // let's filter out ahead of time based on document href
            if (!locator || locator.href === bookmark.locator.href) {
                if (this.props.isDivina || this.props.isPdf) {
                    const isVisible = bookmark.locator.href === this.props.locator.locator.href;
                    if (isVisible) {
                        visibleBookmarkList.push(bookmark);
                    }
                } else if (this.props.r2Publication) { // isLocatorVisible() API only once navigator ready
                    let isVisible = false;
                    try {
                        isVisible = await isLocatorVisible(bookmark.locator);
                    } catch (_e) {
                        // rejection because webview not fully loaded yet
                    }
                    if (isVisible) {
                        visibleBookmarkList.push(bookmark);
                    }
                }
            }
        }
        this.setState({ visibleBookmarkList });
        return visibleBookmarkList;
    }

    private focusMainArea(deep: boolean, immediate: boolean) {
        if (this.fastLinkRef?.current) {
            console.log("€€€€€ FOCUS READER MAIN");
            this.fastLinkRef.current.focus();
        }

        setTimeout(() => {
            keyboardFocusRequest(deep);
        }, immediate ? 0 : 800); // time for document load + render/paginate + reading location setter
    }

    private closeMenu() {

        if (this.state.menuOpen) {
            this.handleMenuButtonClick(false);
        }
    }

    private focusMainAreaLandmarkAndCloseMenu(deep: boolean) {

        // if (this.state.menuOpen) {
        //     this.handleMenuButtonClick(false);
        // }

        // no need here, as no hyperlink from settings menu
        // if (this.state.settingsOpen) {
        //     this.handleSettingsClick();
        // }

        this.closeMenu();
        this.focusMainArea(deep, false);
        // if (this.fastLinkRef?.current) {
        //     // shortcutEnable must be true (see handleMenuButtonClick() above, and this.state.menuOpen))
        //     console.log("@@@@@@@@@@@@@@@");
        //     console.log();

        //     console.log("@@@@@@@@@@@@@@@");

        //     this.onKeyboardFocusMain();
        // }
    }

    private navLeftOrRight_(left: boolean, spineNav?: boolean) {

        if (this.props.isPdf) {
            if (left) {
                createOrGetPdfEventBus().dispatch("page-previous");
            } else {
                createOrGetPdfEventBus().dispatch("page-next");
            }
        } else if (this.props.isDivina) {

            if (this.currentDivinaPlayer) {
                if (left) {
                    this.currentDivinaPlayer.goLeft();
                } else {
                    this.currentDivinaPlayer.goRight();
                }
            }
        } else {
            const wasPlaying = this.props.r2PublicationHasMediaOverlays ?
                this.props.mediaOverlaysState === MediaOverlaysStateEnum.PLAYING :
                this.props.ttsState === TTSStateEnum.PLAYING;
            const wasPaused = this.props.r2PublicationHasMediaOverlays ?
                this.props.mediaOverlaysState === MediaOverlaysStateEnum.PAUSED :
                this.props.ttsState === TTSStateEnum.PAUSED;

            const rtlIsOverridden = this.isRTL(this.isFixedLayout()) && this.props.disableRTLFlip;
            const left_ = rtlIsOverridden ? !left : left;

            if (wasPaused || wasPlaying) {
                navLeftOrRight(left_, false);
                // if (!this.state.r2PublicationHasMediaOverlays) {
                //     handleTTSPlayDebounced(this);
                // }
            } else {
                navLeftOrRight(left_, spineNav);
            }
        }
    }

    private goToLocator(locator: R2Locator, closeNavPanel = true, isFromOnPopState = false) {

        if (closeNavPanel && !isFromOnPopState) {
            // this.closeMenu();
            this.focusMainAreaLandmarkAndCloseMenu(true);
        }

        if (this.props.isPdf) {
            const index = locator?.href || "";
            if (index) {
                createOrGetPdfEventBus().dispatch("page", index);
            }
        } else if (this.props.isDivina) {
            // console.log(JSON.stringify(locator, null, 4));
            let index = -1;
            try {
                index = parseInt(locator?.href, 10);
                if (!Number.isInteger(index)) { // NaN
                    index = -1;
                }
            } catch (_e) {
                // noop
            }
            if (index >= 0) {
                this.currentDivinaPlayer.goToPageWithIndex(index);
            } else {
                this.currentDivinaPlayer.goTo(locator);
            }
        } else {
            this.handleLinkLocator(locator, isFromOnPopState);

            // this.focusMainArea();
        }

    }

    // tslint:disable-next-line: max-line-length
    private handleLinkClick(event: TMouseEventOnSpan | TMouseEventOnAnchor | TKeyboardEventOnAnchor | undefined, url: string, closeNavPanel = true, isFromOnPopState = false) {
        if (event) {
            event.preventDefault();
        }
        if (!url) {
            return;
        }

        if (closeNavPanel && !isFromOnPopState) {
            this.focusMainAreaLandmarkAndCloseMenu(true);
        }

        if (this.props.isPdf) {

            const index = url;
            if (index) {
                createOrGetPdfEventBus().dispatch("page", index);
            }

        } else if (this.props.isDivina) {
            console.log("HANDLE LINK CLICK DIVINA URL", url);

            this.currentDivinaPlayer.goTo({ href: url });

        } else {
            const newUrl = isFromOnPopState ? url : this.props.manifestUrlR2Protocol + "/../" + url;
            this.handleLinkUrl(newUrl, isFromOnPopState);
        }
    }

    private async handleToggleBookmark(fromKeyboard?: boolean) {

        // this.setState({bookmarkMessage: undefined});

        // sets state visibleBookmarkList
        const visibleBookmarkList = await this.updateVisibleBookmarks();

        if (this.props.isDivina || this.props.isPdf) {

            const locator = this.props.locator?.locator;
            // TODO?? const locator = this.state.currentLocation?.locator;

            const href = locator?.href;
            const name = this.props.isDivina ? locator.href : (parseInt(href, 10) + 1).toString();
            if (href) {

                const found = visibleBookmarkList.find(({ locator: { href: _href } }) => href === _href);
                if (found) {
                    this.props.deleteBookmark(found);
                } else {
                    this.props.addBookmark({
                        locator,
                        name,
                    });
                }
            }

        } else {

            const locator = this.state.currentLocation?.locator;
            if (!locator) {
                return;
            }

            const deleteAllVisibleBookmarks =

                // "toggle" only if there is a single bookmark in the content visible inside the viewport
                // otherwise preserve existing, and add new one (see addCurrentLocationToBookmarks below)
                visibleBookmarkList.length === 1 &&

                // CTRL-B (keyboard interaction) and audiobooks:
                // do not toggle: never delete, just add current reading location to bookmarks
                !fromKeyboard &&
                !this.state.currentLocation.audioPlaybackInfo &&
                (!locator.text?.highlight ||

                    // "toggle" only if visible bookmark == current reading location
                    visibleBookmarkList[0].locator.href === locator.href &&
                    visibleBookmarkList[0].locator.locations.cssSelector === locator.locations.cssSelector &&
                    visibleBookmarkList[0].locator.text?.highlight === locator.text.highlight
                )
                ;

            if (deleteAllVisibleBookmarks) {
                const l = visibleBookmarkList.length;

                // reader.navigation.bookmarkTitle
                const msg = `${this.props.__("catalog.delete")} - ${this.props.__("reader.marks.bookmarks")} [${this.props.bookmarks?.length ? this.props.bookmarks.length + 1 - l : 0}]`;
                // this.setState({bookmarkMessage: msg});
                this.props.toasty(msg);

                for (const bookmark of visibleBookmarkList) {
                    this.props.deleteBookmark(bookmark);
                }

                // we do not add the current reading location to bookmarks
                // (just toggle the existing visible ones)
                return;
            }

            const addCurrentLocationToBookmarks =
                !this.props.bookmarks?.find((b) => {
                    const identical =
                        b.locator.href === locator.href &&
                        (b.locator.locations.progression === locator.locations.progression ||
                            b.locator.locations.cssSelector && locator.locations.cssSelector &&
                            b.locator.locations.cssSelector === locator.locations.cssSelector) &&
                        b.locator.text?.highlight === locator.text?.highlight;

                    return identical;
                }) &&
                (this.state.currentLocation.audioPlaybackInfo ||
                    !visibleBookmarkList?.length ||
                    fromKeyboard || // SCREEN READER CTRL+B on discrete text position (container element)
                    locator.text?.highlight
                );

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

                // reader.navigation.bookmarkTitle
                const msg = `${this.props.__("catalog.addTagsButton")} - ${this.props.__("reader.marks.bookmarks")} [${this.props.bookmarks?.length ? this.props.bookmarks.length + 1 : 1}] ${name ? ` (${name})` : ""}`;
                // this.setState({bookmarkMessage: msg});
                this.props.toasty(msg);

                if (locator.locations && !locator.locations.rangeInfo && this.state.currentLocation.selectionInfo?.rangeInfo) {
                    locator.locations.rangeInfo = this.state.currentLocation.selectionInfo?.rangeInfo;
                }
                this.props.addBookmark({
                    locator,
                    name,
                });
            }
        }
    }

    private handleDivinaSound(play: boolean) {

        console.log(play ? "divina sound unmuted" : "divina sound muted");
        if (play)
            this.currentDivinaPlayer.unmute();
        else
            this.currentDivinaPlayer.mute();
    }

    private handleReaderClose() {
        this.props.closeReader();
    }

    private handleReaderDetach() {
        this.props.detachReader();
    }

    private handleFullscreenClick() {
        this.props.toggleFullscreen(!this.state.fullscreen);
        this.setState({ fullscreen: !this.state.fullscreen });

        if (this.state.menuOpen) {
            this.handleMenuButtonClick();
        }
        if (this.state.settingsOpen) {
            this.handleSettingsClick();
        }
    }

    private handleSettingsClick(open?: boolean, doFocus?: boolean) {
        console.log("HandleSettingsClick", "settingsOpen=", this.state.settingsOpen ? "closeSettings" : "openSettings", open !== undefined ? `openFromParam=${open ? "openSettings" : "closeSettings"}`: "");

        const openToggle = !this.state.settingsOpen;
        const settingsOpen = open !== undefined ? open : openToggle;
        const shortcutEnable = (settingsOpen && this.props.readerConfig.readerDockingMode === "full") ? false : true;

        this.setState({
            settingsOpen,
            shortcutEnable: shortcutEnable,
            menuOpen: false,
            doFocus: doFocus ? this.state.doFocus + 1 : this.state.doFocus,
            // openedSectionSettings,
        });
    }

    private handleTTSPlay() {
        ttsClickEnable(true);
        let delay = 0;
        if (!this.props.readerConfig?.noFootnotes) {
            delay = 100;
            // console.log("TTS PLAY ==> NO_FOOTNOTES MUST BE TRUE (POPUP DISABLED), SWITCHING...");
            this.props.setConfig({ noFootnotes: true });
            // TODO: skippability should be disabled when user explicitly "requests" a skippable item, such as when clicking on a note reference hyperlink, or even on a skippable element itself(?)
        }
        setTimeout(() => {
            ttsPlay(parseFloat(this.props.ttsPlaybackRate), this.props.ttsVoice);
        }, delay);
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
    private handleTTSNext(skipSentences: boolean, escape: boolean) {
        ttsNext(skipSentences, escape);
    }
    private handleTTSPrevious(skipSentences: boolean, escape: boolean) {
        ttsPrevious(skipSentences, escape);
    }
    private handleTTSPlaybackRate(speed: string) {
        ttsPlaybackRate(parseFloat(speed));
        // this.setState({ ttsPlaybackRate: speed });
        this.props.setConfig({ ttsPlaybackRate: speed });
    }
    private handleTTSVoice(voice: SpeechSynthesisVoice | null) {
        // alert(`${voice.name} ${voice.lang} ${voice.default} ${voice.voiceURI} ${voice.localService}`);
        const v = voice ? {
            default: voice.default,
            lang: voice.lang,
            localService: voice.localService,
            name: voice.name,
            voiceURI: voice.voiceURI,
        } : null;
        ttsVoice(v);
        // this.setState({ ttsVoice: v });
        this.props.setConfig({ ttsVoice: v });
    }

    private handleMediaOverlaysPlay() {
        mediaOverlaysClickEnable(true);
        let delay = 0;
        if (!this.props.readerConfig?.noFootnotes) {
            delay = 100;
            // console.log("MO PLAY ==> NO_FOOTNOTES MUST BE TRUE (POPUP DISABLED), SWITCHING...");
            this.props.setConfig({ noFootnotes: true });
            // TODO: skippability should be disabled when user explicitly "requests" a skippable item, such as when clicking on a note reference hyperlink, or even on a skippable element itself(?)
        }
        setTimeout(() => {
            mediaOverlaysPlay(parseFloat(this.props.mediaOverlaysPlaybackRate));
        }, delay);
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
        // this.setState({ mediaOverlaysPlaybackRate: speed });
        this.props.setConfig({ mediaOverlaysPlaybackRate: speed });
    }

    // private handleSettingsSave(readerConfig: ReaderConfig) {
    //     const moWasPlaying = this.props.r2PublicationHasMediaOverlays &&
    //         this.props.mediaOverlaysState === MediaOverlaysStateEnum.PLAYING;

    //     const ttsWasPlaying = this.props.ttsState !== TTSStateEnum.STOPPED;

    //     mediaOverlaysEnableSkippability(readerConfig.mediaOverlaysEnableSkippability);
    //     ttsSentenceDetectionEnable(readerConfig.ttsEnableSentenceDetection);
    //     ttsSkippabilityEnable(readerConfig.mediaOverlaysEnableSkippability);
    //     mediaOverlaysEnableCaptionsMode(readerConfig.mediaOverlaysEnableCaptionsMode);
    //     ttsOverlayEnable(readerConfig.ttsEnableOverlayMode);

    //     if (moWasPlaying) {
    //         mediaOverlaysPause();
    //         setTimeout(() => {
    //             mediaOverlaysResume();
    //         }, 300);
    //     }
    //     if (ttsWasPlaying) {
    //         ttsStop();
    //         setTimeout(() => {
    //             ttsPlay(parseFloat(this.state.ttsPlaybackRate), this.state.ttsVoice);
    //         }, 300);
    //     }

    //     this.props.setConfig(readerConfig);

    //     if (this.props.r2Publication) {
    //         readiumCssUpdate(computeReadiumCssJsonMessage(readerConfig));

    //         if (readerConfig.enableMathJax !== this.props.readerConfig.enableMathJax) {
    //             setTimeout(() => {
    //                 // window.location.reload();
    //                 reloadContent();
    //             }, 1000);
    //         }
    //     }
    // }

    // private handleSettingChange(
    //     event: TChangeEventOnInput | TChangeEventOnSelect | undefined,
    //     name: keyof ReaderConfig,
    //     givenValue?: string | boolean) {

    //     let value = givenValue;
    //     if (value === null || value === undefined) {
    //         if (event?.target?.value) {
    //             value = event.target.value.toString();
    //         } else {
    //             return;
    //         }
    //     }

    //     const readerConfig = r.clone(this.props.readerConfig);

    //     const typedName =
    //         name as (typeof value extends string ? keyof ReaderConfigStrings : keyof ReaderConfigBooleans);
    //     const typedValue =
    //         value as (typeof value extends string ? string : boolean);
    //     readerConfig[typedName] = typedValue;

    //     if (readerConfig.paged) {
    //         readerConfig.enableMathJax = false;
    //     }

    //     this.handleSettingsSave(readerConfig);
    // }

    // private handleIndexChange(event: TChangeEventOnInput, name: keyof ReaderConfigStringsAdjustables) {

    //     let valueNum = event.target.valueAsNumber;
    //     if (typeof valueNum !== "number") {
    //         const valueStr = event.target.value.toString();
    //         valueNum = parseInt(valueStr, 10);
    //         if (typeof valueNum !== "number") {
    //             console.log(`valueNum?!! ${valueNum}`);
    //             return;
    //         }
    //     }

    //     const readerConfig = r.clone(this.props.readerConfig);

    //     readerConfig[name] = optionsValues[name][valueNum];

    //     this.handleSettingsSave(readerConfig);
    // }

    private handleDivinaReadingMode(v: TdivinaReadingMode) {

        if (this.currentDivinaPlayer) {
            console.log("Set readingMode: ", v);

            this.currentDivinaPlayer.setReadingMode(v);
        }
    }

    // private setSettings(readerConfig: ReaderConfig) {
    //     // TODO: with TypeScript strictNullChecks this test condition should not be necessary!
    //     if (!readerConfig) {
    //         return;
    //     }

    //     this.handleSettingsSave(readerConfig);
    // }
}

const mapStateToProps = (state: IReaderRootState, _props: IBaseProps) => {

    const indexes: AdjustableSettingsNumber = {
        fontSize: 2,
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
    // ttsSentenceDetectionEnable(state.reader.config.ttsEnableSentenceDetection);
    // ttsSkippabilityEnable(state.reader.config.mediaOverlaysEnableSkippability);

    // extension or @type ?
    // const isDivina = isDivinaFn(state.r2Publication);
    // const isDivina = path.extname(state?.reader?.info?.filesystemPath).toLowerCase() === acceptedExtensionObject.divina;
    const isDivina = isDivinaFn(state.reader.info.r2Publication);
    const isPdf = isPdfFn(state.reader.info.r2Publication);

    return {
        isDivina,
        isPdf,
        publicationView: state.reader.info.publicationView,
        r2Publication: state.reader.info.r2Publication,
        readerConfig: state.reader.config,
        indexes,
        keyboardShortcuts: state.keyboard.shortcuts,
        infoOpen: state.dialog.open &&
            state.dialog.type === DialogTypeName.PublicationInfoReader,
        pubId: state.reader.info.publicationIdentifier,
        locator: state.reader.locator,
        searchEnable: state.search.enable,
        manifestUrlR2Protocol: state.reader.info.manifestUrlR2Protocol,
        winId: state.win.identifier,
        bookmarks: state.reader.bookmark.map(([, v]) => v),
        readerMode: state.mode,
        divinaReadingMode: state.reader.divina.readingMode,
        locale: state.i18n.locale,
        disableRTLFlip: !!state.reader.disableRTLFlip?.disabled,
        r2PublicationHasMediaOverlays: state.reader.info.navigator.r2PublicationHasMediaOverlays,
        ttsState: state.reader.tts.state,
        mediaOverlaysState: state.reader.mediaOverlay.state,
        ttsVoice: state.reader.config.ttsVoice,
        mediaOverlaysPlaybackRate: state.reader.config.mediaOverlaysPlaybackRate,
        ttsPlaybackRate: state.reader.config.ttsPlaybackRate,

        // Reader Lock Demo
        // lock: state.reader.lock,
        // Reader Lock Demo
    };
};

let __READING_FINISHED_CALL_COUNTER = 0;

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        toasty: (msg: string) => {

            dispatch(toastActions.openRequest.build(ToastType.Success, msg));
        },
        toggleFullscreen: (fullscreenOn: boolean) => {
            dispatch(readerActions.fullScreenRequest.build(fullscreenOn));
        },
        closeReader: () => {
            dispatch(readerActions.closeRequest.build());
        },
        detachReader: () => {
            dispatch(readerActions.detachModeRequest.build());
        },

        displayPublicationInfo: (pubId: string, pdfPlayerNumberOfPages: number | undefined, divinaNumberOfPages: number | undefined, divinaContinousEqualTrue: boolean, readerReadingLocation: MiniLocatorExtended | undefined, handleLinkUrl: ((url: string) => void) | undefined, focusWhereAmI?: boolean) => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoReader,
                {
                    publicationIdentifier: pubId,
                    focusWhereAmI: focusWhereAmI ? true : false,
                    pdfPlayerNumberOfPages,
                    divinaNumberOfPages,
                    divinaContinousEqualTrue,
                    readerReadingLocation,
                    handleLinkUrl,
                },
            ));
        },
        closePublicationInfo: () => {
            dispatch(dialogActions.closeRequest.build());
        },
        setMiniLocatorExtended: (miniLocatorExtended: MiniLocatorExtended) => {
            dispatch(readerLocalActionSetLocator.build(miniLocatorExtended));

            // just to refresh allPublicationPage.tsx

            // TODO: quick fix to refresh AllPublication component grid view
            // when a book is set as finished and then open / readed
            //
            // dispatch a stub api endpoint "readingFinishedRefresh" just to trigger
            // AllPublication grid view, this is a legacy usage of the ReduxApi
            // originaly developped. Now we should use the react/redux data update mechanism
            // instead to call a fake IPC API
            //
            // So call readingFinishedRefresh API at each call of setLocator function
            // trigger too often the refresh, needed only at start or when the book is
            // check as set as finished in library/AllPublication compoment during the reading
            // setLocator is heavealy called with tts enabled or in an audiobook
            // so we just called readingFinishedRefresh 2 times at start
            // (first time is not handled by the library, second time is it)
            //
            // It's not a good practice to do that, but it works!
            //
            if (__READING_FINISHED_CALL_COUNTER < 2) {
                __READING_FINISHED_CALL_COUNTER++;
                apiDispatch(dispatch)()("publication/readingFinishedRefresh")();
            }
        },
        setConfig: (config: Partial<ReaderConfig>) => {
            dispatch(readerLocalActionSetConfig.build(config));

            // session never enabled in reader but always in main/lib
            // if (!sessionEnabled) {
                // called once in the readerConfigChanged saga function triggerd by the readerLocalActionSetConfig action just above.
                // dispatch(readerActions.configSetDefault.build(config));
            // }
        },
        addBookmark: (bookmark: IBookmarkStateWithoutUUID) => {
            dispatch(readerActions.bookmark.push.build(bookmark));
        },
        deleteBookmark: (bookmark: IBookmarkState) => {
            dispatch(readerActions.bookmark.pop.build(bookmark));
        },
        setDisableRTLFlip: (disable: boolean) => {
            dispatch(readerActions.disableRTLFlip.build(disable));
        },
        setReadingMode: (readingMode: TdivinaReadingMode) => {

            console.log("Persist the reading mode", readingMode);
            dispatch(readerLocalActionDivina.setReadingMode.build({ readingMode }));
        },
        clipboardCopy: (publicationIdentifier: string, clipboardData: IEventPayload_R2_EVENT_CLIPBOARD_COPY) => {
            dispatch(readerActions.clipboardCopy.build(publicationIdentifier, clipboardData));
        },
        dispatchReaderTSXMountedAndPublicationIntoViewportLoaded: () => {
            dispatch(winActions.initSuccess.build());
        },
        triggerAnnotationBtn: () => {
            dispatch(readerLocalActionAnnotations.trigger.build());
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Reader));
