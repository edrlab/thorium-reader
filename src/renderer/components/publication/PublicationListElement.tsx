// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { connect } from "react-redux";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { DialogType } from "readium-desktop/common/models/dialog";

import * as dialogActions from "readium-desktop/common/redux/actions/dialog";

import { PublicationView } from "readium-desktop/common/views/publication";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import * as MenuIcon from "readium-desktop/renderer/assets/icons/menu.svg";

interface PublicationListElementProps {
    publication: PublicationView;
    displayPublicationInfo?: any;
}

interface PublicationListElementState {
    menuOpen: boolean;
}

export class PublicationListElement extends React.Component<PublicationListElementProps, PublicationListElementState> {
    constructor(props: any) {
        super(props);

        this.state = {
            menuOpen: false,
        }

        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);
        this.switchMenu = this.switchMenu.bind(this);
    }

    public render(): React.ReactElement<{}>  {
        const pub = this.props.publication;

        return (
            <>
                <div className={styles.list_book_title}>
                <p className={styles.book_title} aria-label="Titre du livre">{pub.title}</p>
                <p
                    className={`${styles.book_author} ${styles.lightgrey}`}
                    aria-label="Auteur du livre"
                >
                    {pub.authors.map((author) => author).join(", ")}
                </p>
                </div>
                <p className={styles.infos_sup} aria-label="Date de sortie du livre">{pub.publishedAt}</p>
                <p className={styles.infos_sup} aria-label="Éditeur du livre">{pub.editor}</p>
                <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-controls="dialog"
                    title="Voir plus"
                    onClick={this.switchMenu}
                >
                    <SVG svg={MenuIcon}/>
                </button>
                <div className={(this.state.menuOpen ? styles.menu_open + " " : "") + styles.list_menu}>
                    <a onClick={this.displayPublicationInfo} >Fiche livre</a>
                    <a>Supprimer définitivement</a>
                </div>
            </>
        );
    }

    private displayPublicationInfo(e: any) {
        e.preventDefault();
        this.props.displayPublicationInfo(this.props.publication);
    }

    private switchMenu() {
        this.setState({menuOpen: !this.state.menuOpen});
    }
}

const mapDispatchToProps = (dispatch: any, __1: PublicationListElementProps) => {
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

export default connect(undefined, mapDispatchToProps)(PublicationListElement);
