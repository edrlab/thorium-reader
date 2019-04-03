// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

import CatalogMenu from "readium-desktop/renderer/components/publication/menu/CatalogMenu";
import PublicationListElement from "readium-desktop/renderer/components/publication/PublicationListElement";

import AddEntryForm from "./AddEntryForm";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import GridTagLayout from "./GridTagLayout";

interface ListViewProps {
    catalogEntries: CatalogEntryView[];
}

export default class ListView extends React.Component<ListViewProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <>
            {
                this.props.catalogEntries.map((entry, entryIndex: number) => {
                    return (
                        <section key={ entryIndex }>
                            <div className={styles.title}>
                                <h1>{ entry.title }</h1>
                            </div>
                            <ul>
                                { entry.publications.map((pub, i: number) => {
                                    return (
                                        <li className={styles.block_book_list} key={ i }>
                                            <PublicationListElement
                                                publication={pub}
                                                menuContent={<CatalogMenu publication={pub}/>}
                                            />
                                        </li>
                                    );
                                })
                                }
                            </ul>
                        </section>
                    );
            })
            }
            <GridTagLayout
                entries={this.props.catalogEntries}/>
            <AddEntryForm />
            </>
        );
    }
}
