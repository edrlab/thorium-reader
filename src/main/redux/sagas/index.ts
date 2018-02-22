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
// import { netStatusWatcher } from "./net";
import {
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
        // netStatusWatcher(),

        // Reader
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
        lcpRenewRequestWatcher(),
    ]);
}
