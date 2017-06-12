import {
    watchCatalogInit,
    watchMainCatalogResponse,
} from "readium-desktop/renderer/sagas/catalog";
import { watchPublicationDownloadAdd } from "readium-desktop/renderer/sagas/publication";

export function* rootSaga() {
    yield [
        watchCatalogInit(),
        watchMainCatalogResponse(),
        watchPublicationDownloadAdd(),
    ];
}
