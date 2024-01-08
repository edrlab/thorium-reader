// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as stylesPublications from "readium-desktop/renderer/assets/styles/components/publications.css";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";

import Cover from "readium-desktop/renderer/common/components/Cover";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import Menu from "readium-desktop/renderer/common/components/menu/Menu";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    formatContributorToString,
} from "readium-desktop/renderer/common/logics/formatContributor";
import { TDispatch } from "readium-desktop/typings/redux";

import CatalogMenu from "./menu/CatalogMenu";
import OpdsMenu from "./menu/OpdsMenu";

import { convertMultiLangStringToString, langStringIsRTL } from "readium-desktop/renderer/common/language-string";
import { PublicationInfoOpdsWithRadix, PublicationInfoOpdsWithRadixContent, PublicationInfoOpdsWithRadixTrigger } from "../dialog/publicationInfos/PublicationInfo";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationViewMaybeOpds: PublicationView | IOpdsPublicationView;
    isOpds?: boolean;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps> {
}

class PublicationCard extends React.Component<IProps> {

    constructor(props: IProps) {
        super(props);

        this.truncateAuthors = this.truncateAuthors.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __, publicationViewMaybeOpds, translator, isOpds } = this.props;

        const authors = formatContributorToString(publicationViewMaybeOpds.authors, translator);

        const pubTitleLangStr = convertMultiLangStringToString(translator, (publicationViewMaybeOpds as PublicationView).publicationTitle || publicationViewMaybeOpds.documentTitle);
        const pubTitleLang = pubTitleLangStr && pubTitleLangStr[0] ? pubTitleLangStr[0].toLowerCase() : "";
        const pubTitleIsRTL = langStringIsRTL(pubTitleLang);
        const pubTitleStr = pubTitleLangStr && pubTitleLangStr[1] ? pubTitleLangStr[1] : "";

        let pubFormat;
        const pub = (publicationViewMaybeOpds as PublicationView);

        if (pub.isAudio) {
            pubFormat = "AUDIO";
        } else if (pub.isDivina) {
            pubFormat = "DIVINA";
        } else if (pub.isPDF) {
            pubFormat = "PDF";
        } else if (pub.isDaisy) {
            pubFormat = "DAISY";
        } else if (pub.isFXL) {
            pubFormat = "EPUB";
        } else {
            pubFormat = "EPUB";
        }

        // aria-haspopup="dialog"
        // aria-controls="dialog"
        return (
            <div className={stylesPublications.publication_wrapper}>

                {
                    this.props.isOpds ?
                        <PublicationInfoOpdsWithRadix
                            opdsPublicationView={publicationViewMaybeOpds as IOpdsPublicationView}
                        >
                            <PublicationInfoOpdsWithRadixTrigger asChild>
                                <a
                                    title={`${publicationViewMaybeOpds.documentTitle} - ${authors}`}
                                    className={stylesPublications.publication_image_wrapper}
                                    tabIndex={0}
                                >
                                    <Cover publicationViewMaybeOpds={publicationViewMaybeOpds} />
                                </a>
                            </PublicationInfoOpdsWithRadixTrigger>
                            <PublicationInfoOpdsWithRadixContent />
                        </PublicationInfoOpdsWithRadix>
                        :
                        <a
                            onClick={(e) => this.handleLocalBookshelfBookClick(e)}
                            onKeyPress={
                                (e) =>
                                    (e.key === "Enter") && this.handleLocalBookshelfBookClick(e)
                            }
                            title={`${publicationViewMaybeOpds.documentTitle} - ${authors}`}
                            className={stylesPublications.publication_image_wrapper}
                            tabIndex={0}
                        >
                            <Cover publicationViewMaybeOpds={publicationViewMaybeOpds} />
                        </a>
                }

                <div className={stylesPublications.publication_infos_wrapper}>
                    {
                        this.props.isOpds ?
                            <PublicationInfoOpdsWithRadix
                                opdsPublicationView={publicationViewMaybeOpds as IOpdsPublicationView}
                            >
                                <PublicationInfoOpdsWithRadixTrigger asChild>
                                    <a aria-hidden style={{cursor: "pointer"}}
                                        className={stylesPublications.publication_title_wrapper}
                                    >
                                        <p aria-hidden className={stylesPublications.publication_title}
                                            dir={pubTitleIsRTL ? "rtl" : undefined}>
                                            {pubTitleStr}
                                        </p>
                                        <p aria-hidden className={stylesPublications.publication_authors}>
                                            {this.truncateAuthors(authors)}
                                        </p>
                                    </a>
                                </PublicationInfoOpdsWithRadixTrigger>
                                <PublicationInfoOpdsWithRadixContent />
                            </PublicationInfoOpdsWithRadix>
                            :
                            <a aria-hidden onClick={(e) => this.handleLocalBookshelfBookClick(e)} style={{cursor: "pointer"}}
                                className={stylesPublications.publication_title_wrapper}
                            >
                                <p aria-hidden className={stylesPublications.publication_title}
                                    dir={pubTitleIsRTL ? "rtl" : undefined}>
                                    {pubTitleStr}
                                </p>
                                <p aria-hidden className={stylesPublications.publication_authors}>
                                    {this.truncateAuthors(authors)}
                                </p>
                            </a>
                    }
                    <div className={stylesPublications.publication_infos}>
                    <span className={stylesButtons.button_secondary_blue}>{pubFormat}</span>
                    <Menu
                        button={(
                            <SVG title={`${__("accessibility.bookMenu")} (${publicationViewMaybeOpds.documentTitle})`} svg={MenuIcon} />
                        )}
                    >
                        {isOpds ?
                            <OpdsMenu
                                opdsPublicationView={publicationViewMaybeOpds as IOpdsPublicationView}
                            /> :
                            <CatalogMenu
                                publicationView={publicationViewMaybeOpds as PublicationView}
                            />}
                    </Menu>
                    </div>
                </div>
            </div>
        );
    }

    private handleLocalBookshelfBookClick(e: React.SyntheticEvent) {
        e.preventDefault();
        const { publicationViewMaybeOpds } = this.props;
        this.props.openReader(publicationViewMaybeOpds as PublicationView);
    }

    /* function Truncate very long titles at 60 characters */
    // private truncateTitle(title: string): string {
    //     let newTitle = title;
    //     const truncate = 60;

    //     if (newTitle && newTitle.length > truncate) {
    //         newTitle = title.substr(0, truncate);
    //         newTitle += "...";
    //     }
    //     return (newTitle);
    // }

    /* function Truncate very long authors at 60 characters */
    private truncateAuthors(authors: string): string {
        let newAuthors = authors;
        const truncate = 28;

        if (newAuthors && newAuthors.length > truncate) {
            newAuthors = authors.substr(0, truncate);
            newAuthors += "...";
        }
        return (newAuthors);
    }
}

const mapDispatchToProps = (dispatch: TDispatch, _props: IBaseProps) => {
    return {
        // !isOpds
        openReader: (publicationView: PublicationView) => {
            dispatch(readerActions.openRequest.build(publicationView.identifier));
        },
        // isOpds
        openInfosDialog: (opdsPublicationView: IOpdsPublicationView) => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoOpds,
                {
                    publication: opdsPublicationView,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(PublicationCard));
