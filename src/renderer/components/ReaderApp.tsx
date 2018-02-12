import * as path from "path";

import * as classNames from "classnames";

import * as React from "react";

import { Store } from "redux";

import { getTitleString, Publication } from "readium-desktop/common/models/publication";

import { lazyInject } from "readium-desktop/renderer/di";

import { setLocale } from "readium-desktop/common/redux/actions/i18n";
import { Translator } from "readium-desktop/common/services/translator";

import ArrowIcon from "readium-desktop/renderer/assets/icons/arrow.svg";
import ContentTableIcon from "readium-desktop/renderer/assets/icons/content-table.svg";
import NightIcon from "readium-desktop/renderer/assets/icons/night.svg";
import SettingsIcon from "readium-desktop/renderer/assets/icons/settings.svg";

import { RootState } from "readium-desktop/renderer/redux/states";

import { IStringMap } from "@r2-shared-js/models/metadata-multilang";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import {
    R2_EVENT_LCP_LSD_RENEW,
    R2_EVENT_LCP_LSD_RENEW_RES,
    R2_EVENT_LCP_LSD_RETURN,
    R2_EVENT_LCP_LSD_RETURN_RES,
    R2_EVENT_TRY_LCP_PASS,
    R2_EVENT_TRY_LCP_PASS_RES,
} from "@r2-navigator-js/electron/common/events";
import { IStore } from "@r2-navigator-js/electron/common/store";
import { getURLQueryParams } from "@r2-navigator-js/electron/renderer/common/querystring";
import {
    handleLink,
    installNavigatorDOM,
    navLeftOrRight,
    readiumCssOnOff,
    setReadingLocationSaver,
    setReadiumCssJsonGetter,
} from "@r2-navigator-js/electron/renderer/index";
import { initGlobals } from "@r2-shared-js/init-globals";
import { StoreElectron } from "@r2-testapp-js/electron/common/store-electron";
import { ipcRenderer } from "electron";
import { JSON as TAJSON } from "ta-json";

import * as ReaderStyles from "readium-desktop/renderer/components/styles/readerApp.css";

// Preprocessing directive
declare const __RENDERER_BASE_URL__: string;
declare const __NODE_ENV__: string;
declare const __NODE_MODULE_RELATIVE_URL__: string;
declare const __PACKAGING__: string;

const electronStore: IStore = new StoreElectron("readium2-testapp", {
    styling: {
        align: "left",
        colCount: "auto",
        dark: false,
        font: "DEFAULT",
        fontSize: "100%",
        invert: false,
        lineHeight: "1.5",
        night: false,
        paged: false,
        readiumcss: false,
        sepia: false,
    },
});

const electronStoreLCP: IStore = new StoreElectron("readium2-testapp-lcp", {});

const electronStoreLSD: IStore = new StoreElectron("readium2-testapp-lsd", {});

initGlobals();

const computeReadiumCssJsonMessage = (): string => {

    const on = electronStore.get("styling.readiumcss");
    if (on) {
        const align = electronStore.get("styling.align");
        const colCount = electronStore.get("styling.colCount");
        const dark = electronStore.get("styling.dark");
        const font = electronStore.get("styling.font");
        const fontSize = electronStore.get("styling.fontSize");
        const lineHeight = electronStore.get("styling.lineHeight");
        const invert = electronStore.get("styling.invert");
        const night = electronStore.get("styling.night");
        const paged = electronStore.get("styling.paged");
        const sepia = electronStore.get("styling.sepia");
        const cssJson = {
            align,
            colCount,
            dark,
            font,
            fontSize,
            invert,
            lineHeight,
            night,
            paged,
            sepia,
        };
        const jsonMsg = { injectCSS: "yes", setCSS: cssJson };
        return JSON.stringify(jsonMsg, null, 0);
    } else {
        const jsonMsg = { injectCSS: "rollback", setCSS: "rollback" };
        return JSON.stringify(jsonMsg, null, 0);
    }
};
setReadiumCssJsonGetter(computeReadiumCssJsonMessage);

