// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { CatalogEntryView } from "readium-desktop/common/views/catalog";
import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import PublicationCard from "readium-desktop/renderer/components/publication/PublicationCard";
import Slider from "readium-desktop/renderer/components/utils/Slider";

import AboutThoriumButton from "./AboutThoriumButton";
import NoPublicationInfo from "./NoPublicationInfo";
import SortMenu from "./SortMenu";
import TagLayout from "./TagLayout";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
    catalogEntries: CatalogEntryView[];
    tags?: string[];
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps {
}

interface IState {
    tabTags: string[];
    status: SortStatus;
}

enum SortStatus {
    Count,
    Alpha,
}

export class CatalogGridView extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            tabTags: this.props.tags ? this.props.tags.slice() : [],
            status: SortStatus.Count,
        };
        this.sortByAlpha = this.sortByAlpha.bind(this);
        this.sortbyCount = this.sortbyCount.bind(this);
    }

    public componentDidUpdate(oldProps: IProps) {
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
        const entriesEmpty = this.props.catalogEntries.filter((entry) => {
            return entry.publicationViews.length > 0;
        }).length === 0;

        return (
            <>
                { this.props.catalogEntries.map((entry, EntryIndex: number) => {
                    return entry.publicationViews.length > 0 ? (
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
                                    content={ entry.publicationViews.map((pub) =>
                                        <PublicationCard
                                            key={ pub.identifier }
                                            publicationViewMaybeOpds={ pub }
                                        />,
                                    )}
                                />
                            ) :
                            (<></>)
                        }

                        </section>
                    ) : <div key={ EntryIndex } aria-hidden="true" style={{display: "none"}}></div>;
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
