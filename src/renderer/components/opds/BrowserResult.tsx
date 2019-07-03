// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { RouteComponentProps, withRouter } from "react-router-dom";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import {
    OpdsResultType,
    OpdsResultView,
} from "readium-desktop/common/views/opds";

import { TranslatorProps } from "readium-desktop/renderer/components/utils/translator";

import Empty from "./Empty";
import EntryList from "./EntryList";
import EntryPublicationList from "./EntryPublicationList";

import Loader from "readium-desktop/renderer/components/utils/Loader";

import * as qs from "qs";
import { parseQueryString } from "readium-desktop/utils/url";

interface BrowserResultProps extends RouteComponentProps, TranslatorProps {
    url: string;
    search?: string;
    result?: OpdsResultView;
    cleanData: any;
    requestOnLoadData: any;
    browse?: any;
}

export class BrowserResult extends React.Component<BrowserResultProps, null> {
    private currentUrl: string;
    public componentDidMount() {
        this.browseOpds();
    }
    public componentDidUpdate(prevProps: BrowserResultProps) {
        if (prevProps.url !== this.props.url || prevProps.location.search !== this.props.location.search) {
            // New url to browse
            this.browseOpds();
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
                case OpdsResultType.Empty:
                    // TRANSLATE
                    content = (
                        <Empty />
                    );
                    break;
                default:
                    break;
            }
        }

        return content;
    }

    private browseOpds() {
        const {url, location, result, browse} = this.props;
        const oldQs = parseQueryString(url.split("?")[1]);
        const search = qs.parse(location.search.replace("?", "")).search;
        let newUrl = url;
        if (search && result) {
            newUrl = (result as any).searchUrl;
            newUrl = this.addSearchTerms(newUrl, search) +
                Object.keys(oldQs).map((id) => `&${id}=${oldQs[id]}`).join("");
        }
        this.currentUrl = newUrl;
        this.props.cleanData();
        browse({url: newUrl});
    }

    private addSearchTerms(url: string, search: string) {
        const opds1: boolean = url.search("{searchTerms}") !== -1;
        if (opds1) {
            return url.replace("{searchTerms}", search);
        } else {
            const searchTemplate = url.match(/{\?(.*?)}/g);
            let newUrl = url;
            if (searchTemplate) {
                const searchOptions = searchTemplate[0].replace("{?", "").replace("}", "").split(",");
                newUrl = url.replace(/{\?(.*?)}/g, "?");
                if (searchOptions.find((value) => value === "query")) {
                    newUrl += `query=${search}`;
                }
            } else {
                const splitedCurrentUrl = this.currentUrl.split("?");
                const parsedQueryString = parseQueryString(splitedCurrentUrl[1]);
                parsedQueryString.query = search;
                const queryString = Object.keys(parsedQueryString).map((key) => `${key}=${search}`);
                newUrl = splitedCurrentUrl[0] + "?" + queryString.join("&");
            }
            return newUrl;
        }
    }
}

export default withApi(
    withRouter(BrowserResult),
    {
        operations: [
            {
                moduleId: "opds",
                methodId: "browse",
                resultProp: "result",
                callProp: "browse",
            },
        ],
    },
);
