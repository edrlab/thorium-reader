import { all } from "redux-saga/effects";

import {
    watchReaderInit,
} from "readium-desktop/renderer/sagas/reader";

import { winInitWatcher } from "./win";

export function* rootSaga() {
    yield all([
        watchReaderInit(),
        winInitWatcher(),
    ]);
}
