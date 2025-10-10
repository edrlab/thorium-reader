// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesHeader from "readium-desktop/renderer/assets/styles/header.scss";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import * as stylesModals from "readium-desktop/renderer/assets/styles/components/modals.scss";

import * as Dialog from "@radix-ui/react-dialog";

import { Link } from "react-router-dom";
import classNames from "classnames";
import * as React from "react";
import SkipLink from "readium-desktop/renderer/common/components/SkipLink";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { DisplayType, IRouterLocationState } from "../../routing";
import * as HomeIcon from "readium-desktop/renderer/assets/icons/home-icon.svg";
import * as GlobeIcon from "readium-desktop/renderer/assets/icons/globe-icon.svg";
import * as CatalogsIcon from "readium-desktop/renderer/assets/icons/catalogs-icon.svg";
import * as ShelfIcon from "readium-desktop/renderer/assets/icons/shelf-icon.svg";
import * as InfoIcon from "readium-desktop/renderer/assets/icons/info-icon.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { Settings } from "../settings/Settings";
import { _APP_NAME } from "readium-desktop/preprocessor-directives";
import { buildOpdsBrowserRoute } from "../../opds/route";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";
import { THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL, THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER } from "readium-desktop/common/streamerProtocol";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import DOMPurify from "dompurify";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
// import { WizardModal } from "../Wizard";

export interface NavigationHeader {
    route: string;
    label: string;
    matchRoutes: string[];
    searchEnable?: boolean;
    styles: string[];
    svg: any;
}

