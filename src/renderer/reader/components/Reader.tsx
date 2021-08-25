// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

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
import { dialogActions, readerActions } from "readium-desktop/common/redux/actions";
import {
    IBookmarkState, IBookmarkStateWithoutUUID,
} from "readium-desktop/common/redux/states/bookmark";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { formatTime } from "readium-desktop/common/utils/time";
import {
    _APP_NAME, _APP_VERSION, _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL,
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

import { IEventPayload_R2_EVENT_CLIPBOARD_COPY } from "@r2-navigator-js/electron/common/events";
import {
    convertCustomSchemeToHttpUrl, READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "@r2-navigator-js/electron/common/sessions";
import {
    audioForward, audioPause, audioRewind, audioTogglePlayPause,
} from "@r2-navigator-js/electron/renderer/audiobook";
import {
    getCurrentReadingLocation, handleLinkLocator, handleLinkUrl, installNavigatorDOM,
    isLocatorVisible, LocatorExtended, mediaOverlaysClickEnable, mediaOverlaysEnableCaptionsMode,
    mediaOverlaysEnableSkippability, mediaOverlaysListen, mediaOverlaysNext, mediaOverlaysPause,
    mediaOverlaysPlay, mediaOverlaysPlaybackRate, mediaOverlaysPrevious, mediaOverlaysResume,
    MediaOverlaysStateEnum, mediaOverlaysStop, navLeftOrRight, publicationHasMediaOverlays,
    readiumCssUpdate, setEpubReadingSystemInfo, setKeyDownEventHandler, setKeyUpEventHandler,
    setReadingLocationSaver, ttsClickEnable, ttsListen, ttsNext, ttsOverlayEnable, ttsPause,
    ttsPlay, ttsPlaybackRate, ttsPrevious, ttsResume, ttsSentenceDetectionEnable, TTSStateEnum,
    ttsStop, ttsVoice,
} from "@r2-navigator-js/electron/renderer/index";
import { reloadContent } from "@r2-navigator-js/electron/renderer/location";
import { Locator, Locator as R2Locator } from "@r2-shared-js/models/locator";

import { IEventBusPdfPlayer, TToc } from "../pdf/common/pdfReader.type";
import { pdfMountAndReturnBus } from "../pdf/driver";
import {
    readerLocalActionBookmarks, readerLocalActionDivina, readerLocalActionSetConfig,
    readerLocalActionSetLocator,
} from "../redux/actions";
import { defaultReadingMode } from "../redux/state/divina";
import optionsValues, {
    AdjustableSettingsNumber, IReaderMenuProps, IReaderOptionsProps, isDivinaReadingMode,
    TdivinaReadingMode,
} from "./options-values";
import PickerManager from "./picker/PickerManager";
import { ok } from "assert";

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

const isDivinaLocation = (data: any): data is { pageIndex: number, nbOfPages: number, locator: Locator } => {
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

    pdfPlayerBusEvent: IEventBusPdfPlayer;
    pdfPlayerToc: TToc | undefined;
    pdfPlayerNumberOfPages: number | undefined;

    openedSectionSettings: number | undefined;
    openedSectionMenu: number | undefined;
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

        this.fastLinkRef = React.createRef<HTMLAnchorElement>();
        this.refToolbar = React.createRef<HTMLAnchorElement>();
        this.mainElRef = React.createRef<HTMLDivElement>();

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
            ttsVoice: null,

            mediaOverlaysState: MediaOverlaysStateEnum.STOPPED,
            mediaOverlaysPlaybackRate: "1",

            visibleBookmarkList: [],
            currentLocation: undefined,

            divinaNumberOfPages: 0,
            divinaReadingModeSupported: [],

            pdfPlayerBusEvent: undefined,
            pdfPlayerToc: undefined,
            pdfPlayerNumberOfPages: undefined,

            openedSectionSettings: undefined,
            openedSectionMenu: undefined,
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

    }

    public async componentDidMount() {

        const handleMouseKeyboard = (isKey: boolean) => {

            if (_mouseMoveTimeout) {
                window.clearTimeout(_mouseMoveTimeout);
                _mouseMoveTimeout = undefined;
            }
            window.document.documentElement.classList.remove("HIDE_CURSOR_CLASS");

            const nav = window.document.querySelector(`.${styles.main_navigation}`);
            if (nav) {
                nav.classList.remove(styles.HIDE_CURSOR_CLASS_head);
            }
            const foot = window.document.querySelector(`.${styles.reader_footer}`);
            if (foot) {
                foot.classList.remove(styles.HIDE_CURSOR_CLASS_foot);
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
                const nav = window.document.querySelector(`.${styles.main_navigation}`);
                if (nav) {
                    nav.classList.add(styles.HIDE_CURSOR_CLASS_head);
                }
                const foot = window.document.querySelector(`.${styles.reader_footer}`);
                if (foot) {
                    foot.classList.add(styles.HIDE_CURSOR_CLASS_foot);
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

        if (this.props.isPdf) {

            await this.loadPublicationIntoViewport();

            if (this.state.pdfPlayerBusEvent) {

                this.state.pdfPlayerBusEvent.subscribe("page",
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

                this.state.pdfPlayerBusEvent.subscribe("ready", () => {
                    this.state.pdfPlayerBusEvent.dispatch("page", page);
                });

            } else {
                console.log("pdf bus event undefined");
            }

        } else if (this.props.isDivina) {

            await this.loadPublicationIntoViewport();

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
            await this.loadPublicationIntoViewport();
        }

        await this.checkBookmarks();
    }

    public async componentDidUpdate(oldProps: IProps, _oldState: IState) {
        // if (oldProps.readerMode !== this.props.readerMode) {
            // console.log("READER MODE = ", this.props.readerMode === ReaderMode.Detached ? "detached" : "attached");
        // }
        if (oldProps.bookmarks !== this.props.bookmarks) {
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

            divinaReadingMode: this.props.divinaReadingMode,
            divinaReadingModeSupported: this.state.divinaReadingModeSupported,

            isDivina: this.props.isDivina,
            isPdf: this.props.isPdf,
            pdfEventBus: this.state.pdfPlayerBusEvent,
            openedSection: this.state.openedSectionSettings,
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
                        pdfEventBus={this.state.pdfPlayerBusEvent}
                    />
                    <div className={classNames(styles.content_root,
                        this.state.fullscreen ? styles.content_root_fullscreen : undefined,
                        this.props.isPdf ? styles.content_root_skip_bottom_spacing : undefined)}>
                        <PickerManager
                            showSearchResults={this.showSearchResults}
                            pdfEventBus={this.state.pdfPlayerBusEvent}
                            isPdf={this.props.isPdf}
                        ></PickerManager>
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
                                <div
                                    id="publication_viewport"
                                    className={styles.publication_viewport}
                                    ref={this.mainElRef}
                                >
                                </div>
                            </main>
                        </div>
                    </div>
                </div>
                <ReaderFooter
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
                    isPdf={this.props.isPdf}
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
        unregisterKeyboardListener(this.onKeyboardShowGotoPage);
        unregisterKeyboardListener(this.onKeyboardCloseReader);
        unregisterKeyboardListener(this.onKeyboardAudioPlayPause);
        unregisterKeyboardListener(this.onKeyboardAudioPrevious);
        unregisterKeyboardListener(this.onKeyboardAudioNext);
        unregisterKeyboardListener(this.onKeyboardAudioPreviousAlt);
        unregisterKeyboardListener(this.onKeyboardAudioNextAlt);
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

    private onKeyboardAudioPreviousAlt = () => {
        this.onKeyboardAudioPrevious(true);
    }
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
    }

    private onKeyboardAudioNextAlt = () => {
        this.onKeyboardAudioNext(true);
    }
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
    }

    private onKeyboardFullScreen = () => {
        this.handleFullscreenClick();
    }

    private onKeyboardCloseReader = () => {
        // if (!this.state.shortcutEnable) {
        //     if (DEBUG_KEYBOARD) {
        //         console.log("!shortcutEnable (onKeyboardCloseReader)");
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

    }

    private onKeyboardNavigationToBegin = () => {

        if (this.props.isPdf) {
            this.state.pdfPlayerBusEvent?.dispatch("page", "1");
        } else if (this.props.isDivina) {
            this.currentDivinaPlayer.goToPageWithIndex(0);
        } else {
            if (this.props.r2Publication?.Spine) {
                const firstSpine = this.props.r2Publication.Spine[0];
                if (firstSpine?.Href) {
                    handleLinkLocator({
                        href: firstSpine.Href,
                        locations: {
                            progression: 0,
                        },
                    });
                }
            }
        }
    }
    private onKeyboardNavigationToEnd = () => {

        if (this.props.isPdf) {
            if (this.state.pdfPlayerNumberOfPages) {
                this.state.pdfPlayerBusEvent?.dispatch("page",
                    this.state.pdfPlayerNumberOfPages.toString());
            }
        } else if (this.props.isDivina) {
            // TODO: Divina total number of pages? (last page index (number))
            // this.currentDivinaPlayer.goToPageWithIndex(index);
        } else {
            if (this.props.r2Publication?.Spine) {
                const lastSpine = this.props.r2Publication.Spine[this.props.r2Publication.Spine.length - 1];
                if (lastSpine?.Href) {
                    handleLinkLocator({
                        href: lastSpine.Href,
                        locations: {
                            progression: 0.95, // because 1 (100%) tends to trip blankspace css columns :(
                        },
                    });
                }
            }
        }
    }

    private onKeyboardSpineNavigationNext = () => {
        this.onKeyboardSpineNavigationPreviousNext(false);
    }
    private onKeyboardSpineNavigationPrevious = () => {
        this.onKeyboardSpineNavigationPreviousNext(true);
    }
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

            const LocatorExtended: LocatorExtended = {
                audioPlaybackInfo: undefined,
                locator: data.locator,
                paginationInfo: undefined,
                selectionInfo: undefined,
                selectionIsNew: undefined,
                docInfo: undefined,
                epubPage: undefined,
                secondWebViewHref: undefined,
            };
            this.handleReadingLocationChange(LocatorExtended);
        } else {
            console.log("DIVINA: location bad formated ", data);
        }

    }

    private async loadPublicationIntoViewport() {

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

            const clipboardInterceptor = // !this.props.publicationView.lcp ? undefined :
                (clipboardData: IEventPayload_R2_EVENT_CLIPBOARD_COPY) => {
                    apiAction("reader/clipboardCopy", this.props.pubId, clipboardData)
                        .catch((error) => console.error("Error to fetch api reader/clipboardCopy", error));
                };

            const pdfPlayerBusEvent = await pdfMountAndReturnBus(
                pdfUrl,
                publicationViewport,
            );

            this.setState({
                pdfPlayerBusEvent,
            });
            pdfPlayerBusEvent.subscribe("copy", (txt) => clipboardInterceptor({ txt, locator: undefined }));
            pdfPlayerBusEvent.subscribe("toc", (toc) => this.setState({pdfPlayerToc: toc}));
            pdfPlayerBusEvent.subscribe("numberofpages", (pages) => this.setState({pdfPlayerNumberOfPages: pages}));

            // previously loaded in driver.ts. @danielWeck do you think is it possible to execute it here ?
            pdfPlayerBusEvent.subscribe("keydown", (payload) => {
                keyDownEventHandler(payload, payload.elementName, payload.elementAttributes);
            });
            pdfPlayerBusEvent.subscribe("keyup", (payload) => {
                keyUpEventHandler(payload, payload.elementName, payload.elementAttributes);
            });

            console.log("toc", this.state.pdfPlayerToc);

            // this.state.pdfPlayerBusEvent.subscribe("page", (pageNumber) => {

            //     console.log("pdfPlayer page changed", pageNumber);
            // });

            // this.state.pdfPlayerBusEvent.subscribe("scale", (scale) => {

            //     console.log("pdfPlayer scale changed", scale);
            // });

            // this.state.pdfPlayerBusEvent.subscribe("view", (view) => {

            //     console.log("pdfPlayer view changed", view);
            // });

            // this.state.pdfPlayerBusEvent.subscribe("column", (column) => {

            //     console.log("pdfPlayer column changed", column);
            // });

            // this.state.pdfPlayerBusEvent.subscribe("search", (search) => {

            //     console.log("pdfPlayer search word changed", search);
            // });

            // this.state.pdfPlayerBusEvent.subscribe("search-next", () => {

            //     console.log("pdfPlayer highlight next search word executed");
            // });

            // this.state.pdfPlayerBusEvent.subscribe("search-previous", () => {

            //     console.log("pdfPlayer highlight previous search word executed");
            // });

            // /* master subscribe */
            // this.state.pdfPlayerBusEvent.subscribe("page-next", () => {
            //     console.log("pdfPlayer next page requested");
            // });
            // this.state.pdfPlayerBusEvent.subscribe("page-previous", () => {
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
            console.log(locator);

            console.log("LOCATOR");
            console.log("LOCATOR");

            this.currentDivinaPlayer.openDivinaFromFolderPath(url, locator, options);

            // Handle events emitted by the currentDivinaPlayer
            const eventEmitter = this.currentDivinaPlayer.eventEmitter;
            // deprecated
            // eventEmitter.on("jsonload", (data: any) => {
            //     console.log("JSON load", data);
            // });

            eventEmitter.on("dataparsing", (data: any) => {

                /**
                 * once the Divina JSON has been parsed and pageNavigatorsData created
                 * Data: { readingProgression, readingModesArray, languagesArray }, where readingProgression can be used to position navigation controls,
                 * readingModesArray the list of all possible page navigators for the story, and languages the list of all possible languages for the story
                 */

                console.log("DIVINA: 'dataparsing'", data);

                const isDataParsing = (data: any): data is { readingModesArray: TdivinaReadingMode[] } => {
                    return typeof data === "object" &&
                        Array.isArray(data.readingModesArray) &&
                        data.readingModesArray.reduce((pv: any, cv: any) => pv && isDivinaReadingMode(cv), true);
                };

                if (isDataParsing(data)) {

                    // readingMode

                    const modes = data.readingModesArray;
                    this.setState({ divinaReadingModeSupported: modes });

                    const readingMode = this.props.divinaReadingMode;

                    console.log("Reading mode from persistence : ", readingMode);

                    if (modes.includes(readingMode)) {
                        this.props.setReadingMode(readingMode);
                    } else if (modes.includes(defaultReadingMode)) {
                        this.props.setReadingMode(defaultReadingMode);
                    } else if (modes[0]) {
                        this.props.setReadingMode(modes[0]);
                    } else {
                        this.props.setReadingMode(defaultReadingMode);
                    }
                    console.log("DIVINA ReadingModeSupported", modes);
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
            eventEmitter.on("readingmodechange", (data: any) => {
                console.log("DIVINA: 'readingmodechange'", data);

                /**
                 * once a reading mode change has been validated (do note that, on opening a Divina, this event does happen after dataparsing)
                 * Data: { readingMode, nbOfPages, hasSounds, isMuted }, where
                 *  readingMode is “single” | “double” | “scroll” | “guided”,
                 *  nbOfPages is that for the corresponding page navigator,
                 *  hasSounds is a boolean that specifies whether the page navigator has sound animations,
                 *  isMuted a boolead that specified whether the player is currently muted or not)
                 */

                const isReadingModeChangeData = (data: any): data is {readingMode: TdivinaReadingMode, nbOfPages: number, hasSounds: boolean, isMuted: boolean} => {

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

                const isReadingModeUpdateData = (data: any): data is {readingMode: TdivinaReadingMode} => {
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

                const isInPageChangeData = (data: any): data is {percent: number, locator: Locator} => {
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
                    } catch {};
                }

            });
            eventEmitter.on("inpagesscroll", (data: any) => {
                console.log("DIVINA: 'inpagesscroll'", data);

                const isInPagesScrollData = (data: any): data is {percent: number, locator: Locator} => {
                    return typeof data === "object" &&
                        typeof data.percent === "number" &&
                        isDivinaLocation(data.locator);
                };

                if (isInPagesScrollData(data)) {

                    this.divinaSetLocation(data);
                } else
                    console.error("DIVINA: inpagesscroll event => unknow data", data);
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
    }

    private onKeyboardShowGotoPage() {
        if (!this.state.shortcutEnable) {
            if (DEBUG_KEYBOARD) {
                console.log("!shortcutEnable (onKeyboardShowGotoPage)");
            }
            return;
        }
        this.handleMenuButtonClick(5); // "goto page" zero-based index in SectionData[] of ReaderMenu.tsx
    }

    private showSearchResults() {
        this.handleMenuButtonClick(4); // "search" zero-based index in SectionData[] of ReaderMenu.tsx
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
        }
        this.ttsOverlayEnableNeedsSync = false;

        this.saveReadingLocation(loc);
        this.setState({ currentLocation: getCurrentReadingLocation() || loc });

        console.log("SET READING LOCATION");
        console.log("SET READING LOCATION");
        try {
            console.log((loc.locator.locations as any).totalProgression, getCurrentReadingLocation());
        } catch {}

        console.log("SET READING LOCATION");
        console.log("SET READING LOCATION");

        // No need to explicitly refresh the bookmarks status here,
        // as componentDidUpdate() will call the function after setState():
        // await this.checkBookmarks();
    }

    // check if a bookmark is on the screen
    private async checkBookmarks() {
        if (!this.props.bookmarks) {
            return;
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

        if (this.props.isPdf) {
            if (left) {
                this.state.pdfPlayerBusEvent?.dispatch("page-previous");
            } else {
                this.state.pdfPlayerBusEvent?.dispatch("page-next");
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
                navLeftOrRight(left, false); // !this.state.r2PublicationHasMediaOverlays
                // if (!this.state.r2PublicationHasMediaOverlays) {
                //     handleTTSPlayDebounced(this);
                // }
            } else {
                navLeftOrRight(left, spineNav);
            }
        }
    }

    private goToLocator(locator: R2Locator, closeNavPanel = true) {

        if (this.props.isPdf) {

            const index = locator?.href || "";
            if (index) {
                this.state.pdfPlayerBusEvent?.dispatch("page", index);
            }

        } else if (this.props.isDivina) {
            const index = parseInt(locator?.href, 10);
            if (index >= 0) {
                this.currentDivinaPlayer.goToPageWithIndex(index);
            }
        } else {
            if (closeNavPanel) {
                this.focusMainAreaLandmarkAndCloseMenu();
            }

            handleLinkLocator(locator);
        }

    }

    // tslint:disable-next-line: max-line-length
    private handleLinkClick(event: TMouseEventOnSpan | TMouseEventOnAnchor | TKeyboardEventOnAnchor | undefined, url: string, closeNavPanel = true) {
        if (event) {
            event.preventDefault();
        }
        if (!url) {
            return;
        }

        if (this.props.isPdf) {

            const index = url;
            if (index) {
                this.state.pdfPlayerBusEvent?.dispatch("page", index);
            }

        } else if (this.props.isDivina) {

            const newUrl = this.props.manifestUrlR2Protocol.split("/manifest.json")[1] + url;

            this.currentDivinaPlayer.goTo(newUrl);

        } else {
            if (closeNavPanel) {
                this.focusMainAreaLandmarkAndCloseMenu();
            }
            const newUrl = this.props.manifestUrlR2Protocol + "/../" + url;
            handleLinkUrl(newUrl);

        }
    }

    private async handleToggleBookmark(fromKeyboard?: boolean) {

        const visibleBookmark = this.state.visibleBookmarkList;

        if (this.props.isDivina || this.props.isPdf) {

            const locator = this.props.locator?.locator;
            const href = locator?.href;
            const name = (parseInt(href, 10) + 1).toString();
            if (href) {

                const found = visibleBookmark.find(({ locator: { href: _href } }) => href === _href);
                if (found) {
                    this.props.deleteBookmark(found);
                } else {
                    this.props.setBookmark({
                        locator,
                        name,
                    });
                }
            }

        } else {

            if (!this.state.currentLocation?.locator) {
                return;
            }

            const locator = this.state.currentLocation.locator;

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
                    this.props.deleteBookmark(bookmark);
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

                this.props.setBookmark({
                    locator,
                    name,
                });
            }
        }
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
    // ttsSentenceDetectionEnable(state.reader.config.ttsEnableSentenceDetection);

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
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        toggleFullscreen: (fullscreenOn: boolean) => {
                dispatch(readerActions.fullScreenRequest.build(fullscreenOn));
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
        setBookmark: (bookmark: IBookmarkStateWithoutUUID) => {
            dispatch(readerLocalActionBookmarks.push.build(bookmark));
        },
        deleteBookmark: (bookmark: IBookmarkState) => {
            dispatch(readerLocalActionBookmarks.pop.build(bookmark));
        },
        setReadingMode: (readingMode: TdivinaReadingMode) => {

            console.log("Persist the reading mode", readingMode);
            dispatch(readerLocalActionDivina.setReadingMode.build({readingMode}));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Reader));
