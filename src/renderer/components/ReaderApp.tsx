// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as path from "path";

import * as classNames from "classnames";

import * as React from "react";

import { Store } from "redux";

import { container } from "readium-desktop/renderer/di";

import { Publication } from "readium-desktop/common/models/publication";
import {
    Bookmark,
    ReaderConfig as ReadiumCSS,
} from "readium-desktop/common/models/reader";

import { lazyInject } from "readium-desktop/renderer/di";

import { setLocale } from "readium-desktop/common/redux/actions/i18n";
import { Translator } from "readium-desktop/common/services/translator";

import ArrowIcon from "readium-desktop/renderer/assets/icons/arrow.svg";
import ArrowBack from "readium-desktop/renderer/assets/icons/baseline-arrow_back-24px-grey.svg";
import ContentTableIcon from "readium-desktop/renderer/assets/icons/content-table.svg";
import ContinueIcon from "readium-desktop/renderer/assets/icons/continue.svg";
import LandmarkIcon from "readium-desktop/renderer/assets/icons/landmark.svg";
import NightIcon from "readium-desktop/renderer/assets/icons/night.svg";
import PageIcon from "readium-desktop/renderer/assets/icons/page.svg";
import AlignCenterIcon from "readium-desktop/renderer/assets/icons/paragraph-center.svg";
import AlignLeftIcon from "readium-desktop/renderer/assets/icons/paragraph-left.svg";
import AlignRightIcon from "readium-desktop/renderer/assets/icons/paragraph-right.svg";
import SettingsIcon from "readium-desktop/renderer/assets/icons/settings.svg";

import { RootState } from "readium-desktop/renderer/redux/states";

import { lcpActions, readerActions } from "readium-desktop/common/redux/actions";

import { IStringMap } from "@r2-shared-js/models/metadata-multilang";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { Dialog } from "material-ui";
import { lightBaseTheme, MuiThemeProvider } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import {
    IEventPayload_R2_EVENT_READING_LOCATION,
    IEventPayload_R2_EVENT_READIUMCSS,
} from "@r2-navigator-js/electron/common/events";

import { getURLQueryParams } from "@r2-navigator-js/electron/renderer/common/querystring";
import {
    handleLink,
    installNavigatorDOM,
    navLeftOrRight,
    readiumCssOnOff,
    setReadingLocationSaver,
    setReadiumCssJsonGetter,
} from "@r2-navigator-js/electron/renderer/index";
import { ipcRenderer } from "electron";
import { JSON as TAJSON } from "ta-json-x";

import { webFrame } from "electron";

import {
    convertCustomSchemeToHttpUrl,
    READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "@r2-navigator-js/electron/common/sessions";

import * as styles from "readium-desktop/renderer/assets/styles/reader-app.css";

import {
    _NODE_MODULE_RELATIVE_URL,
    _PACKAGING,
    _RENDERER_READER_BASE_URL,
} from "readium-desktop/preprocessor-directives";

import FocusLock from "react-focus-lock";

import { setEpubReadingSystemJsonGetter } from "@r2-navigator-js/electron/renderer/index";
import { INameVersion } from "@r2-navigator-js/electron/renderer/webview/epubReadingSystem";

import {
    _APP_VERSION,
} from "readium-desktop/preprocessor-directives";

import ReaderMenu from "readium-desktop/renderer/components/ReaderMenu";
import ReaderOptions from "readium-desktop/renderer/components/ReaderOptions";

webFrame.registerURLSchemeAsSecure(READIUM2_ELECTRON_HTTP_PROTOCOL);
webFrame.registerURLSchemeAsPrivileged(READIUM2_ELECTRON_HTTP_PROTOCOL, {
    allowServiceWorkers: false,
    bypassCSP: false,
    corsEnabled: true,
    secure: true,
    supportFetchAPI: true,
});

const queryParams = getURLQueryParams();

const computeReadiumCssJsonMessage = (): IEventPayload_R2_EVENT_READIUMCSS => {
    const store = (container.get("store") as Store<any>);
    const settings = store.getState().reader.config;
    const cssJson = {
        align: settings.align,
        colCount: settings.colCount,
        dark: settings.dark,
        font: settings.font,
        fontSize: settings.fontSize,
        invert: settings.invert,
        lineHeight: settings.lineHeight,
        night: settings.night,
        paged: settings.paged,
        sepia: settings.sepia,
    };
    const jsonMsg: IEventPayload_R2_EVENT_READIUMCSS = { injectCSS: "yes", setCSS: cssJson };
    return jsonMsg;
};
setReadiumCssJsonGetter(computeReadiumCssJsonMessage);

const saveReadingLocation = (docHref: string, locator: IEventPayload_R2_EVENT_READING_LOCATION) => {
    const store = container.get("store") as Store<RootState>;
    store.dispatch(readerActions.saveBookmark(
        {
            identifier: "reading-location",
            publication: {
                // tslint:disable-next-line:no-string-literal
                identifier: queryParams["pubId"],
            },
            docHref,

            // TODO: support for save+restore locator.cfi (see IEventPayload_R2_EVENT_READING_LOCATION type)
            docSelector: locator.cssSelector,
        } as Bookmark,
    ));
};

// tslint:disable-next-line:no-string-literal
const publicationJsonUrl = queryParams["pub"];
// tslint:disable-next-line:variable-name
const publicationJsonUrl_ = publicationJsonUrl.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL) ?
    convertCustomSchemeToHttpUrl(publicationJsonUrl) : publicationJsonUrl;

