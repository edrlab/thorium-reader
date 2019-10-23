// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { Link, RouteComponentProps, withRouter } from "react-router-dom";
import { OpdsLinkView } from "readium-desktop/common/views/opds";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/baseline-arrow_forward_ios-24px.svg";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { IOpdsBrowse } from "readium-desktop/renderer/routing";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";

interface EntryProps extends RouteComponentProps<IOpdsBrowse> {
    level?: number;
    entry: OpdsLinkView;
}

class Entry extends React.Component<EntryProps, undefined> {
    public render(): React.ReactElement<{}>  {
        const { entry } = this.props;

        // Build feedBreadcrumb
        const { level, match } = this.props;
        const rootFeedIdentifier = match.params.opdsId;
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
                        {entry.subtitle ? <span className={styles.flux_subtitle}>{entry.subtitle}</span> : <></>}
                        {
                            (entry.publicationCount) ?
                                (
                                    // FIXME livres in french
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
