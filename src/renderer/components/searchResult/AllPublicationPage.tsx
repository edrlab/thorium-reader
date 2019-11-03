// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { TPublicationApiFindAll_result } from "readium-desktop/main/api/publication";
import { apiAction } from "readium-desktop/renderer/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/apiSubscribe";
import BreadCrumb from "readium-desktop/renderer/components/layout/BreadCrumb";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import GridView from "readium-desktop/renderer/components/utils/GridView";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import ListView from "readium-desktop/renderer/components/utils/ListView";
import { RootState } from "readium-desktop/renderer/redux/states";
import { Dispatch, Store, Unsubscribe } from "redux";

import Header, { DisplayType } from "../catalog/Header";

interface IProps extends TranslatorProps, RouteComponentProps {
}

interface IState {
    publications: TPublicationApiFindAll_result | undefined;
}

export class AllPublicationPage extends React.Component<IProps, IState> {
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
        ], () => {
            apiAction("publication/findAll")
                .then((publications) => this.setState({publications}))
                .catch((error) => console.error("Error to fetch api publication/findAll", error));
        });
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {ß
            this.unsubscribe();
        }
    }

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

        const secondaryHeader = <Header displayType={typeview} />;

        return (
            <LibraryLayout secondaryHeader={secondaryHeader}>
                <div>
                    <BreadCrumb
                        search={this.props.location.search}
                        breadcrumb={[{ name: __("catalog.myBooks"), path: "/library" }, { name: title as string }]}
                    />
                    {this.state.publications ?
                        <DisplayView publications={this.state.publications} />
                        : <></>}
                </div>
            </LibraryLayout>
        );
    }
}

const mapStateToProps = (state: Store<RootState>) => {

}

const mapDispatchToProps = (dispatch: Dispatch) => {

    const findAll = apiDispatch(dispatch)("publication/findAll", "AllPubComponnent");
    findAll();
    return {
        findAll,
    }
}




export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(AllPublicationPage));
