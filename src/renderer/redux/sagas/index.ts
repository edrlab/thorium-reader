import { all } from "redux-saga/effects";

import { winInitWatcher } from "./win";

import {
    publicationDownloadAddSuccessWatcher,
    publicationDownloadSuccessWatcher,
} from "./publication-download";

import {
    lcpRenewErrorWatcher,
    lcpRenewSuccessWatcher,
    lcpReturnErrorWatcher,
    lcpReturnSuccessWatcher,
} from "./lcp";

export function* rootSaga() {
    yield all([

        winInitWatcher(),

        publicationDownloadAddSuccessWatcher(),
        publicationDownloadSuccessWatcher(),

        lcpRenewErrorWatcher(),
        lcpRenewSuccessWatcher(),
        lcpReturnErrorWatcher(),
        lcpReturnSuccessWatcher(),
    ]);
}
