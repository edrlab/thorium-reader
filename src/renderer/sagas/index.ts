import {
    watchCatalogInit,
    watchMainCatalogResponse,
} from "readium-desktop/renderer/sagas/catalog";
import {
    watchPublicationDelete,
    watchPublicationDownloadAdd,
    watchPublicationDownloadCancel,
    watchPublicationImport,
} from "readium-desktop/renderer/sagas/publication";
import {
    watchEpubManifestUrlResponse,
    watchReaderClose,
    watchReaderInit,
} from "readium-desktop/renderer/sagas/reader";

export function* rootSaga() {
    yield [
        watchCatalogInit(),
        watchReaderInit(),
        watchReaderClose(),
        watchEpubManifestUrlResponse(),
        watchMainCatalogResponse(),
        watchPublicationDownloadAdd(),
        watchPublicationDownloadCancel(),
        watchPublicationImport(),
        watchPublicationDelete(),
    ];
}
