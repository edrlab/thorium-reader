// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesFooter from "readium-desktop/renderer/assets/styles/components/aboutFooter.scss";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.scss";

import { shell } from "electron";
import { existsSync, promises } from "fs";
import * as path from "path";
import * as React from "react";
import { connect } from "react-redux";
import { ABOUT_BOOK_TITLE_PREFIX } from "readium-desktop/common/constant";
import { readerActions } from "readium-desktop/common/redux/actions";
import { PublicationView } from "readium-desktop/common/views/publication";
import { _APP_NAME, _APP_VERSION, _PACKAGING } from "readium-desktop/preprocessor-directives";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { TDispatch } from "readium-desktop/typings/redux";
import { findMimeTypeWithExtension, mimeTypes } from "readium-desktop/utils/mimeTypes";

import { TaJsonSerialize } from "@r2-lcp-js/serializable";
import { Metadata } from "@r2-shared-js/models/metadata";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";
import { Link } from "@r2-shared-js/models/publication-link";

import { apiAction } from "../../apiAction";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import * as EdrlabLogo from "readium-desktop/renderer/assets/icons/logo_edrlab.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";

const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

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
}

class AboutThoriumButton extends React.Component<IProps, IState> {

    private manifestView: PublicationView;

    constructor(props: IProps) {
        super(props);


        this.state = {
            versionInfo: true,
        };
    }

    public render() {
        const { __ } = this.props;
        const displayVersionToast = !!(this.state.versionInfo && this.props.newVersionURL && this.props.newVersion);

        return (
            <section className={stylesFooter.footer_wrapper} style={{justifyContent: displayVersionToast ? "space-between" : "end"}}>
                                {
                    displayVersionToast ?
                    <div className={stylesGlobal.new_version}
                    aria-live="polite"
                    role="alert">
                        <div>
                            <SVG ariaHidden svg={InfoIcon} />
                            <p
                            ><a href=""
                            onClick={async (ev) => {
                                ev.preventDefault(); // necessary because href="", CSS must also ensure hyperlink visited style
                                this.setState({ versionInfo : false });
                                await shell.openExternal(this.props.newVersionURL);
                            }}>{`${this.props.__("app.update.message")}`}</a> <span>(v{this.props.newVersion})</span></p>
                        </div>
                        {/* <button onClick={async () => {
                            this.setState({ versionInfo : false });
                            await shell.openExternal(this.props.newVersionURL);
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
                <div className={stylesFooter.footer_about}>
                    <div>
                    <p>{`v${_APP_VERSION}`}</p>
                    <a href="" onClick={(ev) => {
                                ev.preventDefault(); // necessary because href="", CSS must also ensure hyperlink visited style
                                this.about();
                            }}
                        tabIndex={0}>{__("catalog.about.title", { appName: capitalizedAppName })}</a>
                    </div>
                    <SVG ariaHidden svg={EdrlabLogo} />
                </div>
            </section>
        );
    }

    private about = async () => {
        const { locale } = this.props;
        const infoFolderRelativePath = "assets/md/information/"; // final / is important
        const imagesFolder = "images";

        let aboutLocale = locale.toLowerCase();

        const setTitle = (l: string) => `${ABOUT_BOOK_TITLE_PREFIX}${_APP_VERSION}${l}`;
        try {

            let title = setTitle(aboutLocale);

            let [pubView] = await apiAction("publication/searchEqTitle", title);
            if (pubView) {
                console.log("pubView already exist no need to generate a new one");
                console.log(pubView);

                this.manifestView = pubView;

                return; // see finally {} below
            }
            console.log("pubView not found, need to generate a new one: ", title);

            let folderPath = path.join((global as any).__dirname, infoFolderRelativePath);
            if (_PACKAGING === "0") {
                folderPath = path.join(process.cwd(), "dist", infoFolderRelativePath);
            }

            let htmlFile = `${aboutLocale}.xhtml`;
            {
                const filePath = path.join(folderPath, `${aboutLocale}.xhtml`);

                if (!existsSync(filePath)) {
                    console.log("about XHTML does not exist (english fallback) ", filePath);
                    aboutLocale = "en";
                }
                htmlFile = `${aboutLocale}.xhtml`;
                title = setTitle(aboutLocale);
            }

            [pubView] = await apiAction("publication/searchEqTitle", title);
            if (pubView) {
                console.log("pubView already exist no need to generate a new one");
                console.log(pubView);

                this.manifestView = pubView;

                return; // see finally {} below
            }
            console.log("pubView again not found, need to generate a new one: ", title);

            const publication = new R2Publication();
            publication.Context = ["https://readium.org/webpub-manifest/context.jsonld"];
            publication.Metadata = new Metadata();
            publication.Metadata.Title = title;

            const link = new Link();
            link.Href = htmlFile;
            link.TypeLink = mimeTypes.xhtml;
            link.Title = aboutLocale;
            publication.Spine = [link];

            const imgPath = path.join(folderPath, imagesFolder);
            const imgArray = await promises.readdir(imgPath);
            publication.Resources = imgArray.map((i) => {
                const l = new Link();
                l.Href = `${imagesFolder}/${i}`; // path.join() backslash on Windows
                l.TypeLink = findMimeTypeWithExtension(path.extname(l.Href));

                return l;
            });

            const publicationSerialize = TaJsonSerialize(publication);
            const publicationStr = JSON.stringify(publicationSerialize);

            this.manifestView = await apiAction("publication/importFromString",
                publicationStr,
                "file://" + folderPath.replace(/\\/g, "/"));

        } catch (e) {
            console.log("error to import about", aboutLocale, e);

        } finally {
            if (this.manifestView) {
                this.props.openReader(this.manifestView);
            }
        }
    };
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {

    return {
        // here
        locale: state.i18n.locale, // refresh
        newVersionURL: state.versionUpdate.newVersionURL,
        newVersion: state.versionUpdate.newVersion,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        openReader: (publicationView: PublicationView) => {
            dispatch(readerActions.openRequest.build(publicationView.identifier));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(AboutThoriumButton));
