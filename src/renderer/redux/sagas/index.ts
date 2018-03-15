import { all } from "redux-saga/effects";

import { winInitWatcher } from "./win";

import {
    publicationDownloadAddSuccessWatcher,
    publicationDownloadSuccessWatcher,
} from "./publication-download";

import {
    lcpPassphraseSubmitErrorWatcher,
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

        lcpPassphraseSubmitErrorWatcher(),
        lcpRenewErrorWatcher(),
        lcpRenewSuccessWatcher(),
        lcpReturnErrorWatcher(),
        lcpReturnSuccessWatcher(),
    ]);
}
