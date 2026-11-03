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
import { resolveDisplayType } from "readium-desktop/renderer/library/routing";
import { IBreadCrumbItem } from "readium-desktop/common/redux/states/renderer/breadcrumbItem";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

const truncateBreadcrumbLabel = (label: string) => {
    const characters = Array.from(label);
    return characters.length > 30 ? `${characters.slice(0, 30).join("")}...` : label;
};

export const CatalogHeader: React.FC<React.PropsWithChildren<{ currentLocation: IBreadCrumbItem, previousLocation: IBreadCrumbItem, rootLocation?: IBreadCrumbItem}>> = (props) => {

    const { currentLocation, previousLocation, rootLocation } = props;
    const dispatch = useDispatch();
    const [__] = useTranslator();
    const labelStyle: React.CSSProperties = { fontSize: "16px", fontWeight: 400, lineHeight: 1.5, minWidth: 0, overflowWrap: "anywhere", whiteSpace: "normal" };
    const location = useSelector((state: ILibraryRootState) => state.router.location);
    const savedDisplayType = useSelector((state: ILibraryRootState) => state.settings.libraryView?.displayType);

    return (
        <nav aria-label={__("opds.breadcrumbRoot")} style={{display: "flex", alignItems: "center", gap: "20px", minWidth: 0, maxWidth: "100%"}}>
            {previousLocation ?
            <Link
                style={{width: "20px", height: "20px", flexShrink: 0, transform: "rotate(180deg)"}}
                to={{
                    pathname: previousLocation?.path,
                }}
                state={{ displayType: resolveDisplayType(location.state, savedDisplayType) }}
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
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", minWidth: 0, overflowWrap: "anywhere" }}>
                {rootLocation && rootLocation.path !== currentLocation?.path && <>
                    <Link style={labelStyle} to={{ pathname: rootLocation.path }}
                        title={rootLocation.name}
                        aria-label={rootLocation.name}
                        state={{ displayType: resolveDisplayType(location.state, savedDisplayType) }}>
                        {truncateBreadcrumbLabel(rootLocation.name)}
                    </Link>
                    <span aria-hidden="true">›</span>
                </>}
                <span style={labelStyle} aria-current="page">{currentLocation?.name}</span>
            </div>
        </nav>
    );
};
