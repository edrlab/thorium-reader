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

import { all } from 'redux-saga/effects';

import { winInitWatcher } from "./win";

export function* rootSaga() {
    yield all([
        watchCatalogInit(),
        watchMainCatalogResponse(),
        watchPublicationDownloadAdd(),
        watchPublicationDownloadCancel(),
        watchPublicationImport(),
        watchPublicationDelete(),
        watchReaderInit(),
        winInitWatcher(),
    ]);
}
