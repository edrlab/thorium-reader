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

import GridTagLayout from "./GridTagLayout";
import SortMenu from "./SortMenu";

interface GridViewProps extends RouteComponentProps {
    catalogEntries: CatalogEntryView[];
}

export default class GridView extends React.Component<GridViewProps, undefined> {
    public constructor(props: any) {
        super(props);

        this.sortByAlpha = this.sortByAlpha.bind(this);
        this.sortbyCount = this.sortbyCount.bind(this);
    }

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
                <GridTagLayout
                entries={this.props.catalogEntries}
                content={
                    <SortMenu
                        onClickAlphaSort={this.sortByAlpha}
                        onClickCountSort={this.sortbyCount}
                    />}
                />
                <AddEntryForm/>
            </>
        );
    }

    private sortbyCount() {
        console.log("count");
        this.props.catalogEntries.sort((a, b) => {
            if (a.totalCount < b.totalCount) {
                  return (1);
            } else if (a.totalCount > b.totalCount) {
                  return (-1);
            }
            return (0);
      });
  }

  private sortByAlpha() {
      console.log("alpha");
      this.props.catalogEntries.sort((a, b) => {
            if (a.title > b.title) {
                  return (1);
            } else if (a.title < b.title) {
                  return (-1);
            }
            return (0);
      });
  }

}
