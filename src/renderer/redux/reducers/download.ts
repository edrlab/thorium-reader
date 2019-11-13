// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { downloadActions } from "readium-desktop/common/redux/actions";
import { DownloadState } from "readium-desktop/renderer/redux/states/download";

// TODO: this does not handle multiple same-URL downloads! (different progress?)
// assumes URL download is unique
const initialState: DownloadState = {
    downloads: [],
};

export function downloadReducer(
    state: DownloadState = initialState,
    action: downloadActions.request.TAction |
        downloadActions.success.TAction |
        downloadActions.error.TAction |
        downloadActions.progress.TAction,
): DownloadState {
    const downloads = state.downloads;
    switch (action.type) {
        case downloadActions.request.ID: {
            const index1 = downloads.findIndex((dl) => dl.url === action.payload.url);
            if (index1 >= 0) {
                downloads.splice(index1, 1);
            }
            downloads.push({url: action.payload.url, title: action.payload.title, progress: 0});
            return Object.assign({}, state, { downloads });
        }
        case downloadActions.progress.ID: {
            const index2 = downloads.findIndex((dl) => dl.url === action.payload.url);
            if (index2 >= 0) {
                downloads[index2].progress = action.payload.progress;
            }
            return Object.assign({}, state, { downloads });
        }
        case downloadActions.success.ID:
        case downloadActions.error.ID: {
            const index3 = downloads.findIndex((dl) => dl.url === action.payload.url);
            if (index3 >= 0) {
                downloads.splice(index3, 1);
            }
            return Object.assign({}, state, { downloads });
        }
        default:
            return state;
    }
}
