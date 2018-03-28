// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

import { Download } from "readium-desktop/common/models/download";
import { Publication } from "readium-desktop/common/models/publication";

export enum ActionType {
    AddRequest = "PUBLICATION_DOWNLOAD_ADD_REQUEST",
    AddSuccess = "PUBLICATION_DOWNLOAD_ADD_SUCCESS",
    AddError = "PUBLICATION_DOWNLOAD_ADD_ERROR",
    Error = "PUBLICATION_DOWNLOAD_ERROR",
    Success = "PUBLICATION_DOWNLOAD_SUCCESS",
    Progress = "PUBLICATION_DOWNLOAD_PROGRESS",
    CancelRequest = "PUBLICATION_DOWNLOAD_CANCEL_REQUEST",
    CancelSuccess = "PUBLICATION_DOWNLOAD_CANCEL_SUCCESS",
    CancelError = "PUBLICATION_DOWNLOAD_CANCEL_ERROR",
}

export function add(publication: Publication): Action {
    return {
        type: ActionType.AddRequest,
        payload: {
            publication,
        },
    };
}

export function start(publication: Publication, downloads: Download[]): Action {
    return {
        type: ActionType.AddSuccess,
        payload: {
            publication,
            downloads,
        },
    };
}

export function progress(publication: Publication, progressValue: number): Action {
    return {
        type: ActionType.Progress,
        payload: {
            publication,
            progress: progressValue,
        },
    };
}

export function finish(publication: Publication): Action {
    return {
        type: ActionType.Success,
        payload: {
            publication,
        },
    };
}

export function cancel(publication: Publication): Action {
    return {
        type: ActionType.CancelRequest,
        payload: {
            publication,
        },
    };
}
