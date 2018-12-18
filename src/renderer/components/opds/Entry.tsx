// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import { withApi } from "readium-desktop/renderer/components/utils/api";

import * as styles from "readium-desktop/renderer/assets/styles/opds.css";

import { Link, RouteComponentProps, withRouter } from "react-router-dom";

import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";

import SVG from "readium-desktop/renderer/components/utils/SVG";

import { PublicationView } from "readium-desktop/common/views/publication";

import Slider from "readium-desktop/renderer/components/utils/Slider";

import { PublicationCard } from "readium-desktop/renderer/components/publication";

import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";

interface EntryProps extends RouteComponentProps {
    level: number;
    entry: any;
    publications?: PublicationView[];
}

export class OpdsDetails extends React.Component<EntryProps, undefined> {
    public render(): React.ReactElement<{}>  {
        const { entry, publications } = this.props;

        if (!entry || !publications) {
            return <></>;
        }

        // Build feedBreadcrumb
        const { level, match } = this.props;
        const matchParams = match.params as any;
        const rootFeedIdentifier = matchParams.opdsId;
        const route = buildOpdsBrowserRoute(
            rootFeedIdentifier,
            entry.title,
            entry.url,
            level,
        );

        return (
            <>
                <div className={styles.flux_infos}>
                    <Link
                        className={styles.flux_image}
                        to={ route }
                    >
                        <span className={styles.flux_title}>{entry.title}</span>
                        {
                            (entry.publicationCount) ?
                                (
                                    <span className={styles.flux_subtitle}>
                                        {entry.publicationCount} livres
                                    </span>
                                ) :
                                (<></>)
                        }
                    </Link>
                </div>
                {/* <Slider
                    content={
                        publications.map((pub) =>
                            <PublicationCard
                                key={pub.identifier}
                                publication={pub}
                            />,
                        )
                    }
                    className={styles.flux_slider}
                /> */}
            </>
        );
    }
}

export default withApi(
    withRouter(OpdsDetails),
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
