// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { RouteComponentProps } from "react-router-dom";
import { TPublicationApiFindAll_result } from "readium-desktop/main/api/publication";
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
    publicationViews: TPublicationApiFindAll_result | undefined;
}

export class AllPublicationPage extends React.Component<IProps, IState> {
    private unsubscribe: Unsubscribe;

    constructor(props: IProps) {
        super(props);
        this.state = {
            publicationViews: undefined,
        };
    }

    public componentDidMount() {
        this.unsubscribe = apiSubscribe([
            "publication/import",
            "publication/delete",
            "catalog/addEntry",
            "publication/updateTags",
        ], () => {
            apiAction("publication/findAll")
                .then((publicationViews) => this.setState({publicationViews}))
                .catch((error) => console.error("Error to fetch api publication/findAll", error));
        });
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public render(): React.ReactElement<{}> {
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
            typeview = DisplayType.List;
        } else {
            typeview = DisplayType.Grid;
        }

        const secondaryHeader = <Header displayType={typeview} />;

        return (
            <LibraryLayout secondaryHeader={secondaryHeader}>
                <div>
                    <BreadCrumb
                        search={this.props.location.search}
                        breadcrumb={[{ name: __("catalog.myBooks"), path: "/library" }, { name: title as string }]}
                    />
                    {this.state.publicationViews ?
                        (displayType === DisplayType.Grid ?
                            <GridView normalOrOpdsPublicationViews={ this.state.publicationViews } /> :
                            <ListView normalOrOpdsPublicationViews={ this.state.publicationViews } />)
                        : <></>}
                </div>
            </LibraryLayout>
        );
    }
}

export default withTranslator(AllPublicationPage);
