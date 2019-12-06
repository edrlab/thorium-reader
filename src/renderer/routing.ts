// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { push } from "connected-react-router";
import { LocationDescriptorObject } from "history";
import { RouteComponentProps } from "react-router";
import { TDispatch } from "readium-desktop/typings/redux";

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

const _routes = Object.freeze({
    "/opds": Object.freeze<Route>({
        path: "/opds",
        exact: true,
        component: Opds,
    }),
    "/opds/browse": Object.freeze<Route>({
        // IOpdsBrowse
        path: "/opds/:opdsId/browse/:level/:name/:url",
        exact: true,
        component: Browser,
    }),
    "/settings/languages": Object.freeze<Route>({
        path: "/settings/languages",
        exact: false,
        component: LanguageSettings,
    }),
    "/settings": Object.freeze<Route>({
        path: "/settings",
        exact: false,
        component: LanguageSettings,
    }),
    "/library/search/text": Object.freeze<Route>({
        // ILibrarySearchText
        path: "/library/search/text/:value",
        exact: true,
        component: TextSearchResult,
    }),
    "/library/search/tag": Object.freeze<Route>({
        // ILibrarySearchTag
        path: "/library/search/tag/:value",
        exact: true,
        component: TagSearchResult,
    }),
    "/library/search/all": Object.freeze<Route>({
        path: "/library/search/all",
        exact: true,
        component: AllPublicationPage,
    }),
    "/library": Object.freeze<Route>({
        path: "/library",
        exact: true,
        component: Catalog,
    }),
    "/": Object.freeze<Route>({
        path: "/",
        exact: false,
        component: Catalog,
    }),
});

type TRoutesKey = keyof typeof _routes;
export type TRouteList = {
    [key in TRoutesKey]: Route;
};

export const routes: TRouteList = _routes;

export const dispatchHistoryPush = (dispatch: TDispatch) =>
    (location: LocationDescriptorObject<IRouterLocationState>) =>
        dispatch(push(location));
