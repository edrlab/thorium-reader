// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { lazyInject } from "readium-desktop/renderer/di";

import { Publication } from "readium-desktop/common/models/publication";

import { Translator } from "readium-desktop/common/services/translator";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

interface IPublicationProps {
    publication: Publication;
    id: number;
    handleMenuClick: (id: number) => void;
    openDialog: () => void;
    menuOpen: boolean;
    // downloading: boolean;
    // downloadProgress?: number;
    // handleRead: any;
    // cancelDownload: any;
    // deletePublication: any;
    // openInfoDialog: (publication: Publication) => void;
    // openReturnDialog: (publication: Publication) => void;
    // openRenewDialog: (publication: Publication) => void;
}

export default class PublicationListElement extends React.Component<IPublicationProps, null> {
    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate.bind(this.translator);

        const i = this.props.id;
        const pub = this.props.publication;

        return (
            <li
                key={i}
                className={styles.block_book_list +
                    (this.props.menuOpen ? " " + styles.menuOpen : "")}
            >
                <div className={styles.list_book_title}>
                <p className={styles.book_title} aria-label="Titre du livre">{pub.title}</p>
                <p
                    className={`${styles.book_author} ${styles.lightgrey}`}
                    aria-label="Auteur du livre"
                >
                    {pub.authors.map((author) => author.name).join(", ")}
                </p>
                </div>
                <p className={styles.infos_sup} aria-label="Date de sortie du livre">2017</p>
                <p className={styles.infos_sup} aria-label="Éditeur du livre">Larousse</p>
                <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-controls="dialog"
                    title="Voir plus"
                    onClick={() => this.props.handleMenuClick(i)}
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
                    <a onClick={this.props.openDialog} >Fiche livre</a>
                    <a>Retirer de la séléction</a>
                    <a>Supprimer définitivement</a>
                </div>
            </li>
        );
    }
}
