// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as styles from "readium-desktop/renderer/assets/styles/opds.css";

import { Link } from "react-router-dom";

import { withApi } from "readium-desktop/renderer/components/utils/api";

interface OpdsListProps {
    data: any;
}

const data = [
    {
        name: "FeedBooks",
        path: "test/path/feedbooks",
    },
    {
        name: "Flux 1",
        path: "test/path/feedbooks",
    },
    {
        name: "Flux 2",
        path: "test/path/feedbooks",
    },
    {
        name: "Flux 3",
        path: "test/path/feedbooks",
    },
];

export class OpdsList extends React.Component<{}, null> {
    public render(): React.ReactElement<{}>  {
        if (!data) {
            return <></>;
        }
        return (
            <section className={styles.opds_list}>
                { data.map((item, index) =>
                    <Link to={"/catalogs/" + item.name} key={index}>
                        <div>
                            <p>{ item.name }</p>
                        </div>
                    </Link>,
                )}
            </section>
        );
    }
}

export default withApi(
    OpdsList,
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
