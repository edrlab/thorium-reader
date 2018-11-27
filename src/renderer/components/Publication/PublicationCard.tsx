// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { lazyInject } from "readium-desktop/renderer/di";

import { Contributor } from "readium-desktop/common/models/contributor";
import { Publication } from "readium-desktop/common/models/publication";

import { Translator } from "readium-desktop/common/services/translator";

import Cover from "readium-desktop/renderer/components/Publication/Cover";

import * as styles from "readium-desktop/renderer/assets/styles/publication.css";

import { PublicationView } from "readium-desktop/common/views/publication";

interface IPublicationState {
    isFlipped: boolean;
    menu: boolean;
}

interface IPublicationProps {
    publication: PublicationView;
    handleRead: (publication: PublicationView) => void;
    handleMenuClick: (el: React.RefObject<any>, publication: PublicationView) => void;
    openDialog: (publication: PublicationView) => void;
    // openReturnDialog: (publication: Publication) => void;
    // openRenewDialog: (publication: Publication) => void;
}

export default class PublicationCard extends React.Component<IPublicationProps, IPublicationState> {
    @lazyInject("translator")
    private translator: Translator;

    private menuButton: React.RefObject<any>;

    private menuRef: any;

    constructor(props: IPublicationProps) {
        super(props);

        this.state = {
            isFlipped: false,
            menu: false,
        };

        this.menuRef = React.createRef();

        this.handleOnBlurMenu = this.handleOnBlurMenu.bind(this);
        this.handleMenuClick = this.handleMenuClick.bind(this);        
    }

    public handleFront = () => {
        this.setState({ isFlipped: true });
    }

    public handleBack = () => {
        this.setState({ isFlipped: false });
    }

    public render(): React.ReactElement<{}>  {
        const __ = this.translator.translate.bind(this.translator);
        const publication = this.props.publication;
        let authors: string = "";

        if (publication.authors && publication.authors.length > 0) {
            for (const author of publication.authors) {
                const newAuthor = author;
                if (authors !== "") {
                    authors += ", ";
                }
                authors += this.translator.translateContentField(newAuthor);
            }
        }

        return (
            <div className={styles.block_book}
                aria-haspopup="dialog"
                aria-controls="dialog"
            >
                <div className={styles.image_wrapper}>
                    <a onClick={(e) => this.handleBookClick(e)}>
                        <Cover publication={publication} />
                    </a>
                </div>
                <div className={styles.legend}>
                    <a onClick={(e) => this.handleBookClick(e)}>
                        <p className={styles.book_title} aria-label="Titre du livre">
                            {publication.title}
                        </p>
                        <p className={styles.book_author} aria-label="Auteur du livre">
                            {authors}
                        </p>
                    </a>
                    <button
                        ref={this.menuButton}
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
                    className={(this.state.menu ? styles.menu_active + " " : "") + styles.menu}
                    ref={this.menuRef}
                >
                    <a
                        tabIndex={1}
                        onClick={() => this.props.openDialog(this.props.publication)}
                        onBlur={this.handleOnBlurMenu}
                    > Fiche livre </a>
                    <a tabIndex={2} onBlur={this.handleOnBlurMenu}> Retirer de la séléction </a>
                    <a tabIndex={3} onBlur={this.handleOnBlurMenu}> Supprimer définitivement </a>
                </div>
            </div>
        );
    }

    private handleOnBlurMenu(e: any) {
        console.log();
        if (!e.relatedTarget || (e.relatedTarget && e.relatedTarget.parentElement !== e.target.parentElement)) {
            this.setState({ menu: false});
        }
    }

    private handleMenuClick() {
        this.setState({menu: !this.state.menu});
    }

    private handleBookClick(e: any) {
        e.preventDefault();
        this.props.handleRead(this.props.publication);
    }
}
