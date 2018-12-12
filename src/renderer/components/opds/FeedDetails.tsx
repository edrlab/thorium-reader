// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";

import Header from "./Header";

import * as styles from "readium-desktop/renderer/assets/styles/opds.css";

import { RouteComponentProps } from "react-router-dom";
import BreadCrumb from "../layout/BreadCrumb";

import OpdsEntry from "./OpdsEntry";

import { OpdsFeedView } from "readium-desktop/common/views/opds";

interface FeedDetailsProps extends RouteComponentProps {
    feed: OpdsFeedView;
}

export class FeedDetails extends React.Component<FeedDetailsProps, null> {
    public render(): React.ReactElement<{}>  {
        const { feed } = this.props;

        const breadcrumb = [{ name: "Catalogues", path: "/catalogs" }, { name: feed && feed.title }];
        return (
            <LibraryLayout>
                <Header/>
                <BreadCrumb breadcrumb={breadcrumb} search={this.props.location.search}/>
                <section id={styles.flux_list}>
                    <ul>
                        { feed && (feed as any).content.map((entry: any, index: any) =>
                            <li key={index}>
                                <OpdsEntry entry={entry} match={this.props.match}/>
                            </li>,
                        )}
                    </ul>
                </section>
            </LibraryLayout>
        );
    }
}

export default withApi(
    FeedDetails,
    {
        operations: [
            {
                moduleId: "opds",
                methodId: "getFeed",
                resultProp: "feed",
                onLoad: true,
            },
        ],
    },
);
