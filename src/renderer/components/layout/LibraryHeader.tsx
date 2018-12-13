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

import { TranslatorProps, withTranslator } from "readium-desktop/renderer/components/utils/translator";

import * as styles from "readium-desktop/renderer/assets/styles/header.css";

const headerNav = [
    {
        route: "/library",
        label: "Mes livres",
        matchRoutes: ["/", "/library"],
        styles: [],
    },
    {
        route: "/opds",
        label: "Catalogues",
        matchRoutes: ["/opds"],
        styles: [],
    },
    {
        route: "/settings",
        label: "Préférences",
        matchRoutes: ["/settings"],
        styles: [styles.preferences],
    },
];

export interface HeaderProps extends RouteComponentProps, TranslatorProps { }

export class Header extends React.Component<HeaderProps, undefined> {
    public render(): React.ReactElement<{}> {
        return (
            <nav className={styles.main_navigation} role="navigation" aria-label="Menu principal">
                <ul>
                    {
                        headerNav.map((item, index: number) => {
                            return this.buildNavItem(item, index);
                        })
                    }
                </ul>
            </nav>
        );
    }

    private buildNavItem(item: any, index: number) {
        if (!this.props.location) {
            return (<></>);
        }

        let active = false;
        let styleClasses = [];
        const pathname = this.props.match.path;

        for (const matchRoute of item.matchRoutes) {
            if (pathname.startsWith(matchRoute)
            && ((pathname === "/" && matchRoute === pathname) || matchRoute !== "/")) {
                active = true;
                styleClasses.push(styles.active);
                break;
            }
        }

        styleClasses = styleClasses.concat(item.styles);

        return (
            <li className={classNames(...styleClasses)} key={ index }>
                <Link to={ item.route } replace={true}>
                    { this.props.__(item.label) }
                </Link>
            </li>
        );
    }
}

export default withTranslator(withRouter(Header));
