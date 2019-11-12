// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as qs from "qs";
import * as React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { OpdsResultType } from "readium-desktop/common/views/opds";
import { TOpdsApiBrowse } from "readium-desktop/main/api/opds";
import { apiAction } from "readium-desktop/renderer/apiAction";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import { BreadCrumbItem } from "readium-desktop/renderer/components/layout/BreadCrumb";
import {
    TranslatorProps,
    withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import Loader from "readium-desktop/renderer/components/utils/Loader";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { parseQueryString } from "readium-desktop/utils/url";

import EntryList from "./EntryList";
import EntryPublicationList from "./EntryPublicationList";
import MessageOpdBrowserResult from "./MessageOpdBrowserResult";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    url: string;
    breadcrumb: BreadCrumbItem[];
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, RouteComponentProps {
}

interface IState {
    browserResult: ReturnPromiseType<TOpdsApiBrowse> | undefined;
    browserError: string | undefined;
    currentResultPage: number;
}

export class BrowserResult extends React.Component<IProps, IState> {
    private currentUrl: string;

    constructor(props: IProps) {
        super(props);
        this.state = {
            browserError: undefined,
            browserResult: undefined,
            currentResultPage: 1,
        };

        this.goto = this.goto.bind(this);
    }

    public componentDidMount() {
        this.browseOpds(this.props.url);
    }

    public componentDidUpdate(prevProps: IProps) {
        if (prevProps.url !== this.props.url ||
            prevProps.location.search !== this.props.location.search) {
            // New url to browse
            this.browseOpds(this.props.url);
        }

        if (this.props.breadcrumb !== prevProps.breadcrumb) {
            this.setState({currentResultPage: 1});
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
                switch (browserResult.data.type) {
                    case OpdsResultType.NavigationFeed:
                        content = (
                            <EntryList entries={browserResult.data.navigation} />
                        );
                        break;
                    case OpdsResultType.PublicationFeed:
                        content = (
                            <EntryPublicationList
                                opdsPublicationViews={browserResult.data.opdsPublicationViews}
                                goto={this.goto}
                                urls={browserResult.data.urls}
                                page={browserResult.data.page}
                                currentPage={this.state.currentResultPage}
                            />
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
        const { location } = this.props;
        const { browserResult } = this.state;
        const oldQs = parseQueryString(url.split("?")[1]);
        const search = qs.parse(location.search.replace("?", "")).search;
        let newUrl = url;
        if (search && browserResult && browserResult.isSuccess && browserResult.data.urls.search) {
            newUrl = browserResult.data.urls.search;
            newUrl = this.addSearchTerms(newUrl, search) +
                Object.keys(oldQs).map((id) => `&${id}=${oldQs[id]}`).join("");
        }

        this.currentUrl = newUrl;

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

    private goto(url: string, page: number) {
        this.browseOpds(url);
        this.setState({currentResultPage: page});
    }
}

export default withTranslator(withRouter(BrowserResult));