const saveReadingLocation = (doc: string, loc: string) => {
    let obj = electronStore.get("readingLocation");
    if (!obj) {
        obj = {};
    }
    obj[pathDecoded] = {
        doc,
        loc,
    };
    electronStore.set("readingLocation", obj);
};
setReadingLocationSaver(saveReadingLocation);

const queryParams = getURLQueryParams();

// tslint:disable-next-line:no-string-literal
const publicationJsonUrl = queryParams["pub"];

const pathBase64 = publicationJsonUrl.replace(/.*\/pub\/(.*)\/manifest.json/, "$1");

const pathDecoded = window.atob(pathBase64);

const pathFileName = pathDecoded.substr(
    pathDecoded.replace(/\\/g, "/").lastIndexOf("/") + 1,
    pathDecoded.length - 1);

// tslint:disable-next-line:no-string-literal
const lcpHint = queryParams["lcpHint"];

electronStore.onChanged("styling.night", (newValue: any, oldValue: any) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }

    readiumCssOnOff();
});

electronStore.onChanged("styling.align", (newValue: any, oldValue: any) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }

    readiumCssOnOff();
});

electronStore.onChanged("styling.paged", (newValue: any, oldValue: any) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }

    readiumCssOnOff();
});

// const readiumCssOnOff = debounce(() => {
//     readiumCssOnOff_();
// }, 500);

electronStore.onChanged("styling.readiumcss", (newValue: any, oldValue: any) => {
    if (typeof newValue === "undefined" || typeof oldValue === "undefined") {
        return;
    }

    readiumCssOnOff();

    if (!newValue) {
        electronStore.set("styling.night", false);
    }
});

ipcRenderer.on(R2_EVENT_LCP_LSD_RENEW_RES, (__: any, okay: boolean, msg: string) => {
    console.log("R2_EVENT_LCP_LSD_RENEW_RES");
    console.log(okay);
    console.log(msg);
});

ipcRenderer.on(R2_EVENT_LCP_LSD_RETURN_RES, (__: any, okay: boolean, msg: string) => {
    console.log("R2_EVENT_LCP_LSD_RETURN_RES");
    console.log(okay);
    console.log(msg);
});

