import LanguageSettings from "readium-desktop/renderer/components/settings/LanguageSettings";
import CatalogEntrySettings from "readium-desktop/renderer/components/settings/CatalogEntrySettings";

import Catalog from "readium-desktop/renderer/components/catalog/Catalog";
import SearchResult from "./components/searchResult/SearchResult";

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

export const routes: RouteList = {
    // "/myBooks/list": {
    //     path: "/myBooks/list",
    //     exact: false,
    //     title: "MyBooksList",
    //     component: CatalogList,
    // },
    "/settings/tags": {
        path: "/settings/tags",
        exact: false,
        title: "Settings: Tags",
        component: CatalogEntrySettings,
    },
    "/settings/languages": {
        path: "/settings/languages",
        exact: false,
        title: "Settings: Languages",
        component: LanguageSettings,
    },
    "/settings": {
        path: "/settings",
        exact: false,
        title: "Settings: Tags",
        component: CatalogEntrySettings,
    },
    "/library/search": {
        path: "/library/search",
        exact: false,
        title: "Library",
        component: SearchResult,
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
