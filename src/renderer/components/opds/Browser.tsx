// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as debug_ from "debug";
import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { OpdsLinkView } from "readium-desktop/common/views/opds";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";
import { parseQueryString } from "readium-desktop/utils/url";
import { IOpdsBrowse } from "src/renderer/routing";

import BreadCrumb, { BreadCrumbItem } from "../layout/BreadCrumb";
import BrowserResult from "./BrowserResult";
import Header from "./Header";

// Logger
// const debug = debug_("readium-desktop:src/renderer/components/opds/browser");

interface Props extends RouteComponentProps<IOpdsBrowse>, TranslatorProps {
    navigation: OpdsLinkView[];
}

export class Browser extends React.Component<Props> {
    public render(): React.ReactElement<Props>  {
        const breadcrumb = this.buildBreadcrumb();
        let url: string | undefined;

        if (this.props.navigation.length > 0) {
            // get the last link from navigation array print in breadcrumb
            url = this.props.navigation[this.props.navigation.length - 1].url;
        }

        const secondaryHeader = <Header/>;

        return (
            <LibraryLayout secondaryHeader={secondaryHeader}>
                <BreadCrumb breadcrumb={breadcrumb} search={this.props.location.search} />
                {url &&
                    <BrowserResult url={url} />
                }
            </LibraryLayout>
        );
    }

    private buildBreadcrumb() {
        const { match, navigation } = this.props;
        const breadcrumb: BreadCrumbItem[] = [];

        // Add root page
        breadcrumb.push({
            name: this.props.__("opds.breadcrumbRoot"),
            path: "/opds",
        });
        const rootFeedIdentifier = match.params.opdsId;
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

        const parsedQuerryString = parseQueryString(this.props.location.search);
        const search = parsedQuerryString.search;

        if (search) {
            breadcrumb.push({
                name: search,
            });
        }

        return breadcrumb;
    }
}

const mapStateToProps = (state: RootState, __: any) => {
    const navigation = state.opds.browser.navigation;

    return {
        navigation,
    };
};

export default withRouter(withTranslator(connect(mapStateToProps, undefined)(Browser)));
