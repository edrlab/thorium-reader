// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";

import * as React from "react";
import { connect } from "react-redux";
import { Link, matchPath } from "react-router-dom";
import { IOpdsNavigationLinkView } from "readium-desktop/common/views/opds";

import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { DisplayType, IOpdsBrowse, IRouterLocationState, routes } from "readium-desktop/renderer/library/routing";

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

        const rootFeedIdentifier = matchPath<keyof IOpdsBrowse, string>(
            routes["/opds/browse"].path,
            this.props.location.pathname,
        ).params.opdsId;

        const route = buildOpdsBrowserRoute(
            rootFeedIdentifier,
            entry.title,
            entry.url,
            level,
        );

        return (
            <Link
                className={stylesButtons.button_transparency}
                to={{
                    ...this.props.location,
                    pathname: route,
                }}
                state={{ displayType: (this.props.location.state && (this.props.location.state as IRouterLocationState).displayType) ? (this.props.location.state as IRouterLocationState).displayType : DisplayType.Grid }}
                onClick={(e) => {
                    if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) {
                        e.preventDefault();
                        e.currentTarget.click();
                    }
                }}
                onKeyDown={(e) => {
                    // if (e.code === "Space") {
                    if (e.key === " " || e.altKey || e.ctrlKey) {
                        e.preventDefault(); // prevent scroll
                    }
                }}
                onKeyUp={(e) => {
                    // Includes screen reader tests:
                    // if (e.code === "Space") { WORKS
                    // if (e.key === "Space") { DOES NOT WORK
                    // if (e.key === "Enter") { WORKS
                    if (e.key === " ") { // WORKS
                        e.preventDefault();
                        e.currentTarget.click();
                    }
                }}
            >
                <span>
                    <span title={entry.subtitle ? entry.subtitle : entry.title}>{entry.title}</span>
                    {
                        (entry.subtitle && entry.subtitle !== entry.title) ?
                        (<span title={entry.subtitle} aria-label={entry.subtitle}>
                            <br/>{entry.subtitle.substr(0, 40) + (entry.subtitle.length > 40 ? "..." : "")}
                        </span>) :
                        (<></>)
                    }
                </span>
                {
                    (entry.numberOfItems) ?
                        (
                            <span className={stylesCatalogs.numberOfItems}>
                                ({entry.numberOfItems})
                            </span>
                        ) :
                        (<></>)
                }
            </Link>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(Entry);
