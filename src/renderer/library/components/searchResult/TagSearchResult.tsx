// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { matchPath } from "react-router-dom";
import { PublicationView } from "readium-desktop/common/views/publication";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/library/components/hoc/translator";
import BreadCrumb from "readium-desktop/renderer/library/components/layout/BreadCrumb";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { GridView } from "readium-desktop/renderer/library/components/utils/GridView";
import { ListView } from "readium-desktop/renderer/library/components/utils/ListView";
import { RootState } from "readium-desktop/renderer/library/redux/states";
import { DisplayType, ILibrarySearchText, routes } from "readium-desktop/renderer/library/routing";
import { apiAction } from "readium-desktop/renderer/tools/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/tools/apiSubscribe";
import { Unsubscribe } from "redux";

import Header from "../catalog/Header";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

interface IState {
    publicationViews: PublicationView[] | undefined;
}

export class TagSearchResult extends React.Component<IProps, IState> {
    private unsubscribe: Unsubscribe;

    constructor(props: IProps) {
        super(props);
        this.state = {
            publicationViews: undefined,
        };
    }

    public componentDidMount() {
        this.unsubscribe = apiSubscribe([
            "publication/delete",
            "publication/import",
            "publication/updateTags",
            "catalog/addEntry",
        ], () => {
            const value = matchPath<ILibrarySearchText>(
                this.props.location.pathname, routes["/library/search/tag"],
            ).params.value;

            apiAction("publication/findByTag", value)
                .then((publicationViews) => this.setState({ publicationViews }))
                .catch((error) => console.error("Error to fetch api publication/findByTag", error));
        });
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public render(): React.ReactElement<{}> {
        const displayType = this.props.location?.state?.displayType || DisplayType.Grid;
        const { __ } = this.props;
        const title = matchPath<ILibrarySearchText>(
            this.props.location.pathname, routes["/library/search/tag"],
        ).params.value;

        const secondaryHeader = <Header />;

        return (
            <LibraryLayout secondaryHeader={secondaryHeader}>
                <div>
                    <BreadCrumb
                        breadcrumb={[{ name: __("catalog.myBooks"), path: "/library" }, { name: title }]}
                    />
                    {this.state.publicationViews ?
                        (displayType === DisplayType.Grid ?
                            <GridView normalOrOpdsPublicationViews={this.state.publicationViews} /> :
                            <ListView normalOrOpdsPublicationViews={this.state.publicationViews} />)
                        : <></>}
                </div>
            </LibraryLayout>
        );
    }
}

const mapStateToProps = (state: RootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(TagSearchResult));
