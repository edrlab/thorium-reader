// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { RouteComponentProps } from "react-router-dom";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import {
    OpdsResultType,
    OpdsResultView,
} from "readium-desktop/common/views/opds";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import EntryList from "./EntryList";
import EntryPublicationList from "./EntryPublicationList";

import Loader from "readium-desktop/renderer/components/utils/Loader";
import { Entry } from "./Entry";

interface BrowserResultProps extends RouteComponentProps, TranslatorProps {
    url: string;
    result?: OpdsResultView;
    cleanData: any;
    requestOnLoadData: any;
}

export class BrowserResult extends React.Component<BrowserResultProps, null> {
    public componentDidUpdate?(prevProps: BrowserResultProps, prevState: any) {
        if (prevProps.url !== this.props.url) {
            // New url to browse
            this.props.cleanData(),
            this.props.requestOnLoadData();
        }
    }

    public render(): React.ReactElement<{}>  {
        const { result } = this.props;
        let content = (<Loader/>);

        if (result) {
            switch (result.type) {
                case OpdsResultType.NavigationFeed:
                    content = (
                        <EntryList entries={ result.navigation } />
                    );
                    break;
                case OpdsResultType.PublicationFeed:
                    content = (
                        <EntryPublicationList publications={ result.publications } />
                    );
                    break;
                default:
                    console.log(result);
                    content = (<p>{result}</p>
                    );
                    break;
            }
        }

        return content;
    }
}

const buildOpdsRequestData = (props: BrowserResultProps) => {
    return { url: props.url };
};

export default withApi(
    BrowserResult,
    {
        operations: [
            {
                moduleId: "opds",
                methodId: "browse",
                resultProp: "result",
                buildRequestData: buildOpdsRequestData,
                onLoad: true,
            },
        ],
    },
);
