// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

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
    title: string;
    component: any;
    customParams?: any;
}

interface RouteList {
    [path: string]: Route;
}

export interface IOpdsBrowse {
    opdsId: string;
    level: string;
    name: string;
}

export const routes: RouteList = {
    "/opds": {
        path: "/opds",
        exact: true,
        title: "Catalogues",
        component: Opds,
    },
    "/opds/browse": {
        path: "/opds/:opdsId/browse/:level/:name/:url",
        exact: true,
        title: "Catalogues",
        component: Browser,
    },
    "/settings/languages": {
        path: "/settings/languages",
        exact: false,
        title: "Settings: Languages",
        component: LanguageSettings,
    },
    // "/downloads": {
    //     path: "/downloads",
    //     exact: true,
    //     title: "Downloads",
    //     component: DownloadsList,
    // },
    /*
    "/settings/information": {
        path: "/settings/information",
        exact: false,
        title: "Information",
        component: Information,
    },*/
    "/settings": {
        path: "/settings",
        exact: false,
        title: "Settings: default page",
        component: LanguageSettings,
    },
    "/library/search/text": {
        path: "/library/search/text/:value",
        exact: true,
        title: "Library",
        component: TextSearchResult,
    },
    "/library/search/tag": {
        path: "/library/search/tag/:value",
        exact: true,
        title: "Library",
        component: TagSearchResult,
    },
    "/library/search/all": {
        path: "/library/search/all",
        exact: true,
        title: "Library",
        component: AllPublicationPage,
    },
    "/library": {
        path: "/library",
        exact: true,
        title: "Library",
        component: Catalog,
    },
    "/": {
        path: "/",
        exact: false,
        title: "Home",
        component: Catalog,
    },
};
