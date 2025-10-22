// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesPublications from "readium-desktop/renderer/assets/styles/components/publications.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";

import Cover from "readium-desktop/renderer/common/components/Cover";
import Menu from "readium-desktop/renderer/common/components/menu/Menu";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    formatContributorToString,
} from "readium-desktop/renderer/common/logics/formatContributor";
import { TDispatch } from "readium-desktop/typings/redux";

import CatalogMenu from "./menu/CatalogMenu";
import OpdsMenu from "./menu/OpdsMenu";

import { convertMultiLangStringToLangString, langStringIsRTL } from "readium-desktop/common/language-string";
import { PublicationInfoOpdsWithRadix, PublicationInfoOpdsWithRadixContent, PublicationInfoOpdsWithRadixTrigger } from "../dialog/publicationInfos/PublicationInfo";
import * as CalendarIcon from "readium-desktop/renderer/assets/icons/calendar2-icon.svg";
// import * as CalendarExpiredIcon from "readium-desktop/renderer/assets/icons/calendarExpired-icon.svg";
import * as DoubleCheckIcon from "readium-desktop/renderer/assets/icons/doubleCheck-icon.svg";
import * as KeyIcon from "readium-desktop/renderer/assets/icons/key-icon.svg";
import classNames from "classnames";
import * as moment from "moment";
import { formatTime } from "readium-desktop/common/utils/time";
import { IRendererCommonRootState } from "readium-desktop/common/redux/states/rendererCommonRootState";
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/common/components/hoc/translator";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationViewMaybeOpds: PublicationView | IOpdsPublicationView;
    isOpds?: boolean;
    isReading?: boolean;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapStateToProps> {
}

class PublicationCard extends React.Component<IProps> {

    constructor(props: IProps) {
        super(props);

        this.truncateAuthors = this.truncateAuthors.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __, locale, publicationViewMaybeOpds, isOpds } = this.props;

        const authors = formatContributorToString(publicationViewMaybeOpds.authorsLangString, locale);

        const pubTitleLangStr = convertMultiLangStringToLangString((publicationViewMaybeOpds as PublicationView).publicationTitle || publicationViewMaybeOpds.documentTitle, locale);
        const pubTitleLang = pubTitleLangStr && pubTitleLangStr[0] ? pubTitleLangStr[0].toLowerCase() : "";
        const pubTitleIsRTL = langStringIsRTL(pubTitleLang);
        const pubTitleStr = pubTitleLangStr && pubTitleLangStr[1] ? pubTitleLangStr[1] : "";

        const publicationView = publicationViewMaybeOpds as PublicationView;

        let pubFormat = "EPUB";
        if (publicationView.isAudio) {
            pubFormat = "Audio";
        } else if (publicationView.isDivina) {
            pubFormat = "Divina";
        } else if (publicationView.isPDF) {
            pubFormat = "PDF";
        } else if (publicationView.isDaisy) {
            pubFormat = "DAISY";
        } else if (publicationView.isFixedLayoutPublication) {
            pubFormat = "EPUB (FXL)";
        }

        const lcpRightsEndDate = (publicationView.lcp?.rights?.end) ? publicationView.lcp.rights.end : undefined;
        let remainingDays= "";
        const now = moment().locale([this.props.locale, "en"]);
        let hasEnded = false;
        const isLcp = publicationView.lcp?.rights ? true : false;

        if (lcpRightsEndDate) {
            const momentEnd = moment(lcpRightsEndDate).locale([this.props.locale, "en"]);
            const timeEndDif = momentEnd.diff(now, "days");
            if (timeEndDif > 1) {
                remainingDays = `${timeEndDif} ${__("publication.days")}`;
            } else if (timeEndDif === 1) {
                remainingDays = `${timeEndDif} ${__("publication.day")}`;
            } else {
                // const nowUTC = (new Date()).toISOString();
                // const momentNow = moment(nowUTC).locale([this.props.locale, "en"]);
                if (now.isAfter(momentEnd)) {
                    remainingDays = `${__("publication.expired")}`;
                    hasEnded = true;
                } else {
                    // remainingDays = `${__("publication.licensed")}`;
                    remainingDays = `${formatTime(momentEnd.diff(now, "seconds"))}`;
                }
            }
        }

