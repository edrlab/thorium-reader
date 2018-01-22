import {
    watchDownloadFinish,
    watchDownloadStart,
} from "readium-desktop/sagas/downloader";

import {
    watchDownloadUpdate,
    watchPublicationDownloadUpdate,
    watchRendererPublicationDownloadRequest,
} from "readium-desktop/main/sagas/publication-download";

import {
    watchCatalogInit,
    watchCatalogUpdate,
    watchRendererCatalogRequest,
} from "readium-desktop/main/sagas/catalog";
import {
    watchStreamerPublicationClose,
    watchStreamerPublicationOpen,
} from "readium-desktop/main/sagas/streamer";

import {
    watchPublicationUpdate,
    watchRendererPublicationRequest,
} from "readium-desktop/main/sagas/collection-manager";

import {
    watchRendererOpdsListRequest,
} from "readium-desktop/main/sagas/opds";

import {
    watchReaderClose,
    watchReaderInit,
    watchReaderOpen,
    watchReaderOpenRequest,
} from "readium-desktop/main/sagas/reader";

import { all } from 'redux-saga/effects';

export function* rootSaga() {
    yield all([
        watchCatalogInit(),
        watchCatalogUpdate(),
        watchRendererCatalogRequest(),
        watchDownloadStart(),
        watchDownloadFinish(),
        watchRendererPublicationDownloadRequest(),
        watchDownloadUpdate(),
        watchPublicationDownloadUpdate(),
        watchStreamerPublicationOpen(),
        watchStreamerPublicationClose(),
        watchRendererPublicationRequest(),
        watchPublicationUpdate(),
        watchRendererOpdsListRequest(),
        watchReaderInit(),
        watchReaderOpen(),
        watchReaderClose(),
        watchReaderOpenRequest(),
    ]);
}
