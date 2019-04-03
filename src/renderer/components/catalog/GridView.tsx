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

import AddEntryForm from "./AddEntryForm";

import CatalogMenu from "readium-desktop/renderer/components/publication/menu/CatalogMenu";

import TagContainer from "./TagContainer";

import GridTagLayout from "./GridTagLayout";

interface GridViewProps extends RouteComponentProps {
    catalogEntries: CatalogEntryView[];
}

export default class GridView extends React.Component<GridViewProps, undefined> {
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

                {/*this.buildGridTagView()*/}
                <GridTagLayout
                entries={this.props.catalogEntries}/>
                <AddEntryForm/>
            </>
        );
    }
    private buildGridTagView() {
        return (
            <section>
                <Slider
                className={styles.slider}
                content={this.props.catalogEntries.map((entry, index: number) =>
                        <TagContainer
                            tag={entry.title}
                            totalCount={entry.totalCount}
                            key={index}
                        />,
                )}
                />
        </section>
        );
    }
}
