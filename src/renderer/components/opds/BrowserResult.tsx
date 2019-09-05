// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as qs from "qs";
import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { OpdsResultType, THttpGetOpdsResultView } from "readium-desktop/common/views/opds";
import { TOpdsBrowseApi } from "readium-desktop/main/api/opds";
import { withApi } from "readium-desktop/renderer/components/utils/hoc/api";
import Loader from "readium-desktop/renderer/components/utils/Loader";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { parseQueryString } from "readium-desktop/utils/url";
import EntryList from "./EntryList";
import EntryPublicationList from "./EntryPublicationList";
import MessageOpdBrowserResult from "./MessageOpdBrowserResult";

interface BrowserResultProps extends RouteComponentProps, TranslatorProps {
    url: string;
    result?: THttpGetOpdsResultView | string;
    resultIsReject?: boolean;
    cleanData: any;
    browse?: TOpdsBrowseApi;
}

export class BrowserResult extends React.Component<BrowserResultProps, null> {
    private currentUrl: string;

    public componentDidMount() {
        this.browseOpds();
    }

    public componentDidUpdate(prevProps: BrowserResultProps) {
        if (prevProps.url !== this.props.url ||
            prevProps.location.search !== this.props.location.search) {
            // New url to browse
            this.browseOpds();
        }
    }

    public render(): React.ReactElement<{}> {
        const { result, resultIsReject, __ } = this.props;
        let content = (<Loader />);

        if (resultIsReject) {
            content = (
                <MessageOpdBrowserResult
                    title={__("opds.network.reject")}
                    message={JSON.stringify(result)}
                />
            );
        } else if (typeof result === "object" && result) {
            if (result.isSuccess) {
                switch (result.data.type) {
                    case OpdsResultType.NavigationFeed:
                        content = (
                            <EntryList entries={result.data.navigation} />
                        );
                        break;
                    case OpdsResultType.PublicationFeed:
                        content = (
                            <EntryPublicationList publications={result.data.publications} />
                        );
                        break;
                    case OpdsResultType.Empty:
                        content = (
                            <MessageOpdBrowserResult title={__("opds.empty")} />
                        );
                        break;
                    default:
                        break;
                }
            } else if (result.isTimeout) {
                content = (
                    <MessageOpdBrowserResult title={__("opds.network.timeout")} />
                );
            } else {
                content = (
                    <MessageOpdBrowserResult
                        title={__("opds.network.error")}
                        message={`${result.statusCode || "unknow error code"} : ${result.statusMessage || ""}`}
                    />
                );
            }
        }

        return content;
    }

    private browseOpds() {
        const { url, location, result, browse } = this.props;
        const oldQs = parseQueryString(url.split("?")[1]);
        const search = qs.parse(location.search.replace("?", "")).search;
        let newUrl = url;
        if (search && result && typeof result === "object" && result.isSuccess && result.data.searchUrl) {
            newUrl = result.data.searchUrl;
            newUrl = this.addSearchTerms(newUrl, search) +
                Object.keys(oldQs).map((id) => `&${id}=${oldQs[id]}`).join("");
        }
        this.currentUrl = newUrl;
        this.props.cleanData();
        browse(newUrl);
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

export default withTranslator<BrowserResultProps>(withApi<BrowserResultProps>(
    withRouter(BrowserResult),
    {
        operations: [
            {
                moduleId: "opds",
                methodId: "browse",
                resultProp: "result",
                resultIsRejectProp: "resultIsReject",
                callProp: "browse",
            },
        ],
    },
));
