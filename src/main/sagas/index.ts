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
    watchPublicationCloseRequest,
    watchStreamManifestCloseRequest,
    watchStreamManifestOpenRequest,
} from "readium-desktop/main/sagas/streamer";

import {
    watchPublicationUpdate,
    watchRendererPublicationRequest,
} from "readium-desktop/main/sagas/collection-manager";

import {
    watchRendererOpdsListRequest,
} from "readium-desktop/main/sagas/opds";

export function* rootSaga() {
    yield [
        watchCatalogInit(),
        watchCatalogUpdate(),
        watchRendererCatalogRequest(),
        watchDownloadStart(),
        watchDownloadFinish(),
        watchRendererPublicationDownloadRequest(),
        watchDownloadUpdate(),
        watchPublicationDownloadUpdate(),
        watchStreamManifestOpenRequest(),
        watchStreamManifestCloseRequest(),
        watchPublicationCloseRequest(),
        watchRendererPublicationRequest(),
        watchPublicationUpdate(),
        watchRendererOpdsListRequest(),
    ];
}
