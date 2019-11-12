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
import { OpdsPublicationView } from "readium-desktop/common/views/opds";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";
import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { TDispatch } from "readium-desktop/typings/redux";
import * as uuid from "uuid";

import { TranslatorProps, withTranslator } from "../utils/hoc/translator";
import AccessibleMenu from "../utils/menu/AccessibleMenu";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationViewMaybeOpds: PublicationView | OpdsPublicationView;
    menuContent: JSX.Element;
    isOpds?: boolean;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapDispatchToProps>, ReturnType<typeof mapDispatchToProps> {
}

interface IState {
    menuOpen: boolean;
}

export class PublicationListElement extends React.Component<IProps, IState> {
    private menuId: string;
    private buttonRef: any;

    constructor(props: IProps) {
        super(props);

        this.state = {
            menuOpen: false,
        };

        // this.deletePublication = this.deletePublication.bind(this);
        this.toggleMenu = this.toggleMenu.bind(this);
        this.focusButton = this.focusButton.bind(this);

        this.menuId = "menu-" + uuid.v4();
    }

    public render(): React.ReactElement<{}>  {
        const pub = this.props.publicationViewMaybeOpds;
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
                        title={pub.title}
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
            dispatch(dialogActions.openRequest.build("publication-info",
                {
                    opdsPublicationView: props.publicationViewMaybeOpds as OpdsPublicationView,
                    publicationIdentifier: undefined,
                },
            ));
        },
        // !isOpds
        openReader: () => {
            dispatch(readerActions.openRequest.build((props.publicationViewMaybeOpds as PublicationView).identifier));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(withTranslator(PublicationListElement));
