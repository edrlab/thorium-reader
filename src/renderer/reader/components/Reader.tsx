// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as classNames from "classnames";
import * as path from "path";
import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import {
    ReaderConfig, ReaderConfigBooleans, ReaderConfigStrings, ReaderConfigStringsAdjustables,
    ReaderMode,
} from "readium-desktop/common/models/reader";
import { dialogActions, readerActions } from "readium-desktop/common/redux/actions";
import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { LocatorView } from "readium-desktop/common/views/locator";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    _APP_NAME, _APP_VERSION, _NODE_MODULE_RELATIVE_URL, _PACKAGING, _RENDERER_READER_BASE_URL,
} from "readium-desktop/preprocessor-directives";
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SkipLink from "readium-desktop/renderer/common/components/SkipLink";
import { apiAction } from "readium-desktop/renderer/reader/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/reader/apiSubscribe";
import ReaderFooter from "readium-desktop/renderer/reader/components/ReaderFooter";
import ReaderHeader from "readium-desktop/renderer/reader/components/ReaderHeader";
import { diReaderGet } from "readium-desktop/renderer/reader/di";
import {
    TChangeEventOnInput, TChangeEventOnSelect, TKeyboardEventOnAnchor, TMouseEventOnAnchor,
    TMouseEventOnSpan,
} from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
// import { encodeURIComponent_RFC3986 } from "readium-desktop/utils/url";
import { Unsubscribe } from "redux";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import {
    IEventPayload_R2_EVENT_CLIPBOARD_COPY, IEventPayload_R2_EVENT_READIUMCSS,
    IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN,
} from "@r2-navigator-js/electron/common/events";
import {
    colCountEnum, IReadiumCSS, readiumCSSDefaults, textAlignEnum,
} from "@r2-navigator-js/electron/common/readium-css-settings";
// import {
//     convertCustomSchemeToHttpUrl, convertHttpUrlToCustomScheme, /* READIUM2_ELECTRON_HTTP_PROTOCOL,*/
// } from "@r2-navigator-js/electron/common/sessions";
import {
    getCurrentReadingLocation, handleLinkLocator, handleLinkUrl, installNavigatorDOM,
    isLocatorVisible, LocatorExtended, navLeftOrRight, readiumCssOnOff, setEpubReadingSystemInfo,
    setKeyDownEventHandler, setReadingLocationSaver, setReadiumCssJsonGetter,
} from "@r2-navigator-js/electron/renderer/index";
import { reloadContent } from "@r2-navigator-js/electron/renderer/location";
import { Locator as R2Locator } from "@r2-shared-js/models/locator";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { readerLocalActionSetConfig, readerLocalActionSetLocator } from "../redux/actions";
import optionsValues, {
    AdjustableSettingsNumber, IReaderMenuProps, IReaderOptionsProps,
} from "./options-values";

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

