import * as path from "path";

import * as React from "react";

import FlatButton from "material-ui/FlatButton";

import Dropdown from "react-dropdown"
import ReactDropdown = require("react-dropdown")
import "react-dropdown/style.css"

import { lightBaseTheme, MuiThemeProvider } from "material-ui/styles";
import getMuiTheme from "material-ui/styles/getMuiTheme";

import { Store } from "redux";

import { Publication, getTitleString } from "readium-desktop/models/publication";

import { lazyInject } from "readium-desktop/renderer/di";

import { setLocale } from "readium-desktop/actions/i18n";
import { Translator } from "readium-desktop/i18n/translator";

import { encodeURIComponent_RFC3986 } from "readium-desktop/utils/url";

import * as readerActions from "readium-desktop/renderer/actions/reader";
import * as windowActions from "readium-desktop/renderer/actions/window";
import { RendererState } from "readium-desktop/renderer/reducers";

import { Styles } from "readium-desktop/renderer/components/styles";

// import debounce = require("debounce");

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
import { StoreElectron } from "@r2-testapp-js/electron/common/store-electron";
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
import { ipcRenderer } from "electron";
import { JSON as TAJSON } from "ta-json";

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

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

ipcRenderer.on(R2_EVENT_LCP_LSD_RENEW_RES, (_event: any, okay: boolean, msg: string) => {
    console.log("R2_EVENT_LCP_LSD_RENEW_RES");
    console.log(okay);
    console.log(msg);
});

