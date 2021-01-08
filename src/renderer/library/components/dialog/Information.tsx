// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { existsSync, promises } from "fs";
import * as path from "path";
import { TaJsonSerialize } from "r2-lcp-js/dist/es6-es2015/src/serializable";
import { Link } from "r2-shared-js/dist/es6-es2015/src/models/publication-link";
import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { dialogActions, readerActions } from "readium-desktop/common/redux/actions";
import { PublicationView } from "readium-desktop/common/views/publication";
import { _PACKAGING } from "readium-desktop/preprocessor-directives";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { TDispatch } from "readium-desktop/typings/redux";
import { findMimeTypeWithExtension, mimeTypes } from "readium-desktop/utils/mimeTypes";

import { Metadata } from "@r2-shared-js/models/metadata";
import { Publication as R2Publication } from "@r2-shared-js/models/publication";

import { apiAction } from "../../apiAction";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

export class Information extends React.Component<IProps, undefined> {

    private manifestView: PublicationView;

    constructor(props: IProps) {
        super(props);
    }

    public async componentDidMount() {
        const { locale, __ } = this.props;
        const infoFolderRelativePath = "assets/md/information/"; // final / is important
        const imagesFolder = "images";

        let aboutLocale = locale;

        try {

            let title = `_______________ ${aboutLocale}`;
            let [pubView] = await apiAction("publication/search", title);
            if (pubView) {

                console.log("pubView already exist no need to generate a new one");
                console.log(pubView);

                this.manifestView = pubView;
                return;
            }

            let folderPath = path.join((global as any).__dirname, infoFolderRelativePath);
            if (_PACKAGING === "0") {
                folderPath = path.join(process.cwd(), "dist", infoFolderRelativePath);
            }
            const filePath = path.join(folderPath, `${aboutLocale}.html`);
            let htmlFile = `${aboutLocale}.html`;
            aboutLocale = existsSync(filePath) === true ? locale : "en";
            htmlFile = `${aboutLocale}.html`;
            title = `_______________ ${aboutLocale}`;

            [pubView] = await apiAction("publication/search", title);
            if (pubView) {

                console.log("pubView already exist no need to generate a new one");
                console.log(pubView);

                this.manifestView = pubView;
                return;
            }

            const publication = new R2Publication();
            publication.Context = ["https://readium.org/webpub-manifest/context.jsonld"];
            publication.Metadata = new Metadata();
            publication.Metadata.Title = `${__("reader.footerInfo.moreInfo")} ${aboutLocale}`;

            const link = new Link();
            link.Href = htmlFile;
            link.TypeLink = mimeTypes.xhtml;
            link.Title = aboutLocale;
            publication.Spine = [link];

            const imgPath = path.join(folderPath, imagesFolder);
            const imgArray = await promises.readdir(imgPath);
            publication.Resources = imgArray.map((i) => {
                const l = new Link();
                l.Href = path.join(imagesFolder, i);
                l.TypeLink = findMimeTypeWithExtension(path.extname(l.Href));

                return l;
            });

            const publicationSerialize = TaJsonSerialize(publication);
            const publicationStr = JSON.stringify(publicationSerialize);

            this.manifestView = await apiAction("publication/importFromString", publicationStr, "file://" + folderPath);

        } catch (e) {
            console.log("error to import about", aboutLocale, e);

        } finally {

            this.forceUpdate();
        }
    }

    public render(): React.ReactElement<{}> {
        if (this.props.open) {
            if (this.manifestView) {
                this.props.openReader(this.manifestView);
            }
        }

        // const html = { __html: this.parsedMarkdown };
        // return (
        //     <Dialog open={true} close={this.props.closeDialog}>
        //         <div dangerouslySetInnerHTML={html}></div>
        //     </Dialog>
        // );
        return <></>;
    }
}

const mapStateToProps = (state: ILibraryRootState, _props: IBaseProps) => {

    return {
        locale: state.i18n.locale,
        open: state.dialog.type === DialogTypeName.AboutThorium,
    };
};

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        // closeDialog: () => {
        //     dispatch(
        //         dialogActions.closeRequest.build(),
        //     );
        // },
        openReader: (publicationView: PublicationView) => {
            dispatch(readerActions.openRequest.build(publicationView.identifier));
            dispatch(dialogActions.closeRequest.build());
        },
        closeReader: () => {
            dispatch(dialogActions.closeRequest.build());
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Information));