// TODO: centralize this code, currently duplicated
// see src/main/streamer.js
const computeReadiumCssJsonMessage = (): IEventPayload_R2_EVENT_READIUMCSS => {
    const store = diReaderGet("store");
    const settings = store.getState().reader.config;

    // TODO: see the readiumCSSDefaults values below, replace with readium-desktop's own
    const cssJson: IReadiumCSS = {

        a11yNormalize: readiumCSSDefaults.a11yNormalize,

        backgroundColor: readiumCSSDefaults.backgroundColor,

        bodyHyphens: readiumCSSDefaults.bodyHyphens,

        colCount: settings.colCount === "1" ? colCountEnum.one :
            (settings.colCount === "2" ? colCountEnum.two : colCountEnum.auto),

        darken: settings.darken,

        font: settings.font,

        fontSize: settings.fontSize,

        invert: settings.invert,

        letterSpacing: settings.letterSpacing,

        ligatures: readiumCSSDefaults.ligatures,

        lineHeight: settings.lineHeight,

        night: settings.night,

        pageMargins: settings.pageMargins,

        paged: settings.paged,

        paraIndent: readiumCSSDefaults.paraIndent,

        paraSpacing: settings.paraSpacing,

        sepia: settings.sepia,

        noFootnotes: settings.noFootnotes,

        textAlign: settings.align === textAlignEnum.left ? textAlignEnum.left :
            (settings.align === textAlignEnum.right ? textAlignEnum.right :
            (settings.align === textAlignEnum.justify ? textAlignEnum.justify :
            (settings.align === textAlignEnum.start ? textAlignEnum.start : undefined))),

        textColor: readiumCSSDefaults.textColor,

        typeScale: readiumCSSDefaults.typeScale,

        wordSpacing: settings.wordSpacing,

        mathJax: settings.enableMathJax,

        reduceMotion: readiumCSSDefaults.reduceMotion,
    };
    const jsonMsg: IEventPayload_R2_EVENT_READIUMCSS = { setCSS: cssJson };
    return jsonMsg;
};

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
    title?: string;

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
    visibleBookmarkList: LocatorView[];
    currentLocation: LocatorExtended;
    bookmarks: LocatorView[] | undefined;

    indexes: AdjustableSettingsNumber;
    readerConfig: ReaderConfig;
    readerMode: ReaderMode;
}

class Reader extends React.Component<IProps, IState> {
    private fastLinkRef: React.RefObject<HTMLAnchorElement>;

    // can be get back with withTranslator HOC
    // to remove
    // @lazyInject(diRendererSymbolTable.translator)
    // private translator: Translator;

    private unsubscribe: Unsubscribe;

    constructor(props: IProps) {
        super(props);

        this.fastLinkRef = React.createRef<HTMLAnchorElement>();

        this.state = {
            publicationJsonUrl: "HTTP://URL",
            lcpHint: "LCP hint",
            title: "TITLE",
            lcpPass: "LCP pass",
            contentTableOpen: false,
            settingsOpen: false,
            readerConfig: {
                align: "auto",
                colCount: "auto",
                dark: false,
                font: "DEFAULT",
                fontSize: "100%",
                invert: false,
                lineHeight: undefined,
                night: false,
                paged: false,
                readiumcss: true,
                sepia: false,
                wordSpacing: undefined,
                paraSpacing: undefined,
                letterSpacing: undefined,
                pageMargins: undefined,
                enableMathJax: false,
                noFootnotes: false,
                darken: false,
            },
            shortcutEnable: true,
            indexes: {
                fontSize: 3,
                pageMargins: 0,
                wordSpacing: 0,
                letterSpacing: 0,
                paraSpacing: 0,
                lineHeight: 0,
            },
            landmarksOpen: false,
            landmarkTabOpen: 0,

            publicationView: undefined,
            r2Publication: undefined,

            menuOpen: false,
            fullscreen: false,
            visibleBookmarkList: [],
            currentLocation: undefined,
            bookmarks: undefined,

            readerMode: ReaderMode.Attached,
        };

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

        setReadiumCssJsonGetter(computeReadiumCssJsonMessage);
    }

