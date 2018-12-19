// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as path from "path";
import * as React from "react";
import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

import {
    Bookmark,
    ReaderConfig as ReadiumCSS,
} from "readium-desktop/common/models/reader";

import {
    colCountEnum,
    IReadiumCSS,
    readiumCSSDefaults,
    textAlignEnum,
} from "@r2-navigator-js/electron/common/readium-css-settings";
import {
    handleLinkUrl,
    installNavigatorDOM,
    LocatorExtended,
    navLeftOrRight,
    readiumCssOnOff,
    setReadingLocationSaver,
    setReadiumCssJsonGetter,
} from "@r2-navigator-js/electron/renderer/index";
import { lightBaseTheme, MuiThemeProvider} from "material-ui/styles";

import {
    convertCustomSchemeToHttpUrl,
    READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "@r2-navigator-js/electron/common/sessions";
import {
    _NODE_MODULE_RELATIVE_URL,
    _PACKAGING,
    _RENDERER_READER_BASE_URL,
} from "readium-desktop/preprocessor-directives";

import {
    IEventPayload_R2_EVENT_READIUMCSS,
} from "@r2-navigator-js/electron/common/events";
import { getURLQueryParams } from "@r2-navigator-js/electron/renderer/common/querystring";
import { setEpubReadingSystemInfo } from "@r2-navigator-js/electron/renderer/index";
import { INameVersion } from "@r2-navigator-js/electron/renderer/webview/epubReadingSystem";
import { Locator } from "@r2-shared-js/models/locator";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { webFrame } from "electron";
import { readerActions } from "readium-desktop/common/redux/actions";
import { setLocale } from "readium-desktop/common/redux/actions/i18n";
import { Translator } from "readium-desktop/common/services/translator";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";
import ReaderFooter from "readium-desktop/renderer/components/reader/ReaderFooter";
import ReaderHeader from "readium-desktop/renderer/components/reader/ReaderHeader";
import ReaderMenu from "readium-desktop/renderer/components/reader/ReaderMenu";
import ReaderOptions from "readium-desktop/renderer/components/reader/ReaderOptions";
import { container, lazyInject } from "readium-desktop/renderer/di";
import { RootState } from "readium-desktop/renderer/redux/states";
import { Store } from "redux";
import { JSON as TAJSON } from "ta-json-x";

import optionsValues from "./optionsValues";

webFrame.registerURLSchemeAsSecure(READIUM2_ELECTRON_HTTP_PROTOCOL);
webFrame.registerURLSchemeAsPrivileged(READIUM2_ELECTRON_HTTP_PROTOCOL, {
    allowServiceWorkers: false,
    bypassCSP: false,
    corsEnabled: true,
    secure: true,
    supportFetchAPI: true,
});

const queryParams = getURLQueryParams();

// TODO: centralize this code, currently duplicated
// see src/main/streamer.js
const computeReadiumCssJsonMessage = (): IEventPayload_R2_EVENT_READIUMCSS => {
    const store = (container.get("store") as Store<any>);
    let settings = store.getState().reader.config;
    if (!settings.value) {
        console.log("!settings.value? (RENDERER)");
    } else {
        settings = settings.value;
    }
    console.log(settings);

    // TODO: see the readiumCSSDefaults values below, replace with readium-desktop's own
    const cssJson: IReadiumCSS = {

        a11yNormalize: readiumCSSDefaults.a11yNormalize,

        backgroundColor: readiumCSSDefaults.backgroundColor,

        bodyHyphens: readiumCSSDefaults.bodyHyphens,

        colCount: settings.colCount === "1" ? colCountEnum.one :
            (settings.colCount === "2" ? colCountEnum.two : colCountEnum.auto),

        darken: settings.dark,

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

        textAlign: settings.align === "left" ? textAlignEnum.left :
            (settings.align === "right" ? textAlignEnum.right :
            (settings.align === "justify" ? textAlignEnum.justify : textAlignEnum.start)),

        textColor: readiumCSSDefaults.textColor,

        typeScale: readiumCSSDefaults.typeScale,

        wordSpacing: settings.wordSpacing,
    };
    const jsonMsg: IEventPayload_R2_EVENT_READIUMCSS = { setCSS: cssJson };
    console.log("jsonMsg RENDERER");
    console.log(jsonMsg);
    return jsonMsg;
};
setReadiumCssJsonGetter(computeReadiumCssJsonMessage);

const saveReadingLocation = (loc: LocatorExtended) => {

    const store = container.get("store") as Store<RootState>;
    store.dispatch(readerActions.saveBookmark(
        {
            identifier: "reading-location",
            publication: {
                // tslint:disable-next-line:no-string-literal
                identifier: queryParams["pubId"],
            },
            docHref: loc.locator.href,

            // TODO? Also save loc.locator.locations.position|progression|cfi
            // (not really used internally by navigator at this stage, only CSS Selector,
            // but progression useful to display per-document percentage progress)
            docSelector: loc.locator.locations.cssSelector,
        } as Bookmark,
    ));
};

// tslint:disable-next-line:no-string-literal
const publicationJsonUrl = queryParams["pub"];
// tslint:disable-next-line:variable-name
const publicationJsonUrl_ = publicationJsonUrl.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL) ?
    convertCustomSchemeToHttpUrl(publicationJsonUrl) : publicationJsonUrl;
