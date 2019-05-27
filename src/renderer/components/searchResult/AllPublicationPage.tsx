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

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import Header, { DisplayType } from "../catalog/Header";

import GridView from "readium-desktop/renderer/components/utils/GridView";
import ListView from "readium-desktop/renderer/components/utils/ListView";

import { Publication } from "readium-desktop/common/models/publication";

import BreadCrumb from "readium-desktop/renderer/components/layout/BreadCrumb";

interface AllPublicationPageProps extends TranslatorProps, RouteComponentProps {
    publications?: Publication[];
}

export class AllPublicationPage extends React.Component<AllPublicationPageProps, undefined> {
    public render(): React.ReactElement<{}> {
        let DisplayView: any = GridView;
        let displayType = DisplayType.Grid;
        const { __ } = this.props;
        const title = __("catalog.allBooks");

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

export default withTranslator(withApi(
    AllPublicationPage,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "findAll",
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
));
