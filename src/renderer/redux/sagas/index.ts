import {
    watchCatalogInit,
    watchMainCatalogResponse,
} from "readium-desktop/renderer/sagas/catalog";
import {
    watchPublicationDownloadAddSuccess,
    watchPublicationDownloadSuccess,
} from "readium-desktop/renderer/sagas/publication";
import {
    watchReaderInit,
} from "readium-desktop/renderer/sagas/reader";

import { all } from 'redux-saga/effects';

import { winInitWatcher } from "./win";

export function* rootSaga() {
    yield all([
        watchCatalogInit(),
        watchMainCatalogResponse(),
        watchPublicationDownloadAddSuccess(),
        watchPublicationDownloadSuccess(),
        watchReaderInit(),
        winInitWatcher(),
    ]);
}
