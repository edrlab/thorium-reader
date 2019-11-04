// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as moment from "moment";
import * as React from "react";
import { connect } from "react-redux";
import { readerActions } from "readium-desktop/common/redux/actions";
import * as dialogActions from "readium-desktop/common/redux/actions/dialog";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TDispatch } from "readium-desktop/typings/redux";
import * as uuid from "uuid";

import { TranslatorProps, withTranslator } from "../utils/hoc/translator";
import AccessibleMenu from "../utils/menu/AccessibleMenu";

// import { LsdStatus } from "readium-desktop/common/models/lcp";
// import { lcpReadable } from "readium-desktop/utils/publication";
// import { apiAction } from "readium-desktop/renderer/apiAction";

interface IProps extends TranslatorProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapDispatchToProps> {
    publication: PublicationView;
    menuContent: JSX.Element;
    isOpds?: boolean;
}

interface IState {
    menuOpen: boolean;
    // lsdStatus: LsdStatus | undefined;
}

export class PublicationListElement extends React.Component<IProps, IState> {
    private menuId: string;
    private buttonRef: any;

    constructor(props: IProps) {
        super(props);

        this.state = {
            menuOpen: false,
            // lsdStatus: undefined,
        };

        // this.deletePublication = this.deletePublication.bind(this);
        this.toggleMenu = this.toggleMenu.bind(this);
        this.focusButton = this.focusButton.bind(this);

        this.menuId = "menu-" + uuid.v4();
    }

    public componentDidMount() {
        // const { publication } = this.props;
        // if (publication.lcp) {
        //     apiAction("lcp/getLsdStatus", { publication })
        //         .then((request) => {
        //             if (request.isSuccess) {
        //                 this.setState({ lsdStatus: request.data });
        //             }
        //         })
        //         .catch((error) => console.error("Error lcp/getLsdStatus", error));
        // }
    }

    public render(): React.ReactElement<{}>  {
        const pub = this.props.publication;
        const formatedPublishers = pub.publishers.join(", ");
        let formatedPublishedYear = "";
        const { translator } = this.props;

        if (pub.publishedAt) {
            formatedPublishedYear = "" + moment(pub.publishedAt).year();
        }

        return (
            <>
                <div className={styles.publicationLine}>
                    <button
                        type="button"
                        aria-expanded={this.state.menuOpen}
                        aria-controls={this.menuId}
                        title={this.props.publication.title}
                        onClick={this.toggleMenu}
                        ref={(ref) => this.buttonRef = ref}
                    >
                        <SVG svg={MenuIcon}/>
                    </button>
                    <a
                        className={styles.publicationLineLink}
                        tabIndex={0}
                        onClick={(e) => this.handleBookClick(e)}
                        onKeyPress={(e) => {
                            if (e.key === "Enter") { this.handleBookClick(e); }}
                        }
                    >
                        <div className={styles.list_book_title}>
                            <p className={styles.book_title}>{ pub.title }</p>
                            <p className={`${styles.book_author} ${styles.lightgrey}`}>
                                {pub.authors.map((author) => translator.translateContentField(author)).join(", ")}
                            </p>
                        </div>
                        <p className={styles.infos_sup}>
                        { formatedPublishedYear}</p>
                        <p className={styles.infos_sup}>
                        { formatedPublishers }</p>
                    </a>
                </div>
                { this.state.menuOpen &&
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
                }
            </>
        );
    }

    private toggleMenu() {
        this.setState({menuOpen: !this.state.menuOpen});
    }

    private focusButton() {
        this.buttonRef.focus();
    }

    private handleBookClick(e: React.SyntheticEvent) {
        e.preventDefault();
        const { publication } = this.props;
        // const { lsdStatus } = this.state;

        if (this.props.isOpds
            // || !lcpReadable(publication, lsdStatus)
            ) {
            this.props.displayPublicationInfo(publication);
        } else {
            this.props.openReader(publication);
        }
    }
}

const mapDispatchToProps = (dispatch: TDispatch) => {
    return {
        displayPublicationInfo: (publication: PublicationView) => {
            dispatch(dialogActions.open("publication-info",
                {
                    opdsPublication: publication,
                    publicationIdentifier: undefined,
                },
            ));
        },
        openReader: (publication: PublicationView) => {
            dispatch({
                type: readerActions.ActionType.OpenRequest,
                payload: {
                    publication: {
                        identifier: publication.identifier,
                    },
                },
            });
        },
        openDeleteDialog: (publication: PublicationView) => {
            dispatch(dialogActions.open("delete-publication-confirm",
                {
                    publication,
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(PublicationListElement));
