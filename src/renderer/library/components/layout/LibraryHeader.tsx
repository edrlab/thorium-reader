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
import * as stylesHeader from "readium-desktop/renderer/assets/styles/header.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SkipLink from "readium-desktop/renderer/common/components/SkipLink";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { DisplayType, IRouterLocationState } from "../../routing";
import * as HomeIcon from "readium-desktop/renderer/assets/icons/home-icon.svg";
import * as GearIcon from "readium-desktop/renderer/assets/icons/gear-icon.svg";
import * as CatalogsIcon from "readium-desktop/renderer/assets/icons/catalogs-icon.svg";
import * as ShelfIcon from "readium-desktop/renderer/assets/icons/shelf-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { Settings } from "../settings/Settings";

interface NavigationHeader {
    route: string;
    label: string;
    matchRoutes: string[];
    styles: string[];
    svg: any;
}

const headerNav: NavigationHeader[] = [
    {
        route: "/library",
        label: "homeTitle",
        matchRoutes: ["/", "/library"],
        styles: [],
        svg: HomeIcon,
    },
    {
        route: "/library/search/all",
        label: "allBooks",
        matchRoutes: ["/library/search/all"],
        styles: [],
        svg: ShelfIcon,
    },
    {
        route: "/opds",
        label: "catalogs",
        matchRoutes: ["/opds"],
        styles: [],
        svg: CatalogsIcon,
    },
    // {
    //     route: "/settings",
    //     label: "settings",
    //     matchRoutes: ["/settings"],
    //     styles: [],
    //     svg: GearIcon,
    // },
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
                className={stylesHeader.skip_link}
                anchorId="main-content"
                label={__("accessibility.skipLink")}
            />
            <nav className={stylesHeader.main_navigation_library} role="navigation" aria-label={__("header.home")}>
                <ul>
                    {
                        headerNav.map(
                            (item, index) =>
                                this.buildNavItem(item, index),
                        )
                    }
                    <li style={{position: "absolute", bottom: "10px" }}>
                        <a role={"button"}>
                            <SVG ariaHidden svg={GearIcon} />
                            <Settings />
                        </a>
                    </li>
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
                pathname === (matchRoute)
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

        const nextLocation = this.props.history.reduce(
            (pv, cv) =>
                cv?.pathname === item.route
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
                    state = {{displayType: (nextLocation.state && (nextLocation.state as IRouterLocationState).displayType) ? (nextLocation.state as IRouterLocationState).displayType : DisplayType.Grid}}
                    replace={true}
                    aria-pressed={active}
                    role={"button"}
                    className={active ? stylesButtons.button_nav_primary : ""}
                >
                    <SVG ariaHidden svg={item.svg} />
                    <h3>{
                        translate("header." + item.label)
                    }</h3>
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