const pathBase64 = publicationJsonUrl_.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");

const pathDecoded = window.atob(pathBase64);

const pathFileName = pathDecoded.substr(
    pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1,
    pathDecoded.length - 1);

// tslint:disable-next-line:no-string-literal
const lcpHint = queryParams["lcpHint"];

const fontSizes: string[] = [
    "75%",
    "87.5%",
    "100%",
    "112.5%",
    "137.5%",
    "150%",
    "162.5%",
    "175%",
    "200%",
    "225%",
    "250%",
];

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
}

const lightMuiTheme = getMuiTheme(lightBaseTheme);
const defaultLocale = "fr";

export default class ReaderApp extends React.Component<undefined, ReaderAppState> {
    @lazyInject("store")
    private store: Store<RootState>;

    @lazyInject("translator")
    private translator: Translator;

    // private landmarksData: any[];

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
            },
            shortcutEnable: true,
            fontSizeIndex: 3,
            landmarksOpen: false,
            landmarkTabOpen: 0,
            publication: undefined,
            menuOpen: false,
        };
    }

    public async componentDidMount() {
        const __ = this.translator.translate;
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
            const settings = storeState.reader.config;
            if (settings !== this.state.settingsValues) {
                this.translator.setLocale(this.store.getState().i18n.locale);

                let i = 0;
                for (const size of fontSizes) {
                    if (settings.fontSize === size) {
                        this.setState({fontSizeIndex: i});
                    }
                    i++;
                }

                this.setState({settingsValues: settings});

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

        // TODO: see IEventPayload_R2_EVENT_READING_LOCATION object below
        // tslint:disable-next-line:no-string-literal
        let docSelector: string = queryParams["docSelector"];

        if (docHref && docSelector) {
            // Decode base64
            docHref = window.atob(docHref);
            docSelector = window.atob(docSelector);
        }

        // TODO: save+restore .cfi (not just .cssSelector)
        const docLocation: IEventPayload_R2_EVENT_READING_LOCATION = {
            cfi: undefined,
            cssSelector: docSelector,
        };

        const publication = await this.loadPublicationIntoViewport(docHref, docLocation);
        this.setState({publication});
        setReadingLocationSaver(saveReadingLocation);

        setEpubReadingSystemJsonGetter(this.getEpubReadingSystem);
    }

    public render(): React.ReactElement<{}> {
        const __ = this.translator.translate.bind(this.translator);

        return (
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <div>
                    <div className={styles.root}>
                        <nav className={styles.main_navigation} role="navigation" aria-label="Menu principal">
                            <ul>
                                <li>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.handleContentTableClick.bind(this)}
                                    >
                                        <img src="src/renderer/assets/icons/baseline-arrow_back-24px-grey.svg"
                                        alt="retour à l'accueil"/>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.handleLandmarksClick.bind(this)}
                                    >
                                        <img src="src/renderer/assets/icons/outline-info-24px.svg"
                                        alt="retour à l'accueil"/>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.handleContentTableClick.bind(this)}
                                    >
                                        <img src="src/renderer/assets/icons/outline-flip_to_front-24px.svg"
                                        alt="retour à l'accueil"/>
                                    </button>
                                </li>
                                <li  className={styles.right + " " + styles.blue}>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.handleContentTableClick.bind(this)}
                                    >
                                        <img src="src/renderer/assets/icons/sharp-crop_free-24px.svg"
                                        alt="retour à l'accueil"/>
                                    </button>
                                </li>
                                <li className={styles.right}>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.handleMenuButtonClick.bind(this)}
                                    >
                                        <img src="src/renderer/assets/icons/open_book.svg"
                                        alt="open menu"/>
                                    </button>
                                </li>
                                <li className={styles.right}>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.handleContentTableClick.bind(this)}
                                    >
                                        <img src="src/renderer/assets/icons/outline-bookmark_border-24px.svg"
                                        alt="retour à l'accueil"/>
                                    </button>
                                </li>
                                <li className={styles.right}>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.handleSettingsClick.bind(this)}
                                    >
                                        <img src="src/renderer/assets/icons/font-size.svg"
                                        alt="settings"/>
                                    </button>
                                </li>
                                <li className={styles.right}>
                                    <button
                                        className={styles.menu_button}
                                        onClick={this.handleContentTableClick.bind(this)}
                                    >
                                        <img src="src/renderer/assets/icons/baseline-volume_up-24px.svg"
                                        alt="retour à l'accueil"/>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                        <ReaderMenu
                            open={this.state.menuOpen}
                            publicationJsonUrl={publicationJsonUrl}
                            publication={this.state.publication}
                            handleLinkClick={this.handleLinkClick.bind(this)}
                        />
                        <ReaderOptions
                            open={this.state.settingsOpen}
                            fontSizeIndex={this.state.fontSizeIndex}
                            settings={this.state.settingsValues}
                            handleLinkClick={this.handleLinkClick.bind(this)}
                            handleSettingChange={this.handleSettingsValueChange.bind(this)}
                        />
                        {/* <div className={styles.menu}>
                            <button
                                className={styles.menu_button}
                                onClick={this.handleContentTableClick.bind(this)}
                            >
                                <svg className={styles.menu_svg} viewBox={ContentTableIcon.content_table}>
                                    <title>{__("reader.svg.contentTable")}</title>
                                    <use xlinkHref={"#" + ContentTableIcon.id} />
                                </svg>
                            </button>
                        </div> */}
                        <div className={styles.content_root}>
                            <div className={styles.reader}>
                                <button
                                    className={classNames(styles.side_button, styles.left_button)}
                                    onClick={() => {navLeftOrRight(true); }}
                                >
                                    <svg className={styles.side_button_svg} viewBox={ArrowIcon.arrow}>
                                        <title>{__("reader.svg.left")}</title>
                                        <use xlinkHref={"#" + ArrowIcon.id} />
                                    </svg>
                                </button>
                                <div className={styles.publication_viewport_container}>
                                    <div id="publication_viewport" className={styles.publication_viewport}> </div>
                                </div>
                                <button
                                    className={classNames(styles.side_button, styles.right_button)}
                                    onClick={() => {navLeftOrRight(false); }}
                                >
                                    <svg className={styles.side_button_svg} viewBox={ArrowIcon.arrow}>
                                        <title>{__("reader.svg.right")}</title>
                                        <use xlinkHref={"#" + ArrowIcon.id} />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/*<FocusLock>
                            <div>
                                <div className={styles.settings_content}>
                                    <label>{__("reader.settings.font")}</label>
                                    <label>
                                        {__("reader.settings.fontSize")}{fontSizes[this.state.fontSizeIndex]}
                                    </label>
                                    <label>{__("reader.settings.align")}</label>
                                    <label>{__("reader.settings.display")}</label>
                        </FocusLock>*/}
                </div>
            </MuiThemeProvider>
        );
    }

    private async loadPublicationIntoViewport(
        docHref: string,
        docLocation: IEventPayload_R2_EVENT_READING_LOCATION,
    ): Promise<R2Publication> {
        let response: Response;
        try {
            response = await fetch(publicationJsonUrl);
        } catch (e) {
            // console.log(e);
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
            docHref,
            docLocation,
        );

        return publication;
    }

    private handleContentTableClick() {
        this.setState({contentTableOpen: !this.state.contentTableOpen});
    }

    private handleMenuButtonClick() {
        this.setState({menuOpen: !this.state.menuOpen});
    }

    private handleLandmarksClick() {
        this.setState({landmarksOpen: !this.state.landmarksOpen});
    }

    private handleLinkClick(event: any, url: string) {
        event.preventDefault();
        handleLink(url, undefined, false);
    }

    private handleSettingsClick() {
        this.setState({settingsOpen: !this.state.settingsOpen});
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

        if (name === "fontSize") {
            this.setState({fontSizeIndex: value});
            value = fontSizes[value];
        }

        settingsValues[name] =  value;

        this.setState({settingsValues});

        this.handleSettingsSave();
    }

    private getEpubReadingSystem: () => INameVersion = () => {
        return { name: "Readium2 Electron/NodeJS desktop app", version: _APP_VERSION };
    }
}
