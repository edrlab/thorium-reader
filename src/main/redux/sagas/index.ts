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
    opdsAddRequestWatcher,
    opdsInitWatcher,
    opdsRemoveRequestWatcher,
    opdsUpdateRequestWatcher,
} from "./opds";

import {
    publicationDownloadAddRequestWatcher,
    publicationDownloadCancelRequestWatcher,
    publicationDownloadStatusWatcher,
} from "./publication-download";

import { appInitWatcher } from "./app";
import {
    catalogFileImportWatcher,
    catalogInitWatcher,
    catalogLocalLCPImportWatcher,
    catalogLocalPublicationImportWatcher,
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
import {
    streamerPublicationCloseRequestWatcher,
    streamerPublicationOpenRequestWatcher,
    streamerStartRequestWatcher,
    streamerStopRequestWatcher,
} from "./streamer";

import {
    lcpPassphraseSubmitRequestWatcher,
    lcpRenewRequestWatcher,
    lcpReturnRequestWatcher,
    lcpUserKeyCheckRequestWatcher,
} from "./lcp";

import {
    updateStatusWatcher,
} from "./update";

export function* rootSaga() {
    yield all([
        // Catalog
        catalogInitWatcher(),
        catalogLocalPublicationImportWatcher(),
        catalogPublicationDownloadSuccessWatcher(),
        catalogPublicationRemoveWatcher(),
        catalogLocalLCPImportWatcher(),
        catalogFileImportWatcher(),

        // Download
        downloadAddRequestWatcher(),
        downloadPostProcessWatcher(),

        // Publication download
        publicationDownloadCancelRequestWatcher(),
        publicationDownloadAddRequestWatcher(),
        publicationDownloadStatusWatcher(),

        // OPDS
        opdsAddRequestWatcher(),
        opdsInitWatcher(),
        opdsRemoveRequestWatcher(),
        opdsUpdateRequestWatcher(),

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
        streamerStopRequestWatcher(),
        streamerStartRequestWatcher(),
        streamerPublicationOpenRequestWatcher(),
        streamerPublicationCloseRequestWatcher(),

        // LCP
        lcpPassphraseSubmitRequestWatcher(),
        lcpUserKeyCheckRequestWatcher(),
        lcpRenewRequestWatcher(),
        lcpReturnRequestWatcher(),

        // Update checker
        updateStatusWatcher(),
    ]);
}
