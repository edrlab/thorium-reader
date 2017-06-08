import {
    watchDownloadStart,
} from "readium-desktop/sagas/downloader";

import {
    watchDownloadFinish,
    watchDownloadProgress,
} from "readium-desktop/main/sagas/downloader";

import {
    watchPublicationDownloadFinish,
    watchPublicationDownloadProgress,
    watchPublicationDownloadStart,
} from "readium-desktop/main/sagas/publication";

import {
    watchCatalogInit,
    watchCatalogUpdate,
    watchRendererCatalogRequest,
} from "readium-desktop/main/sagas/catalog";

export function* rootSaga() {
    yield [
        watchCatalogInit(),
        watchCatalogUpdate(),
        watchRendererCatalogRequest(),
        watchDownloadStart(),
        watchDownloadFinish(),
        watchDownloadProgress(),
        watchPublicationDownloadStart(),
        watchPublicationDownloadFinish(),
        watchPublicationDownloadProgress(),
    ];
}
