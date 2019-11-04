// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as qs from "query-string";
import * as React from "react";
import { connect } from "react-redux";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import {
    apiClean, apiDispatch, apiRefreshToState, apiState,
} from "readium-desktop/renderer/redux/api/api";
import { RootState } from "readium-desktop/renderer/redux/states";
import { Dispatch } from "redux";
import * as uuid from "uuid";

import GridView from "./GridView";
import Header, { DisplayType } from "./Header";
import ListView from "./ListView";

interface IProps extends TranslatorProps, ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class Catalog extends React.Component<IProps> {
    private catalogGetId = uuid.v4();
    private publicationGetAllTagId = uuid.v4();

    public componentDidMount() {
        this.getFromApi();
    }

    public componentWillUnmount() {
        this.props.apiClean(this.catalogGetId);
        this.props.apiClean(this.publicationGetAllTagId);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        let DisplayView: any = GridView;
        let displayType = DisplayType.Grid;

        if (this.props.refresh) {
            // Can there be an infernal loop here ?
            this.getFromApi();
        }

        if (this.props.location) {
            const parsedResult = qs.parse(this.props.location.search);

            if (parsedResult.displayType === DisplayType.List) {
                DisplayView = ListView;
                displayType = DisplayType.List;
            }
        }

        const secondaryHeader = <Header displayType={displayType} />;

        const catalog = this.props.apiData(this.catalogGetId)("catalog/get").data;
        const tags = this.props.apiData(this.catalogGetId)("publication/getAllTags").data;

        return (
            <LibraryLayout secondaryHeader={secondaryHeader} title={__("header.books")}>
                {catalog && catalog.result &&
                    <DisplayView catalogEntries={catalog.result.entries}
                        tags={(tags && tags.result) || []} />
                }
            </LibraryLayout>
        );
    }

    private getFromApi = () => {
        this.props.api(this.catalogGetId)("catalog/get")();
        this.props.api(this.publicationGetAllTagId)("publication/getAllTags")()
    }
}

const mapStateToProps = (state: RootState) => ({
    apiData: apiState(state),
    refresh: apiRefreshToState(state)([
        "publication/import",
        "publication/importOpdsEntry",
        "publication/delete",
        "catalog/addEntry",
        "publication/updateTags",
        "reader/setLastReadingLocation",
    ]),
    location: state.router.location,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    api: apiDispatch(dispatch),
    apiClean: apiClean(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Catalog));
