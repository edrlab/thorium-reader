// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as qs from "qs";
import * as React from "react";
import { connect } from "react-redux";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { OpdsResultType } from "readium-desktop/common/views/opds";
import { TOpdsApiBrowse } from "readium-desktop/main/api/opds";
import { apiAction } from "readium-desktop/renderer/apiAction";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import { BreadCrumbItem } from "readium-desktop/renderer/components/layout/BreadCrumb";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import Loader from "readium-desktop/renderer/components/utils/Loader";
import { RootState } from "readium-desktop/renderer/redux/states";
import { IOpdsBrowse } from "readium-desktop/renderer/routing";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";
import { ReturnPromiseType } from "readium-desktop/typings/promise";
import { parseQueryString } from "readium-desktop/utils/url";

import OPDSAuth from "./Auth";
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
interface IProps extends IBaseProps, RouteComponentProps<IOpdsBrowse>, ReturnType<typeof mapStateToProps> {
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
        this.browseOpds = this.browseOpds.bind(this);
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
        let shelfContent: React.ReactElement<{}> | undefined;

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
            if (browserResult.isSuccess ||
                (browserResult.isFailure && browserResult.statusCode === 401 && browserResult.data)) {

                if (browserResult.data.urls.shelf) {

                    // Build feedBreadcrumb
                    const { level, match } = this.props;
                    const rootFeedIdentifier = match.params.opdsId;
                    const route = buildOpdsBrowserRoute(
                        rootFeedIdentifier,
                        __("opds.shelf"),
                        browserResult.data.urls.shelf,
                        level,
                    );

                    shelfContent = (
                        <h3>
                            <Link
                                className={styles.flux_infos}
                                to={route}
                            >
                                <span className={styles.flux_title}>{__("opds.shelf")}</span>
                            </Link>
                            <br></br>
                        </h3>);
                }
                switch (browserResult.data.type) {
                    case OpdsResultType.Auth:
                        content = (
                            <OPDSAuth browseOpds={this.browseOpds} url={this.props.url} data={browserResult.data}/>
                        );
                        break;
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
                    case OpdsResultType.MixedFeed:
                        content = (<>
                            {browserResult.data.navigation &&
                            <EntryList entries={browserResult.data.navigation} />}

                            {browserResult.data.opdsPublicationViews &&
                            <EntryPublicationList
                                opdsPublicationViews={browserResult.data.opdsPublicationViews}
                                goto={this.goto}
                                urls={browserResult.data.urls}
                                page={browserResult.data.page}
                                currentPage={this.state.currentResultPage}
                            />}

                            {browserResult.data.groups && browserResult.data.groups.map((group, i) => {
                                return (<section key={i}>
                                    <br></br>
                                    <h3>{group.title}</h3>
                                    {group.navigation &&
                                    <EntryList entries={group.navigation} />}
                                    <hr></hr>
                                    {group.opdsPublicationViews &&
                                    <EntryPublicationList
                                        opdsPublicationViews={group.opdsPublicationViews}
                                        goto={this.goto}
                                        urls={{}}
                                        page={undefined}
                                        currentPage={-1}
                                    />}
                                </section>);
                            })}
                        </>);
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
            {shelfContent ? shelfContent : undefined}
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

const mapStateToProps = (state: RootState, _props: IBaseProps) => ({
    level: state.opds.browser.navigation.length + 1,
});

export default connect(mapStateToProps, undefined)(withTranslator(withRouter(BrowserResult)));
