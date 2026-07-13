// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesFooter from "readium-desktop/renderer/assets/styles/components/aboutFooter.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";
import { ToastType } from "readium-desktop/common/models/toast";
import { I18nFunction } from "readium-desktop/common/services/translator";

import { ipcRenderer } from "electron";
import { shell } from "electron";
// import * as path from "path";
import * as React from "react";
import { connect } from "react-redux";
// import { ABOUT_BOOK_TITLE_PREFIX } from "readium-desktop/common/constant";
// import { readerActions } from "readium-desktop/common/redux/actions";
// import { PublicationView } from "readium-desktop/common/views/publication";
import { _APP_NAME, _APP_VERSION } from "readium-desktop/preprocessor-directives";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { TDispatch } from "readium-desktop/typings/redux";
// import { findMimeTypeWithExtension, mimeTypes } from "readium-desktop/utils/mimeTypes";

// import { TaJsonSerialize } from "@r2-lcp-js/serializable";
// import { Metadata } from "@r2-shared-js/models/metadata";
// import { Publication as R2Publication } from "@r2-shared-js/models/publication";
// import { Link } from "@r2-shared-js/models/publication-link";

// import { apiAction } from "../../apiAction";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import * as EdrlabLogo from "readium-desktop/renderer/assets/icons/logo_edrlab.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import * as CheckIcon from "readium-desktop/renderer/assets/icons/singlecheck-icon.svg";
import { screenReaderActions, toastActions } from "readium-desktop/common/redux/actions";

import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

// async function getOsName() {
//     if ((navigator as any).userAgentData) {
//         const result = await (navigator as any).userAgentData.getHighEntropyValues(["architecture", "bitness", "platform"]);
//         return `${result.platform}-${result.architecture}_${result.bitness}`;
//     }

//     // Fallback
//     return navigator.platform || "unknown";
// }

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

interface IState {
    versionInfo: boolean;

    accessibilitySupportEnabled: boolean;
}

class AboutThoriumButton extends React.Component<IProps, IState> {

    // private manifestView: PublicationView;
    private screenReaderLinkRef: React.RefObject<HTMLAnchorElement>;

    constructor(props: IProps) {
        super(props);

        this.accessibilitySupportChanged = this.accessibilitySupportChanged.bind(this);

        this.screenReaderLinkRef = React.createRef<HTMLAnchorElement>();

        this.state = {
            versionInfo: true,

            accessibilitySupportEnabled: false,
        };
    }

    private accessibilitySupportChanged = (_e: Electron.IpcRendererEvent, accessibilitySupportEnabled: boolean) => {
        console.log("ABOUTTHORIUM.tsx ipcRenderer.on - accessibility-support-changed-raw: ", accessibilitySupportEnabled);

        // prevents infinite loop via componentDidUpdate()
        if (accessibilitySupportEnabled !== this.state.accessibilitySupportEnabled) {
            this.setState({ accessibilitySupportEnabled });

            // setTimeout(() => {
            //     this.screenReaderLinkRef?.current?.focus();
            // }, 1000);
        }
    };

    public componentDidMount() {
        // navigatorTTSVoicesSetter(this.props.ttsVoices);

        ipcRenderer.on("accessibility-support-changed-raw", this.accessibilitySupportChanged);

        // note that "@r2-navigator-js/electron/main/browser-window-tracker"
        // uses "accessibility-support-changed" instead of "accessibility-support-query",
        // so there is no duplicate event handler.
        console.log("ABOUTTHORIUM.tsx componentDidMount() ipcRenderer.send - accessibility-support-query-raw");
        ipcRenderer.send("accessibility-support-query-raw");

        // setTimeout(() => {
        //     this.screenReaderLinkRef?.current?.focus();
        // }, 1000);
    }
    // public componentDidUpdate(_prevProps: IProps) {
    //     setTimeout(() => {
    //         this.screenReaderLinkRef?.current?.focus();
    //     }, 1000);
    // }
    public componentWillUnmount() {
        ipcRenderer.off("accessibility-support-changed-raw", this.accessibilitySupportChanged);
    }

