// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import * as React from "react";
import { RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import * as styles from "readium-desktop/renderer/assets/styles/publication.css";
import { TPublication } from "readium-desktop/renderer/common/type/publication.type";

import { TranslatorProps, withTranslator } from "./hoc/translator";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    publicationViewMaybeOpds: TPublication;
    coverType?: "cover" | "thumbnail" | undefined;
    onClick?: () => void;
    onKeyPress?: (e: React.KeyboardEvent<HTMLImageElement>) => void;
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

class Cover extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render()  {

        if (!this.props.publicationViewMaybeOpds.cover) {
            let authors = "";

            for (const author of this.props.publicationViewMaybeOpds.authors) {
                const newAuthor = author;
                if (authors !== "") {
                    authors += ", ";
                }
                authors += this.props.translator.translateContentField(newAuthor);
            }
            let colors = this.props.publicationViewMaybeOpds.customCover;
            if (!colors) {
                colors = RandomCustomCovers[0];
            }
            const backgroundStyle: React.CSSProperties = {
                backgroundImage: `linear-gradient(${colors.topColor}, ${colors.bottomColor})`,
            };

            return (
                <div style={backgroundStyle} className={styles.cover}>
                    <div className={styles.box}>
                        <p aria-hidden className={styles.title}>
                            {this.props.translator.translateContentField(this.props.publicationViewMaybeOpds.title)}
                        </p>
                        <p aria-hidden className={styles.author}>{authors}</p>
                    </div>
                </div>
            );
        } else {
            const { cover } = this.props.publicationViewMaybeOpds;
            const coverUrl = cover.coverUrl || cover.coverLinks[0]?.url;
            const thumbnailUrl = cover.coverUrl || cover.thumbnailLinks[0]?.url;

            let defaultUrl: string;
            if (this.props.coverType === "cover") {
                defaultUrl = coverUrl || thumbnailUrl;
            } else {
                defaultUrl = thumbnailUrl || coverUrl;
            }
            return (
                <img
                    tabIndex={0}
                    className={styles.cover_img}
                    onClick={this.props.onClick}
                    onKeyPress={this.props.onKeyPress}
                    role="presentation"
                    alt={this.props.__("publication.cover.img")}
                    src={defaultUrl}
                />
            );
        }
    }
}

export default withTranslator(Cover);