        // let tagString = "";
        // if (publicationViewMaybeOpds.tags) {
        //     for (const tag of publicationViewMaybeOpds.tags) {
        //         if (typeof tag === "string") {
        //             tagString = tag;
        //         } else {
        //             tagString = tag.name;
        //         }
        //     };
        // }

        // console.log(publicationView.documentTitle, publicationView.readingFinished)

        // aria-haspopup="dialog"
        // aria-controls="dialog"
        return (
            <div className={stylesPublications.publication_wrapper}>
                {
                    isOpds ?
                        <PublicationInfoOpdsWithRadix
                            opdsPublicationView={publicationViewMaybeOpds as IOpdsPublicationView}
                        >
                            <PublicationInfoOpdsWithRadixTrigger asChild>
                                <button
                                    className={classNames(stylesPublications.publication_main_container, hasEnded ? stylesPublications.expired : "")}
                                    title={`${publicationViewMaybeOpds.documentTitle} - ${authors}`}
                                    tabIndex={0}
                                >
                                    <Cover publicationViewMaybeOpds={publicationViewMaybeOpds} hasEnded={hasEnded} />
                                    <div className={stylesPublications.publication_title_wrapper}>
                                        <p aria-hidden className={stylesPublications.publication_title}
                                            dir={pubTitleIsRTL ? "rtl" : undefined}>
                                            {pubTitleStr}
                                        </p>
                                        <p aria-hidden className={stylesPublications.publication_authors}>
                                            {this.truncateAuthors(authors)}
                                        </p>
                                    </div>
                                </button>
                            </PublicationInfoOpdsWithRadixTrigger>
                            <PublicationInfoOpdsWithRadixContent />
                        </PublicationInfoOpdsWithRadix>
                        :
                        <a
                            onClick={(e) => this.handleLocalBookshelfBookClick(e)}
                            onKeyUp={
                                (e) =>
                                    (e.key === "Enter") && this.handleLocalBookshelfBookClick(e)
                            }
                            title={`${publicationViewMaybeOpds.documentTitle} - ${authors}`}
                            className={classNames(stylesPublications.publication_main_container, hasEnded ? stylesPublications.expired : "")}
                            tabIndex={0}
                        >
                            <Cover publicationViewMaybeOpds={publicationViewMaybeOpds} hasEnded={hasEnded} />
                            <div className={stylesPublications.publication_title_wrapper}>
                                <p aria-hidden className={stylesPublications.publication_title}
                                    dir={pubTitleIsRTL ? "rtl" : undefined}>
                                    {pubTitleStr}
                                </p>
                                <p aria-hidden className={stylesPublications.publication_authors}>
                                    {this.truncateAuthors(authors)}
                                </p>
                            </div>
                        </a>
                }
                <div className={stylesPublications.publication_infos_wrapper}>
                    <div className={stylesPublications.publication_infos}>
                        {isOpds ? <></>
                            : <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                {/* (tagString === "/finished/") || */ publicationView.readingFinished ?
                                    <div className={stylesPublications.lcpIndicator}><SVG ariaHidden svg={DoubleCheckIcon} />{__("publication.read")}</div>
                                    : <></>}
                                {
                                    remainingDays ?
                                        <div className={stylesPublications.lcpIndicator} title={`${remainingDays} (${__("publication.timeLeft")})`}>
                                            <SVG ariaHidden svg={hasEnded ? KeyIcon : CalendarIcon} />
                                            {remainingDays}
                                        </div>
                                        : (isLcp && !remainingDays) ?
                                            <div className={stylesPublications.lcpIndicator}>
                                                <SVG ariaHidden svg={KeyIcon} />
                                                {__("publication.licensed")}
                                            </div>
                                            : <></>
                                }
                            </div>}
                        <div style={{ display: "flex", alignItems: "end", height: "50px", width: "100%", justifyContent: isOpds ? "flex-end" : "space-between" }}>
                            {isOpds ? <></>
                                : <span className={stylesButtons.button_secondary_blue}>{pubFormat}</span>}
                                {isOpds ? <></>
                            :
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
                            </Menu>}
                        </div>
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

const mapStateToProps = (state: IRendererCommonRootState) => ({
    locale: state.i18n.locale, // refresh
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(PublicationCard));
