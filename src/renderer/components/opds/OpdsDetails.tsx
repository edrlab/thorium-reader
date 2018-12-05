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

import { Link, RouteComponentProps } from "react-router-dom";
import BreadCrumb from "../layout/BreadCrumb";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

const data = {
    content: [
        {
            name: "Entry 1",
            count: 56,
        },
    ],
    name: "Nom du flux",
};

export class OpdsDetails extends React.Component<RouteComponentProps, null> {
    public render(): React.ReactElement<{}>  {
        if (!data) {
            return <></>;
        }

        const breadcrumb = [{ name: "Catalogues", path: "/catalogs" }, { name: data.name }];
        return (
            <LibraryLayout>
                <Header/>
                <BreadCrumb breadcrumb={breadcrumb} search={this.props.location.search}/>
                <section id={styles.flux_list}>
                    <ul>
                        { data.content.map((item) =>
                            <Link to={"catalogs/" + (this.props.match.params as any).opdsId + "/" + item.name}>
                                <li className={styles.flux_element}>
                                    <span className={styles.flux_title}>{item.name}</span>
                                    <span className={styles.flux_subtitle}>{item.count} livres</span>
                                    <SVG svg={ArrowIcon} aria-hidden="true"/>
                                </li>
                            </Link>,
                        )}
                    </ul>
                </section>
            </LibraryLayout>
        );
    }
}

export default withApi(
    OpdsDetails,
    {
        operations: [
            // {
            //     moduleId: "opds",
            //     methodId: "findAll",
            //     resultProp: "data",
            //     onLoad: true,
            // },
        ],
    },
);
