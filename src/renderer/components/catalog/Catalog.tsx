// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as qs from "query-string";
import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { TCatalogApiGet, TCatalogApiGet_result } from "readium-desktop/main/api/catalog";
import { TPublicationApiGetAllTags_result } from "readium-desktop/main/api/publication";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import { withApi } from "readium-desktop/renderer/components/utils/hoc/api";
import { TranslatorProps } from "readium-desktop/renderer/components/utils/hoc/translator";

import GridView from "./GridView";
import Header, { DisplayType } from "./Header";
import ListView from "./ListView";

interface Props extends TranslatorProps, RouteComponentProps {
    catalog?: TCatalogApiGet_result;
    tags?: TPublicationApiGetAllTags_result;
    requestCatalog: TCatalogApiGet;
}

export class Catalog extends React.Component<Props> {
    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        let DisplayView: any = GridView;
        let displayType = DisplayType.Grid;

        if (this.props.location) {
            const parsedResult = qs.parse(this.props.location.search);

            if (parsedResult.displayType === DisplayType.List) {
                DisplayView = ListView;
                displayType = DisplayType.List;
            }
        }

        const secondaryHeader = <Header displayType={ displayType } />;

        return (
            <LibraryLayout secondaryHeader={secondaryHeader} title={__("header.books")}>
                    { this.props.catalog &&
                        <DisplayView catalogEntries={ this.props.catalog.entries }
                        tags={this.props.tags}/>
                    }
            </LibraryLayout>
        );
    }
}

export default withApi(
    withRouter(Catalog),
    {
        operations: [
            {
                moduleId: "catalog",
                methodId: "get",
                resultProp: "catalog",
                onLoad: true,
            },
            {
                moduleId: "publication",
                methodId: "getAllTags",
                resultProp: "tags",
                onLoad: true,
            },
        ],
        refreshTriggers: [
            {
                moduleId: "publication",
                methodId: "import",
            },
            {
                moduleId: "publication",
                methodId: "importOpdsEntry",
            },
            {
                moduleId: "publication",
                methodId: "delete",
            },
            {
                moduleId: "catalog",
                methodId: "addEntry",
            },
            {
                moduleId: "publication",
                methodId: "updateTags",
            },
            {
                moduleId: "reader",
                methodId: "setLastReadingLocation",
            },
        ],
    },
);