    public render() {
        const { __ } = this.props;
        const displayVersionToast = this.state.versionInfo && !!this.props.newVersionURL && !!this.props.newVersion;
        const displayScreenReaderInvite = !this.props.screenReaderActivate && this.state.accessibilitySupportEnabled;

        // const locale = encodeURIComponent_RFC3986(this.props.locale);
        // const app_version = encodeURIComponent_RFC3986(_APP_VERSION);
        // const source = encodeURIComponent_RFC3986("thorium-desktop");

        // const customizationProfileProvisionedAndActivated = this.props.customizationProvision.find(({id}) => this.props.customizationProfileId === id);
        const keyboardShortcutScreenReader = `${(this.props.keyboardShortcuts.ToggleScreenReaderOptimize.shift ? "SHIFT " : "") + (this.props.keyboardShortcuts.ToggleScreenReaderOptimize.control ? "CTRL " : "") + (this.props.keyboardShortcuts.ToggleScreenReaderOptimize.alt ? "ALT/OPT " : "") + (this.props.keyboardShortcuts.ToggleScreenReaderOptimize.meta ? "META/CMD " : "") + this.props.keyboardShortcuts.ToggleScreenReaderOptimize.key}`;

        return (
            <section
                className={stylesFooter.footer_wrapper}
                style={{ justifyContent: (displayVersionToast || displayScreenReaderInvite) ? "space-between" : "end" }}>
                {
                    displayVersionToast ?
                    <div className={stylesGlobal.new_version}
                    aria-live="polite"
                    role="alert">
                        <div>
                            <SVG ariaHidden svg={InfoIcon} />
                            <p><a href=""
                            onClick={(ev) => {
                                ev.preventDefault(); // necessary because href="", CSS must also ensure hyperlink visited style
                                this.setState({ versionInfo : false });
                                if (this.props.newVersionURL && /^https?:\/\//.test(this.props.newVersionURL)) { /* ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc. */
                                    shell.openExternal(this.props.newVersionURL).then(() => { /* noop */ }).catch((err: unknown) => { console.log(err); }); // .finally(() => { /* noop */ })
                                }
                            }}>{`${this.props.__("app.update.message")}`} <span>(v{this.props.newVersion})</span></a></p>
                        </div>
                        {/* <button onClick={() => {
                            this.setState({ versionInfo : false });
                            shell.openExternal(this.props.newVersionURL).then(() => {}).catch((err: unknown) => { console.log(err); }); // .finally(() => {})
                        }}>
                            {this.props.__("app.session.exit.askBox.button.yes")}
                        </button>
                        <button onClick={() => {
                            this.setState({ versionInfo : false });
                        }}>
                            {this.props.__("app.session.exit.askBox.button.no")}
                        </button> */}
                    </div>
                    : <></>
                }
                {
                    displayScreenReaderInvite ?
                    <div className={stylesGlobal.new_version}
                    aria-live="assertive"
                    role="alert">
                        <div>
                            <SVG ariaHidden svg={CheckIcon} />
                            <p><a href=""
                            ref={this.screenReaderLinkRef}
                            onClick={(ev) => {
                                ev.preventDefault(); // necessary because href="", CSS must also ensure hyperlink visited style

                                this.props.toggleScreenReader(this.props.screenReaderActivate, keyboardShortcutScreenReader, this.props.__);
                            }}>{`${this.props.__("settings.screenReaderActivate.invite", { keyboard: keyboardShortcutScreenReader, status: this.props.screenReaderActivate ? __("app.session.exit.askBox.button.yes") : __("app.session.exit.askBox.button.no") })}`}</a></p>
                        </div>
                    </div>
                    : <></>
                }
                {/* {

                    this.props.customizationProfileId ?
                    <div style={{fontSize: "6px"}}>
                        <span>Filename: {customizationProfileProvisionedAndActivated.fileName}</span><br/>
                        <span>Identifier: {customizationProfileProvisionedAndActivated.id}</span><br/>
                        <span>Version: {customizationProfileProvisionedAndActivated.version}</span>
                    </div>
                    : <></>

                } */}
                <div className={stylesFooter.footer_about}>
                    <div>
                    <p>{`v${_APP_VERSION}`}</p>
                    <a href="" onClick={(ev) => {
                            ev.preventDefault(); // necessary because href="", CSS must also ensure hyperlink visited style

                            // getOsName().then((v) => v).catch(() => navigator.platform || "unknown").then((_osName) => {
                            //     const os = encodeURIComponent_RFC3986(osName);
                            //     const href = `https://www.thoriumreader.com/?lang=${locale}&v=${app_version}&source=${source}&os=${os}`;
                            //     if (href && /^https?:\/\//.test(href)) { /* ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc. */
                            //         shell.openExternal(href).then(() => { /* noop */ }).catch((err: unknown) => { console.log(err); }); // .finally(() => { /* noop */ });
                            //     }
                            // }).catch((err: unknown) => { console.log(err); });

                            const href = "https://www.thoriumreader.com/";
                            // if (href && /^https?:\/\//.test(href)) { /* ignores file: mailto: data: thoriumhttps: httpsr2: thorium: opds: etc. */
                            shell.openExternal(href).then(() => { /* noop */ }).catch((err: unknown) => { console.log(err); }); // .finally(() => { /* noop */ });
                            // }
                        }}
                        tabIndex={0}>{__("catalog.about.title", { appName: capitalizedAppName })}</a>
                    </div>
                    <SVG ariaHidden svg={EdrlabLogo} />
                </div>
            </section>
        );
    }

