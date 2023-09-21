// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";
import * as stylesHeader from "readium-desktop/renderer/assets/styles/header.css";
import SkipLink from "readium-desktop/renderer/common/components/SkipLink";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { DisplayType, IRouterLocationState } from "../../routing";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";

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


const Header = () => {
    const [__] = useTranslator();
    return (<>
        <SkipLink
            className={stylesHeader.skip_link}
            anchorId="main-content"
            label={__("accessibility.skipLink")}
        />
        <nav className={stylesHeader.main_navigation_library} role="navigation" aria-label={__("header.home")}>
            <ul>
                {
                    headerNav.map(
                        (item, index) =>
                            <NavItem
                            item={item}
                            index={index}
                            key={index} />,
                    )
                }
            </ul>
        </nav>
    </>);
};

const NavItem = (props: {item: NavigationHeader, index: number}) => {
    const location = useSelector((state: ILibraryRootState) => state.router.location);
    const history = useSelector((state: ILibraryRootState) => state.history);
    const {item, index} = props;

    if (!location) {
        return (<></>);
    }

    let styleClasses = [];
    const pathname = location.pathname;

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
            styleClasses.push(stylesHeader.active);
            break;
        }
    }
    styleClasses = styleClasses.concat(item.styles);

    const nextLocation = history.reduce(
        (pv, cv) =>
            cv?.pathname?.startsWith(item.route)
                ? {
                    ...location,
                    pathname: cv.pathname,
                }
                : pv,
        {
            ...location,
            pathname: item.route,
        },
    );
    const [__] = useTranslator();
    const translate = __ as (str: string) => string;
    return (
        <li className={classNames(...styleClasses)} key={index}>
            <Link
                to={nextLocation}
                state = {{displayType: (nextLocation.state && (nextLocation.state as IRouterLocationState).displayType) ? (nextLocation.state as IRouterLocationState).displayType : DisplayType.Grid}}

                replace={true}

                aria-pressed={active}
                role={"button"}
            >
                {
                    translate(("header." + item.label) as any)
                }
            </Link>
        </li>
    );
};

export default Header;
