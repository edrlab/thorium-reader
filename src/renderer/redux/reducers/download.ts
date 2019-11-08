// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { downloadActions } from "readium-desktop/common/redux/actions";
import { DownloadState } from "readium-desktop/renderer/redux/states/download";
import { oc } from "ts-optchain";

const initialState: DownloadState = {
    downloads: [],
};

export function downloadReducer(
    state: DownloadState = initialState,
    action: ReturnType<typeof downloadActions.request.build> |
        ReturnType<typeof downloadActions.success.build>,
): DownloadState {
    const downloads = state.downloads;
    const url = oc(action).payload.url(undefined);
    switch (action.type) {
        case downloadActions.request.ID:
            downloads.push({url});
            return Object.assign({}, state, { downloads });
        case downloadActions.success.ID:
            const index = downloads.findIndex((value) => value.url === url);
            downloads.splice(index, 1);
            return Object.assign({}, state, { downloads });
        default:
            return state;
    }
}
