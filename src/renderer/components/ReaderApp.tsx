import * as path from "path";

import * as classNames from "classnames";

import * as React from "react";

import { Store } from "redux";

import { container } from "readium-desktop/renderer/di";

import { getMultiLangString } from "readium-desktop/common/models/language";
import { Publication } from "readium-desktop/common/models/publication";
import { ReaderConfig as ReadiumCSS} from "readium-desktop/common/models/reader";

import { lazyInject } from "readium-desktop/renderer/di";

import { setLocale } from "readium-desktop/common/redux/actions/i18n";
import { Translator } from "readium-desktop/common/services/translator";

import ArrowIcon from "readium-desktop/renderer/assets/icons/arrow.svg";
import ContentTableIcon from "readium-desktop/renderer/assets/icons/content-table.svg";
import ContinueIcon from "readium-desktop/renderer/assets/icons/continue.svg";
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

import { IEventPayload_R2_EVENT_READIUMCSS } from "@r2-navigator-js/electron/common/events";

import { getURLQueryParams } from "@r2-navigator-js/electron/renderer/common/querystring";
import {
    handleLink,
    installNavigatorDOM,
    navLeftOrRight,
    readiumCssOnOff,
    setReadingLocationSaver,
    setReadiumCssJsonGetter,
} from "@r2-navigator-js/electron/renderer/index";
import { StoreElectron } from "@r2-testapp-js/electron/common/store-electron";
import { ipcRenderer } from "electron";
import { JSON as TAJSON } from "ta-json";

import { webFrame } from "electron";

import {
    convertCustomSchemeToHttpUrl,
    READIUM2_ELECTRON_HTTP_PROTOCOL,
} from "@r2-navigator-js/electron/common/sessions";

import * as ReaderStyles from "readium-desktop/renderer/assets/styles/reader-app.css";

import {
    _NODE_MODULE_RELATIVE_URL,
    _PACKAGING,
    _RENDERER_READER_BASE_URL,
} from "readium-desktop/preprocessor-directives";

webFrame.registerURLSchemeAsSecure(READIUM2_ELECTRON_HTTP_PROTOCOL);
webFrame.registerURLSchemeAsPrivileged(READIUM2_ELECTRON_HTTP_PROTOCOL, {
    allowServiceWorkers: false,
    bypassCSP: false,
    corsEnabled: true,
    secure: true,
    supportFetchAPI: true,
});

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

const saveReadingLocation = (doc: string, loc: string) => {
    console.log("Save reading location");
};
setReadingLocationSaver(saveReadingLocation);

const queryParams = getURLQueryParams();

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

interface ReaderAppState {
    publicationJsonUrl?: string;
    lcpHint?: string;
    r2Publication?: Publication;
    title?: string;
    lcpPass?: string;
    spineLinks?: IStringMap;
    contentTableOpen: boolean;
    settingsOpen: boolean;
    settingsValues: ReadiumCSS;
    shortcutEnable: boolean;
}

