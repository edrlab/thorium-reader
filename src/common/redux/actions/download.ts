// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export enum ActionType {
    DownloadRequest = "DOWNLOAD_REQUEST",
    DownloadSuccess = "DOWNLOAD_SUCCESS",
}

export interface DownloadPayload {
    title: string;
}

export function addDownload(data: DownloadPayload) {
    return {
        type: ActionType.DownloadRequest,
        payload: data,
    };
}

export function removeDownload(data: DownloadPayload) {
    return {
        type: ActionType.DownloadSuccess,
        payload: data,
    };
}
