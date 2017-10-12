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
    watchReaderInit,
} from "readium-desktop/renderer/sagas/reader";

import {
    watchMainOpdsResponse,
    watchOpdsAdd,
    watchOpdsListInit,
    watchOpdsRemove,
    watchOpdsUpdate,
} from "readium-desktop/renderer/sagas/opds";

export function* rootSaga() {
    yield [
        watchCatalogInit(),
        watchMainCatalogResponse(),
        watchPublicationDownloadAdd(),
        watchPublicationDownloadCancel(),
        watchPublicationImport(),
        watchPublicationDelete(),
        watchOpdsListInit(),
        watchMainOpdsResponse(),
        watchOpdsAdd(),
        watchOpdsUpdate(),
        watchOpdsRemove(),
        watchReaderInit(),
    ];
}
