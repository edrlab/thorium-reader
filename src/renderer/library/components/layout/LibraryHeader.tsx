// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesHeader from "readium-desktop/renderer/assets/styles/header.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";

import classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/common/components/hoc/translator";
import SkipLink from "readium-desktop/renderer/common/components/SkipLink";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { DisplayType, IRouterLocationState } from "../../routing";
import * as HomeIcon from "readium-desktop/renderer/assets/icons/home-icon.svg";
import * as CatalogsIcon from "readium-desktop/renderer/assets/icons/catalogs-icon.svg";
import * as ShelfIcon from "readium-desktop/renderer/assets/icons/shelf-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { Settings } from "../settings/Settings";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import { getStore } from "../../createStore";
import { IProfile } from "readium-desktop/common/redux/states/profile";
import { buildOpdsBrowserRoute } from "../../opds/route";
// import { WizardModal } from "../Wizard";

interface NavigationHeader {
    route: string;
    label: string;
    matchRoutes: string[];
    searchEnable?: boolean;
    styles: string[];
    svg: any;
    type?: "navigation" | "separator";
}

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

interface IState {
  themeApplied: boolean;
  logo?: {href: string, type: string};
}

class Header extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);

        this.state = {
            themeApplied: false,
            logo: undefined,
        };
    }
    private unsubscribe: () => void;

    componentDidMount(): void {
        const store = getStore();
        const profile = store.getState().profile;
        this.applySupplierLogo(profile);

        this.unsubscribe = store.subscribe(() => {
            const newProfile = store.getState().profile;
            this.applySupplierLogo(newProfile);
        });
    }

    private applySupplierLogo(profile: IProfile): void {
        const logo = profile.images?.filter((object) => object.rel === "logo")[0];

        this.setState({ themeApplied: true, logo });
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        const { logo } = this.state;

        const headerNav: NavigationHeader[] = [];

    headerNav.push({
        route: "/home",
        label: this.props.__("header.homeTitle"),
        matchRoutes: ["/", "/home"],
        searchEnable: true,
        styles: [],
        svg: HomeIcon,
        }); 

        headerNav.push({
        route: "/library",
        label: this.props.__("header.allBooks"),
        matchRoutes: ["/library"],
        searchEnable: false,
        styles: [],
        svg: ShelfIcon,
        });

        if (this.props.profile.name === "Thorium" || this.props.profile.show_catalogs === true) {
        headerNav.push({
            route: "/opds",
            label: this.props.__("header.catalogs"),
            matchRoutes: ["/opds"],
            searchEnable: true,
            styles: [],
            svg: CatalogsIcon,
        });
        }
        if (this.props.profile.name !== "Thorium" && this.props.profile?.navigation?.length > 0) {
            headerNav.push({
                route: "",
                label: "",
                matchRoutes: [],
                searchEnable: false,
                styles: ["separator"],
                svg: CatalogsIcon,
                type: "separator",
            });
            this.props.profile?.navigation?.forEach((feed) => {
                const feedRoute = buildOpdsBrowserRoute(
                    this.props.profile?.id?.toString(),
                    feed.title,
                    feed.href,
                );
                headerNav.push({
                route: feedRoute,
                label: feed.title,
                matchRoutes: [feedRoute],
                searchEnable: true,
                styles: [],
                svg: CatalogsIcon,
                });
            });
        }
        // {
        //     route: "/settings",
        //     label: "settings",
        //     matchRoutes: ["/settings"],
        //     styles: [],
        //     svg: GearIcon,
        // },

        const hasLogo: boolean = logo && (logo.href.length > 1) && (logo.type.length > 1);

        return (<>
            <SkipLink
                className={stylesHeader.skip_link}
                anchorId="main-content"
                label={__("accessibility.skipLink")}
            />
            <nav className={stylesHeader.main_navigation_library} role="navigation" aria-label={__("header.home")}>
                {hasLogo && (logo.type === "image/svg+xml") ? 
                    <div
                        className="logo"
                        style={{height: "60px", width: "calc(100% - 20px)", margin: " 20px auto", display: "flex", justifyContent: "center"}}
                        dangerouslySetInnerHTML={{ __html: logo.href }}
                    />
                    : hasLogo && (logo.type === "image/png") ?
                     <div
                        className="logo"
                        style={{height: "60px", width: "calc(100% - 20px)", margin: " 20px auto", display: "flex", justifyContent: "center"}}
                    >
                    <img src={logo.href} alt="" style={{objectFit: "contain", maxHeight: "100px", maxWidth: "100%", width: "fit-content"}}/></div>
                    : <></>
                    }
                <h1 className={stylesHeader.appName} aria-label="Thorium"></h1>
                <ul style={{paddingTop: "10px", height: hasLogo ? "calc(100% - 180px)" : ""}}>
                    <div>
                    {
                        headerNav.map(
                            (item, index) =>
                                item.type === "separator" ? (
                                     <span key={"separator"} style={{ borderBottom: "2px solid var(--color-light-grey)", width: "80%", margin: "0 10%", display: "block" }}></span>
                                ) : 
                                this.buildNavItem(item, index),
                        )
                    }
                    </div>
                    <li /* style={{position: "absolute", bottom: "10px" }} */>
                        <Settings />
                    </li>
                    {/* <WizardModal /> */}
                </ul>
            </nav>
        </>);
    }

    private buildNavItem(item: NavigationHeader, index: number) {

        if (!this.props.location || !item) {
            return (<></>);
        }

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
                styleClasses.push(stylesHeader.active);
                break;
            }
        }
        styleClasses = styleClasses.concat(item.styles);

        const nextLocation = this.props.history.reduce(
            (pv, cv) =>
                cv?.pathname.startsWith(item.route)
                    ? {
                        ...this.props.location,
                        search: item.searchEnable ? this.props.location?.search : "",
                        pathname: cv.pathname,
                    }
                    : pv,
            {
                ...this.props.location,
                pathname: item.route,
            },
        );

        return (
            <li className={classNames(...styleClasses, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")} key={index}>
                <Link
                    to={nextLocation}
                    state={{ displayType: (nextLocation.state && (nextLocation.state as IRouterLocationState).displayType) ? (nextLocation.state as IRouterLocationState).displayType : DisplayType.Grid }}
                    replace={true}
                    aria-pressed={active}
                    role={"button"}
                    className={classNames(active ? stylesButtons.button_nav_primary : "", !active ? "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE" : "")}
                    style={{minHeight: "20px"}}
                    title={item.label}
                    onClick={(e) => {
                        if (e.altKey || e.shiftKey || e.ctrlKey) {
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
                    <SVG ariaHidden svg={item.svg} />
                    <h3>{item.label}</h3>
                </Link>
            </li>
        );
    }
}

const mapStateToProps = (state: ILibraryRootState) => ({
    location: state.router.location,
    history: state.history,

    locale: state.i18n.locale, // refresh
    profile :state.profile,
});


export default connect(mapStateToProps)(withTranslator(Header));
