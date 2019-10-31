// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as qs from "query-string";
import * as React from "react";
import { RouteComponentProps } from "react-router-dom";
import { TPublicationApiSearch_result } from "readium-desktop/main/api/publication";
import { apiAction } from "readium-desktop/renderer/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/apiSubscribe";
import BreadCrumb from "readium-desktop/renderer/components/layout/BreadCrumb";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import GridView from "readium-desktop/renderer/components/utils/GridView";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import ListView from "readium-desktop/renderer/components/utils/ListView";
import { ILibrarySearchText } from "readium-desktop/renderer/routing";
import { Unsubscribe } from "redux";

import Header, { DisplayType } from "../catalog/Header";

interface IProps extends TranslatorProps, RouteComponentProps<ILibrarySearchText> {
}

interface IState {
    publications: TPublicationApiSearch_result | undefined;
}

export class TextSearchResult extends React.Component<IProps, IState> {
    private unsubscribe: Unsubscribe;

    constructor(props: IProps) {
        super(props);

        this.state = {
            publications: undefined,
        };
    }

    public componentDidMount() {
        this.unsubscribe = apiSubscribe([
            "publication/import",
            "publication/delete",
            "catalog/addEntry",
            "publication/updateTags",
        ], this.searchPublications);
    }

    public componentDidUpdate(prevProps: IProps) {
        const text = this.props.match.params.value;
        const prevText = prevProps.match.params.value;

        if (text !== prevText) {
            // Refresh searched publications
            this.searchPublications();
        }
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public render(): React.ReactElement<{}> {
        let DisplayView: any = GridView;
        let displayType = DisplayType.Grid;
        const { __ } = this.props;
        const title = this.props.match.params.value;

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
                    { this.state.publications ?
                        <DisplayView publications={ this.state.publications } />
                    : <></>}
                </div>
            </LibraryLayout>
        );
    }

    private searchPublications = (text: string = this.props.match.params.value) => {
        apiAction("publication/search", text)
            .then((publications) => this.setState({publications}))
            .catch((error) => console.error("Error to fetch api publication/search", error));
    }
}

/*
const buildSearchRequestData = (props: TextSearchResultProps): any => {
    return [ (props.match.params as any).value ];
};
*/

export default withTranslator(TextSearchResult);
