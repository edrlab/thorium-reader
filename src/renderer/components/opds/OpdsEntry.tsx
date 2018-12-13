// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import * as styles from "readium-desktop/renderer/assets/styles/opds.css";

import { Link, RouteComponentProps } from "react-router-dom";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import { PublicationView } from "readium-desktop/common/views/publication";

import Slider from "readium-desktop/renderer/components/utils/Slider";

import { PublicationCard } from "readium-desktop/renderer/components/publication";

interface OpdsEntryProps extends RouteComponentProps {
    entry?: any;
    publications?: PublicationView[];
}

export class OpdsDetails extends React.Component<OpdsEntryProps, undefined> {
    public render(): React.ReactElement<{}>  {
        const { entry, publications } = this.props;
        if (!entry || !publications) {
            return <></>;
        }
        return (
            <>
                <div className={styles.flux_infos}>
                    <Link
                        className={styles.flux_image}
                        to={"/catalogs/" + (this.props.match.params as any).opdsId + "/" + entry.name}
                        >
                            <span className={styles.flux_title}>{entry.name}</span>
                            <span className={styles.flux_subtitle}>{entry.count} livres</span>
                    </Link>
                </div>
                <Slider
                    content={
                        publications.map((pub) =>
                            <PublicationCard
                                key={pub.identifier}
                                publication={pub}
                            />,
                        )
                    }
                    className={styles.flux_slider}
                />
            </>
        );
    }
}

export default withApi(
    OpdsDetails,
    {
        operations: [
            {
                moduleId: "publication",
                methodId: "findAll",
                resultProp: "publications",
                onLoad: true,
            },
        ],
    },
);
