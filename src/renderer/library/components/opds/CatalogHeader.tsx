// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import * as ChevronRight from "readium-desktop/renderer/assets/icons/chevron-right.svg";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { Link, useNavigate } from "react-router-dom";
import { resolveRouterLocationState } from "readium-desktop/renderer/library/routing";
import { IBreadCrumbItem } from "readium-desktop/common/redux/states/renderer/breadcrumbItem";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";

const truncateBreadcrumbLabel = (label: string) => {
    const characters = Array.from(label);
    return characters.length > 30 ? `${characters.slice(0, 30).join("")}...` : label;
};

export const CatalogHeader: React.FC<React.PropsWithChildren<{ currentLocation: IBreadCrumbItem, rootLocation?: IBreadCrumbItem }>> = (props) => {

    const { currentLocation, rootLocation } = props;
    const navigate = useNavigate();
    const [__] = useTranslator();
    const labelStyle: React.CSSProperties = { fontSize: "18px", fontWeight: 400, lineHeight: 1.5, minWidth: 0 };
    const location = useSelector((state: ILibraryRootState) => state.router.location);
    const savedDisplayType = useSelector((state: ILibraryRootState) => state.settings.libraryView?.displayType);
    const canGoBack = useSelector((state: ILibraryRootState) => state.navigationHistory.index > 0);

    return (
        <nav aria-label={__("opds.breadcrumbRoot")} style={{ display: "flex", alignItems: "center", gap: "20px", minWidth: 0, maxWidth: "100%" }}>
            <button
                type="button"
                style={{ width: "20px", height: "20px", flexShrink: 0, transform: "rotate(180deg)" }}
                disabled={!canGoBack}
                onClick={() => navigate(-1)}
                title={__("opds.previous")}
                aria-label={__("opds.previous")}
            >
                <SVG ariaHidden svg={ChevronRight} />
            </button>
            <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center", gap: "8px", minWidth: 0 }}>
                {rootLocation && rootLocation.path !== currentLocation?.path && <>
                    <Link style={{ ...labelStyle, flexShrink: 0, whiteSpace: "nowrap" }} to={{ pathname: rootLocation.path }}
                        title={rootLocation.name}
                        aria-label={rootLocation.name}
                        state={resolveRouterLocationState(location.state, savedDisplayType)}>
                        {truncateBreadcrumbLabel(rootLocation.name)}
                    </Link>
                    <span aria-hidden="true" style={{ flexShrink: 0 }}>/</span>
                </>}
                <span
                    style={{ ...labelStyle, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    title={currentLocation?.name}
                    aria-current="page">
                    {currentLocation?.name}
                </span>
            </div>
        </nav>
    );
};
