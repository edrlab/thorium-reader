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
    watchPublicationImportUpdate,
    watchRendererPublicationImportRequest,
} from "readium-desktop/main/sagas/publication-import";

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
        watchRendererPublicationImportRequest(),
        watchPublicationImportUpdate(),
    ];
}
