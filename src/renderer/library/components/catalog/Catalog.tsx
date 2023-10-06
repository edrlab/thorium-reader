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
    apiClean, apiDispatch,
} from "readium-desktop/renderer/common/redux/api/api";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { DisplayType, IRouterLocationState } from "readium-desktop/renderer/library/routing";
import { Dispatch } from "redux";

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

        const displayType = (this.props.location?.state && (this.props.location.state as IRouterLocationState).displayType) || DisplayType.Grid;

        const secondaryHeader = <Header/>;
        return (
            <LibraryLayout
                title={__("header.books")}
                secondaryHeader={secondaryHeader}
            >
                {
                    catalog?.entries
                    && (
                        displayType === DisplayType.Grid
                            ? <CatalogGridView
                                catalogEntries={catalog.entries}
                                tags={tags}
                            />
                            : <CatalogListView
                                catalogEntries={catalog.entries}
                                tags={tags}
                            />
                    )
                }
            </LibraryLayout>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
    catalog: state.publication.catalog,
    tags: state.publication.tag,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    api: apiDispatch(dispatch),
    apiClean: apiClean(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Catalog));
