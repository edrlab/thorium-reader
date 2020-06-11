// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as classNames from "classnames";
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
    TChangeEventOnInput, TChangeEventOnSelect, TKeyboardEventOnAnchor, TMouseEventOnAnchor,
    TMouseEventOnSpan,
} from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
// import { encodeURIComponent_RFC3986 } from "readium-desktop/utils/url";
import { Unsubscribe } from "redux";

import { IEventPayload_R2_EVENT_CLIPBOARD_COPY } from "@r2-navigator-js/electron/common/events";
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
import { Locator as R2Locator } from "@r2-shared-js/models/locator";

import { readerLocalActionSetConfig, readerLocalActionSetLocator } from "../redux/actions";
import optionsValues, {
    AdjustableSettingsNumber, IReaderMenuProps, IReaderOptionsProps,
} from "./options-values";

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

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

class Reader extends React.Component<IProps, IState> {

    private fastLinkRef: React.RefObject<HTMLAnchorElement>;
    private refToolbar: React.RefObject<HTMLAnchorElement>;

    // can be get back with withTranslator HOC
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

    private async loadPublicationIntoViewport() {

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
            navLeftOrRight(left, !this.state.r2PublicationHasMediaOverlays);
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
