// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as debug_ from "debug";
import { IBreadCrumbItem } from "readium-desktop/renderer/components/layout/BreadCrumb";
import { diRendererGet } from "readium-desktop/renderer/di";
import { opdsActions } from "readium-desktop/renderer/redux/actions";
import {
    IActionBrowseRequest, IActionHeaderLinkUpdate,
} from "readium-desktop/renderer/redux/actions/opds";
import { IOpdsHeaderState } from "readium-desktop/renderer/redux/states/opds";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";

// Logger
// const debug = debug_("readium-desktop:renderer:redux:reducer:opds");

export function opdsBreadcrumbReducer(
    state: IBreadCrumbItem[] = [],
    action: IActionBrowseRequest,
) {
    switch (action.type) {
        case opdsActions.ActionType.BrowseRequest:
            const { level, title, url, rootFeedIdentifier } = action.payload;
            const stateNew = state.slice(0, level - 1);
            if (stateNew.length === 0) {
                const translator = diRendererGet("translator");
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

export function opdsHeaderLinkReducer(
    state: IOpdsHeaderState = {},
    action: IActionHeaderLinkUpdate,
) {
    switch (action.type) {
        case opdsActions.ActionType.HeaderLinkUpdate:
            const stateNew = { ...state };
            for (const link of Object.entries(action.payload)) {
                // TODO keep search in memory if the next link doesn't exist
                stateNew[link[0] as keyof IOpdsHeaderState] = link[1];
            }

            return stateNew;

        default:
            return state;
    }
}