    public async componentDidMount() {

        const store = diReaderGet("store");

        const pubId = store.getState().reader.info.publicationIdentifier;
        const locator = store.getState().reader.locator;
        const manifestUrl = store.getState().reader.info.manifestUrl;
        // const publicationJsonUrl = convertCustomSchemeToHttpUrl(
        //     encodeURIComponent_RFC3986(
        //         convertHttpUrlToCustomScheme(manifestUrl),
        //     ),
        // );
        const publicationJsonUrl = manifestUrl;

        this.setState({
            publicationJsonUrl,
        });

        // if (lcpHint) {
        //     this.setState({
        //         lcpHint,
        //         lcpPass: this.state.lcpPass + " [" + lcpHint + "]",
        //     });
        // }

        // What is the point of this redux store subscribe ?
        // the locale is already set
        // Why an adaptation from redux settings to local state ?
        store.subscribe(() => {
            const storeState = store.getState();
            const readerConfig = storeState.reader.config;
            if (readerConfig && readerConfig !== this.state.readerConfig) {

                const indexes = this.state.indexes;
                for (const key of ObjectKeys(this.state.indexes)) {
                    let i = 0;
                    for (const value of optionsValues[key]) {
                        if (readerConfig[key] === value) {
                            indexes[key] = i;
                        }
                        i++;
                    }
                }

                if (readerConfig.enableMathJax !== this.state.readerConfig.enableMathJax) {

                    setTimeout(() => {
                        // window.location.reload();
                        reloadContent();
                    }, 300);
                }

                this.setState({ readerConfig, indexes });

                // readiumCssOnOff() API only once navigator ready
                if (this.state.r2Publication) {
                    readiumCssOnOff();
                }
            }
        });

        window.document.documentElement.addEventListener("keydown", (_ev: KeyboardEvent) => {
            window.document.documentElement.classList.add("R2_CSS_CLASS__KEYBOARD_INTERACT");
        }, true);
        window.document.documentElement.addEventListener("mousedown", (_ev: MouseEvent) => {
            window.document.documentElement.classList.remove("R2_CSS_CLASS__KEYBOARD_INTERACT");
        }, true);

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

        const keyDownEventHandler = (ev: IEventPayload_R2_EVENT_WEBVIEW_KEYDOWN) => {
            // DEPRECATED
            // if (ev.keyCode === 37 || ev.keyCode === 39) { // left / right
            // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
            // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
            // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
            const leftKey = ev.code === "ArrowLeft";
            const rightKey = ev.code === "ArrowRight";
            if (leftKey || rightKey) {
                const noModifierKeys = !ev.ctrlKey && !ev.shiftKey && !ev.altKey && !ev.metaKey;
                const spineNavModifierKeys = process.platform === "darwin" ? ev.ctrlKey && ev.shiftKey :
                    ev.ctrlKey && ev.shiftKey && ev.altKey;
                if (noModifierKeys || spineNavModifierKeys) {
                    navLeftOrRight(leftKey, spineNavModifierKeys);
                    if (spineNavModifierKeys) {
                        if (this.fastLinkRef?.current) {
                            setTimeout(() => {
                                if (this.fastLinkRef?.current) {
                                    this.fastLinkRef.current.focus();
                                }
                            }, 200);
                        }
                    }
                }
            }
        };
        setKeyDownEventHandler(keyDownEventHandler);
        window.document.addEventListener("keydown", (ev: KeyboardEvent) => {
            if (this.state.shortcutEnable) {
                keyDownEventHandler(ev);
            }
        });

        setReadingLocationSaver(this.handleReadingLocationChange);

        setEpubReadingSystemInfo({ name: _APP_NAME, version: _APP_VERSION });

        this.unsubscribe = apiSubscribe([
            "reader/deleteBookmark",
            "reader/addBookmark",
        ], this.findBookmarks);

        apiAction("publication/get", pubId, false)
            .then((publicationView) => {
                this.setState({ publicationView });
                this.loadPublicationIntoViewport(publicationView, locator);
            })
            .catch((error) => console.error("Error to fetch api publication/get", error));

        this.getReaderMode();
    }

    public async componentDidUpdate(_oldProps: IProps, oldState: IState) {
        if (oldState.bookmarks !== this.state.bookmarks) {
            await this.checkBookmarks();
        }
    }

    public componentWillUnmount() {
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
            indexes: this.state.indexes,
            readerConfig: this.state.readerConfig,
            handleSettingChange: this.handleSettingChange.bind(this),
            handleIndexChange: this.handleIndexChange.bind(this),
            setSettings: this.setSettings,
            toggleMenu: this.handleSettingsClick,
        };

