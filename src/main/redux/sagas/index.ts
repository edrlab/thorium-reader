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
    catalogInitWatcher,
    catalogLocalPublicationImportWatcher,
    catalogPublicationDownloadSuccessWatcher,
    catalogPublicationRemoveWatcher,
} from "./catalog";
// import { netStatusWatcher } from "./net";
import {
    readerCloseRequestWatcher,
    readerOpenRequestWatcher,
} from "./reader";
import {
    streamerPublicationCloseRequestWatcher,
    streamerPublicationOpenRequestWatcher,
    streamerStartRequestWatcher,
    streamerStopRequestWatcher,
} from "./streamer";

import {
    readerSettingsRestoreRequestWatcher,
    readerSettingsSaveRequestWatcher,
} from "./reader-settings";

export function* rootSaga() {
    yield all([
        // Catalog
        catalogInitWatcher(),
        catalogLocalPublicationImportWatcher(),
        catalogPublicationDownloadSuccessWatcher(),
        catalogPublicationRemoveWatcher(),

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
        readerOpenRequestWatcher(),

        // Streamer
        streamerStopRequestWatcher(),
        streamerStartRequestWatcher(),
        streamerPublicationOpenRequestWatcher(),
        streamerPublicationCloseRequestWatcher(),

        // Reader Settings
        readerSettingsSaveRequestWatcher(),
        readerSettingsRestoreRequestWatcher(),
    ]);
}
