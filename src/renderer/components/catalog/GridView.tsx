// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { RouteComponentProps } from "react-router-dom";

import { CatalogEntryView } from "readium-desktop/common/views/catalog";

import CatalogMenu from "readium-desktop/renderer/components/publication/menu/CatalogMenu";
import PublicationCard from "readium-desktop/renderer/components/publication/PublicationCard";
import Slider from "readium-desktop/renderer/components/utils/Slider";

import AboutThoriumButton from "./AboutThoriumButton";
import NoPublicationInfo from "./NoPublicationInfo";
import SortMenu from "./SortMenu";
import TagLayout from "./TagLayout";

import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";

interface GridViewProps extends RouteComponentProps {
    catalogEntries: CatalogEntryView[];
    tags?: string[];
}

interface GridViewState {
    tabTags: string[];
    status: SortStatus;
}

enum SortStatus {
    Count,
    Alpha,
}

export default class GridView extends React.Component<GridViewProps, GridViewState> {
    public constructor(props: any) {
        super(props);

        this.state = {
            tabTags: this.props.tags ? this.props.tags.slice() : [],
            status: SortStatus.Count,
        };
        this.sortByAlpha = this.sortByAlpha.bind(this);
        this.sortbyCount = this.sortbyCount.bind(this);
    }

    public componentDidUpdate(oldProps: GridViewProps) {
        if (this.props.tags !== oldProps.tags) {
            const { status } = this.state;
            switch (status) {
                case SortStatus.Count:
                    this.sortbyCount();
                    break;
                case SortStatus.Alpha:
                    this.sortByAlpha();
                    break;
            }
        }
    }

    public render(): React.ReactElement<{}> {
        const entriesEmpty = this.props.catalogEntries.filter((entry) => entry.publications.length > 0).length === 0;
        return (
            <>
                { this.props.catalogEntries.map((entry, EntryIndex: number) => {
                    return entry.publications.length > 0 ? (
                        <section key={ EntryIndex }>
                        {

                            EntryIndex <= 1 ? (
                            <div className={ styles.title }>
                                <h2>{ entry.title }</h2>
                            </div>
                            ) :
                            (<></>)
                        }
                        {
                            EntryIndex <= 1 ? (
                                <Slider
                                    className={ styles.slider }
                                    content={ entry.publications.map((pub) =>
                                        <PublicationCard
                                            key={ pub.identifier }
                                            publication={ pub }
                                            menuContent={ CatalogMenu }
                                        />,
                                    )}
                                />
                            ) :
                            (<></>)
                        }

                        </section>
                    ) : <></>;
                })}
                { this.state.tabTags.length > 0 &&
                    <TagLayout
                    tags={this.state.tabTags}
                    content={
                        <SortMenu
                            onClickAlphaSort={this.sortByAlpha}
                            onClickCountSort={this.sortbyCount}
                        />}
                    />
                }
                { this.state.tabTags.length === 0 && entriesEmpty &&
                    <NoPublicationInfo />
                }
                <AboutThoriumButton />
            </>
        );
    }

    private sortbyCount() {
        const { tags } = this.props;
        const tabTags = tags.sort((a, b) => {
            if (a < b) {
                return (1);
            } else if (a > b) {
                return (-1);
            }
            return (0);
        });
        this.setState({
            status: SortStatus.Count,
            tabTags,
        });
    }

    private sortByAlpha() {
        const { tags } = this.props;
        const tabTags = tags.sort((a, b) => {
            if (a > b) {
                return (1);
            } else if (a < b) {
                return (-1);
            }
            return (0);
        });
        this.setState({
            status: SortStatus.Alpha,
            tabTags,
        });
    }

}
