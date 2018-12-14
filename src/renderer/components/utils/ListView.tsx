// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import PublicationListElement from "readium-desktop/renderer/components/publication/PublicationListElement";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import { Publication } from "readium-desktop/common/models/publication";

interface ListViewProps {
    publications: Publication[];
}

export default class ListView extends React.Component<ListViewProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <>
            {
                <ul>
                    { this.props.publications.map((pub, i: number) => {
                        return (
                            <li className={styles.block_book_list} key={ i }>
                                <PublicationListElement
                                    publication={pub}
                                />
                            </li>
                        );
                    })}
                </ul>
            }
            </>
        );
    }
}