ipcRenderer.on(R2_EVENT_LCP_LSD_RETURN_RES, (_event: any, okay: boolean, msg: string) => {
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
}

const lightMuiTheme = getMuiTheme(lightBaseTheme);
const defaultLocale = "fr";

export default class ReaderApp extends React.Component<undefined, ReaderAppState> {
    @lazyInject("store")
    private store: Store<RendererState>;

    @lazyInject("translator")
    private translator: Translator;

    constructor(props: any) {
        super(props);
        let locale = this.store.getState().i18n.locale;

        if (locale == null) {
            this.store.dispatch(setLocale(defaultLocale));
        }

        this.translator.setLocale(locale);

        this.state = {
            publicationJsonUrl: "HTTP://URL",
            lcpHint: "LCP hint",
            r2Publication: undefined,
            title: "TITLE",
            lcpPass: "LCP pass",
            spineLinks: { "no spine items?": "http://google.com" },
        };

        this._onDropDownSelectSpineLink = this._onDropDownSelectSpineLink.bind(this);
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

        let _publicationJSON: any | undefined;
        try {
            _publicationJSON = await response.json();
        } catch (e) {
            console.log(e);
        }
        if (!_publicationJSON) {
            return;
        }
        // const pubJson = global.JSON.parse(publicationStr);

        console.log(_publicationJSON);

        // let _publication: Publication | undefined;
        const _publication = TAJSON.deserialize<R2Publication>(_publicationJSON, R2Publication);

        if (_publication.Metadata && _publication.Metadata.Title) {
            // TODO: should get language from view state? (user preferences)
            const lang = "en";
            const title = getTitleString( _publication.Metadata.Title, lang);

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

        if (_publication.Spine && _publication.Spine.length) {
            console.log(_publication.Spine);
            const links: IStringMap = {};
            _publication.Spine.forEach((spineItemLink) => {
                links[spineItemLink.Href] = publicationJsonUrl + "/../" + spineItemLink.Href;
            });
            this.setState({spineLinks: links});
        }
        if (_publication.TOC && _publication.TOC.length) {
        }
        if (_publication.PageList && _publication.PageList.length) {
        }
        if (_publication.Landmarks && _publication.Landmarks.length) {
        }
        if (_publication.LOT && _publication.LOT.length) {
        }
        if (_publication.LOI && _publication.LOI.length) {
        }
        if (_publication.LOV && _publication.LOV.length) {
        }
        if (_publication.LOA && _publication.LOA.length) {
        }

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
            preloadPath = path.normalize(path.join("file://", __dirname, preloadPath));
        } else {
            preloadPath = "r2-navigator-js/dist/" +
            "es6-es2015" +
            "/src/electron/renderer/webview/preload.js";

            if (__RENDERER_BASE_URL__ === "file://") {
                // dist/prod mode (without WebPack HMR Hot Module Reload HTTP server)
                preloadPath = path.normalize(path.join("file://", __dirname, __NODE_MODULE_RELATIVE_URL__, preloadPath));
            } else {
                // dev/debug mode (with WebPack HMR Hot Module Reload HTTP server)
                // readerUrl = readerUrl.replace(":8080", ":8081");
                preloadPath = path.normalize(path.join("file://", process.cwd(), "node_modules", preloadPath));
            }
        }

        preloadPath = preloadPath.replace(/\\/g, "/");
        console.log(preloadPath);

        installNavigatorDOM(_publication, publicationJsonUrl,
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

    private _onDropDownSelectSpineLink(option: ReactDropdown.Option) {
        const href = this.state.spineLinks[option.label];
        handleLink(href, undefined, false);
    }

    public async componentDidMount() {
        console.log(window.location.search);
        console.log(publicationJsonUrl);
        console.log(lcpHint);

        this.setState({
            publicationJsonUrl: publicationJsonUrl,
        });

        if (lcpHint) {
            this.setState({
                lcpHint: lcpHint,
                lcpPass: this.state.lcpPass + " [" + lcpHint + "]",
            });
        }

        console.log(this.state);
        console.log(this.store.getState());

        // this.store.dispatch(windowActions.init());
        this.store.subscribe(() => {
            const storeState = this.store.getState();
            console.log("storeState (INDEX READER):");
            console.log(storeState);

            // this.setState({
            // });

            this.translator.setLocale(this.store.getState().i18n.locale);
        });

        ipcRenderer.on(R2_EVENT_TRY_LCP_PASS_RES, async (_event: any, okay: boolean, msg: string, passSha256Hex: string) => {

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
        return (
            <MuiThemeProvider muiTheme={lightMuiTheme}>
                <div>
                    <Dropdown options={Object.keys(this.state.spineLinks)} onChange={this._onDropDownSelectSpineLink} placeholder="Spine Items" />
                    {/* <span>{this.state.title}</span> */}
                    <FlatButton
                        label="LEFT"
                        onClick={()=>{navLeftOrRight(true);}}
                    />
                    <FlatButton
                        label="RIGHT"
                        onClick={()=>{navLeftOrRight(false);}}
                    />
                    <FlatButton
                        label="ReadiumCSS"
                        onClick={()=>{
                            electronStore.set("styling.readiumcss", !electronStore.get("styling.readiumcss"));
                        }}
                    />
                    <FlatButton
                        label="Scroll/Page"
                        onClick={()=>{
                            electronStore.set("styling.paged", !electronStore.get("styling.paged"));
                        }}
                    />
                    <FlatButton
                        label="Night"
                        onClick={()=>{
                            electronStore.set("styling.night", !electronStore.get("styling.night"));
                        }}
                    />
                    <FlatButton
                        label="Open settings"
                        onClick={()=>{
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
                    />
                    <input type="text" value={this.state.lcpPass} onChange={(event) => {  this.setState({lcpPass: event.target.value});}} size={40} />
                    <FlatButton
                        label="LSD Renew"
                        onClick={()=>{
                            ipcRenderer.send(R2_EVENT_LCP_LSD_RENEW, pathDecoded, ""); // no explicit end date
                        }}
                    />
                    <FlatButton
                        label="LSD Return"
                        onClick={()=>{
                            ipcRenderer.send(R2_EVENT_LCP_LSD_RETURN, pathDecoded);
                        }}
                    />
                    <div id="publication_viewport" style={Styles.Reader.publicationViewport}> </div>
                </div>
            </MuiThemeProvider>
        );
    }
}
