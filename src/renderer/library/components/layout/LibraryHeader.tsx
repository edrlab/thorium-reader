// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import * as styles from "readium-desktop/renderer/assets/styles/global.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SkipLink from "readium-desktop/renderer/common/components/SkipLink";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";

interface NavigationHeader {
    route: string;
    label: string;
    matchRoutes: string[];
    styles: string[];
}

const headerNav: NavigationHeader[] = [
    {
        route: "/library",
        label: "books",
        matchRoutes: ["/", "/library"],
        styles: [],
    },
    {
        route: "/opds",
        label: "catalogs",
        matchRoutes: ["/opds"],
        styles: [],
    },
    {
        route: "/settings",
        label: "settings",
        matchRoutes: ["/settings"],
        styles: [],
    },
];

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class Header extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        return (<>
            <SkipLink
                className={styles.skip_link}
                anchorId="main-content"
                label={__("accessibility.skipLink")}
            />
            <nav className={styles.main_navigation} role="navigation" aria-label={__("header.home")}>
                <ul>
                    {
                        headerNav.map(
                            (item, index) =>
                                this.buildNavItem(item, index),
                        )
                    }
                </ul>
            </nav>
        </>);
    }

    private buildNavItem(item: NavigationHeader, index: number) {

        if (!this.props.location) {
            return (<></>);
        }

        // because dynamic label does not pass typed i18n compilation
        const translate = this.props.__ as (str: string) => string;

        let styleClasses = [];
        const pathname = this.props.location.pathname;

        let active = false;
        for (const matchRoute of item.matchRoutes) {
            if (
                pathname.startsWith(matchRoute)
                && (
                    (pathname === "/" && matchRoute === pathname)
                    || matchRoute !== "/"
                )
            ) {
                active = true;
                styleClasses.push(styles.active);
                break;
            }
        }
        styleClasses = styleClasses.concat(item.styles);

        const nextLocation = this.props.history.reduce(
            (pv, cv) =>
                cv?.pathname?.startsWith(item.route)
                    ? {
                        ...this.props.location,
                        pathname: cv.pathname,
                    }
                    : pv,
            {
                ...this.props.location,
                pathname: item.route,
            },
        );

        return (
            <li className={classNames(...styleClasses)} key={index}>
                <Link
                    to={nextLocation}
                    replace={true}

                    aria-pressed={active}
                    role={"button"}
                >
                    {
                        translate("header." + item.label)
                    }
                </Link>
            </li>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
    history: state.history,
    locale: state.i18n.locale, // used for automatic refresh to force the rendering of header
});

export default connect(mapStateToProps)(withTranslator(Header));
