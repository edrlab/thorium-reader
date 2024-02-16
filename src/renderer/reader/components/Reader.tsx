// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

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
    ReaderConfig, ReaderConfigBooleans, ReaderConfigStrings, ReaderConfigStringsAdjustables,
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
    _APP_NAME, _APP_VERSION, _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL,
} from "readium-desktop/preprocessor-directives";
import * as DoubleArrowDownIcon from "readium-desktop/renderer/assets/icons/double_arrow_down_black_24dp.svg";
import * as DoubleArrowLeftIcon from "readium-desktop/renderer/assets/icons/double_arrow_left_black_24dp.svg";
import * as DoubleArrowRightIcon from "readium-desktop/renderer/assets/icons/double_arrow_right_black_24dp.svg";
import * as DoubleArrowUpIcon from "readium-desktop/renderer/assets/icons/double_arrow_up_black_24dp.svg";
import * as stylesReader from "readium-desktop/renderer/assets/styles/reader-app.css";
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
    TChangeEventOnInput, TChangeEventOnSelect, TKeyboardEventOnAnchor, TMouseEventOnAnchor,
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
    mediaOverlaysEnableSkippability, mediaOverlaysListen, mediaOverlaysNext, mediaOverlaysPause,
    mediaOverlaysPlay, mediaOverlaysPlaybackRate, mediaOverlaysPrevious, mediaOverlaysResume,
    MediaOverlaysStateEnum, mediaOverlaysStop, navLeftOrRight, publicationHasMediaOverlays,
    readiumCssUpdate, setEpubReadingSystemInfo, setKeyDownEventHandler, setKeyUpEventHandler,
    setReadingLocationSaver, ttsClickEnable, ttsListen, ttsNext, ttsOverlayEnable, ttsPause,
    ttsPlay, ttsPlaybackRate, ttsPrevious, ttsResume, ttsSkippabilityEnable, ttsSentenceDetectionEnable, TTSStateEnum,
    ttsStop, ttsVoice,
} from "@r2-navigator-js/electron/renderer/index";
import { reloadContent } from "@r2-navigator-js/electron/renderer/location";
import { Locator as R2Locator } from "@r2-navigator-js/electron/common/locator";

import { TToc } from "../pdf/common/pdfReader.type";
import { pdfMount } from "../pdf/driver";
import {
    readerLocalActionBookmarks, readerLocalActionDivina, readerLocalActionSetConfig,
    readerLocalActionSetLocator,
} from "../redux/actions";
import { TdivinaReadingMode, defaultReadingMode } from "readium-desktop/common/redux/states/renderer/divina";
import optionsValues, {
    AdjustableSettingsNumber, IReaderMenuProps, IReaderOptionsProps, isDivinaReadingMode,
} from "./options-values";
import PickerManager from "./picker/PickerManager";
import { URL_PARAM_CLIPBOARD_INTERCEPT, URL_PARAM_CSS, URL_PARAM_DEBUG_VISUALS, URL_PARAM_EPUBREADINGSYSTEM, URL_PARAM_GOTO, URL_PARAM_GOTO_DOM_RANGE, URL_PARAM_IS_IFRAME, URL_PARAM_PREVIOUS, URL_PARAM_REFRESH, URL_PARAM_SECOND_WEBVIEW, URL_PARAM_SESSION_INFO, URL_PARAM_WEBVIEW_SLOT } from "@r2-navigator-js/electron/renderer/common/url-params";

import { createOrGetPdfEventBus } from "readium-desktop/renderer/reader/pdf/driver";

import {
    highlightsCreate,
} from "@r2-navigator-js/electron/renderer";

import { IS_DEV } from "readium-desktop/preprocessor-directives";

// main process code!
// thoriumhttps
// import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL } from "readium-desktop/main/streamer/streamerNoHttp";

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
            !url_.startsWith("thoriumhttps://")) {
            console.log(">> HISTORY POP STATE SKIP URL (1)", url_);
            return;
        }
        // console.log(">> HISTORY POP STATE DO URL (1)", url_);

        if (window.history.state?.data === url_) {
            window.history.replaceState({data: url_, index: windowHistory._length - 1}, "");
        } else {
            windowHistory._length++;
            window.history.pushState({data: url_, index: windowHistory._length - 1}, "");
        }
        if (windowHistory._readerInstance) {
            windowHistory._readerInstance.setState({historyCanGoForward: false, historyCanGoBack: windowHistory._length > 1});
        }
    }
};

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

