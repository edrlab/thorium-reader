// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { RouteComponentProps } from "react-router";

import Catalog from "./components/catalog/Catalog";
import Browser from "./components/opds/Browser";
import Opds from "./components/opds/Opds";
import AllPublicationPage from "./components/searchResult/AllPublicationPage";
import TagSearchResult from "./components/searchResult/TagSearchResult";
import TextSearchResult from "./components/searchResult/TextSearchResult";
import LanguageSettings from "./components/settings/LanguageSettings";

// import DownloadsList from "./components/DownloadsList";

interface Route {
    path: string;
    exact: boolean;
    component: React.ComponentType<RouteComponentProps<any>> | React.ComponentType<any>;
}

interface RouteList {
    [path: string]: Route;
}

export interface IOpdsBrowse {
    opdsId: string;
    level: string;
    name: string;
}

export interface ILibrarySearchText {
    value: string;
}

export enum DisplayType {
    Grid = "grid",
    List = "list",
}
export interface IRouterLocationState {
    displayType: DisplayType;
}

export const routes: RouteList = {
    "/opds": {
        path: "/opds",
        exact: true,
        component: Opds,
    },
    "/opds/browse": {
        // IOpdsBrowse
        path: "/opds/:opdsId/browse/:level/:name/:url",
        exact: true,
        component: Browser,
    },
    "/settings/languages": {
        path: "/settings/languages",
        exact: false,
        component: LanguageSettings,
    },
    "/settings": {
        path: "/settings",
        exact: false,
        component: LanguageSettings,
    },
    "/library/search/text": {
        // ILibrarySearchText
        path: "/library/search/text/:value",
        exact: true,
        component: TextSearchResult,
    },
    "/library/search/tag": {
        // ILibrarySearchTag
        path: "/library/search/tag/:value",
        exact: true,
        component: TagSearchResult,
    },
    "/library/search/all": {
        path: "/library/search/all",
        exact: true,
        component: AllPublicationPage,
    },
    "/library": {
        path: "/library",
        exact: true,
        component: Catalog,
    },
    "/": {
        path: "/",
        exact: false,
        component: Catalog,
    },
};
