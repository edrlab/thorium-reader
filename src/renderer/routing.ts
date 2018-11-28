import LanguageSettings from "readium-desktop/renderer/components/settings/LanguageSettings";
import TagSettings from "readium-desktop/renderer/components/settings/TagSettings";

import Catalog from "readium-desktop/renderer/components/catalog/Catalog";

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
        component: TagSettings,
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
        component: TagSettings,
    },
    "/": {
        path: "/",
        exact: false,
        title: "Home",
        component: Catalog,
    },
    "/library": {
        path: "/library",
        exact: false,
        title: "Library",
        component: Catalog,
    },
};