interface ReaderAppState {
    publicationJsonUrl?: string;
    lcpHint?: string;
    r2Publication?: Publication;
    title?: string;
    lcpPass?: string;
    spineLinks?: IStringMap;
    contentTableOpen: boolean;
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
            r2Publication: undefined,
            title: "TITLE",
            lcpPass: "LCP pass",
            spineLinks: { "no spine items?": "https://google.com" },
            contentTableOpen: false,
        };
    }

    public async componentDidMount() {
        console.log(window.location.search);
        console.log(publicationJsonUrl);
        console.log(lcpHint);

        this.setState({
            publicationJsonUrl,
        });

        if (lcpHint) {
            this.setState({
                lcpHint,
                lcpPass: this.state.lcpPass + " [" + lcpHint + "]",
            });
        }

        // this.store.dispatch(windowActions.init());
        this.store.subscribe(() => {
            const storeState = this.store.getState();

            this.translator.setLocale(this.store.getState().i18n.locale);

            this.setState({});
        });

        ipcRenderer.on(R2_EVENT_TRY_LCP_PASS_RES,
            async (__: any, okay: boolean, msg: string, passSha256Hex: string) => {

            if (!okay) {
                setTimeout(() => {
                    this.showLcpDialog(msg);
                }, 500);

                return;
            }

            const lcpStore = electronStoreLCP.get("lcp");
            if (!lcpStore) {
                const lcpObj: any = {};
                const pubLcpObj: any = lcpObj[pathDecoded] = {};
                pubLcpObj.sha = passSha256Hex;

                electronStoreLCP.set("lcp", lcpObj);
            } else {
                const pubLcpStore = lcpStore[pathDecoded];
                if (pubLcpStore) {
                    pubLcpStore.sha = passSha256Hex;
                } else {
                    lcpStore[pathDecoded] = {
                        sha: passSha256Hex,
                    };
                }
                electronStoreLCP.set("lcp", lcpStore);
            }

            await this.loadPublicationIntoViewport();
        });

        if (lcpHint) {

            let lcpPassSha256Hex: string | undefined;
            const lcpStore = electronStoreLCP.get("lcp");
            if (lcpStore) {
                const pubLcpStore = lcpStore[pathDecoded];
                if (pubLcpStore && pubLcpStore.sha) {
                    lcpPassSha256Hex = pubLcpStore.sha;
                }
            }
            if (lcpPassSha256Hex) {
                ipcRenderer.send(R2_EVENT_TRY_LCP_PASS, pathDecoded, lcpPassSha256Hex, true);
            } else {
                this.showLcpDialog();
            }
        } else {
            await this.loadPublicationIntoViewport();
        }
    }

    public render(): React.ReactElement<{}> {
        const contentTable = [];
        let i = 0;
        for (const spine in this.state.spineLinks) {
            contentTable.push((
                <li><a key={i} href={this.state.spineLinks[spine]}
                    onClick={this._onDropDownSelectSpineLink}>
                    {spine}
                </a></li>
            ));
            i++;
        }
        return (
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
                    <button
                        className={ReaderStyles.menu_button}
                        onClick={() => {
                            electronStore.set("styling.readiumcss", !electronStore.get("styling.readiumcss"));
                        }}
                    >
                        ReadiumCSS
                    </button>
                    <button
                        className={ReaderStyles.menu_button}
                        onClick={() => {
                            electronStore.set("styling.paged", !electronStore.get("styling.paged"));
                        }}
                    >
                        Scroll/Page
                    </button>
                    <button
                        className={ReaderStyles.menu_button}
                        onClick={() => {
                            electronStore.set("styling.night", !electronStore.get("styling.night"));
                        }}
                    >
                        <svg className={ReaderStyles.menu_svg} viewBox={NightIcon.night}>
                            <title>Night</title>
                            <use xlinkHref={"#" + NightIcon.id} />
                        </svg>
                    </button>
                    <button
                        className={ReaderStyles.menu_button}
                        onClick={() => {
                            if ((electronStore as any).reveal) {
                                (electronStore as any).reveal();
                            }
                            if ((electronStoreLCP as any).reveal) {
                                (electronStoreLCP as any).reveal();
                            }
                            if ((electronStoreLSD as any).reveal) {
                                (electronStoreLSD as any).reveal();
                            }
                        }}
                    >
                        <svg className={ReaderStyles.menu_svg} viewBox={SettingsIcon.settings}>
                            <title>Settings</title>
                            <use xlinkHref={"#" + SettingsIcon.id} />
                        </svg>
                    </button>
                    <div className={ReaderStyles.separation}/>
                    <input type="text"
                        value={this.state.lcpPass}
                        onChange={(event) => {  this.setState({lcpPass: event.target.value}); }}
                        size={40}
                    />
                    <button
                        className={ReaderStyles.menu_button}
                        onClick={() => {
                            ipcRenderer.send(R2_EVENT_LCP_LSD_RENEW, pathDecoded, ""); // no explicit end date
                        }}
                        >
                        LSD Renew
                    </button>
                    <button
                        className={ReaderStyles.menu_button}
                        onClick={() => {
                            ipcRenderer.send(R2_EVENT_LCP_LSD_RETURN, pathDecoded);
                        }}
                        >
                        LSD Return
                    </button>
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
        );
    }

    private async loadPublicationIntoViewport() {
        // // tslint:disable-next-line:no-floating-promises
        // (async () => {
        // })();

        let response: Response;
        try {
            response = await fetch(publicationJsonUrl);
        } catch (e) {
            console.log(e);
            return;
        }
        if (!response.ok) {
            console.log("BAD RESPONSE?!");
        }
        // response.headers.forEach((arg0: any, arg1: any) => {
        //     console.log(arg0 + " => " + arg1);
        // });

        let publicationJSON: any | undefined;
        try {
            publicationJSON = await response.json();
        } catch (e) {
            console.log(e);
        }
        if (!publicationJSON) {
            return;
        }
        // const pubJson = global.JSON.parse(publicationStr);

        console.log(publicationJSON);

        // let _publication: Publication | undefined;
        const publication = TAJSON.deserialize<R2Publication>(publicationJSON, R2Publication);

        if (publication.Metadata && publication.Metadata.Title) {
            // TODO: should get language from view state? (user preferences)
            const lang = "en";
            const title = getTitleString( publication.Metadata.Title, lang);

            // let title: string | undefined;
            // if (typeof _publication.Metadata.Title === "string") {
            //     title = _publication.Metadata.Title;
            // } else {
            //     const keys = Object.keys(_publication.Metadata.Title as IStringMap);
            //     if (keys && keys.length) {
            //         title = (_publication.Metadata.Title as IStringMap)[keys[0]];
            //     }
            // }

            if (title) {
                console.log(title);
                window.document.title = "Readium2 [ " + title + "]";
                this.setState({
                    title,
                });
            }
        }

        if (publication.Spine && publication.Spine.length) {
            console.log(publication.Spine);
            const links: IStringMap = {};
            publication.TOC.forEach((spineItemLink) => {
                links[spineItemLink.Title] = publicationJsonUrl + "/../" + spineItemLink.Href;
            });
            this.setState({spineLinks: links});
        }
        // if (publication.TOC && publication.TOC.length) {
        // }
        // if (publication.PageList && publication.PageList.length) {
        // }
        // if (publication.Landmarks && publication.Landmarks.length) {
        // }
        // if (publication.LOT && publication.LOT.length) {
        // }
        // if (publication.LOI && publication.LOI.length) {
        // }
        // if (publication.LOV && publication.LOV.length) {
        // }
        // if (publication.LOA && publication.LOA.length) {
        // }

        const readStore = electronStore.get("readingLocation");
        let pubDocHrefToLoad: string | undefined;
        let pubDocSelectorToGoto: string | undefined;
        if (readStore) {
            const obj = readStore[pathDecoded];
            if (obj && obj.doc) {
                pubDocHrefToLoad = obj.doc;
                if (obj.loc) {
                    pubDocSelectorToGoto = obj.loc;
                }
            }
        }

        let preloadPath = "preload.js";
        if (__PACKAGING__ === "1") {
            console.log(__dirname);
            console.log((global as any).__dirname);
            preloadPath = "file://" + path.normalize(path.join((global as any).__dirname, preloadPath));
        } else {
            preloadPath = "r2-navigator-js/dist/" +
            "es6-es2015" +
            "/src/electron/renderer/webview/preload.js";

            if (__RENDERER_BASE_URL__ === "file://") {
                // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
                console.log(__dirname);
                console.log((global as any).__dirname);
                preloadPath = "file://" +
                    path.normalize(path.join((global as any).__dirname, __NODE_MODULE_RELATIVE_URL__, preloadPath));
            } else {
                // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
                // readerUrl = readerUrl.replace(":8080", ":8081");
                preloadPath = "file://" + path.normalize(path.join(process.cwd(), "node_modules", preloadPath));
            }
        }

        preloadPath = preloadPath.replace(/\\/g, "/");
        console.log(preloadPath);

        installNavigatorDOM(publication, publicationJsonUrl,
            "publication_viewport",
            preloadPath,
            pubDocHrefToLoad, pubDocSelectorToGoto);
    }

    private showLcpDialog(message?: string) {

        console.log(lcpHint);
        if (message) {
            console.log(message);
        }

        setTimeout(() => {
            ipcRenderer.send(R2_EVENT_TRY_LCP_PASS, pathDecoded, this.state.lcpPass, false);
        }, 3000);
    }

    private handleContentTableClick() {
        this.setState({contentTableOpen: !this.state.contentTableOpen});
    }

    private _onDropDownSelectSpineLink(event: any) {
        const href = event.target.href;
        handleLink(href, undefined, false);
        event.preventDefault();
    }
}
