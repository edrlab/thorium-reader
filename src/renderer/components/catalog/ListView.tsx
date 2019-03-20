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

import { Link } from "react-router-dom";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import { TranslatorProps, withTranslator } from "../utils/translator";

import { lazyInject } from "readium-desktop/renderer/di";

import { Translator } from "readium-desktop/common/services/translator";

export interface ListViewProps extends TranslatorProps {
    catalogEntries: CatalogEntryView[];
}

export class ListView extends React.Component<ListViewProps, undefined> {

    public render(): React.ReactElement<{}> {

        return (
            <>
            {
                this.props.catalogEntries.map((entry, entryIndex: number) => {
                    return (
                        <section key={ entryIndex }>
                            <div className={styles.title}>
                                <h1>{(entry.title === "Last additions" ?
                                    this.props.__("catalog.entry.lastAdditions") : entry.title)}</h1>
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
            <button className={styles.tag_add_button}>
                <span>
                    <Link to="/settings/tags" style={{color: "#1a1a1a"}}>
                    {this.props.__("catalog.Selection")}
                    </Link>
                </span>
            </button>
            </>
        );
    }
}

export default withTranslator(ListView);
