// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import * as React from "react";
import { RandomCustomCovers } from "readium-desktop/common/models/custom-cover";
import { PublicationView } from "readium-desktop/common/views/publication";
import * as styles from "readium-desktop/renderer/assets/styles/publication.css";

import { TranslatorProps, withTranslator } from "../utils/hoc/translator";

interface IProps extends TranslatorProps {
    publication: PublicationView;
}

class Cover extends React.Component<IProps, null> {

    public render(): React.ReactElement<{}>  {

        if (this.props.publication.cover == null) {
            let authors = "";

            for (const author of this.props.publication.authors) {
                const newAuthor = author;
                if (authors !== "") {
                    authors += ", ";
                }
                authors += this.props.translator.translateContentField(newAuthor);
            }
            let colors = this.props.publication.customCover;
            if (colors === undefined) {
                colors = RandomCustomCovers[0];
            }
            const backgroundStyle = {
                backgroundImage: `linear-gradient(${colors.topColor}, ${colors.bottomColor})`,
            };

            return (
                <div style={backgroundStyle} className={styles.cover}>
                    <div className={styles.box}>
                        <p aria-hidden className={styles.title}>
                            {this.props.translator.translateContentField(this.props.publication.title)}
                        </p>
                        <p aria-hidden className={styles.author}>{authors}</p>
                    </div>
                </div>
            );
        } else {
            return <img src={this.props.publication.cover.url}/>;
        }
    }
}

export default withTranslator(Cover);
