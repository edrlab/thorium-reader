// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { connect } from "react-redux";

import { Publication } from "readium-desktop/common/models/publication";

import { Translator } from "readium-desktop/common/services/translator";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { libraryActions } from "readium-desktop/renderer/redux/actions";

import { PublicationView } from "readium-desktop/common/views/publication";

interface PublicationListElementProps {
    publication: PublicationView;
    displayPublicationInfo?: any;
}

export class PublicationListElement extends React.Component<PublicationListElementProps, undefined> {
    constructor(props: any) {
        super(props);

        this.displayPublicationInfo = this.displayPublicationInfo.bind(this);
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
                <div className={styles.listMenu}>
                    <a onClick={this.displayPublicationInfo} >Fiche livre</a>
                    <a>Retirer de la séléction</a>
                    <a>Supprimer définitivement</a>
                </div>
            </>
        );
    }

    private displayPublicationInfo(e: any) {
        e.preventDefault();
        this.props.displayPublicationInfo(this.props.publication);
    }
}

const mapDispatchToProps = (dispatch: any, __1: PublicationListElementProps) => {
    return {
        displayPublicationInfo: (publication: PublicationView) => {
            dispatch(
                libraryActions.ActionType.PublicationInfoDisplayRequest,
            );
        },
    };
};

export default connect(undefined, mapDispatchToProps)(PublicationListElement);
