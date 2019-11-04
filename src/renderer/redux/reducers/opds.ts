// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import * as debug_ from "debug";
import { opdsActions } from "readium-desktop/renderer/redux/actions";
import { IActionBrowseRequest } from "readium-desktop/renderer/redux/actions/opds";
import { OpdsState } from "readium-desktop/renderer/redux/states/opds";
import { buildOpdsBrowserRoute } from "readium-desktop/renderer/utils";

// Logger
// const debug = debug_("readium-desktop:renderer:redux:reducer:opds");

const initialState: OpdsState = {
    browser: {
        breadcrumb: [],
    },
};

export function opdsReducer(
    state: OpdsState = initialState,
    action: IActionBrowseRequest,
) {
    switch (action.type) {
        case opdsActions.ActionType.BrowseRequest:
            const stateNew = { ...state };
            const { level, title, url, rootFeedIdentifier } = action.payload;

            stateNew.browser.breadcrumb = stateNew.browser.breadcrumb.slice(0, level - 1);
            stateNew.browser.breadcrumb.push({
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
