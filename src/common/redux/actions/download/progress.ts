// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";

export const ID = "DOWNLOAD_PROGRESS";

/** Transfer progress for one file within a download batch. */
export interface SubDownloadProgress {
    /** Stable index within the batch, including when URLs are duplicated. */
    id: number;
    url: string;
    filename?: string;
    /** Percentage in [0, 100]; absent while the total size is unknown. */
    progress?: number;
    downloadedBytes: number;
    totalBytes?: number;
    speedKiBPerSecond: number;
}

export interface Payload {
    downloadLabel: string;
    downloadUrls: string[];
    progress: number | undefined; // integer [0, 100]; undefined means indeterminate
    subDownloads: SubDownloadProgress[];
    id: number; // unix timestamp
    speed: number; // 44.3 Kb/s
    contentLengthHumanReadable: string; // 1.4 Mb
}

export function build(data: Payload):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: data,
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
