// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { connect } from "react-redux";

import { Contributor } from "readium-desktop/common/models/contributor";

import { Publication } from "readium-desktop/common/models/publication";

import { Translator } from "readium-desktop/common/services/translator";

import { DialogType } from "readium-desktop/common/models/dialog";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import Cover from "readium-desktop/renderer/components/publication/Cover";

import { PublicationView } from "readium-desktop/common/views/publication";

import * as styles from "readium-desktop/renderer/assets/styles/publication.css";

interface PublicationCardProps {
    publication: PublicationView;
    displayPublicationInfo?: any;
    openReader?: any;
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
                    <button
                        type="button"
                        aria-haspopup="dialog"
                        aria-controls="dialog"
                        title="Voir plus"
                        onClick={this.handleMenuClick}
                    >
                    <svg role="link" className={styles.icon_seemore}>
                        <g aria-hidden="true">
                        <path d="M0 0h24v24H0z" fill="none"/>
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2
                            2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1
                            0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </g>
                    </svg>
                    </button>
                </div>
                <div
                    className={(this.state.menuOpen ? styles.menu_active + " " : "") + styles.menu}
                >
                    <a
                        tabIndex={1}
                        onClick={this.displayPublicationInfo }
                        onBlur={this.handleOnBlurMenu}
                    > Fiche livre </a>
                    <a tabIndex={2} onBlur={this.handleOnBlurMenu}> Supprimer définitivement </a>
                </div>
            </div>
        );
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
        this.props.openReader(this.props.publication);
    }

    private displayPublicationInfo(e: any) {
        e.preventDefault();
        this.props.displayPublicationInfo(this.props.publication);
    }
}

const mapDispatchToProps = (dispatch: any, __1: PublicationCardProps) => {
    return {
        openReader: (publication: PublicationView) => {

        },
        displayPublicationInfo: (publication: PublicationView) => {
            dispatch(dialogActions.open(
                DialogType.PublicationInfo,
                {
                    publication: {
                        identifier: publication.identifier,
                    },
                },
            ));
        },
    };
};

export default connect(undefined, mapDispatchToProps)(PublicationCard);
