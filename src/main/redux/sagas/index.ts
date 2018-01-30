import { all } from "redux-saga/effects";

import {
    watchCatalogInit,
    watchCatalogUpdate,
    watchRendererCatalogRequest,
} from "readium-desktop/main/redux/sagas/catalog";
import {
    watchStreamerPublicationClose,
    watchStreamerPublicationOpen,
} from "readium-desktop/main/redux/sagas/streamer";

import {
    watchPublicationUpdate,
    watchRendererPublicationRequest,
} from "readium-desktop/main/redux/sagas/collection-manager";

import {
    watchReaderClose,
    // watchReaderInit,
    watchReaderOpen,
    watchReaderOpenRequest,
} from "readium-desktop/main/redux/sagas/reader";


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
import { netStatusWatcher } from "./net";

export function* rootSaga() {
    yield all([
        watchCatalogInit(),
        watchCatalogUpdate(),
        watchRendererCatalogRequest(),

        watchStreamerPublicationOpen(),
        watchStreamerPublicationClose(),
        watchRendererPublicationRequest(),
        watchPublicationUpdate(),

        // Download
        downloadAddRequestWatcher(),
        downloadPostProcessWatcher(),

        // watchReaderInit(),
        watchReaderOpen(),
        watchReaderClose(),
        watchReaderOpenRequest(),

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
    ]);
}
