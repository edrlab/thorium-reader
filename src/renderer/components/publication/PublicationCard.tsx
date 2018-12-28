// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { DialogType } from "readium-desktop/common/models/dialog";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import Cover from "readium-desktop/renderer/components/publication/Cover";

import { PublicationView } from "readium-desktop/common/views/publication";

import { readerActions } from "readium-desktop/common/redux/actions";

import Menu from "readium-desktop/renderer/components/utils/menu/Menu";
import SVG from "readium-desktop/renderer/components/utils/SVG";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";

import * as styles from "readium-desktop/renderer/assets/styles/publication.css";

interface PublicationCardProps {
    publication: PublicationView;
    displayPublicationInfo?: any;
    deletePublication?: any;
    openReader?: any;
    openDeleteDialog?: any;
    menuContent: any;
    isOpds: boolean;
    openInfosDialog: any;
}

interface PublicationCardState {
    menuOpen: boolean;
}

export class PublicationCard extends React.Component<PublicationCardProps, PublicationCardState> {
    constructor(props: any) {
        super(props);

        this.state = {
            menuOpen: false,
        };

        this.handleMenuClick = this.handleMenuClick.bind(this);
        this.handleOnBlurMenu = this.handleOnBlurMenu.bind(this);
        this.deletePublication = this.deletePublication.bind(this);
        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);
    }

    public render(): React.ReactElement<{}>  {
        const authors = this.props.publication.authors.join(", ");

        return (
            <div className={styles.block_book}
                aria-haspopup="dialog"
                aria-controls="dialog"
            >
                <div className={styles.image_wrapper}>
                    <a onClick={(e) => this.handleBookClick(e)}>
                        <Cover publication={ this.props.publication } />
                    </a>
                </div>
                <div className={styles.legend}>
                    <a onClick={(e) => this.handleBookClick(e)}>
                        <p className={styles.book_title} aria-label="Titre du livre">
                            { this.props.publication.title }
                        </p>
                        <p className={styles.book_author} aria-label="Auteur du livre">
                            {authors}
                        </p>
                    </a>
                    <Menu
                        button={(
                            <SVG svg={MenuIcon}/>
                        )}
                        content={(
                            <div className={styles.menu}>
                                {this.props.menuContent}
                            </div>
                        )}
                        open={false}
                        dir="right"
                    />
                </div>
            </div>
        );
    }

    private deletePublication(e: any) {
        e.preventDefault();
        this.props.openDeleteDialog(this.props.publication);
    }

    private handleOnBlurMenu(e: any) {
        if (!e.relatedTarget || (e.relatedTarget && e.relatedTarget.parentElement !== e.target.parentElement)) {
            this.setState({ menuOpen: false});
        }
    }

    private handleMenuClick() {
        this.setState({menuOpen: !this.state.menuOpen});
    }

    private handleBookClick(e: any) {
        e.preventDefault();
        if (!this.props.isOpds) {
            this.props.openReader(this.props.publication);
        } else {
            this.props.openInfosDialog(this.props.publication);
        }
    }

    private displayPublicationInfo(e: any) {
        e.preventDefault();
        this.props.displayPublicationInfo(this.props.publication);
    }
}

const mapDispatchToProps = (dispatch: any, __1: PublicationCardProps) => {
    return {
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
        displayPublicationInfo: (publication: PublicationView) => {
            dispatch(dialogActions.open(
                DialogType.PublicationInfo,
                {
                    publication,
                },
            ));
        },
        openDeleteDialog: (publication: string) => {
            dispatch(dialogActions.open(
                DialogType.DeletePublicationConfirm,
                {
                    publication,
                },
            ));
        },
        openInfosDialog: (publication: string) => {
            dispatch(dialogActions.open(
                DialogType.PublicationInfo,
                {
                    publication,
                },
            ));
        },
    };
};

export default withApi(
    PublicationCard,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "delete",
                callProp: "deletePublication",
            },
        ],
        mapDispatchToProps,
    },
);
