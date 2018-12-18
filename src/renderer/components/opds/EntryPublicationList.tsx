// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as qs from "query-string";

import * as React from "react";

import { RouteComponentProps, withRouter } from "react-router-dom";

import Header, { DisplayType } from "readium-desktop/renderer/components/opds/Header";

import GridView from "readium-desktop/renderer/components/utils/GridView";
import ListView from "readium-desktop/renderer/components/utils/ListView";
import Loader from "readium-desktop/renderer/components/utils/Loader";

import { OpdsPublicationView } from "readium-desktop/common/views/opds";

interface EntryPublicationListProps extends RouteComponentProps {
    publications: OpdsPublicationView[];
}

export class EntryPublicationList extends React.Component<EntryPublicationListProps, undefined> {
    public render(): React.ReactElement<{}> {
        let DisplayView: any = GridView;
        let displayType = DisplayType.Grid;

        if (this.props.location) {
            const parsedResult = qs.parse(this.props.location.search);

            if (parsedResult.displayType === DisplayType.List) {
                DisplayView = ListView;
                displayType = DisplayType.List;
            }
        }

        return (
            <div>
                <Header displayType={ displayType } />
                { this.props.publications ?
                    <DisplayView publications={ this.props.publications } isOpdsView={true}/>
                : <Loader/>}
            </div>
        );
    }
}

export default withRouter(EntryPublicationList);
