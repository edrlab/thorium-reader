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

import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";

interface EntryProps extends RouteComponentProps {
    level: number;
    entry: any;
}

export class Entry extends React.Component<EntryProps, undefined> {
    public render(): React.ReactElement<{}>  {
        const { entry } = this.props;

        if (!entry) {
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
                <div>
                    <Link
                        className={styles.flux_infos}
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
                        <div className={styles.flux_image}>
                            <SVG svg={ArrowIcon} />
                        </div>
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

export default withRouter(Entry);
