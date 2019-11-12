// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as qs from "query-string";
import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { TCatalogApiGet_result } from "readium-desktop/main/api/catalog";
import { TPublicationApiGetAllTags_result } from "readium-desktop/main/api/publication";
import { apiAction } from "readium-desktop/renderer/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/apiSubscribe";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { Unsubscribe } from "redux";

import { CatalogGridView } from "./GridView";
import Header, { DisplayType } from "./Header";
import { CatalogListView } from "./ListView";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, RouteComponentProps {
}

interface IState {
    catalog: TCatalogApiGet_result | undefined;
    tags: TPublicationApiGetAllTags_result | undefined;
}

class Catalog extends React.Component<IProps, IState> {
    private unsubscribe: Unsubscribe;

    constructor(props: IProps) {
        super(props);

        this.state = {
            catalog: undefined,
            tags: undefined,
        };
    }

    public componentDidMount() {
        this.unsubscribe = apiSubscribe([
            "publication/import",
            "publication/importOpdsEntry",
            "publication/delete",
            "catalog/addEntry",
            "publication/updateTags",
            "reader/setLastReadingLocation",
        ], () => {
            apiAction("catalog/get")
                .then((catalog) => this.setState({ catalog }))
                .catch((error) => {
                    console.error(`Error to fetch catalog/get`, error);
                });
            apiAction("publication/getAllTags")
                .then((tags) => this.setState({ tags }))
                .catch((error) => {
                    console.error(`Error to fetch publication/getAllTags`, error);
                });
        });
    }

    public componentWillUnmount() {
        this.unsubscribe();
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        let displayType = DisplayType.Grid;

        if (this.props.location) {
            const parsedResult = qs.parse(this.props.location.search);

            if (parsedResult.displayType === DisplayType.List) {
                displayType = DisplayType.List;
            }
        }

        const secondaryHeader = <Header displayType={displayType} />;

        return (
            <LibraryLayout secondaryHeader={secondaryHeader} title={__("header.books")}>
                {this.state.catalog &&
                (displayType === DisplayType.Grid ?
                    <CatalogGridView catalogEntries={this.state.catalog.entries}
                        tags={this.state.tags} /> :
                    <CatalogListView catalogEntries={this.state.catalog.entries}
                        tags={this.state.tags} />)
                }
            </LibraryLayout>
        );
    }
}

export default withTranslator(withRouter(Catalog));
