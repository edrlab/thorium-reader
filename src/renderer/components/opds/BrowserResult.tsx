// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as qs from "qs";
import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { TOpdsApiBrowse } from "readium-desktop/main/api/opds";
import { apiAction } from "readium-desktop/renderer/apiAction";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
// import { BreadCrumbItem } from "readium-desktop/renderer/components/layout/BreadCrumb";
import {
    TranslatorProps,
    withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import Loader from "readium-desktop/renderer/components/utils/Loader";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
// import { parseQueryString } from "readium-desktop/utils/url";

import EntryList from "./EntryList";
import EntryPublicationList from "./EntryPublicationList";
import MessageOpdBrowserResult from "./MessageOpdBrowserResult";

interface BrowserResultProps extends RouteComponentProps, TranslatorProps {
}

interface IState {
    browserResult: ReturnPromiseType<TOpdsApiBrowse> | undefined;
    browserError: string | undefined;
}

export class BrowserResult extends React.Component<BrowserResultProps, IState> {
    // private currentUrl: string;

    constructor(props: BrowserResultProps) {
        super(props);
        this.state = {
            browserError: undefined,
            browserResult: undefined,
        };
    }

    public componentDidMount() {
        this.browseOpds(this.props.url);
    }

    public componentDidUpdate(prevProps: BrowserResultProps) {
        if (prevProps.url !== this.props.url ||
            prevProps.location.search !== this.props.location.search) {
            // New url to browse
            this.browseOpds(this.props.url);
        }
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        const { browserError, browserResult } = this.state;
        let content = (<Loader />);

        if (!navigator.onLine) {
            content = (
                <MessageOpdBrowserResult
                    title={__("opds.network.noInternet")}
                    message={__("opds.network.noInternetMessage")}
                />
            );
        } else if (browserError) {
            content = (
                <MessageOpdBrowserResult
                    title={__("opds.network.reject")}
                    message={browserError}
                />
            );
        } else if (browserResult) {
            if (browserResult.isSuccess) {
                if (browserResult.data.navigation) {
                    content = (
                        <EntryList entries={browserResult.data.navigation} />
                    );
                } else if (browserResult.data.publications) {
                    content = (
                            <EntryPublicationList
                                publications={browserResult.data.publications}
                                links={browserResult.data.links}
                                pageInfo={browserResult.data.metadata}
                            />
                        );
                } else {
                    content = (
                        <MessageOpdBrowserResult title={__("opds.empty")} />
                    );
                }
            } else if (browserResult.isTimeout) {
                content = (
                    <MessageOpdBrowserResult title={__("opds.network.timeout")} />
                );
            } else {
                content = (
                    <MessageOpdBrowserResult
                        title={__("opds.network.error")}
                        message={`${browserResult.statusCode || "unknow error code"} : ${browserResult.statusMessage || ""}`}
                    />
                );
            }
        }

        return <div className={styles.opdsBrowseContent}>
            {content}
        </div>;
    }

    private browseOpds(url: string) {
        // const { location } = this.props;
        // const { browserResult } = this.state;
        // const oldQs = parseQueryString(url.split("?")[1]);
        // const search = qs.parse(location.search.replace("?", "")).search;
        const newUrl = url;
        /*
        if (search && browserResult && browserResult.isSuccess && browserResult.data.links.search) {
            newUrl = browserResult.data.links.search[0].Href;
            newUrl = this.addSearchTerms(newUrl, search) +
                Object.keys(oldQs).map((id) => `&${id}=${oldQs[id]}`).join("");
        }
        */

        // this.currentUrl = newUrl;

        // reset browserResult to display loader spinner
        this.setState({
            browserResult: undefined,
        });

        // fetch newUrl
        apiAction("opds/browse", newUrl).then((result) => this.setState({
            browserResult: result,
            browserError: undefined,
        })).catch((error) => this.setState({
            browserResult: undefined,
            browserError: error,
        }));
    }

    // TODO : Create a new function to parse the search url in function of TypeLink
    // currently broken
    /*
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
    */
}

export default withTranslator(withRouter(BrowserResult));
