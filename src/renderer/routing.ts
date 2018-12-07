import CatalogEntrySettings from "./components/settings/CatalogEntrySettings";
import LanguageSettings from "./components/settings/LanguageSettings";

import Catalog from "./components/catalog/Catalog";
import AllPublicationPage from "./components/searchResult/AllPublicationPage";
import TagSearchResult from "./components/searchResult/TagSearchResult";
import TextSearchResult from "./components/searchResult/TextSearchResult";

import Opds from "./components/opds/Opds";
import OpdsDetails from "./components/opds/OpdsDetails";

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
    "/catalogs": {
        path: "/catalogs",
        exact: true,
        title: "Catalogues",
        component: Opds,
    },
    "/catalogs/": {
        path: "/catalogs/:opdsId",
        exact: true,
        title: "Catalogues",
        component: OpdsDetails,
    },
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