const isDivinaLocation = (data: any): data is { pageIndex: number, nbOfPages: number, locator: R2Locator } => {

    return typeof data === "object"
        // && typeof data.pageIndex === "number"
        // && typeof data.nbOfPages === "number"
        && typeof data.locator === "object"
        && typeof data.locator.href === "string"
        && typeof data.locator.locations === "object"
        && typeof data.locator.locations.position === "number"
        && typeof data.locator.locations.totalProgression === "number"
        && data.locator.locations.totalProgression >= 0
        && data.locator.locations.totalProgression <= 1;
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
    ttsVoice: SpeechSynthesisVoice | null;

    mediaOverlaysState: MediaOverlaysStateEnum;
    mediaOverlaysPlaybackRate: string;

    visibleBookmarkList: IBookmarkState[];
    currentLocation: LocatorExtended;

    divinaReadingModeSupported: TdivinaReadingMode[];
    divinaNumberOfPages: number;
    divinaArrowEnabled: boolean;
    divinaContinousEqualTrue: boolean;

    pdfPlayerToc: TToc | undefined;
    pdfPlayerNumberOfPages: number | undefined;

    openedSectionSettings: number | undefined;
    openedSectionMenu: number | undefined;

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

    constructor(props: IProps) {
        super(props);

        this.ttsOverlayEnableNeedsSync = true;

        this.onKeyboardHistoryNavigationPrevious = this.onKeyboardHistoryNavigationPrevious.bind(this);
        this.onKeyboardHistoryNavigationNext = this.onKeyboardHistoryNavigationNext.bind(this);
        this.onKeyboardPageNavigationPrevious = this.onKeyboardPageNavigationPrevious.bind(this);
        this.onKeyboardPageNavigationNext = this.onKeyboardPageNavigationNext.bind(this);
        this.onKeyboardSpineNavigationPrevious = this.onKeyboardSpineNavigationPrevious.bind(this);
        this.onKeyboardSpineNavigationNext = this.onKeyboardSpineNavigationNext.bind(this);
        this.onKeyboardFocusMain = this.onKeyboardFocusMain.bind(this);
        this.onKeyboardFocusToolbar = this.onKeyboardFocusToolbar.bind(this);
        this.onKeyboardFullScreen = this.onKeyboardFullScreen.bind(this);
        this.onKeyboardBookmark = this.onKeyboardBookmark.bind(this);
        this.onKeyboardInfo = this.onKeyboardInfo.bind(this);
        this.onKeyboardInfoWhereAmI = this.onKeyboardInfoWhereAmI.bind(this);
        this.onKeyboardInfoWhereAmISpeak = this.onKeyboardInfoWhereAmISpeak.bind(this);
        this.onKeyboardFocusSettings = this.onKeyboardFocusSettings.bind(this);
        this.onKeyboardFocusNav = this.onKeyboardFocusNav.bind(this);

        this.onPopState = this.onPopState.bind(this);

        this.fastLinkRef = React.createRef<HTMLAnchorElement>();
        this.refToolbar = React.createRef<HTMLAnchorElement>();
        this.mainElRef = React.createRef<HTMLDivElement>();

        this.state = {
            // bookmarkMessage: undefined,

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
            ttsVoice: null,

            mediaOverlaysState: MediaOverlaysStateEnum.STOPPED,
            mediaOverlaysPlaybackRate: "1",

            visibleBookmarkList: [],
            currentLocation: undefined,

            divinaNumberOfPages: 0,
            divinaReadingModeSupported: [],

            pdfPlayerToc: undefined,
            pdfPlayerNumberOfPages: undefined,

            openedSectionSettings: undefined,
            openedSectionMenu: undefined,

            divinaArrowEnabled: true,
            divinaContinousEqualTrue: false,

            historyCanGoBack: false,
            historyCanGoForward: false,
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
        this.setSettings = this.setSettings.bind(this);
        this.handleReadingLocationChange = this.handleReadingLocationChange.bind(this);
        this.handleToggleBookmark = this.handleToggleBookmark.bind(this);
        this.goToLocator = this.goToLocator.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);

        this.handleDivinaSound = this.handleDivinaSound.bind(this);

        this.isRTLFlip = this.isRTLFlip.bind(this);
    }

    public async componentDidMount() {
        windowHistory._readerInstance = this;

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
            const foot = window.document.querySelector(`.${stylesReader.reader_footer}`);
            if (foot) {
                foot.classList.remove(stylesReader.HIDE_CURSOR_CLASS_foot);
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
                const foot = window.document.querySelector(`.${stylesReader.reader_footer}`);
                if (foot) {
                    foot.classList.add(stylesReader.HIDE_CURSOR_CLASS_foot);
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
                    const loc = {
                        locator: {
                            href: pageIndex.toString(),
                            locations: {
                                position: pageIndex,
                                // progression: numberOfPages ? (pageIndex / numberOfPages) : 0,
                                progression: 0,
                            },
                        },
                    };
                    console.log("pdf pageChange", pageIndex);

                    // TODO: this is a hack! Forcing type LocatorExtended on this non-matching object shape
                    // only "works" because data going into the persistent store (see saveReadingLocation())
                    // is used appropriately and selectively when extracted back out ...
                    // however this may trip / crash future code
                    // if strict LocatorExtended model structure is expected when
                    // reading from the persistence layer.
                    this.handleReadingLocationChange(loc as unknown as LocatorExtended);
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

            setReadingLocationSaver(this.handleReadingLocationChange);
            setEpubReadingSystemInfo({ name: _APP_NAME, version: _APP_VERSION });
            this.loadPublicationIntoViewport();
        }

        // sets state visibleBookmarkList
        await this.updateVisibleBookmarks();
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
    }

    public componentWillUnmount() {
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
            r2Publication: this.props.r2Publication,
            handleLinkClick: this.handleLinkClick,
            goToLocator: this.goToLocator,
            toggleMenu: this.handleMenuButtonClick,
            focusMainAreaLandmarkAndCloseMenu: this.focusMainAreaLandmarkAndCloseMenu.bind(this),
            pdfToc: this.state.pdfPlayerToc,
            isPdf: this.props.isPdf,
            openedSection: this.state.openedSectionMenu,
            pdfNumberOfPages: this.state.pdfPlayerNumberOfPages,
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
            handleDivinaReadingMode: this.handleDivinaReadingMode.bind(this),

            setDisableRTLFlip: this.props.setDisableRTLFlip.bind(this),
            disableRTLFlip: this.props.disableRTLFlip,

            divinaReadingMode: this.props.divinaReadingMode,
            divinaReadingModeSupported: this.state.divinaReadingModeSupported,

            isDivina: this.props.isDivina,
            isPdf: this.props.isPdf,
            openedSection: this.state.openedSectionSettings,
        };

        // {this.state.bookmarkMessage ? <div
        //     aria-live="assertive"
        //     aria-relevant="all"
        //     role="alert"

        //     style={{position: "absolute", left: "-1000px"}}
        // >
        //     {this.state.bookmarkMessage}
        // </div> : <></>}
        return (
            <div className={classNames(
                this.props.readerConfig.night && stylesReader.nightMode,
                this.props.readerConfig.sepia && stylesReader.sepiaMode,
            )}>
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
                        ttsState={this.state.ttsState}
                        ttsPlaybackRate={this.state.ttsPlaybackRate}
                        ttsVoice={this.state.ttsVoice}

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
                        mode={this.props.readerMode}
                        handleFullscreenClick={this.handleFullscreenClick}
                        handleReaderDetach={this.handleReaderDetach}
                        handleReaderClose={this.handleReaderClose}
                        toggleBookmark={() => this.handleToggleBookmark(false)}
                        isOnBookmark={this.state.visibleBookmarkList.length > 0}
                        isOnSearch={this.props.searchEnable}
                        readerOptionsProps={readerOptionsProps}
                        readerMenuProps={readerMenuProps}
                        displayPublicationInfo={this.displayPublicationInfo}
                        // tslint:disable-next-line: max-line-length
                        currentLocation={this.props.isDivina || this.props.isPdf ? this.props.locator : this.state.currentLocation}
                        isDivina={this.props.isDivina}
                        isPdf={this.props.isPdf}
                        divinaSoundPlay={this.handleDivinaSound}
                        r2Publication={this.props.r2Publication}

                        disableRTLFlip={this.props.disableRTLFlip}
                        isRTLFlip={this.isRTLFlip}
                    />
                    <div className={classNames(stylesReader.content_root,
                        this.state.fullscreen ? stylesReader.content_root_fullscreen : undefined,
                        this.props.isPdf ? stylesReader.content_root_skip_bottom_spacing : undefined)}>
                        <PickerManager
                            showSearchResults={this.showSearchResults}
                            isPdf={this.props.isPdf}
                        ></PickerManager>
                        <div className={stylesReader.reader}>
                            <main
                                id="main"
                                aria-label={this.props.__("accessibility.mainContent")}
                                className={stylesReader.publication_viewport_container}>
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
                                    className={stylesReader.publication_viewport}
                                    ref={this.mainElRef}
                                >
                                </div>

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

                            </main>
                        </div>
                    </div>
                </div>
                <ReaderFooter
                    historyCanGoBack={this.state.historyCanGoBack}
                    historyCanGoForward={this.state.historyCanGoForward}
                    navLeftOrRight={this.navLeftOrRight_.bind(this)}
                    gotoBegin={this.onKeyboardNavigationToBegin.bind(this)}
                    gotoEnd={this.onKeyboardNavigationToEnd.bind(this)}
                    fullscreen={this.state.fullscreen}
                    // tslint:disable-next-line: max-line-length
                    currentLocation={this.props.isDivina || this.props.isPdf ? this.props.locator : this.state.currentLocation}
                    r2Publication={this.props.r2Publication}
                    handleLinkClick={this.handleLinkClick}
                    goToLocator={this.goToLocator}
                    isDivina={this.props.isDivina}
                    divinaNumberOfPages={this.state.divinaNumberOfPages}
                    divinaContinousEqualTrue={this.state.divinaContinousEqualTrue}
                    isPdf={this.props.isPdf}

                    disableRTLFlip={this.props.disableRTLFlip}
                    isRTLFlip={this.isRTLFlip}
                />
            </div>
        );
    }

    public setTTSState(ttss: TTSStateEnum) {
        this.setState({ ttsState: ttss });
    }

    public setMediaOverlaysState(mos: MediaOverlaysStateEnum) {
        this.setState({ mediaOverlaysState: mos });
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
            this.onKeyboardAudioPrevious);
        registerKeyboardListener(
            true, // listen for key up (not key down)
            this.props.keyboardShortcuts.AudioNext,
            this.onKeyboardAudioNext);
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

        // TODO HIGHLIGHTS-ANNOTATIONS: just for testing!
        if (IS_DEV) {
          registerKeyboardListener(
              true, // listen for key up (not key down)
              this.props.keyboardShortcuts.AnnotationsTest1,
              this.onKeyboardAnnotationsTest1);
          registerKeyboardListener(
              true, // listen for key up (not key down)
              this.props.keyboardShortcuts.AnnotationsTest2,
              this.onKeyboardAnnotationsTest2);
          registerKeyboardListener(
              true, // listen for key up (not key down)
              this.props.keyboardShortcuts.AnnotationsTest3,
              this.onKeyboardAnnotationsTest3);
        }
    }

    private unregisterAllKeyboardListeners() {
        unregisterKeyboardListener(this.onKeyboardHistoryNavigationPrevious);
        unregisterKeyboardListener(this.onKeyboardHistoryNavigationNext);
        unregisterKeyboardListener(this.onKeyboardPageNavigationPrevious);
        unregisterKeyboardListener(this.onKeyboardPageNavigationNext);
        unregisterKeyboardListener(this.onKeyboardSpineNavigationPrevious);
        unregisterKeyboardListener(this.onKeyboardSpineNavigationNext);
        unregisterKeyboardListener(this.onKeyboardFocusMain);
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
        unregisterKeyboardListener(this.onKeyboardAudioPrevious);
        unregisterKeyboardListener(this.onKeyboardAudioNext);
        unregisterKeyboardListener(this.onKeyboardAudioPreviousAlt);
        unregisterKeyboardListener(this.onKeyboardAudioNextAlt);
        unregisterKeyboardListener(this.onKeyboardAudioStop);

        // TODO HIGHLIGHTS-ANNOTATIONS: just for testing!
        if (IS_DEV) {
            unregisterKeyboardListener(this.onKeyboardAnnotationsTest1);
            unregisterKeyboardListener(this.onKeyboardAnnotationsTest2);
            unregisterKeyboardListener(this.onKeyboardAnnotationsTest3);
        }
    }

    private handleLinkLocator = (locator: R2Locator, isFromOnPopState = false) => {

        if (!windowHistory._length) {
            windowHistory._length = 0;
        }

        if (!isFromOnPopState) {
            // console.log("#+$%".repeat(5)  + " goToLocator history pushState()", JSON.stringify(locator), JSON.stringify(document.location), JSON.stringify(window.location), JSON.stringify(window.history.state), window.history.length, windowHistory._length);
            if (window.history.state && r.equals(locator, window.history.state.data)) {
                window.history.replaceState({data: locator, index: windowHistory._length - 1}, "");
            } else {
                windowHistory._length++;
                window.history.pushState({data: locator, index: windowHistory._length - 1}, "");
            }

            // windowHistory._readerInstance === this
            this.setState({historyCanGoForward: false, historyCanGoBack: windowHistory._length > 1});
        }
        r2HandleLinkLocator(locator);
    };

    private handleLinkUrl = (url: string, isFromOnPopState = false) => {
        handleLinkUrl_UpdateHistoryState(url, isFromOnPopState);
        r2HandleLinkUrl(url);
    };

    // TODO HIGHLIGHTS-ANNOTATIONS: just for testing!
    private onKeyboardAnnotationsTest = (type: number) => {

        if (IS_DEV) {
            if (this.props.isDivina || this.props.isPdf) {
                return;
            }

            // navigator loc has updated selectionInfo (may have been invalidated / cleared since last notified here ... so takes precedence over local state)
            const loc = getCurrentReadingLocation() || this.state.currentLocation;

            if (!loc?.locator?.href || !loc?.selectionInfo) { // loc?.selectionIsNew
                return;
            }

            const colors = [{
                red: 210,
                green: 137,
                blue: 156,
            },
            {
                red: 6,
                green: 202,
                blue: 56,
            },
            {
                red: 57,
                green: 153,
                blue: 208,
            },
            {
                red: 213,
                green: 180,
                blue: 120,
            },
            {
                red: 61,
                green: 181,
                blue: 172,
            }];
            const color = false ? colors[Math.floor(Math.random() * colors.length)] : {
                red: Math.floor(Math.random() * 256),
                green: Math.floor(Math.random() * 256),
                blue: Math.floor(Math.random() * 256),
            };
            console.log("DEV HIGHLIGHT CREATE: " + type, JSON.stringify(color, null, 4));

            highlightsCreate(loc.locator.href, [
                {
                    selectionInfo: loc.selectionInfo,
                    // range: Range,

                    color,

                    // 0 is full background (default), 1 is underline, 2 is strikethrough
                    // FUTURE: 3 is composite background + underline
                    drawType: type,

                    expand: 3,

                    group: "annotations",
                },
            ]);
        }
    };
    private onKeyboardAnnotationsTest1 = () => {
        this.onKeyboardAnnotationsTest(0);
    };
    private onKeyboardAnnotationsTest2 = () => {
        this.onKeyboardAnnotationsTest(1);
    };
    private onKeyboardAnnotationsTest3 = () => {
        this.onKeyboardAnnotationsTest(2);
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
    };

    private onKeyboardAudioPreviousAlt = () => {
        this.onKeyboardAudioPrevious(true);
    };
    private onKeyboardAudioPrevious = (skipSentences = false) => {
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
            // const doc = document as TKeyboardDocument;
            // const skipSentences = doc._keyModifierShift && doc._keyModifierAlt;
            this.handleTTSPrevious(skipSentences);
        }
    };

    private onKeyboardAudioNextAlt = () => {
        this.onKeyboardAudioNext(true);
    };
    private onKeyboardAudioNext = (skipSentences = false) => {
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
            // const doc = document as TKeyboardDocument;
            // const skipSentences = doc._keyModifierShift && doc._keyModifierAlt;
            this.handleTTSNext(skipSentences);
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
        this.displayPublicationInfo(true);
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
        this.displayPublicationInfo();
    };

    private onKeyboardFocusNav = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFocusNav)");
            }
            return;
        }
        this.handleMenuButtonClick();
    };
    private onKeyboardFocusSettings = () => {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardFocusSettings)");
            }
            return;
        }
        this.handleSettingsClick();
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

        if (this.fastLinkRef?.current) {
            console.log("€€€€€ FOCUS READER MAIN");
            this.fastLinkRef.current.focus();
        }
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
            // this.currentDivinaPlayer.goToPageWithIndex(index);
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

        if (popState.state?.data) {
            if (typeof popState.state.data === "object") {
                this.goToLocator(popState.state.data, true, true);
            } else if (typeof popState.state.data === "string") {
                // if (!/https?:\/\//.test(popState.state.data)) {
                if (popState.state.data.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ||
                    popState.state.data.startsWith("thoriumhttps://")) {
                    this.handleLinkClick(undefined, popState.state.data, true, true);
                } else {
                    console.log(">> HISTORY POP STATE SKIP URL (2)", popState.state.data);
                }
            }
            this.setState({historyCanGoForward: windowHistory._length > 1 && popState.state.index < windowHistory._length - 1, historyCanGoBack: windowHistory._length > 1 && popState.state.index > 0});
        } else {
            this.setState({historyCanGoForward: false, historyCanGoBack: false});
        }
    };

    private displayPublicationInfo(focusWhereAmI?: boolean) {
        if (this.props.publicationView) {
            // TODO: subscribe to Redux action type == CloseRequest
            // in order to reset shortcutEnable to true? Problem: must be specific to this reader window.
            // So instead we subscribe to DOM event "Thorium:DialogClose", but this is a short-term hack!
            this.setState({
                shortcutEnable: false,
            });

            const readerReadingLocation = this.state.currentLocation ? this.state.currentLocation : undefined;
            this.props.displayPublicationInfo(this.props.publicationView.identifier, this.state.pdfPlayerNumberOfPages, this.state.divinaNumberOfPages, this.state.divinaContinousEqualTrue, readerReadingLocation, this.handleLinkUrl.bind(this), focusWhereAmI);
        }
    }

    private divinaSetLocation = (data: any) => {


        if (isDivinaLocation(data)) {

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

            data.locator.locations.progression = (data.locator.locations as any).totalProgression;
            const LocatorExtended: LocatorExtended = {
                audioPlaybackInfo: undefined,
                locator: data.locator,
                paginationInfo: undefined,
                selectionInfo: undefined,
                selectionIsNew: undefined,
                docInfo: undefined,
                epubPage: undefined,
                epubPageID: undefined,
                headings: undefined,
                secondWebViewHref: undefined,
            };
            this.handleReadingLocationChange(LocatorExtended);
        } else {
            console.log("DIVINA: location bad formated ", data);
        }

    };

    private loadPublicationIntoViewport() {

        if (this.props.r2Publication?.Metadata?.Title) {
            const title = this.props.translator.translateContentField(this.props.r2Publication.Metadata.Title);

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
                if (!pageChangeDropFirst) {
                    pageChangeDropFirst = true;
                    return;
                }
                console.log("DIVINA: 'pagechange'", data);

                this.setState({divinaArrowEnabled: false});

                const isInPageChangeData = (data: any): data is { percent: number, locator: R2Locator } => {
                    return typeof data === "object" &&
                        isDivinaLocation(data);
                };

                if (isInPageChangeData(data)) {
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
                if (!inpagescrollDropFirst) {
                    inpagescrollDropFirst = true;
                    return;
                }
                console.log("DIVINA: 'inpagescroll'", data);
                this.setState({ divinaArrowEnabled: false });
                const isInPagesScrollData = (data: any): data is { percent: number, locator: R2Locator } => {
                    return typeof data === "object" &&
                        // typeof data.percent === "number" &&
                        isDivinaLocation(data);
                };

                if (isInPagesScrollData(data)) {

                    this.divinaSetLocation(data);
                } else
                    console.error("DIVINA: inpagescroll event => unknow data", data);
            });

        } else {
            this.setState({
                r2PublicationHasMediaOverlays: publicationHasMediaOverlays(this.props.r2Publication),
            });

            let preloadPath = "preload.js";
            if (_PACKAGING === "1") {
                preloadPath = "file://" + path.normalize(path.join((global as any).__dirname, preloadPath));
            } else {
                preloadPath = "r2-navigator-js/dist/" +
                    "es8-es2017" +
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

            windowHistory._length = 1;
            // console.log("#+$%".repeat(5)  + " installNavigatorDOM => window history replaceState() ...", JSON.stringify(locator), JSON.stringify(window.history.state), window.history.length, windowHistory._length, JSON.stringify(document.location), JSON.stringify(window.location));
            // does not trigger onPopState!
            window.history.replaceState(locator ? {data: locator, index: windowHistory._length - 1} : null, "");
        }
    }

    private onKeyboardShowGotoPage() {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardShowGotoPage)");
            }
            return;
        }

        // WARNING: "goto page" zero-based index in SectionData[] of ReaderMenu.tsx
        this.handleMenuButtonClick(4);
    }

    private onKeyboardShowTOC() {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardShowTOC)");
            }
            return;
        }

        // WARNING: "table of contents" zero-based index in SectionData[] of ReaderMenu.tsx
        this.handleMenuButtonClick(0);
    }

    private showSearchResults() {
        // WARNING: "search" zero-based index in SectionData[] of ReaderMenu.tsx
        this.handleMenuButtonClick(3);
    }

    private handleMenuButtonClick(openedSectionMenu?: number | undefined) {
        this.setState({
            menuOpen: !this.state.menuOpen,
            shortcutEnable: this.state.menuOpen,
            settingsOpen: false,
            openedSectionMenu,
        });
    }

    private saveReadingLocation(loc: LocatorExtended) {
        this.props.setLocator(loc);
    }

    // TODO: WARNING, see code comments alongisde usage of this function for Divina and PDF
    // (forced type despite different object shape / data model)
    // See saveReadingLocation() => dispatch(readerLocalActionSetLocator.build(locator))
    // See Reader RootState reader.locator (readerLocatorReducer merges the action data payload
    // as-is, without type checking ... but consumers might expect strict LocatorExtended!)
    private handleReadingLocationChange(loc: LocatorExtended) {

        ok(loc, "handleReadingLocationChange loc KO");

        if (!this.props.isDivina && !this.props.isPdf && this.ttsOverlayEnableNeedsSync) {
            ttsOverlayEnable(this.props.readerConfig.ttsEnableOverlayMode);
            ttsSentenceDetectionEnable(this.props.readerConfig.ttsEnableSentenceDetection);
            ttsSkippabilityEnable(this.props.readerConfig.mediaOverlaysEnableSkippability);
        }
        this.ttsOverlayEnableNeedsSync = false;

        // note that with Divina, loc has locator.locations.progression set to totalProgression
        this.saveReadingLocation(loc);

        const l = (this.props.isDivina || isDivinaLocation(loc)) ? loc : (this.props.isPdf ? loc : (getCurrentReadingLocation() || loc));
        this.setState({ currentLocation: l });

        if (loc?.locator?.href && window.history.length === 1 && !window.history.state) {

            // console.log("#+$%".repeat(5)  + " handleReadingLocationChange (INIT history state) => window history replaceState() ...", JSON.stringify(loc.locator), JSON.stringify(window.history.state), window.history.length, windowHistory._length, JSON.stringify(document.location), JSON.stringify(window.location));
            windowHistory._length = 1;
            // does not trigger onPopState!
            window.history.replaceState({data: loc.locator, index: windowHistory._length - 1}, "");
        }

        // No need to explicitly refresh the bookmarks status here,
        // as componentDidUpdate() will call the function after setState()!
        // sets state visibleBookmarkList:
        // await this.checkBookmupdateVisibleBookmarksarks();
    }

    // check if a bookmark is on the screen
    private async updateVisibleBookmarks(): Promise<IBookmarkState[] | undefined> {
        if (!this.props.bookmarks) {
            this.setState({ visibleBookmarkList: []});
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
                    try{
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

    private focusMainAreaLandmarkAndCloseMenu() {

        if (this.state.menuOpen) {
            this.handleMenuButtonClick();
        }

        // no need here, as no hyperlink from settings menu
        // if (this.state.settingsOpen) {
        //     this.handleSettingsClick();
        // }

        if (this.fastLinkRef?.current) {
            // shortcutEnable must be true (see handleMenuButtonClick() above, and this.state.menuOpen))
            this.onKeyboardFocusMain();
        }
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
            const wasPlaying = this.state.r2PublicationHasMediaOverlays ?
                this.state.mediaOverlaysState === MediaOverlaysStateEnum.PLAYING :
                this.state.ttsState === TTSStateEnum.PLAYING;
            const wasPaused = this.state.r2PublicationHasMediaOverlays ?
                this.state.mediaOverlaysState === MediaOverlaysStateEnum.PAUSED :
                this.state.ttsState === TTSStateEnum.PAUSED;

            if (wasPaused || wasPlaying) {
                navLeftOrRight(left, false);
                // if (!this.state.r2PublicationHasMediaOverlays) {
                //     handleTTSPlayDebounced(this);
                // }
            } else {
                navLeftOrRight(left, spineNav);
            }
        }
    }

    private goToLocator(locator: R2Locator, closeNavPanel = true, isFromOnPopState = false) {

        if (this.props.isPdf) {

            const index = locator?.href || "";
            if (index) {
                createOrGetPdfEventBus().dispatch("page", index);
            }

        } else if (this.props.isDivina) {
            // const index = parseInt(locator?.href, 10);
            // if (index >= 0) {
            //     this.currentDivinaPlayer.goToPageWithIndex(index);
            // }
            this.currentDivinaPlayer.goTo(locator);
        } else {
            if (closeNavPanel) {
                this.focusMainAreaLandmarkAndCloseMenu();
            }

            this.handleLinkLocator(locator, isFromOnPopState);
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

        if (this.props.isPdf) {

            const index = url;
            if (index) {
                createOrGetPdfEventBus().dispatch("page", index);
            }

        } else if (this.props.isDivina) {

            console.log("HANDLE LINK CLICK DIVINA URL", url);

            this.currentDivinaPlayer.goTo({ href: url });

        } else {
            if (closeNavPanel) {
                this.focusMainAreaLandmarkAndCloseMenu();
            }
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
                const msg = `${this.props.__("catalog.delete")} - ${this.props.__("reader.marks.bookmarks")} [${this.props.bookmarks?.length ? this.props.bookmarks.length - l : 0}]`;
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

    private handleSettingsClick(openedSectionSettings?: number | undefined) {
        this.setState({
            settingsOpen: !this.state.settingsOpen,
            shortcutEnable: this.state.settingsOpen,
            menuOpen: false,
            openedSectionSettings,
        });
    }

    private handleTTSPlay() {
        ttsClickEnable(true);
        ttsPlay(parseFloat(this.state.ttsPlaybackRate), this.state.ttsVoice);
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
    private handleTTSNext(skipSentences = false) {
        ttsNext(skipSentences);
    }
    private handleTTSPrevious(skipSentences = false) {
        ttsPrevious(skipSentences);
    }
    private handleTTSPlaybackRate(speed: string) {
        ttsPlaybackRate(parseFloat(speed));
        this.setState({ ttsPlaybackRate: speed });
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
        this.setState({ ttsVoice: v });
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
        this.setState({ mediaOverlaysPlaybackRate: speed });
    }

    private handleSettingsSave(readerConfig: ReaderConfig) {
        const moWasPlaying = this.state.r2PublicationHasMediaOverlays &&
            this.state.mediaOverlaysState === MediaOverlaysStateEnum.PLAYING;
        const ttsWasPlaying = this.state.ttsState !== TTSStateEnum.STOPPED;

        mediaOverlaysEnableSkippability(readerConfig.mediaOverlaysEnableSkippability);
        ttsSentenceDetectionEnable(readerConfig.ttsEnableSentenceDetection);
        ttsSkippabilityEnable(readerConfig.mediaOverlaysEnableSkippability);
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
                ttsPlay(parseFloat(this.state.ttsPlaybackRate), this.state.ttsVoice);
            }, 300);
        }

        this.props.setConfig(readerConfig, this.props.session);

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
            if (event?.target?.value) {
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

    private handleDivinaReadingMode(v: TdivinaReadingMode) {

        if (this.currentDivinaPlayer) {
            console.log("Set readingMode: ", v);

            this.currentDivinaPlayer.setReadingMode(v);
        }
    }

    private setSettings(readerConfig: ReaderConfig) {
        // TODO: with TypeScript strictNullChecks this test condition should not be necessary!
        if (!readerConfig) {
            return;
        }

        this.handleSettingsSave(readerConfig);
    }
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
    // const isDivina = path.extname(state?.reader?.info?.filesystemPath) === acceptedExtensionObject.divina;
    const isDivina = isDivinaFn(state.reader.info.r2Publication);
    const isPdf = isPdfFn(state.reader.info.r2Publication);

    return {
        isDivina,
        isPdf,
        lang: state.i18n.locale,
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
        session: state.session.state,

        disableRTLFlip: !!state.reader.disableRTLFlip?.disabled,
    };
};

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

        displayPublicationInfo: (pubId: string, pdfPlayerNumberOfPages: number | undefined, divinaNumberOfPages: number | undefined, divinaContinousEqualTrue: boolean, readerReadingLocation: LocatorExtended | undefined, handleLinkUrl: ((url: string) => void) | undefined, focusWhereAmI?: boolean) => {
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
        setLocator: (locator: LocatorExtended) => {
            dispatch(readerLocalActionSetLocator.build(locator));
        },
        setConfig: (config: ReaderConfig, sessionEnabled: boolean) => {
            dispatch(readerLocalActionSetConfig.build(config));

            if (!sessionEnabled) {
                dispatch(readerActions.configSetDefault.build(config));
            }
        },
        addBookmark: (bookmark: IBookmarkStateWithoutUUID) => {
            dispatch(readerLocalActionBookmarks.push.build(bookmark));
        },
        deleteBookmark: (bookmark: IBookmarkState) => {
            dispatch(readerLocalActionBookmarks.pop.build(bookmark));
        },
        setDisableRTLFlip: (disable: boolean) => {
            dispatch(readerActions.disableRTLFlip.build(disable));
        },
        setReadingMode: (readingMode: TdivinaReadingMode) => {
            dispatch(readerLocalActionDivina.setReadingMode.build({readingMode}));
        },
        clipboardCopy: (publicationIdentifier: string, clipboardData: IEventPayload_R2_EVENT_CLIPBOARD_COPY) => {
            dispatch(readerActions.clipboardCopy.build(publicationIdentifier, clipboardData));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Reader));
