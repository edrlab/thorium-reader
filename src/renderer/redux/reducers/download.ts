// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

import { downloadActions } from "readium-desktop/common/redux/actions";
import { DownloadState } from "readium-desktop/renderer/redux/states/download";

import { oc } from "ts-optchain";

const initialState: DownloadState = {
    downloads: [],
};

export function downloadReducer(
    state: DownloadState = initialState,
    action: Action,
): DownloadState {
    const downloads = state.downloads;
    const publicationTitle = oc(action).payload.data.title(undefined);
    switch (action.type) {
        case downloadActions.ActionType.DownloadRequest:
            downloads.push({publicationTitle});
            return Object.assign({}, state, { downloads });
        case downloadActions.ActionType.DownloadSuccess:
            const index = downloads.findIndex((value) => value.publicationTitle === publicationTitle);
            downloads.splice(index, 1);
            return Object.assign({}, state, { downloads });
        default:
            return state;
    }
}
