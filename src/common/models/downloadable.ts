// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export enum DownloadStatus {
    Init, // Initial state
    Downloading, // Item is downloading
    Canceled, // Item download has been canceled
    Failed, // Item download has failed
    Downloaded, // Item has been downloaded
}

export interface Downloadable {
    status: DownloadStatus;
    downloadedSize: number;
    progress: number; // integer [0, 100]
}
