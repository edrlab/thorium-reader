// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { all } from "redux-saga/effects";

import {
    downloadAddRequestWatcher,
    downloadPostProcessWatcher,
} from "./downloader";

import {
    publicationDownloadCancelRequestWatcher
} from "./publication-download";

import { appInitWatcher } from "./app";
import {
    catalogFileImportWatcher,
    catalogPublicationDownloadSuccessWatcher,
    catalogPublicationRemoveWatcher,
} from "./catalog";
import { netStatusWatcher } from "./net";
import {
    readerBookmarkSaveRequestWatcher,
    readerCloseRequestWatcher,
    readerConfigInitWatcher,
    readerConfigSetRequestWatcher,
    readerOpenRequestWatcher,
} from "./reader";

import * as api from "./api";

import * as streamer from "./streamer";

// import {
//     lcpPassphraseSubmitRequestWatcher,
//     lcpRenewRequestWatcher,
//     lcpReturnRequestWatcher,
//     lcpUserKeyCheckRequestWatcher,
// } from "./lcp";

import {
    updateStatusWatcher,
} from "./update";

export function* rootSaga() {
    yield all([
        api.watchers(),

        // Catalog
        catalogPublicationDownloadSuccessWatcher(),
        catalogPublicationRemoveWatcher(),
        catalogFileImportWatcher(),

        // Download
        downloadAddRequestWatcher(),
        downloadPostProcessWatcher(),

        // Publication download
        publicationDownloadCancelRequestWatcher(),

        // App
        appInitWatcher(),

        // Net
        netStatusWatcher(),

        // Reader
        readerBookmarkSaveRequestWatcher(),
        readerCloseRequestWatcher(),
        readerConfigInitWatcher(),
        readerConfigSetRequestWatcher(),
        readerOpenRequestWatcher(),

        // Streamer
        streamer.watchers(),

        // LCP
        // lcpPassphraseSubmitRequestWatcher(),
        // lcpUserKeyCheckRequestWatcher(),
        // lcpRenewRequestWatcher(),
        // lcpReturnRequestWatcher(),

        // Update checker
        updateStatusWatcher(),
    ]);
}
