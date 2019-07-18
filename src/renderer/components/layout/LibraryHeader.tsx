// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";

import * as classNames from "classnames";

import { withRouter } from "react-router";

import { Link } from "react-router-dom";

import { RouteComponentProps } from "react-router-dom";

import SkipLink from "readium-desktop/renderer/components/utils/SkipLink";
import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import * as styles from "readium-desktop/renderer/assets/styles/header.css";

const headerNav = [
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
        styles: [styles.preferences],
    },
];

export interface HeaderProps extends RouteComponentProps, TranslatorProps { }

export class Header extends React.Component<HeaderProps, undefined> {
    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        return (<>
            <SkipLink
                className={styles.skip_link}
                label={__("accessibility.skipLink")}
            />
            <nav className={styles.main_navigation} role="navigation" aria-label={ __("header.home")}>
                <ul>
                    { headerNav.map((item, index: number) => {
                        return this.buildNavItem(item, index, __);
                    })}
                </ul>
            </nav>
        </>);
    }

    private buildNavItem(item: any, index: number, __: any) {
        const jsn = "header." + item.label;
        if (!this.props.location) {
            return (<></>);
        }
        let styleClasses = [];
        const pathname = this.props.match.path;

        for (const matchRoute of item.matchRoutes) {
            if (pathname.startsWith(matchRoute)
            && ((pathname === "/" && matchRoute === pathname) || matchRoute !== "/")) {
                styleClasses.push(styles.active);
                break;
            }
        }

        styleClasses = styleClasses.concat(item.styles);

        return (
            <li className={classNames(...styleClasses)} key={ index }>
                <Link to={ item.route } replace={true}>
                    { __(jsn) }
                </Link>
            </li>
        );
    }
}

export default withTranslator(withRouter(Header));
