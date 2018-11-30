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

import { Styles } from "readium-desktop/renderer/components/styles";

import { Contributor } from "readium-desktop/common/models/contributor";

import { PublicationView } from "readium-desktop/common/views/publication";

interface ICoverProps {
    publication: PublicationView;
}

export default class Cover extends React.Component<ICoverProps, null> {
    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}>  {
        // TODO: should get language from view state? (user preferences)
        const lang = "en";

        if (this.props.publication.cover == null) {
            let authors = "";
            const bodyCSS = Object.assign({}, Styles.BookCover.body);
            let colors = this.props.publication.customCover;
            if (colors === undefined) {
                colors = {
                    topColor: "#d18e4b",
                    bottomColor: "#7c4c1c",
                };
            }
            bodyCSS.backgroundImage = "linear-gradient(" + colors.topColor + ", " + colors.bottomColor + ")";

            for (const author of this.props.publication.authors) {
                const newAuthor = author;
                if (authors !== "") {
                    authors += ", ";
                }
                authors += this.translator.translateContentField(newAuthor);
            }

            return (
                <div style={bodyCSS}>
                    <div style={Styles.BookCover.box}>
                        <p style={Styles.BookCover.title}>
                        {
                            this.translator.translateContentField(this.props.publication.title)
                        }
                        </p>
                        <p style={Styles.BookCover.author}>{authors}</p>
                    </div>
                </div>
            );
        } else {
            return <img src={this.props.publication.cover.url}/>;
        }
    }
}