const Header = () => {


    const location = useSelector((state: ILibraryRootState) => state.router.location);
    const history = useSelector((state: ILibraryRootState) => state.history);
    const locale = useSelector((state: ILibraryRootState) => state.i18n.locale);
    const customizationManifest = useSelector((state: ILibraryRootState) => state.customization.manifest);
    const [__] = useTranslator();

    const buildNavItem = React.useCallback((item: NavigationHeader, index: number, active: boolean) => {

        if (!location) {
            return (<></>);
        }

        let styleClasses = [];
        if (active) {
            styleClasses.push(stylesHeader.active);
        }
        styleClasses = styleClasses.concat(item.styles);

        const nextLocation = history.reduce(
            (pv, cv) =>
                cv?.pathname.startsWith(item.route)
                    ? {
                        ...location,
                        search: item.searchEnable ? location?.search : "",
                        pathname: item.route,
                    }
                    : pv,
            {
                ...location,
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
    }, [history, location]);

    const headerNav: NavigationHeader[] = [
        {
            route: "/home",
            label: __("header.homeTitle"),
            matchRoutes: ["/", "/home"],
            styles: [],
            svg: HomeIcon,
        },
        {
            route: "/library",
            label: __("header.allBooks"),
            matchRoutes: ["/library"],
            searchEnable: false,
            styles: [],
            svg: ShelfIcon,
        },
        {
            route: "/opds",
            label: __("header.catalogs"),
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

    const customizationEnable = !!customizationManifest;
    const customizationId = customizationManifest?.identifier;
    const logoObj = customizationManifest?.images?.find((ln) => ln?.rel === "logo");
    const customizationBaseUrl = customizationEnable ? `${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL}://${THORIUM_READIUM2_ELECTRON_HTTP_PROTOCOL__IP_ORIGIN_STREAMER}/custom-profile-zip/${encodeURIComponent_RFC3986(Buffer.from(customizationId).toString("base64"))}/` : "";

    const screenZipLinks = React.useMemo(() => {
        let a = customizationManifest?.links?.filter((ln) => ln.rel === "screen" && (!ln.type || ln.type === "text/html") && ln.language === locale);
        if (!a) {
            a = customizationManifest?.links?.filter((ln) => ln.rel === "screen" && (!ln.type || ln.type === "text/html") && (ln.language === "en" || !ln.language));
        }
        return a;
    }, [customizationManifest, locale]);
    const screenZipObj = React.useMemo(() => screenZipLinks?.map(({ href, title }) => href && customizationBaseUrl ? {url: customizationBaseUrl + encodeURIComponent_RFC3986(Buffer.from(href).toString("base64")), title } : undefined), [screenZipLinks, customizationBaseUrl]);

    const [screenHtmlArray, setScreenHtmlArray] = React.useState([]);
    const [cancel, setCancel] = React.useState(false);

    React.useEffect(() => {
        if (customizationId && screenZipObj?.length) {

            setScreenHtmlArray([]);
            setCancel(false);

            for (const screenHref of screenZipObj) {

                // URL is thoriumhttps:// "custom-profile-zip" protocol handler, so no use of isURL(url) and /^https?:\/\//.test(url) checks here
                fetch(screenHref.url)
                    .then((response) => {
                        if (response.ok) {
                            return response.text();
                        }
                        return Promise.reject(response.statusText);
                    })
                    .then((rawHtmlContent) => {
                        // console.log("RAW HTML", rawHtmlContent);

                        if (cancel) {
                            return ;
                        }

                        if (!rawHtmlContent) {
                            return ;
                        }

                        const regex = new RegExp(/href=\"(.*?)\"/, "gm");
                        const parsed = DOMPurify.sanitize(rawHtmlContent, { FORBID_TAGS: [/*"style"*/], FORBID_ATTR: [/*"style"*/] /* TODO: handle external https links */ });
                        const hrefSanitized = parsed.replace(regex, (substring) => {

                            let url = /href=\"(.*?)\"/.exec(substring)[1];
                            if (!/^https?:\/\//.test(url)) {
                                url = "http://" + url;
                            }

                            return `href="" alt="${url}" onclick="return ((e) => {
                                        window.__shell_openExternal('${url}').catch(() => {});
                                        return false;
                                     })()"`;
                        });

                        setScreenHtmlArray((screenHtmlArray) => [...screenHtmlArray, { html: hrefSanitized, title: screenHref.title }]);
                    })
                    .catch((e) => {
                        console.error("Error fetching data:", e);
                    });
            }
        } else {
            setScreenHtmlArray([]);
            setCancel(true);
        }

    }, [screenZipObj, customizationId, setScreenHtmlArray, cancel, setCancel]);


    const customizationCatalogs = customizationManifest?.links?.filter(({ rel }) => rel === "catalog");
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
            const label = (catalog?.title && typeof catalog.title === "object") ? catalog.title[locale] || catalog.title["en"] || __("header.myCatalogs") : typeof catalog.title === "string" ? catalog.title : __("header.myCatalogs");
            headerNav.push({
                route: buildOpdsBrowserRoute(hostEncoded, label, catalog.href),
                label,
                matchRoutes: ["/opds/" + hostEncoded],
                searchEnable: false,
                styles: [],
                // svg: catalog.properties?.logo?.type === "image/svg+xml" ? customizationBaseUrl + encodeURIComponent_RFC3986(Buffer.from(catalog.properties.logo.href).toString("base64")) : ThoriumIcon,
                svg: GlobeIcon,
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
                    <div className="logo" style={{ height: "60px", width: "calc(100% - 20px)", margin: " 20px auto", display: "flex", justifyContent: "center" }}>
                        <img src={customizationBaseUrl + encodeURIComponent_RFC3986(Buffer.from(logoObj.href).toString("base64"))} alt="" style={{ objectFit: "contain", maxHeight: "100px", maxWidth: "100%", width: "fit-content" }} />
                    </div>
                    : <></>
            }
            <h1 className={stylesHeader.appName} aria-label="Thorium"></h1>
            <ul style={{ paddingTop: "10px", height: customizationEnable ? "calc(100% - 180px)" : "" }}>
                <div>
                    {
                        headerNav.map(
                            (item, index, array) => {

                                const pathname = location.pathname;

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
                                return buildNavItem(item, index, active);
                            },
                        )
                    }
                {
                    screenHtmlArray.length ? screenHtmlArray.map(({html: htmlSanitized, title}, index) => {

                        return <>
                            <li className={classNames("R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE")} key={`customization-screen-${index}`} style={{ height: "inherit" }}>
                                <Dialog.Root>
                                    <Dialog.Trigger asChild>
                                        <button title={title || __("catalog.customization.fallback.screen")} className="R2_CSS_CLASS__FORCE_NO_FOCUS_OUTLINE">
                                            <SVG ariaHidden svg={InfoIcon} />
                                            <h3>{title || __("catalog.customization.fallback.screen")}</h3>
                                        </button>
                                    </Dialog.Trigger>
                                    <Dialog.Portal>
                                        <div className={stylesModals.modal_dialog_overlay}></div>
                                        <Dialog.Content className={classNames(stylesModals.modal_dialog)} aria-describedby={undefined}>
                                            {
                                                // FALSE this to test sourcemaps:
                                                true &&
                                                <VisuallyHidden.Root>
                                                    <Dialog.Title>{title || __("catalog.customization.fallback.screen")}</Dialog.Title>
                                                </VisuallyHidden.Root>
                                            }

                                            {
                                                htmlSanitized ?
                                                    <div className={stylesModals.modal_dialog_body} dangerouslySetInnerHTML={{ __html: htmlSanitized }} /> : <></>
                                            }

                                        </Dialog.Content>
                                    </Dialog.Portal>
                                </Dialog.Root>
                            </li>
                        </>;
                    }) : <></>
                }
                </div>
                <li /* style={{position: "absolute", bottom: "10px" }} */>
                    <Settings />
                </li>
                {/* <WizardModal /> */}
            </ul>
        </nav>
    </>);

};

export default Header;
