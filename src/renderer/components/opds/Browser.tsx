// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";
import { parseQueryString } from "readium-desktop/utils/url";
import { IOpdsBrowse } from "src/renderer/routing";

import BreadCrumb, { BreadCrumbItem } from "../layout/BreadCrumb";
import BrowserResult from "./BrowserResult";
import Header from "./Header";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, RouteComponentProps<IOpdsBrowse>, ReturnType<typeof mapStateToProps> {
}

class Browser extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<IProps>  {
        const breadcrumb = this.buildBreadcrumb();
        let url: string | undefined;

        if (this.props.navigation.length > 0) {
            // get the last link from navigation array print in breadcrumb
            url = this.props.navigation[this.props.navigation.length - 1].url;
        }

        const parsedResult = parseQueryString(this.props.location.search);

        const secondaryHeader = <Header displayType={parsedResult.displayType}/>;

        return (
            <LibraryLayout secondaryHeader={secondaryHeader} mainClassName={styles.opdsBrowse}>
                <BreadCrumb
                    className={styles.opdsBrowseBreadcrumb}
                    breadcrumb={breadcrumb}
                    search={this.props.location.search}
                />
                {url &&
                    <BrowserResult url={url} breadcrumb={breadcrumb}/>
                }
            </LibraryLayout>
        );
    }

    private buildBreadcrumb() {
        const { match, navigation } = this.props;
        const breadcrumb: BreadCrumbItem[] = [];
        const parsedQuerryString = parseQueryString(this.props.location.search);
        const search = parsedQuerryString.search;

        // Add root page
        breadcrumb.push({
            name: this.props.__("opds.breadcrumbRoot"),
            path: "/opds",
        });
        const rootFeedIdentifier = (match.params as any).opdsId;

        if (search) {
            const link = navigation[0];
            if (link) {
                breadcrumb.push({
                    name: decodeURI(link.title),
                    path: buildOpdsBrowserRoute(
                        rootFeedIdentifier,
                        link.title,
                        link.url,
                        1,
                    ),
                });
            }
            breadcrumb.push({
                name: decodeURI(search),
            });
            return breadcrumb;
        }

        navigation.forEach((link, index: number) => {
            breadcrumb.push({
                name: link.title,
                path: buildOpdsBrowserRoute(
                    rootFeedIdentifier,
                    link.title,
                    link.url,
                    index + 1,
                ),
            });
        });

        return breadcrumb;
    }
}

const mapStateToProps = (state: RootState, _props: IBaseProps) => ({
    navigation: state.opds.browser.navigation,
});

export default connect(mapStateToProps, undefined)(withRouter(withTranslator(Browser)));
