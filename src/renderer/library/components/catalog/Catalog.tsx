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
import { DisplayType, IRouterLocationState } from "readium-desktop/renderer/library/routing";
import { Dispatch } from "redux";
import { CATALOG_GET_API_ID_CHANNEL, PUBLICATION_TAGS_API_ID_CHANNEL } from "../../redux/sagas/catalog";

import CatalogGridView from "./GridView";
import Header from "./Header";
import CatalogListView from "./ListView";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps,
    ReturnType<typeof mapStateToProps>, ReturnType<typeof mapDispatchToProps> {
}

class Catalog extends React.Component<IProps, undefined> {

    public render(): React.ReactElement<{}> {
        const { __, catalog, tags } = this.props;

        if (this.props.refresh) {
            this.props.api(CATALOG_GET_API_ID_CHANNEL)("catalog/get")();
            this.props.api(PUBLICATION_TAGS_API_ID_CHANNEL)("publication/getAllTags")();
        }

        const displayType = (this.props.location?.state && (this.props.location.state as IRouterLocationState).displayType) || DisplayType.Grid;

        const secondaryHeader = <Header/>;
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
}

const mapStateToProps = (state: ILibraryRootState) => ({
    catalog: apiState(state)(CATALOG_GET_API_ID_CHANNEL)("catalog/get"),
    tags: apiState(state)(PUBLICATION_TAGS_API_ID_CHANNEL)("publication/getAllTags"),
    refresh: apiRefreshToState(state)([
        "publication/importFromFs",
        "publication/importFromLink",
        "publication/delete",
        "publication/findAll",
        // "catalog/addEntry",
        "publication/updateTags",
        // "reader/setLastReadingLocation",
    ]),
    location: state.router.location,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    api: apiDispatch(dispatch),
    apiClean: apiClean(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Catalog));
