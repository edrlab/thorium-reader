// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { RouteComponentProps } from "react-router-dom";
import { TPublicationApiFindAll_result } from "readium-desktop/main/api/publication";
import BreadCrumb from "readium-desktop/renderer/components/layout/BreadCrumb";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import { withApi } from "readium-desktop/renderer/components/utils/api";
import GridView from "readium-desktop/renderer/components/utils/GridView";
import ListView from "readium-desktop/renderer/components/utils/ListView";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/translator";

import Header, { DisplayType } from "../catalog/Header";

interface AllPublicationPageProps extends TranslatorProps, RouteComponentProps {
    publications?: TPublicationApiFindAll_result;
}

export class AllPublicationPage extends React.Component<AllPublicationPageProps, undefined> {
    public render(): React.ReactElement<{}> {
        let DisplayView: any = GridView;
        const displayType = this.props.location.state;
        let type: any = "";
        let typeview: DisplayType = DisplayType.Grid;
        const { __ } = this.props;
        const title = __("catalog.allBooks");

        if (displayType) {
            type = Object.values(displayType).pop();
        }

        // console.log(`type: ${type}`);
        if (type === DisplayType.List ||
            window.location.hash === "#/library/search/all?displayType=list") {
            DisplayView = ListView;
            typeview = DisplayType.List;
        } else {
            DisplayView = GridView;
            typeview = DisplayType.Grid;
        }

        const secondaryHeader = <Header displayType={ typeview } />;

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
