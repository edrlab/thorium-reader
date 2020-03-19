// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import {
    apiClean, apiDispatch, apiRefreshToState, apiState,
} from "readium-desktop/renderer/common/redux/api/api";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { DisplayType } from "readium-desktop/renderer/library/routing";
import { Dispatch } from "redux";
import { v4 as uuidv4 } from "uuid";

import { CatalogGridView } from "./GridView";
import Header from "./Header";
import { CatalogListView } from "./ListView";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps,
    ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class Catalog extends React.Component<IProps, undefined> {
    private catalogGetId = uuidv4();
    private publicationGetAllTagId = uuidv4();

    public componentDidMount() {
        this.getFromApi();
    }

    public componentWillUnmount() {
        this.props.apiClean(this.catalogGetId);
        this.props.apiClean(this.publicationGetAllTagId);
    }

    public componentDidUpdate(oldProps: IProps) {
        if (oldProps.refreshCatalog !== this.props.refreshCatalog) {
            this.getFromApi();
        }
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        if (this.props.refresh) {
            this.getFromApi();
        }

        const displayType = this.props.location?.state?.displayType || DisplayType.Grid;

        const secondaryHeader = <Header/>;

        const catalog = this.props.apiData(this.catalogGetId)("catalog/get");
        const tags = this.props.apiData(this.publicationGetAllTagId)("publication/getAllTags");

        return (
            <LibraryLayout
                title={__("header.books")}
                secondaryHeader={secondaryHeader}
            >
                {
                    catalog?.data.result
                    && (
                        displayType === DisplayType.Grid
                            ? <CatalogGridView
                                catalogEntries={catalog.data.result.entries}
                                tags={(tags?.data.result) || []}
                            />
                            : <CatalogListView
                                catalogEntries={catalog.data.result.entries}
                                tags={(tags?.data.result) || []}
                            />
                    )
                }
            </LibraryLayout>
        );
    }

    private getFromApi = () => {
        this.props.api(this.catalogGetId)("catalog/get")();
        this.props.api(this.publicationGetAllTagId)("publication/getAllTags")();
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    apiData: apiState(state),
    refresh: apiRefreshToState(state)([
        "publication/import",
        "publication/importOpdsPublicationLink",
        "publication/delete",
        // "catalog/addEntry",
        "publication/updateTags",
        // "reader/setLastReadingLocation",
    ]),
    location: state.router.location,
    refreshCatalog: state.updateCatalog, // just to recall 'catalog/get' when readerActions.setReduxState is dispatched
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    api: apiDispatch(dispatch),
    apiClean: apiClean(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Catalog));
