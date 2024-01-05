// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { IBreadCrumbItem } from "readium-desktop/common/redux/states/renderer/breadcrumbItem";
import { diLibraryGet } from "readium-desktop/renderer/library/di";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/library/opds/route";
import { opdsActions } from "readium-desktop/renderer/library/redux/actions";
import {
    browseRequest, headerLinksUpdate, search,
} from "readium-desktop/renderer/library/redux/actions/opds";
import {
    IOpdsHeaderState, IOpdsSearchState,
} from "readium-desktop/common/redux/states/renderer/opds";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";

// import * as debug_ from "debug";
// Logger
// const debug = debug_("readium-desktop:renderer:redux:reducer:opds");

function opdsBreadcrumbReducer_(
    state: IBreadCrumbItem[] = [],
    action: browseRequest.TAction,
): IBreadCrumbItem[] {
    switch (action.type) {
        case opdsActions.browseRequest.ID:
            const { level, title, url, rootFeedIdentifier } = action.payload;
            const stateNew = state.slice(0, level - 1);
            if (stateNew.length === 0) {
                const translator = diLibraryGet("translator");
                stateNew.push({
                    name: translator.translate("opds.breadcrumbRoot"),
                    path: "/opds",
                });
            }
            // the slice() operation clones the array and returns a reference to a new array.
            stateNew.push({
                name: title,
                path: buildOpdsBrowserRoute(
                    rootFeedIdentifier,
                    title,
                    url,
                    level,
                ),
            });
            return stateNew;

        default:
            return state;
    }
}

export const opdsBreadcrumbReducer = opdsBreadcrumbReducer_ as Reducer<ReturnType<typeof opdsBreadcrumbReducer_>>;

function opdsHeaderLinkReducer_(
    state: IOpdsHeaderState = {},
    action: headerLinksUpdate.TAction,
): IOpdsHeaderState {
    switch (action.type) {
        case headerLinksUpdate.ID:
            const stateNew: IOpdsHeaderState = {};
            for (const key of ObjectKeys(action.payload)) {
                stateNew[key] = action.payload[key];
            }

            return stateNew;

        default:
            return state;
    }
}

export const opdsHeaderLinkReducer = opdsHeaderLinkReducer_ as Reducer<ReturnType<typeof opdsHeaderLinkReducer_>>;

function opdsSearchLinkReducer_(
    state: IOpdsSearchState = {},
    action: search.TAction,
): IOpdsSearchState {
    switch (action.type) {
        case search.ID:
            return { ...action.payload };

        default:
            return state;
    }
}

export const opdsSearchLinkReducer = opdsSearchLinkReducer_ as Reducer<ReturnType<typeof opdsSearchLinkReducer_>>;
