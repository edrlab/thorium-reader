// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Download } from "readium-desktop/common/models/download";
import { Action, ErrorAction } from "readium-desktop/common/models/redux";

export enum ActionType {
    AddRequest = "DOWNLOAD_ADD_REQUEST",
    AddSuccess = "DOWNLOAD_ADD_SUCCESS",
    PostProcess = "DOWNLOAD_POST_PROCESS",
    Error = "DOWNLOAD_ERROR",
    Success = "DOWNLOAD_SUCCESS",
    Progress = "DOWNLOAD_PROGRESS",
    CancelRequest = "DOWNLOAD_CANCEL_REQUEST",
    CancelSuccess = "DOWNLOAD_CANCEL_SUCCESS",
}

export function add(download: Download): Action {
    return {
        type: ActionType.AddRequest,
        payload: {
            download,
        },
    };
}

export function start(download: Download): Action {
    return {
        type: ActionType.AddSuccess,
        payload: {
            download,
        },
    };
}

export function progress(download: Download, progressValue: number): Action {
    return {
        type: ActionType.Progress,
        payload: {
            download,
            progress: progressValue,
        },
    };
}

export function finish(download: Download): Action {
    return {
        type: ActionType.Success,
        payload: {
            download,
        },
    };
}

export function fail(download: Download, errorMsg: string): ErrorAction {
    const error = new Error(errorMsg);
    return {
        type: ActionType.Error,
        payload: {
            download,
        },
        error: true,
        meta: {
            download,
        },
    };
}

export function cancel(download: Download): Action {
    return {
        type: ActionType.CancelRequest,
        payload: {
            download,
        },
    };
}
