// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

import PublicationCard from "readium-desktop/renderer/components/publication/PublicationCard";

import Slider from "readium-desktop/renderer/components/utils/Slider";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

import { Link, RouteComponentProps } from "react-router-dom";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import CatalogMenu from "readium-desktop/renderer/components/publication/menu/CatalogMenu";
import { TranslatorProps, withTranslator } from "../utils/translator";

export interface GridViewProps extends TranslatorProps {
    catalogEntries: CatalogEntryView[];
}

export class GridView extends React.Component<GridViewProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <>
                { this.props.catalogEntries.map((entry, i: number) => {
                        return (
                            <section key={ i }>
                                <div className={styles.title}>
                                    <h1>{ entry.title }</h1>
                                </div>
                                <Slider
                                    className={styles.slider}
                                    content={entry.publications.map((pub) =>
                                        <PublicationCard
                                            key={pub.identifier}
                                            publication={pub}
                                            menuContent={<CatalogMenu publication={pub}/>}
                                        />,
                                    )}
                                />
                            </section>
                        );
                })}
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

export default withTranslator(GridView);