        return (
            <div>
                <SkipLink
                    className={styles.skip_link}
                    anchorId="main-content"
                    label={this.props.__("accessibility.skipLink")}
                />
                <div className={classNames(
                    styles.root,
                    this.state.readerConfig.night && styles.nightMode,
                    this.state.readerConfig.sepia && styles.sepiaMode,
                )}>
                    <ReaderHeader
                        infoOpen={this.props.infoOpen}
                        menuOpen={this.state.menuOpen}
                        settingsOpen={this.state.settingsOpen}
                        handleMenuClick={this.handleMenuButtonClick}
                        handleSettingsClick={this.handleSettingsClick}
                        fullscreen={this.state.fullscreen}
                        mode={this.state.readerMode}
                        handleFullscreenClick={this.handleFullscreenClick}
                        handleReaderDetach={this.handleReaderDetach}
                        handleReaderClose={this.handleReaderClose}
                        toggleBookmark={this.handleToggleBookmark}
                        isOnBookmark={this.state.visibleBookmarkList.length > 0}
                        readerOptionsProps={readerOptionsProps}
                        readerMenuProps={readerMenuProps}
                        displayPublicationInfo={this.displayPublicationInfo}
                    />
                    <div className={styles.content_root}>
                        <div className={styles.reader}>
                            <main
                                id="main"
                                role="main"
                                className={styles.publication_viewport_container}>
                                <a ref={this.fastLinkRef}
                                    id="main-content"
                                    aria-hidden tabIndex={-1}></a>
                                <div id="publication_viewport" className={styles.publication_viewport}> </div>
                            </main>
                        </div>
                    </div>
                    <ReaderFooter
                        navLeftOrRight={navLeftOrRight}
                        fullscreen={this.state.fullscreen}
                        currentLocation={this.state.currentLocation}
                        r2Publication={this.state.r2Publication}
                        handleLinkClick={this.handleLinkClick}
                    />
                </div>
            </div>
        );
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

    private goToLocator(locator: R2Locator) {
        handleLinkLocator(locator);
    }

