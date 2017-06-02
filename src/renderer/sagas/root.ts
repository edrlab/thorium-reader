import { loadCatalog } from "readium-desktop/renderer/sagas/catalog";

export function* rootSaga() {
    yield [
        loadCatalog(),
    ];
}