const pathBase64Raw = publicationJsonUrl_.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");
const pathBase64 = decodeURIComponent(pathBase64Raw);
const pathDecoded = window.atob(pathBase64);

const pathFileName = pathDecoded.substr(
    pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1,
    pathDecoded.length - 1);

// tslint:disable-next-line:no-string-literal
const lcpHint = queryParams["lcpHint"];

interface ReaderAppState {
    publicationJsonUrl?: string;
    lcpHint?: string;
    title?: string;
    lcpPass?: string;
    contentTableOpen: boolean;
    settingsOpen: boolean;
    settingsValues: ReadiumCSS;
    shortcutEnable: boolean;
    fontSizeIndex: number;
    landmarksOpen: boolean;
    landmarkTabOpen: number;
    publication: R2Publication;
    menuOpen: boolean;
    fullscreen: boolean;
    indexes: any;
}

const defaultLocale = "fr";

export default class ReaderApp extends React.Component<undefined, ReaderAppState> {
    @lazyInject("store")
    private store: Store<RootState>;

    @lazyInject("translator")
    private translator: Translator;

    constructor(props: any) {
        super(props);
        const locale = this.store.getState().i18n.locale;

        if (locale == null) {
            this.store.dispatch(setLocale(defaultLocale));
        }

        this.state = {
            publicationJsonUrl: "HTTP://URL",
            lcpHint: "LCP hint",
            title: "TITLE",
            lcpPass: "LCP pass",
            contentTableOpen: false,
            settingsOpen: false,
            settingsValues: {
                align: "left",
                colCount: "auto",
                dark: false,
                font: "DEFAULT",
                fontSize: "100%",
                invert: false,
                lineHeight: "1.5",
                night: false,
                paged: false,
                readiumcss: true,
                sepia: false,
                wordSpacing: undefined,
                paraSpacing: undefined,
                letterSpacing: undefined,
                pageMargins: undefined,
            },
            shortcutEnable: true,
            indexes: {
                fontSize: 0, pageMargins: 0, wordSpacing: 0, letterSpacing: 0, paraSpacing: 0,
            },
            fontSizeIndex: 3,
            landmarksOpen: false,
            landmarkTabOpen: 0,
            publication: undefined,
            menuOpen: false,
            fullscreen: false,
        };

        this.handleMenuButtonClick = this.handleMenuButtonClick.bind(this);
        this.handleSettingsClick = this.handleSettingsClick.bind(this);
        this.handleFullscreenClick = this.handleFullscreenClick.bind(this);
    }

    public async componentDidMount() {
        this.setState({
            publicationJsonUrl,
        });

        if (lcpHint) {
            this.setState({
                lcpHint,
                lcpPass: this.state.lcpPass + " [" + lcpHint + "]",
            });
        }

        this.store.subscribe(() => {
            const storeState = this.store.getState();
            this.translator.setLocale(storeState.i18n.locale);
            const settings = storeState.reader.config.value;
            if (settings && settings !== this.state.settingsValues) {
                this.translator.setLocale(this.store.getState().i18n.locale);

                const indexes = this.state.indexes;
                for (const name of Object.keys(this.state.indexes)) {
                    let i = 0;
                    for (const value of optionsValues[name]) {
                        if (settings[name] === value) {
                            indexes[name] = i;
                        }
                        i++;
                    }
                }

                this.setState({settingsValues: settings, indexes});

                // Push reader config to navigator
                readiumCssOnOff();
            }
        });

        window.document.addEventListener("keydown", (ev: KeyboardEvent) => {
            if (this.state.shortcutEnable) {
                if (ev.keyCode === 37) { // left
                    navLeftOrRight(true);
                } else if (ev.keyCode === 39) { // right
                    navLeftOrRight(false);
                }
            }
        });

        // tslint:disable-next-line:no-string-literal
        let docHref: string = queryParams["docHref"];

        // tslint:disable-next-line:no-string-literal
        let docSelector: string = queryParams["docSelector"];

        if (docHref && docSelector) {
            // Decode base64
            docHref = window.atob(docHref);
            docSelector = window.atob(docSelector);
        }

        // Note that CFI, etc. can optionally be restored too,
        // but navigator currently uses cssSelector as the primary
        const locator: Locator = {
            href: docHref,
            locations: {
                cfi: undefined,
                cssSelector: docSelector,
                position: undefined,
                progression: undefined,
            },
        };

        const publication = await this.loadPublicationIntoViewport(locator);
        this.setState({publication});
        setReadingLocationSaver(saveReadingLocation);

        setEpubReadingSystemInfo({ name: "Readium2 Electron/NodeJS desktop app", version: _APP_VERSION });
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);

