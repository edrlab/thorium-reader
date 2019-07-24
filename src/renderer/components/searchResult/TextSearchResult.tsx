// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as qs from "query-string";

import * as React from "react";

import { RouteComponentProps } from "react-router-dom";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import Header, { DisplayType } from "../catalog/Header";

import GridView from "readium-desktop/renderer/components/utils/GridView";
import ListView from "readium-desktop/renderer/components/utils/ListView";

import { Publication } from "readium-desktop/common/models/publication";

import BreadCrumb from "readium-desktop/renderer/components/layout/BreadCrumb";

interface TextSearchResultProps extends TranslatorProps, RouteComponentProps {
    searchPublications: any;
    publications?: Publication[];
}

export class TextSearchResult extends React.Component<TextSearchResultProps, undefined> {
    public componentDidUpdate(prevProps: any, prevState: any, snapshot?: any): boolean {
        const text = (this.props.match.params as any).value;
        const prevText = (prevProps.match.params as any).value;

        if (text !== prevText) {
            // Refresh searched publications
            this.props.searchPublications({
                text,
            });
        }
        return true;
    }

    public render(): React.ReactElement<{}> {
        let DisplayView: any = GridView;
        let displayType = DisplayType.Grid;
        const { __ } = this.props;
        const title = (this.props.match.params as any).value;

        if (this.props.location) {
            const parsedResult = qs.parse(this.props.location.search);

            if (parsedResult.displayType === DisplayType.List) {
                DisplayView = ListView;
                displayType = DisplayType.List;
            }
        }

        const secondaryHeader = <Header displayType={ displayType } />;

        return (
            <LibraryLayout secondaryHeader={secondaryHeader}>
                <div>
                    <BreadCrumb
                        search={this.props.location.search}
                        breadcrumb={[{name: __("catalog.myBooks"), path: "/library"}, {name: title as string}]}
                    />
                    { this.props.publications ?
                        <DisplayView publications={ this.props.publications } />
                    : <></>}
                </div>
            </LibraryLayout>
        );
    }
}

const buildSearchRequestData = (props: TextSearchResultProps): any => {
    return {
        text: (props.match.params as any).value,
    };
};

export default withApi(
    TextSearchResult,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "search",
                buildRequestData: buildSearchRequestData,
                callProp: "searchPublications",
                resultProp: "publications",
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
        ],
    },
);
