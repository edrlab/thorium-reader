// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { DialogTypeName } from "readium-desktop/common/models/dialog";
import { readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { TPublication } from "readium-desktop/common/type/publication.type";
import { IOpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesPublications from "readium-desktop/renderer/assets/styles/components/publications.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import Menu from "readium-desktop/renderer/common/components/menu/Menu";
// import AccessibleMenu from "readium-desktop/renderer/common/components/menu/AccessibleMenu";
import SVG from "readium-desktop/renderer/common/components/SVG";
import {
    formatContributorToString,
} from "readium-desktop/renderer/common/logics/formatContributor";
import { TDispatch } from "readium-desktop/typings/redux";
import { convertMultiLangStringToString, langStringIsRTL } from "readium-desktop/renderer/common/language-string";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationViewMaybeOpds: TPublication;
    menuContent: JSX.Element;
    isOpds?: boolean;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapDispatchToProps> {
}

export class PublicationListElement extends React.Component<IProps> {
    private buttonRef: React.RefObject<HTMLButtonElement>;

    constructor(props: IProps) {
        super(props);

        this.buttonRef = React.createRef<HTMLButtonElement>();

        // this.deletePublication = this.deletePublication.bind(this);
        this.focusButton = this.focusButton.bind(this);
    }

    public render(): React.ReactElement<{}> {

        const pub = this.props.publicationViewMaybeOpds;

        const { translator } = this.props;

        let publisherComponent = <></>;
        // note that empty array is truthy (unlike empty string which is falsy)
        if (pub.publishers || pub.publishedAt) {
            let formatedPublishers = "";
            if (pub.publishers) {
                for (const publisher of pub.publishers) {
                    let name = "";
                    if (typeof publisher === "string") {
                        name = publisher;
                    } else if (typeof publisher === "object" && publisher.name) {
                        name = publisher.name;
                    }
                    formatedPublishers += formatedPublishers ? ", " + name : name;
                }
            }

            let formatedPublishedYear = "";
            if (pub.publishedAt) {
                formatedPublishedYear = "" + moment(pub.publishedAt).year();
            }

            publisherComponent = <div>
                <p>{formatedPublishedYear}</p>
                <p>{formatedPublishers}</p>
            </div>;
        }

        const authors = formatContributorToString(pub.authors, translator);

        const pubTitleLangStr = convertMultiLangStringToString(translator, (pub as PublicationView).publicationTitle || pub.documentTitle);
        const pubTitleLang = pubTitleLangStr && pubTitleLangStr[0] ? pubTitleLangStr[0].toLowerCase() : "";
        const pubTitleIsRTL = langStringIsRTL(pubTitleLang);
        const pubTitleStr = pubTitleLangStr && pubTitleLangStr[1] ? pubTitleLangStr[1] : "";

        return (
            <>
                <Menu
                    button={
                        (<SVG
                            title={`${this.props.__("accessibility.bookMenu")} (${pub.documentTitle})`}
                            className={stylesButtons.button_transparency_icon}
                            svg={MenuIcon}
                        />)
                    }
                >
                    {this.props.menuContent}
                </Menu>
                {/* <button
                    type="button"
                    aria-expanded={this.state.menuOpen}
                    aria-controls={this.menuId}
                    title={`${pub.title} - ${authors}`}
                    onClick={this.toggleMenu}
                    ref={this.buttonRef}
                    className={stylesButtons.button_transparency_icon}
                >
                    <SVG ariaHidden={true} svg={MenuIcon} />
                </button> */}
                <a
                    className={stylesPublications.publication_list_infos}
                    tabIndex={0}
                    onClick={(e) => this.handleBookClick(e)}
                    onKeyPress={
                        (e) =>
                            e.key === "Enter" && this.handleBookClick(e)
                    }
                >
                    <div className={stylesPublications.publication_list_title_authors}>
                        <div
                        dir={pubTitleIsRTL ? "rtl" : undefined}>
                        <strong>{pubTitleStr}</strong></div>
                        <p>{authors}</p>
                    </div>
                    {
                        publisherComponent
                    }
                </a>
                {/* {this.state.menuOpen &&
                    <AccessibleMenu
                        toggleMenu={this.toggleMenu}
                        focusMenuButton={this.focusButton}
                        visible={this.state.menuOpen}
                    >
                        <div
                            id={this.menuId}
                            className={(this.state.menuOpen ? styles.menu_open + " " : "") + styles.list_menu}
                        >
                            {this.props.menuContent}
                        </div>
                    </AccessibleMenu>
                } */}
            </>
        );
    }

    private focusButton() {
        if (this.buttonRef?.current) {
            this.buttonRef.current.focus();
        }
    }

    private handleBookClick(e: React.SyntheticEvent) {
        e.preventDefault();

        if (this.props.isOpds) {
            this.props.displayPublicationInfo();
        } else {
            this.props.openReader();
        }
    }
}

const mapDispatchToProps = (dispatch: TDispatch, props: IBaseProps) => {
    return {
        // isOpds
        displayPublicationInfo: () => {
            dispatch(dialogActions.openRequest.build(DialogTypeName.PublicationInfoOpds,
                {
                    publication: props.publicationViewMaybeOpds as IOpdsPublicationView,
                },
            ));
        },
        // !isOpds
        openReader: () => {
            const publication = props.publicationViewMaybeOpds as PublicationView;
            dispatch(readerActions.openRequest.build(publication.identifier));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(PublicationListElement));