    // private about = async () => {
    //     const { locale } = this.props;
    //     const infoFolderRelativePath = "assets/md/information/"; // final / is important
    //     const imagesFolder = "images";

    //     let aboutLocale = locale.toLowerCase();

    //     const setTitle = (l: string) => `${ABOUT_BOOK_TITLE_PREFIX}${_APP_VERSION}${l}`;
    //     try {

    //         let title = setTitle(aboutLocale);

    //         let [pubView] = await apiAction("publication/searchEqTitle", title);
    //         if (pubView) {
    //             console.log("pubView already exist no need to generate a new one");
    //             console.log(pubView);

    //             this.manifestView = pubView;

    //             return; // see finally {} below
    //         }
    //         console.log("pubView not found, need to generate a new one: ", title);

    //         let folderPath = path.join(window.location.pathname.replace(/^\/\//, "/"), "..", infoFolderRelativePath);
    //         let folderPath = path.join((global as any).__dirname, infoFolderRelativePath);
    //         if (!__TH__IS_PACKAGED__) {
    //             folderPath = path.join(process.cwd(), "dist", infoFolderRelativePath);
    //         }

    //         let htmlFile = `${aboutLocale}.xhtml`;
    //         {
    //             const filePath = path.join(folderPath, `${aboutLocale}.xhtml`);

    //             if (!existsSync(filePath)) {
    //                 console.log("about XHTML does not exist (english fallback) ", filePath);
    //                 aboutLocale = "en";
    //             }
    //             htmlFile = `${aboutLocale}.xhtml`;
    //             title = setTitle(aboutLocale);
    //         }

    //         [pubView] = await apiAction("publication/searchEqTitle", title);
    //         if (pubView) {
    //             console.log("pubView already exist no need to generate a new one");
    //             console.log(pubView);

    //             this.manifestView = pubView;

    //             return; // see finally {} below
    //         }
    //         console.log("pubView again not found, need to generate a new one: ", title);

    //         const publication = new R2Publication();
    //         publication.Context = ["https://readium.org/webpub-manifest/context.jsonld"];
    //         publication.Metadata = new Metadata();
    //         publication.Metadata.Title = title;

    //         const link = new Link();
    //         link.Href = htmlFile;
    //         link.TypeLink = mimeTypes.xhtml;
    //         link.Title = aboutLocale;
    //         publication.Spine = [link];

    //         const imgPath = path.join(folderPath, imagesFolder);
    //         const imgArray = await fs.promises.readdir(imgPath);
    //         publication.Resources = imgArray.map((i) => {
    //             const l = new Link();
    //             l.Href = `${imagesFolder}/${i}`; // path.join() backslash on Windows
    //             l.TypeLink = findMimeTypeWithExtension(path.extname(l.Href));

    //             return l;
    //         });

    //         const publicationSerialize = TaJsonSerialize(publication);
    //         const publicationStr = JSON.stringify(publicationSerialize);

    //         this.manifestView = await apiAction("publication/importFromString",
    //             publicationStr,
    //             "file://" + folderPath.replace(/\\/g, "/"));

    //     } catch (e) {
    //         console.log("error to import about", aboutLocale, e);

    //     } finally {
    //         if (this.manifestView) {
    //             this.props.openReader(this.manifestView);
    //         }
    //     }
    // };
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {

    return {
        // here
        locale: state.i18n.locale, // refresh
        newVersionURL: state.versionUpdate.newVersionURL,
        newVersion: state.versionUpdate.newVersion,

        customizationProvision: state.customization.provision,
        customizationProfileId: state.customization.activate.id,

        screenReaderActivate: state.screenReader.activate,

        keyboardShortcuts: state.keyboard.shortcuts,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        // openReader: (publicationView: PublicationView) => {
        //     dispatch(readerActions.openRequest.build(publicationView.identifier));
        // },
        toggleScreenReader: (screenReaderActivate: boolean, keyboard: string, __: I18nFunction) => {
            dispatch(screenReaderActions.save.build(!screenReaderActivate));
            dispatch(toastActions.openRequest.build(ToastType.Success, __("settings.screenReaderActivate.invite", { keyboard, status: !screenReaderActivate ? __("app.session.exit.askBox.button.yes") : __("app.session.exit.askBox.button.no") })));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(AboutThoriumButton));
