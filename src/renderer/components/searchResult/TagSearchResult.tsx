// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as qs from "query-string";
import * as React from "react";
import { RouteComponentProps } from "react-router-dom";
import { TPublicationApiFindByTag_result } from "readium-desktop/main/api/publication";
import { apiAction } from "readium-desktop/renderer/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/apiSubscribe";
import BreadCrumb from "readium-desktop/renderer/components/layout/BreadCrumb";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import { GridView } from "readium-desktop/renderer/components/utils/GridView";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { ListView } from "readium-desktop/renderer/components/utils/ListView";
import { Unsubscribe } from "redux";

import Header, { DisplayType } from "../catalog/Header";

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
    publicationViews: TPublicationApiFindByTag_result | undefined;
}

export class TagSearchResult extends React.Component<IProps, IState> {
    private unsubscribe: Unsubscribe;

    constructor(props: IProps) {
        super(props);
        this.state = {
            publicationViews: undefined,
        };
    }

    public componentDidMount() {
        this.unsubscribe = apiSubscribe([
            "publication/delete",
            "publication/import",
            "publication/updateTags",
            "catalog/addEntry",
        ], () => {
            apiAction("publication/findByTag", (this.props.match.params as any).value)
                .then((publicationViews) => this.setState({publicationViews}))
                .catch((error) => console.error("Error to fetch api publication/findByTag", error));
        });
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public render(): React.ReactElement<{}> {
        let displayType = DisplayType.Grid;
        const { __ } = this.props;
        const title = (this.props.match.params as any).value;

        if (this.props.location) {
            const parsedResult = qs.parse(this.props.location.search);

            if (parsedResult.displayType === DisplayType.List) {
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
                    { this.state.publicationViews ?
                        (displayType === DisplayType.Grid ?
                            <GridView normalOrOpdsPublicationViews={ this.state.publicationViews } /> :
                            <ListView normalOrOpdsPublicationViews={ this.state.publicationViews } />)
                    : <></>}
                </div>
            </LibraryLayout>
        );
    }
}

export default withTranslator(TagSearchResult);
