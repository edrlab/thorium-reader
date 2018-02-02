import { all } from "redux-saga/effects";

import { winInitWatcher } from "./win";

export function* rootSaga() {
    yield all([
        winInitWatcher(),
    ]);
}
