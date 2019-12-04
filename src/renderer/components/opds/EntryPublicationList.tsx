// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import {
    OpdsPublicationView, OpdsResultPageInfos, OpdsResultUrls,
} from "readium-desktop/common/views/opds";
import { DisplayType } from "readium-desktop/renderer/components/utils/displayType";
import { GridView } from "readium-desktop/renderer/components/utils/GridView";
import { ListView } from "readium-desktop/renderer/components/utils/ListView";
import Loader from "readium-desktop/renderer/components/utils/Loader";

import PageNavigation from "./PageNavigation";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps {
    opdsPublicationViews: OpdsPublicationView[] | undefined;
    goto: (url: string, page: number) => void;
    urls: OpdsResultUrls;
    page?: OpdsResultPageInfos;
    currentPage: number;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, RouteComponentProps {
}

class EntryPublicationList extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render() {
        const { urls, page } = this.props;

        let displayType = DisplayType.Grid;
        if (this.props.location?.state?.displayType) {
            displayType = this.props.location.state.displayType as DisplayType;
        //     console.log("this.props.location -- EntryPublicationList");
        //     console.log(this.props.location);
        //     console.log(this.props.location.state);
        // } else {
        //     console.log("XXX this.props.location -- EntryPublicationList");
        }

        // force cast on PublicationView[]
        // It's an hack from no typing to static typing
        // FIX ME in the future
        return (
            <>
                {this.props.opdsPublicationViews ?
                    <>
                        {displayType === DisplayType.Grid ?
                        <GridView normalOrOpdsPublicationViews={this.props.opdsPublicationViews} isOpdsView={true} /> :
                        <ListView normalOrOpdsPublicationViews={this.props.opdsPublicationViews} isOpdsView={true} />
                        }
                        <PageNavigation
                            goto={this.props.goto}
                            urls={urls}
                            page={page}
                            currentPage={this.props.currentPage}
                        />
                    </>
                    : <Loader />}
            </>
        );
    }
}

export default withRouter(EntryPublicationList);
