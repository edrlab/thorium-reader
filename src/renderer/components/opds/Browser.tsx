// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { connect } from "react-redux";

import { RouteComponentProps } from "react-router-dom";

import BreadCrumb, { BreadCrumbItem } from "../layout/BreadCrumb";

import Header from "./Header";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import { OpdsLinkView } from "readium-desktop/common/views/opds";

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";

import { RootState } from "readium-desktop/renderer/redux/states";
import BrowserResult from "./BrowserResult";

interface FeedDetailsProps extends RouteComponentProps, TranslatorProps {
    navigation: OpdsLinkView[];
}

export class Browser extends React.Component<FeedDetailsProps, null> {
    public render(): React.ReactElement<{}>  {
        const breadcrumb = this.buildBreadcrumb();
        let browserResult = (<></>);

        if (this.props.navigation.length > 0) {
            const link = this.props.navigation[this.props.navigation.length - 1];
            const url = link.url;
            browserResult = (<BrowserResult url={ url } />);
        }

        const secondaryHeader = <Header/>;

        return (
            <LibraryLayout secondaryHeader={secondaryHeader}>
                <BreadCrumb breadcrumb={breadcrumb} search={this.props.location.search}/>
                { browserResult }
            </LibraryLayout>
        );
    }

    private buildBreadcrumb(): BreadCrumbItem[] {
        const { match, navigation } = this.props;
        const breadcrumb: any = [];

        // Add root page
        breadcrumb.push({
            name: this.props.__("opds.breadcrumbRoot"),
            path: "/opds",
        });
        const rootFeedIdentifier = (match.params as any).opdsId;
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

const mapStateToProps = (state: RootState, __: any) => {
    const navigation = state.opds.browser.navigation;

    return {
        navigation,
    };
};

export default withTranslator(connect(mapStateToProps, undefined)(Browser));
