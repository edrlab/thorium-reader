// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { push } from "redux-first-history";
import { Location } from "history";
import { TDispatch } from "readium-desktop/typings/redux";

import Catalog from "./components/catalog/Catalog";
import Browser from "./components/opds/Browser";
import Opds from "./components/opds/Opds";
import AllPublicationPage from "./components/searchResult/AllPublicationPage";
// import TagSearchResult from "./components/searchResult/TagSearchResult";
// import TextSearchResult from "./components/searchResult/TextSearchResult";

interface Route {
    path: string;
    // exact: boolean;
    component: React.ComponentType<any>;
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

const _routes = {
    "/opds": {
        path: "/opds",
        // exact: true,
        component: Opds,
    } as Route,
    "/opds/browse": {
        // IOpdsBrowse
        path: "/opds/:opdsId/browse/:level/:name/:url",
        // exact: true,
        component: Browser,
    } as Route,
    // "/settings/languages": {
    //     path: "/settings/languages",
    //     exact: false,
    //     component: LanguageSettings,
    // } as Route,
    // "/settings": {
    //     path: "/settings",
    //     // exact: false,
    //     component: Settings,
    // } as Route,
    // "/library/search/text": {
    //     // ILibrarySearchText
    //     path: "/library/search/text/:value",
    //     // exact: true,
    //     component: TextSearchResult,
    // } as Route,
    // "/library/search/tag": {
    //     // ILibrarySearchTag
    //     path: "/library/search/tag/:value",
    //     // exact: true,
    //     component: TagSearchResult,
    // } as Route,
    // "/library/focus": {
    //     path: "/library/focus/:focusElement/:value?",
    //     // exact: true,
    //     component: AllPublicationPage,
    // } as Route,
    "/library": {
        path: "/library",
        // exact: true,
        component: AllPublicationPage,
    } as Route,
    "/home": {
        path: "/home",
        // exact: true,
        component: Catalog,
    } as Route,
    "/": {
        path: "/",
        // exact: false,
        component: Catalog,
    } as Route,
    "/custom-home": {
        path: "/custom-home",
        // exact: true,
        component: Browser,
    } as Route,
};

export type TRoutesKey = keyof typeof _routes;
export type TRouteList = {
    [key in TRoutesKey]: Readonly<Route>;
};

export const routes: Readonly<TRouteList> = _routes;

export const dispatchHistoryPush = (dispatch: TDispatch) =>
    (location: Location, state: IRouterLocationState) =>
        dispatch(push(location, state));
