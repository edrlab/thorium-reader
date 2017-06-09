import {
    watchCatalogInit,
    watchMainCatalogResponse,
} from "readium-desktop/renderer/sagas/catalog";

export function* rootSaga() {
    yield [
        watchCatalogInit(),
        watchMainCatalogResponse(),
    ];
}
