import { all } from "redux-saga/effects";

import { winInitWatcher } from "./win";

import {
    publicationDownloadAddSuccessWatcher,
    publicationDownloadSuccessWatcher,
} from "./publication-download";

export function* rootSaga() {
    yield all([

        winInitWatcher(),

        publicationDownloadAddSuccessWatcher(),
        publicationDownloadSuccessWatcher(),
    ]);
}
