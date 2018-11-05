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

interface IPublicationState {
    isFlipped: boolean;
    menu: boolean;
}

interface IPublicationProps {
    publication: Publication;
    handleRead: (publication: Publication) => void;
    handleMenuClick: (el: React.RefObject<any>, publication: Publication) => void;
    // openInfoDialog: (publication: Publication) => void;
    // openReturnDialog: (publication: Publication) => void;
    // openRenewDialog: (publication: Publication) => void;
}

export default class PublicationListElement extends React.Component<IPublicationProps, IPublicationState> {
    @lazyInject("translator")
    private translator: Translator;

    private menuButton: React.RefObject<any>;

    constructor(props: IPublicationProps) {
        super(props);

        this.state = {
            isFlipped: false,
            menu: false,
        };

        this.menuButton = React.createRef();
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
                const newAuthor: Contributor = author;
                if (authors !== "") {
                    authors += ", ";
                }
                authors += this.translator.translateContentField(newAuthor.name);
            }
        }

        return (
            <div className={styles.block_book}
                aria-haspopup="dialog"
                aria-controls="dialog"
            >
                <div className={styles.image_wrapper}>
                    <a onClick={(e) => this.handleBookClick(e, this.props.publication)}>
                        <Cover publication={publication} />
                    </a>
                </div>
                <div className={styles.legend}>
                    <a onClick={(e) => this.handleBookClick(e, this.props.publication)}>
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
                        onClick={() => this.props.handleMenuClick(this.menuButton, publication)}
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
            </div>
        );
    }

    private handleBookClick(e: any, publication: Publication) {
        e.preventDefault();
        this.props.handleRead(this.props.publication);
    }
}
