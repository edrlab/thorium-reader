// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
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
import GridTagLayout from "./TagLayout";
import { DisplayType, IRouterLocationState } from "../../routing";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}

// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}


class CatalogGridView extends React.Component<IProps> {

    constructor(props: IProps) {
        super(props);
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
                                                    state = {{displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid}}
                                                    title={`${this.props.__("header.allBooks")} (${entry.title})`}
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
                    this.props.tags.length > 0
                        ? <GridTagLayout />
                        : <></>
                }
                {
                    this.props.tags.length === 0 && catalogEntriesIsEmpty
                        ? <NoPublicationInfo />
                        : <></>
                }
                <AboutThoriumButton />
            </>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
    catalogEntries: state.publication.catalog.entries,
    tags: state.publication.tag,
});

export default connect(mapStateToProps)(withTranslator(CatalogGridView));
