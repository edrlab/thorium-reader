// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { existsSync, promises } from "fs";
import * as path from "path";
import * as React from "react";
import { connect } from "react-redux";
import { ABOUT_BOOK_TITLE_PREFIX } from "readium-desktop/common/constant";
import { readerActions } from "readium-desktop/common/redux/actions";
import { PublicationView } from "readium-desktop/common/views/publication";
import { _APP_NAME, _APP_VERSION, _PACKAGING } from "readium-desktop/preprocessor-directives";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
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
import { ILibraryRootState } from "../../redux/states";

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

class AboutThoriumButton extends React.Component<IProps, undefined> {

    private manifestView: PublicationView;

    constructor(props: IProps) {
        super(props);
    }

    public render() {
        const { __ } = this.props;
        return (
            <section>
                <div className={stylesGlobal.heading}>
                    <h2>{__("catalog.about.title", { appName: capitalizedAppName })}</h2>
                    <button
                        onClick={this.about}
                        className={stylesButtons.button_primary_small}
                    >
                        {__("catalog.about.button")}
                    </button>
                </div>
                <p>{`v${_APP_VERSION}`}</p>
            </section>
        );
    }

    private about = async () => {
        const { locale } = this.props;
        const infoFolderRelativePath = "assets/md/information/"; // final / is important
        const imagesFolder = "images";

        let aboutLocale = locale;

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
        locale: state.i18n.locale,
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
