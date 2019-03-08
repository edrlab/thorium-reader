// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { Publication } from "readium-desktop/common/models/publication";

import { lazyInject } from "readium-desktop/renderer/di";

import { Translator } from "readium-desktop/common/services/translator";

import { Cover } from "readium-desktop/renderer/components/publication/index";

import * as OpdsStyles from "readium-desktop/renderer/assets/styles/opds_element.css";

interface IPublicationProps {
    publication: Publication;
    handleCheckboxChange: any;
}

export default class OpdsListElement extends React.Component<IPublicationProps, null> {
    @lazyInject("translator")
    private translator: Translator;

    public render(): React.ReactElement<{}>  {
        const publication: Publication = this.props.publication;

        let image: string = "";
        let authors = "";

        if (publication.cover) {
            image = publication.cover.url;
        }

        if (publication.authors) {
            let i = 0;
            for (const author of publication.authors) {
                if (i > 0) {
                    authors += " & ";
                }
                authors += this.translator.translateContentField(author.name);
                i++;
            }
        }

        return (
            <div className={OpdsStyles.body}>
                {publication.cover ? (
                    <img className={OpdsStyles.image} src={publication.cover.url}/>
                ) : (
                    <div className={OpdsStyles.image}>
                        {/*<Cover publication={publication}/>*/}
                    </div>
                )}
                <div className={OpdsStyles.primary_informations}>
                    <p className={OpdsStyles.title}>{this.translator.translateContentField(publication.title)}</p>
                    <p className={OpdsStyles.author}>{authors}</p>
                </div>
                <input
                    className={OpdsStyles.checkbox}
                    type="checkbox"
                    onChange={this.props.handleCheckboxChange.bind(this, publication)}
                />
                <div className={OpdsStyles.description}>
                    <p>
                        {publication.description}
                    </p>
                </div>
            </div>
        );
    }
}
