import {
    watchDownloadStart,
} from "readium-desktop/sagas/downloader";

import {
    watchDownloadFinish,
    watchDownloadProgress,
} from "readium-desktop/main/sagas/downloader";

import {
    watchPublicationDownloadUpdate,
    watchDownloadUpdate,
    watchRendererPublicationDownloadRequest,
} from "readium-desktop/main/sagas/publication-download";

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
        watchRendererPublicationDownloadRequest(),
        watchDownloadUpdate(),
        watchPublicationDownloadUpdate(),
    ];
}