        return (
                <div>
                    <div className={styles.root}>
                        <ReaderHeader
                            menuOpen={this.state.menuOpen}
                            settingsOpen={this.state.settingsOpen}
                            handleMenuClick={this.handleMenuButtonClick}
                            handleSettingsClick={this.handleSettingsClick}
                            fullscreen={this.state.fullscreen}
                            handleFullscreenClick={this.handleFullscreenClick}
                        />
                        <ReaderMenu
                            open={this.state.menuOpen}
                            publicationJsonUrl={publicationJsonUrl}
                            publication={this.state.publication}
                            handleLinkClick={this.handleLinkClick.bind(this)}
                        />
                        <ReaderOptions
                            open={this.state.settingsOpen}
                            indexes={this.state.indexes}
                            settings={this.state.settingsValues}
                            handleLinkClick={this.handleLinkClick.bind(this)}
                            handleSettingChange={this.handleSettingsValueChange.bind(this)}
                            handleIndexChange={this.handleIndexValueChange.bind(this)}
                        />
                        <div className={styles.content_root}>
                            <div className={styles.reader}>
                                <div className={styles.publication_viewport_container}>
                                    <div id="publication_viewport" className={styles.publication_viewport}> </div>
                                </div>
                            </div>
                        </div>
                        <ReaderFooter
                            navLeftOrRight={navLeftOrRight}
                            fullscreen={this.state.fullscreen}
                        />
                    </div>
                </div>
        );
    }

    private async loadPublicationIntoViewport(locator: Locator): Promise<R2Publication> {
        let response: Response;
        try {
            response = await fetch(publicationJsonUrl);
        } catch (e) {
            return;
        }
        if (!response.ok) {
            console.log("BAD RESPONSE?!");
        }

        let publicationJSON: any | undefined;
        try {
            publicationJSON = await response.json();
        } catch (e) {
            console.log(e);
        }
        if (!publicationJSON) {
            return;
        }
        const publication = TAJSON.deserialize<R2Publication>(publicationJSON, R2Publication);

        if (publication.Metadata && publication.Metadata.Title) {
            const title = this.translator.translateContentField(publication.Metadata.Title);

            if (title) {
                window.document.title = "Readium2 [ " + title + "]";
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

        installNavigatorDOM(
            publication,
            publicationJsonUrl,
            "publication_viewport",
            preloadPath,
            locator,
        );

        return publication;
    }

    private handleMenuButtonClick() {
        this.setState({
            menuOpen: !this.state.menuOpen,
            settingsOpen: false,
        });
    }

    private handleLinkClick(event: any, url: string) {
        event.preventDefault();

        handleLinkUrl(url);

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

    private handleFullscreenClick() {
        this.setState({fullscreen: !this.state.fullscreen});
    }

    private handleSettingsClick() {
        this.setState({
            settingsOpen: !this.state.settingsOpen,
            menuOpen: false,
        });
    }

    private handleSettingsSave() {
        const values = this.state.settingsValues;

        this.store.dispatch(readerActions.setConfig(values));
        // Push reader config to navigator
        readiumCssOnOff();
    }

    private handleSettingsValueChange(event: any, name: string, givenValue?: any) {
        const settingsValues = this.state.settingsValues;
        let value = givenValue;

        if (!value) {
            value = event.target.value.toString();
        }

        if (value === "false") {
            value = false;
        } else if (value === "true") {
            value = true;
        }

        settingsValues[name] =  value;

        this.setState({settingsValues});

        this.handleSettingsSave();
    }

    private handleIndexValueChange(event: any, name: string) {
        const indexes = this.state.indexes;
        const settingsValues = this.state.settingsValues;

        const value = event.target.value.toString();

        indexes[name] =  value;
        this.setState({ indexes });

        settingsValues[name] = optionsValues[name][value];
        this.setState({ settingsValues });

        this.handleSettingsSave();
    }
}
