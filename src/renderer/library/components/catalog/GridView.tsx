// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { CatalogEntryView } from "readium-desktop/common/views/catalog";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.css";
import * as stylesGlobal from "readium-desktop/renderer/assets/styles/global.css";
import * as stylesSlider from "readium-desktop/renderer/assets/styles/components/slider.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import PublicationCard from "readium-desktop/renderer/library/components/publication/PublicationCard";
import Slider from "readium-desktop/renderer/library/components/utils/Slider";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";

import AboutThoriumButton from "./AboutThoriumButton";
import NoPublicationInfo from "./NoPublicationInfo";
import SortMenu from "./SortMenu";
import TagLayout from "./TagLayout";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
    catalogEntries: CatalogEntryView[];
    tags?: string[];
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

interface IState {
    tabTags: string[];
    status: SortStatus;
}

enum SortStatus {
    Count,
    Alpha,
}

class CatalogGridView extends React.Component<IProps, IState> {

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
        const catalogEntriesIsEmpty = this.props.catalogEntries.filter(
            (entry) => entry.totalCount > 0,
        ).length === 0;

        return (
            <>
                {
                    this.props.catalogEntries.map((entry, entryIndex: number) =>
                            entry.totalCount > 0
                                ? (
                                    <section key={entryIndex}>
                                        {

                                            <div className={stylesGlobal.heading}>
                                                <h2>{entry.title}</h2>
                                                <Link
                                                    className={stylesButtons.button_primary_small}
                                                    to={{
                                                        ...this.props.location,
                                                        pathname: "/library/search/all",
                                                    }}
                                                >
                                                    {this.props.__("header.allBooks")}
                                                </Link>
                                            </div>
                                        }
                                        {
                                            <Slider
                                                className={stylesSlider.slider}
                                                content={entry.publicationViews.map((pub) =>
                                                    <PublicationCard
                                                        key={pub.identifier}
                                                        publicationViewMaybeOpds={pub}
                                                    />,
                                                )}
                                            />
                                        }

                                    </section>
                                )
                                : <div
                                    key={entryIndex}
                                    aria-hidden="true"
                                    className={stylesGlobal.d_none}
                                >
                                </div>,
                    )
                }
                {
                    this.state.tabTags.length > 0
                        ? <TagLayout
                            tags={this.state.tabTags}
                            content={
                                <SortMenu
                                    onClickAlphaSort={this.sortByAlpha}
                                    onClickCountSort={this.sortbyCount}
                                />}
                        />
                        : <></>
                }
                {
                    this.state.tabTags.length === 0 && catalogEntriesIsEmpty
                        ? <NoPublicationInfo />
                        : <></>
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

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(CatalogGridView));
