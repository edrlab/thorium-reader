// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as classNames from "classnames";
import * as React from "react";
import { withRouter } from "react-router";
import { Link, RouteComponentProps } from "react-router-dom";
import { I18nTyped } from "readium-desktop/common/services/translator";
import * as styles from "readium-desktop/renderer/assets/styles/header.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SkipLink from "readium-desktop/renderer/components/utils/SkipLink";

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
    // // DownloadsList
    // {
    //     route: "/downloads",
    //     label: "downloads",
    //     matchRoutes: ["/downloads"],
    //     styles: [],
    // },
    {
        route: "/settings",
        label: "settings",
        matchRoutes: ["/settings"],
        styles: [styles.preferences],
    },
];

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, RouteComponentProps {
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
            <nav className={styles.main_navigation} role="navigation" aria-label={ __("header.home")}>
                <ul>
                    { headerNav.map((item, index: number) => {
                        return this.buildNavItem(item, index, __);
                    })}
                </ul>
            </nav>
        </>);
    }

    private buildNavItem(item: NavigationHeader, index: number, __: I18nTyped) {
        if (!this.props.location) {
            return (<></>);
        }

        // because dynamic label does not pass typed i18n compilation
        const translate = __ as (str: string) => string;

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
                    { translate("header." + item.label) }
                </Link>
            </li>
        );
    }
}

export default withTranslator(withRouter(Header));
