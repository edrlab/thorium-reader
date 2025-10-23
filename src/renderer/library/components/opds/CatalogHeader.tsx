// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { useDispatch } from "readium-desktop/renderer/common/hooks/useDispatch";
import { popBreadcrumb } from "../../redux/actions/opds";
import * as ChevronRight from "readium-desktop/renderer/assets/icons/chevron-right.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { Link } from "react-router-dom";
import { DisplayType } from "readium-desktop/renderer/library/routing";
import { IBreadCrumbItem } from "src/common/redux/states/renderer/breadcrumbItem";

export const CatalogHeader: React.FC<React.PropsWithChildren<{ currentLocation: IBreadCrumbItem, previousLocation: IBreadCrumbItem}>> = (props) => {

    const { currentLocation, previousLocation } = props;
    const dispatch = useDispatch();

    return (
        <div style={{display: "flex", alignItems: "center", gap: "20px", width: "100%"}}>
            {previousLocation ?
            <Link
                style={{width: "20px", height: "20px", transform: "rotate(180deg)"}}
                to={{
                    pathname: previousLocation?.path,
                }}
                state={{ displayType: DisplayType.Grid }}
                onClick={(e) => {
                    if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) {
                        e.preventDefault();
                        dispatch(popBreadcrumb.build());
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
                        dispatch(popBreadcrumb.build());
                        e.currentTarget.click();
                    }
                }}
                title={previousLocation.name}
            >

                <SVG ariaHidden svg={ChevronRight} />
            </Link>
            : <></>
            }
            <h4 style={{fontSize: "16px"}}>{currentLocation?.name}</h4>
        </div>
    );
};
