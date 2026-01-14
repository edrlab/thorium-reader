// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesHeader from "readium-desktop/renderer/assets/styles/header.scss";
import { Location as HistoryLocation } from "history";
import * as React from "react";
import { OpdsFeedAddFormDialog } from "../dialog/OpdsFeedAddForm";
import { ApiappAddFormDialog } from "../dialog/ApiappAddForm";
import * as stylesButtons from "readium-desktop/renderer/assets/styles/components/buttons.scss";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { DisplayType, IRouterLocationState } from "../../routing";
import { Link } from "react-router-dom";
// import * as CatalogsIcon from "readium-desktop/renderer/assets/icons/catalogs-icon.svg";
import * as EyeGlassesIcon from "readium-desktop/renderer/assets/icons/eyeglasses-icon.svg";
import { NavigationHeader } from "../layout/LibraryHeader";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";

const OpdsAddForm: React.FC = () => {
    const historyState = useSelector((state: ILibraryRootState) => state.history);
    const location = useSelector((state: ILibraryRootState) => state.router.location);
    const [__] = useTranslator();

    const item: NavigationHeader =   {
        route: "/opds",
        label: __("opds.resumeBrowsing"),
        matchRoutes: ["/opds"],
        styles: [],
        svg: EyeGlassesIcon,
    };

    let nextLocation: HistoryLocation | undefined;
    for (let i = historyState.length - 1; i >= 0;  i--) {
        const cv = historyState[i];
        if (cv?.pathname.startsWith(item.route) && cv.pathname !== location.pathname) {
            nextLocation = {
                ...cv,
                search: item.searchEnable ? cv.search : "",
            };
            break;
        }
    }

    // let showResumeBrowsingButton: boolean = false;

    // const nextLocation = historyState.reduceRight(
    //     (pv, cv) => {
    //         if (pv !== null) {
    //             return pv;
    //         }

    //         if (cv?.pathname.startsWith(item.route) && cv.pathname !== location.pathname) {
    //             showResumeBrowsingButton = true;
    //             return {
    //                 ...cv,
    //                 search: item.searchEnable ? cv.search : "",
    //             };
    //         }

    //         return pv;
    //     },
    //     null,
    // ) || {
    //     ...location,
    //     pathname: item.route,
    // };

    return (
        <section style={{display: "flex", gap: "10px", alignItems: "end", width: "100%", height: "53px", justifyContent: nextLocation ? "space-between" : "end", margin: "0"}}
        className={stylesHeader.nav_secondary}>
            {
            nextLocation ?
            <Link
                to={nextLocation}
                state={{ displayType: (nextLocation.state && (nextLocation.state as IRouterLocationState).displayType) ? (nextLocation.state as IRouterLocationState).displayType : DisplayType.Grid }}
                replace={true}
                role={"button"}
                className={stylesButtons.button_nav_primary}
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
                { /* typeof item.svg === "string" ? <img width={"20px"} height={"20px"} src={item.svg}></img> : <SVG ariaHidden svg={item.svg} /> */ }
                <SVG ariaHidden svg={item.svg} />
                <span>{item.label}</span>
            </Link>
            : <></>
            }
            <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                <OpdsFeedAddFormDialog/>
                <ApiappAddFormDialog/>
            </div>
        </section>
    );

};

export default OpdsAddForm;
