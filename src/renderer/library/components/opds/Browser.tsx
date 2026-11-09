// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as stylesCatalogs from "readium-desktop/renderer/assets/styles/components/catalogs.scss";
import * as React from "react";
import * as ForbiddenIcon from "readium-desktop/renderer/assets/icons/forbidden-icon.svg";
import { useLocation } from "react-router-dom";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import SVG from "readium-desktop/renderer/common/components/SVG";
import { useApi } from "readium-desktop/renderer/common/hooks/useApi";
import { useSelector } from "readium-desktop/renderer/common/hooks/useSelector";
import { useTranslator } from "readium-desktop/renderer/common/hooks/useTranslator";
import { parseOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import LibraryLayout from "readium-desktop/renderer/library/components/layout/LibraryLayout";
import { IRouterLocationState } from "readium-desktop/renderer/library/routing";
import { BrowserOptions } from "./BrowserOptions";
import BrowserResult from "./BrowserResult";
import SearchForm from "./SearchForm";
import { CatalogHeader } from "./CatalogHeader";

export const Browser = () => {
    const [__] = useTranslator();
    const location = useLocation();
    const route = parseOpdsBrowserRoute(location.pathname);
    const identifier = route?.rootFeedIdentifier;
    const storedBreadcrumb = useSelector((state: ILibraryRootState) => state.opds.browser.breadcrumb);
    const storedCatalog = storedBreadcrumb[1] && parseOpdsBrowserRoute(storedBreadcrumb[1].path)?.rootFeedIdentifier;
    const breadcrumb = identifier && identifier === storedCatalog ? storedBreadcrumb : [];
    const search = useSelector((state: ILibraryRootState) => state.opds.browser.search);
    const [catalog, getCatalog] = useApi("opds-browser-catalog:" + identifier, "opds/getFeed");
    React.useEffect(() => {
        if (identifier) getCatalog(identifier);
    }, [identifier, getCatalog]);
    // The catalog card name is independent of the feed and of direct Shelf entry.
    const catalogTitle = catalog?.data?.result?.title;
    const current = breadcrumb[breadcrumb.length - 1];
    const root = breadcrumb[1];
    const fallback = route?.title?.trim() || catalogTitle || "-";
    const currentLocation = current ? { ...current, name: current.name?.trim() || fallback } :
        route && { path: location.pathname, name: fallback };
    const rootLocation = root && { ...root, name: root.name?.trim() || catalogTitle || fallback };
    const feedColor = catalog?.data?.result?.color || (location.state as Partial<IRouterLocationState> | undefined)?.feedColor;
    return (
        <LibraryLayout
            page={__("opds.breadcrumbRoot")}
            title={catalogTitle}
            feedColor={feedColor}
            catalogHeader={<CatalogHeader currentLocation={currentLocation} rootLocation={rootLocation}
                previousLocation={breadcrumb[breadcrumb.length - 2]} />}
            catalogOptions={<BrowserOptions />}
            search={search ? <SearchForm /> : undefined}
        >
            {breadcrumb.length ? <BrowserResult /> : <p className={stylesCatalogs.noPublication}>
                <SVG ariaHidden svg={ForbiddenIcon} />{__("opds.empty")}
            </p>}
        </LibraryLayout>
    );
};

export default Browser;