    private async loadPublicationIntoViewport(
        publicationView: PublicationView,
        locator: R2Locator) {

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

            if (title) {
                window.document.title = "Thorium - " + title;
                this.setState({
                    title,
                });
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

        console.log("######");
        console.log("######");
        console.log("######");
        console.log("######");
        console.log("######");
        console.log("######");
        console.log("######");
        console.log("######");
        console.log("######");
        console.log("######");
        console.log("######");
        console.log("######");
        console.log("######");
        console.log("######");
        console.log("######");
        const sessionInfoJson: any = {
            id: "0000-1110-222",
            test: 1,
            other: true,
            obj: {
                "sub-key": null,
            },
        };
        console.log(sessionInfoJson);
        const sessionInfoStr = JSON.stringify(sessionInfoJson, null, 4);
        console.log(sessionInfoStr);
        console.log(Buffer.from(sessionInfoStr).toString("base64"));

        installNavigatorDOM(
            r2Publication,
            this.state.publicationJsonUrl,
            "publication_viewport",
            preloadPath,
            locator,
            true,
            clipboardInterceptor,
            sessionInfoStr,
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
        this.props.setLocator(loc.locator);
    }

    private async handleReadingLocationChange(loc: LocatorExtended) {
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

    // tslint:disable-next-line: max-line-length
    private handleLinkClick(event: TMouseEventOnSpan | TMouseEventOnAnchor | TKeyboardEventOnAnchor | undefined, url: string) {
        if (event) {
            event.preventDefault();
        }
        if (!url) {
            return;
        }

        // DEPRECATED
        // event.charCode === 13
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/charCode
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
        // alternatively, could also use event.code === "Enter"
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
        // if (event && event.key === "Enter") {
        // }
        // Screen readers have their own shortcut to activate hyperlinks (e.g. VoiceOver CTRL+OPT+SPACE),
        // so we must not limit the focus behaviour to app-defined keyboard interaction (i.e. ENTER key)
        // (note that this means the focus is moved even when TOC items clicked with mouse, which is fine)
        if (this.fastLinkRef?.current) {
            setTimeout(() => {
                if (this.fastLinkRef?.current) {
                    this.fastLinkRef.current.focus();
                }
            }, 200);
        }

        if (this.state.menuOpen) {
            setTimeout(() => {
                this.handleMenuButtonClick();
            }, 100);
        }

        const newUrl = this.state.publicationJsonUrl + "/../" + url;
        handleLinkUrl(newUrl);

        // Example to pass a specific cssSelector:
        // (for example to restore a bookmark)
        // const locator: Locator = {
        //     href: url,
        //     locations: {
        //         cfi: undefined,
        //         cssSelector: CSSSELECTOR,
        //         position: undefined,
        //         progression: undefined,
        //     }
        // };
        // handleLinkLocator(locator);

        // Example to save a bookmark:
        // const loc: LocatorExtended = getCurrentReadingLocation();
        // Note: there is additional useful info about pagination
        // which can be used to report progress info to the user
        // if (loc.paginationInfo !== null) =>
        // loc.paginationInfo.totalColumns (N = 1+)
        // loc.paginationInfo.currentColumn [0, (N-1)]
        // loc.paginationInfo.isTwoPageSpread (true|false)
        // loc.paginationInfo.spreadIndex [0, (N/2)]
    }

    private async handleToggleBookmark() {
        await this.checkBookmarks();
        if (this.state.visibleBookmarkList.length > 0) {
            for (const bookmark of this.state.visibleBookmarkList) {
                //                this.props.deleteBookmark(bookmark.identifier);
                try {
                    await apiAction("reader/deleteBookmark", bookmark.identifier);
                } catch (e) {
                    console.error("Error to fetch api reader/deleteBookmark", e);
                }
            }
        } else if (this.state.currentLocation) {
            const locator = this.state.currentLocation.locator;
            //            this.props.addBookmark(queryParams.pubId, locator);
            try {
                await apiAction("reader/addBookmark", this.props.pubId, locator);
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

    private handleSettingsSave() {
        const store = diReaderGet("store");
        store.dispatch(readerLocalActionSetConfig.build(this.state.readerConfig));
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

        const readerConfig = this.state.readerConfig;

        const typedName =
            name as (typeof value extends string ? keyof ReaderConfigStrings : keyof ReaderConfigBooleans);
        const typedValue =
            value as (typeof value extends string ? string : boolean);
        readerConfig[typedName] = typedValue;

        if (readerConfig.paged) {
            readerConfig.enableMathJax = false;

            setTimeout(() => {
                // window.location.reload();
                reloadContent();
            }, 300);
        }

        this.setSettings(readerConfig);
    }

    private handleIndexChange(event: TChangeEventOnInput, name: keyof ReaderConfigStringsAdjustables) {
        const indexes = this.state.indexes;
        const readerConfig = this.state.readerConfig;

        let valueNum = event.target.valueAsNumber;
        if (typeof valueNum !== "number") {
            const valueStr = event.target.value.toString();
            valueNum = parseInt(valueStr, 10);
            if (typeof valueNum !== "number") {
                console.log(`valueNum?!! ${valueNum}`);
                return;
            }
        }

        indexes[name] = valueNum;
        this.setState({ indexes });

        readerConfig[name] = optionsValues[name][valueNum];

        this.setSettings(readerConfig);
    }

    private setSettings(readerConfig: ReaderConfig) {
        if (!readerConfig) {
            return;
        }

        this.setState({ readerConfig });
        this.props.setConfig(readerConfig);
        this.handleSettingsSave();
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
    return {
        readerInfo: state.reader.info,
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
        setLocator: (locator: R2Locator) => {
            dispatch(readerLocalActionSetLocator.build(locator));
        },
        setConfig: (config: ReaderConfig) => {
            dispatch(readerLocalActionSetConfig.build(config));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Reader));
