// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action, ErrorAction } from "readium-desktop/common/models/redux";

import { Download } from "readium-desktop/common/models/download";
import { Publication } from "readium-desktop/common/models/publication";

import { publicationDownloadActions } from "readium-desktop/common/redux/actions";
import { PublicationDownloadState } from "readium-desktop/common/redux/states/publication-download";

const initialState: PublicationDownloadState = {
    downloadIdentifierToPublication: {},
    publicationIdentifierToDownloads: {},
    publicationDownloadProgress: {},
    lastUpdatedDate: null,
};

export function publicationDownloadReducer(
    state: PublicationDownloadState = initialState,
    action: Action | ErrorAction,
    ): PublicationDownloadState {
    const newState = Object.assign({}, state);
    let publication: Publication = null;

    switch (action.type) {
        case publicationDownloadActions.ActionType.AddRequest:
            return newState;
        case publicationDownloadActions.ActionType.AddSuccess:
            publication = action.payload.publication;
            const downloads: Download[] = action.payload.downloads;

            for (const download of downloads) {
                newState.downloadIdentifierToPublication[download.identifier] =
                    publication;
            }

            newState.publicationIdentifierToDownloads[publication.identifier] =
                downloads;
            newState.lastUpdatedDate = Date.now();
            return newState;
        case publicationDownloadActions.ActionType.Progress:
            const progress = action.payload.progress;
            publication = action.payload.publication;
            newState.publicationDownloadProgress[publication.identifier] = progress;
            newState.lastUpdatedDate = Date.now();
            return newState;
        case publicationDownloadActions.ActionType.CancelSuccess:
        case publicationDownloadActions.ActionType.Success:
        case publicationDownloadActions.ActionType.Error:
            if ((action as ErrorAction).error) {
                publication = action.meta.publication;
            } else {
                publication = action.payload.publication;
            }
            delete newState.publicationDownloadProgress[publication.identifier];
            newState.lastUpdatedDate = Date.now();
            return newState;
        default:
            return state;
    }
}
