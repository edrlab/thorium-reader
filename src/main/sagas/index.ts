import {
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

export function* rootSaga() {
    yield [
        watchCatalogInit(),
        watchCatalogUpdate(),
        watchRendererCatalogRequest(),
        watchDownloadStart(),
        watchRendererPublicationDownloadRequest(),
        watchDownloadUpdate(),
        watchPublicationDownloadUpdate(),
    ];
}
