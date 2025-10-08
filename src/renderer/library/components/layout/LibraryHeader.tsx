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
import * as ThoriumIcon from "readium-desktop/renderer/assets/icons/thorium.svg";
import * as CatalogsIcon from "readium-desktop/renderer/assets/icons/catalogs-icon.svg";
import * as ShelfIcon from "readium-desktop/renderer/assets/icons/shelf-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { Settings } from "../settings/Settings";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import { buildOpdsBrowserRoute } from "../../opds/route";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL, THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER } from "readium-desktop/common/streamerProtocol";
// import { WizardModal } from "../Wizard";

interface NavigationHeader {
    route: string;
    label: string;
    matchRoutes: string[];
    searchEnable?: boolean;
    styles: string[];
    svg: any;
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

class Header extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;

        const headerNav: NavigationHeader[] = [
            {
                route: "/home",
                label: this.props.__("header.homeTitle"),
                matchRoutes: ["/", "/home"],
                styles: [],
                svg: HomeIcon,
            },
            {
                route: "/library",
                label: this.props.__("header.allBooks"),
                matchRoutes: ["/library"],
                searchEnable: false,
                styles: [],
                svg: ShelfIcon,
            },
            {
                route: "/opds",
                label: this.props.__("header.catalogs"),
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

        const customizationEnable = !!this.props.customizationManifest;
        const customizationId = this.props.customizationManifest?.identifier;
        const logoObj = this.props.customizationManifest?.images?.find((ln) => ln?.rel === "logo");
        const customizationBaseUrl = customizationEnable ? `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER}/custom-profile-zip/${encodeURIComponent_RFC3986(Buffer.from(customizationId).toString("base64"))}/` : "";

        const customizationCatalogs = this.props.customizationManifest?.links?.filter(({ rel }) => rel === "catalog");
        if (customizationCatalogs?.length) {
            for (const catalog of customizationCatalogs) {
                let catalogOrigin = "";
                try {
                    const { host } = new URL(catalog.href);
                    if (host) {
                        catalogOrigin = host;
                    }
                } catch {
                    // ignore
                }
                const hostEncoded = Buffer.from(encodeURIComponent(catalogOrigin), "utf-8").toString("base64");
                const label = (catalog?.title && typeof catalog.title === "object") ? catalog.title[this.props.locale] || catalog.title["en"] || __("header.myCatalogs") : typeof catalog.title === "string" ? catalog.title : __("header.myCatalogs");
                headerNav.push({
                    route: buildOpdsBrowserRoute(hostEncoded, label, catalog.href),
                    label,
                    matchRoutes: ["/opds/" + hostEncoded],
                    searchEnable: false,
                    styles: [],
                    svg: catalog.properties?.logo?.type === "image/svg+xml" ? customizationBaseUrl + encodeURIComponent_RFC3986(Buffer.from(catalog.properties.logo.href).toString("base64")) : ThoriumIcon,
                });
            }
        }

        return (<>
            <SkipLink
                className={stylesHeader.skip_link}
                anchorId="main-content"
                label={__("accessibility.skipLink")}
            />

            <nav className={stylesHeader.main_navigation_library} role="navigation" aria-label={__("header.home")}>
            {
                customizationEnable ?
                    <div className="logo" style={{height: "60px", width: "calc(100% - 20px)", margin: " 20px auto", display: "flex", justifyContent: "center" }}>
                        <img src={customizationBaseUrl + encodeURIComponent_RFC3986(Buffer.from(logoObj.href).toString("base64"))} alt="" style={{ objectFit: "contain", maxHeight: "100px", maxWidth: "100%", width: "fit-content" }} />
                    </div>
                    : <></>
            }
                <h1 className={stylesHeader.appName} aria-label="Thorium"></h1>
                <ul style={{paddingTop: "10px", height: customizationEnable ? "calc(100% - 180px)" : ""}}>
                    <div>
                    {
                        headerNav.map(
                            (item, index, array) => {

                                const pathname = this.props.location.pathname;

                                let active = false;
                                const itemsFound = array.filter(({ matchRoutes }) => !!matchRoutes.find((route) => route.split("/")[1] === pathname.split("/")[1]));
                                // console.log("ITEMS FOUND=", itemsFound);
                                if (!itemsFound) {
                                    console.error("No Route Found !!!", pathname);
                                } else if (itemsFound.length === 1) {
                                    if (itemsFound[0].label === item.label) {
                                        active = true;
                                    }
                                } else {
                                    const items2Found = array.filter(({ matchRoutes }) => !!matchRoutes.find((route) => route.split("/")[1] === pathname.split("/")[1] && route.split("/")[2] === pathname.split("/")[2]));
                                    if (items2Found?.length === 0) {
                                        if (item.matchRoutes.find((route) => route.split("/")[1] === pathname.split("/")[1] && route.split("/")[2] === undefined)) {
                                            active = true;
                                        }
                                    } else if (items2Found.length === 1) {
                                        if (items2Found[0].label === item.label) {
                                            active = true;
                                        }
                                    } else {
                                        if (items2Found[0].label === item.label) {
                                            active = true;
                                        }
                                    }
                                }
                                // console.log("ITEM", item.label, "ACTIVE=", active);
                                return this.buildNavItem(item, index, active);
                            },
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

    private buildNavItem(item: NavigationHeader, index: number, active: boolean) {

        if (!this.props.location) {
            return (<></>);
        }

        let styleClasses = [];
        if (active) {
            styleClasses.push(stylesHeader.active);
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
            <li className={classNames(...styleClasses, "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")} key={index} style={{ height: "inherit" }}>
                <Link
                    to={nextLocation}
                    state={{ displayType: (nextLocation.state && (nextLocation.state as IRouterLocationState).displayType) ? (nextLocation.state as IRouterLocationState).displayType : DisplayType.Grid }}
                    replace={true}
                    aria-pressed={active}
                    role={"button"}
                    className={classNames(active ? stylesButtons.button_nav_primary : "", !active ? "R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE" : "")}
                    title={item.label}
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
                    style={{ height: "inherit" }}
                >
                    {typeof item.svg === "string" ? <img width={"20px"} height={"20px"} src={item.svg}></img> : <SVG ariaHidden svg={item.svg} />}
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
    customizationManifest: state.customization.manifest,
});

export default connect(mapStateToProps)(withTranslator(Header));
