// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Link, matchPath } from "react-router-dom";
import { IOpdsNavigationLinkView } from "readium-desktop/common/views/opds";
import * as styles from "readium-desktop/renderer/assets/styles/opds.css";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { IOpdsBrowse, routes } from "readium-desktop/renderer/library/routing";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps {
    level?: number;
    entry: IOpdsNavigationLinkView;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class Entry extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}>  {
        const { entry } = this.props;

        const { level } = this.props;
        const rootFeedIdentifier = matchPath<IOpdsBrowse>(
            this.props.location.pathname, routes["/opds/browse"],
        ).params.opdsId;
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
                        to={{
                            ...this.props.location,
                            pathname: route,
                        }}
                    >
                        <span className={styles.flux_title}>{entry.title}</span>
                        {
                            entry.subtitle && entry.subtitle !== entry.title ?
                                <span className={styles.flux_subtitle}>
                                    {entry.subtitle}
                                </span> :
                                <></>
                        }
                        {
                            (entry.numberOfItems) ?
                                (
                                    <span className={styles.flux_subtitle}>
                                        {entry.numberOfItems}
                                    </span>
                                ) :
                                (<></>)
                        }
                    </Link>
                </div>
                {/* <Slider
                    content={
                        opdsPublicationViews.map((pub) =>
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

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(Entry);