const lightMuiTheme = getMuiTheme(lightBaseTheme);
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
            r2Publication: undefined,
            title: "TITLE",
            lcpPass: "LCP pass",
            spineLinks: { "https://google.com": "no spine items?" },
            contentTableOpen: false,
            settingsOpen: false,
            settingsValues: {
                align: "left",
                colCount: "auto",
                dark: false,
                font: "DEFAULT",
                fontSize: "100%",
                fontSizeNum: 100,
                invert: false,
                lineHeight: "1.5",
                night: false,
                paged: false,
                readiumcss: true,
                sepia: false,
            },
            shortcutEnable: true,
        };
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
            const settings = storeState.reader.config;
            if (settings !== this.state.settingsValues) {
                this.translator.setLocale(this.store.getState().i18n.locale);

                this.setState({
                    settingsValues: Object.assign(
                        {},
                        storeState.reader.config,
                        {
                            fontSizeNum: parseInt(
                                storeState.reader.config.fontSize, 10,
                            ),
                        },
                    ),
                });

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

        await this.loadPublicationIntoViewport();
    }

    public render(): React.ReactElement<{}> {
        const contentTable = [];
        const __ = this.translator.translate.bind(this.translator);

        let i = 0;
        for (const spine in this.state.spineLinks) {
            contentTable.push((
                <li key={i}><a href={spine}
                    onClick={this._onDropDownSelectSpineLink}>
                    {this.state.spineLinks[spine]}
                </a></li>
            ));
            i++;
        }

        const additionalRadioProperties = (name: string, value: any) => {
            if (this.state.settingsValues[name] === value) {
                return {
                    checked: true,
                };
            }

            return null;
        };

        return (
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <div>
                    <div className={ReaderStyles.root}>
                        <div className={ReaderStyles.menu}>
                            <button
                                className={ReaderStyles.menu_button}
                                onClick={this.handleContentTableClick.bind(this)}
                            >
                                <svg className={ReaderStyles.menu_svg} viewBox={ContentTableIcon.content_table}>
                                    <title>Content Table</title>
                                    <use xlinkHref={"#" + ContentTableIcon.id} />
                                </svg>
                            </button>
                            <div className={ReaderStyles.menu_right_button}>
                                <button
                                    className={ReaderStyles.menu_button}
                                    onClick={this.handleNightSwitch.bind(this)}
                                >
                                    <svg className={ReaderStyles.menu_svg} viewBox={NightIcon.night}>
                                        <title>Night</title>
                                        <use xlinkHref={"#" + NightIcon.id} />
                                    </svg>
                                </button>
                                <button
                                    className={ReaderStyles.menu_button}
                                    onClick={this.handleSettingsOpen.bind(this)}
                                >
                                    <svg className={ReaderStyles.menu_svg} viewBox={SettingsIcon.settings}>
                                        <title>Settings</title>
                                        <use xlinkHref={"#" + SettingsIcon.id} />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className={ReaderStyles.content_root}>
                            <div className={classNames(ReaderStyles.content_table,
                                    this.state.contentTableOpen && ReaderStyles.content_table_open)}>
                                <ul>
                                {contentTable}
                                </ul>
                            </div>
                            <div className={ReaderStyles.reader}>
                                <button
                                    className={classNames(ReaderStyles.side_button, ReaderStyles.left_button)}
                                    onClick={() => {navLeftOrRight(true); }}
                                >
                                    <svg className={ReaderStyles.side_button_svg} viewBox={ArrowIcon.arrow}>
                                        <title>Left</title>
                                        <use xlinkHref={"#" + ArrowIcon.id} />
                                    </svg>
                                </button>
                                <div id="publication_viewport" className={ReaderStyles.publication_viewport}> </div>
                                <button
                                    className={classNames(ReaderStyles.side_button, ReaderStyles.right_button)}
                                    onClick={() => {navLeftOrRight(false); }}
                                >
                                    <svg className={ReaderStyles.side_button_svg} viewBox={ArrowIcon.arrow}>
                                        <title>Right</title>
                                        <use xlinkHref={"#" + ArrowIcon.id} />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <Dialog
                        title={__("reader.settings.title")}
                        open={this.state.settingsOpen}
                        actions={[
                            <button className={ReaderStyles.settings_action}
                                    onClick={this.handleSettingsClose.bind(this)}>
                                        {__("reader.settings.close")}
                                    </button>,
                            <button className={ReaderStyles.settings_action}
                                onClick={this.handleSettingsSave.bind(this)}>{__("reader.settings.save")}</button>,
                        ]}
                    >
                        <div className={ReaderStyles.settings_content}>
                            <label>{__("reader.settings.fontSize")}{this.state.settingsValues.fontSizeNum}%</label>
                            <input name="fontSizeNum" type="range" min="30" max="250"
                                value={this.state.settingsValues.fontSizeNum}
                                onChange={this.handleSettingsValueChange.bind(this)}/>
                            <label>{__("reader.settings.align")}</label>
                            <div className={ReaderStyles.settings_radios}>
                                <label>
                                    <input type="radio" value="left" name="align"
                                        onChange={this.handleSettingsValueChange.bind(this)}
                                        {...additionalRadioProperties("align", "left")}/>
                                        <svg className={ReaderStyles.settings_icones} viewBox={AlignLeftIcon.alignLeft}>
                                            <title>Align Left</title>
                                            <use xlinkHref={"#" + AlignLeftIcon.id} />
                                        </svg> {__("reader.settings.left")}
                                </label>
                                <label>
                                    <input type="radio" value="center" name="align"
                                        onChange={this.handleSettingsValueChange.bind(this)}
                                        {...additionalRadioProperties("align", "center")}/>
                                        <svg className={ReaderStyles.settings_icones}
                                            viewBox={AlignCenterIcon.alignCenter}
                                        >
                                            <title>Align Center</title>
                                            <use xlinkHref={"#" + AlignCenterIcon.id} />
                                        </svg> {__("reader.settings.center")}
                                </label>
                                <label>
                                    <input type="radio" value="right" name="align"
                                        onChange={this.handleSettingsValueChange.bind(this)}
                                        {...additionalRadioProperties("align", "right")}/>
                                        <svg className={ReaderStyles.settings_icones}
                                            viewBox={AlignRightIcon.alignRight}
                                        >
                                            <title>Align Right</title>
                                            <use xlinkHref={"#" + AlignRightIcon.id} />
                                        </svg> {__("reader.settings.right")}
                                </label>
                            </div>
                            <label>{__("reader.settings.display")}</label>
                            <div>
                                <label>
                                    <input type="radio" value="true" name="paged"
                                        onChange={this.handleSettingsValueChange.bind(this)}
                                        {...additionalRadioProperties("paged", true)}/>
                                        <svg className={ReaderStyles.settings_icones} viewBox={PageIcon.page}>
                                            <title>Document</title>
                                            <use xlinkHref={"#" + PageIcon.id} />
                                        </svg> {__("reader.settings.paginated")}
                                </label>
                                <label>
                                    <input type="radio" value="false" name="paged"
                                        onChange={this.handleSettingsValueChange.bind(this)}
                                        {...additionalRadioProperties("paged", false)}/>
                                        <svg className={ReaderStyles.settings_icones} viewBox={ContinueIcon.continue}>
                                            <title>Continue</title>
                                            <use xlinkHref={"#" + ContinueIcon.id} />
                                        </svg> {__("reader.settings.scrolled")}
                                </label>
                            </div>
                        </div>
                    </Dialog>
                </div>
            </MuiThemeProvider>
        );
    }

    private async loadPublicationIntoViewport() {
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
            // TODO: should get language from view state? (user preferences)
            const lang = "en";
            const title = getMultiLangString( publication.Metadata.Title, lang);

            if (title) {
                window.document.title = "Readium2 [ " + title + "]";
                this.setState({
                    title,
                });
            }
        }

        if (publication.Spine && publication.Spine.length) {
            const links: IStringMap = {};
            publication.TOC.forEach((spineItemLink: any) => {
                links[publicationJsonUrl + "/../" + spineItemLink.Href] = spineItemLink.Title;
            });
            this.setState({spineLinks: links});
        }

        const pubDocHrefToLoad: string | undefined = undefined;
        const pubDocSelectorToGoto: string | undefined = undefined;

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

        installNavigatorDOM(publication, publicationJsonUrl,
            "publication_viewport",
            preloadPath,
            pubDocHrefToLoad, pubDocSelectorToGoto);
    }

    private handleContentTableClick() {
        this.setState({contentTableOpen: !this.state.contentTableOpen});
    }

    private _onDropDownSelectSpineLink(event: any) {
        const href = event.target.href;
        handleLink(href, undefined, false);
        event.preventDefault();
    }

    private handleSettingsOpen() {
        this.setState({settingsOpen: true, shortcutEnable: false});
    }

    private handleSettingsClose() {
        this.setState({settingsOpen: false, shortcutEnable: true});
    }

    private handleSettingsSave() {
        const values = this.state.settingsValues;
        values.fontSize = values.fontSizeNum + "%";

        this.store.dispatch(readerActions.setConfig(values));
        this.setState({settingsValues: values});
        this.handleSettingsClose();

        // Push reader config to navigator
        readiumCssOnOff();
    }

    private handleNightSwitch() {
        const settingsValues = this.state.settingsValues;

        settingsValues.night =  !settingsValues.night;

        this.setState({settingsValues});

        this.handleSettingsSave();
    }

    private handleSettingsValueChange(event: any) {
        const settingsValues = this.state.settingsValues;
        const name = event.target.name;
        let value = event.target.value.toString();

        if (value === "false") {
            value = false;
        } else if (value === "true") {
            value = true;
        }

        settingsValues[name] =  value;

        this.setState({settingsValues});
    }
}
