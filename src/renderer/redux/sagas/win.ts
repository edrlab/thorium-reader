import { SagaIterator } from "redux-saga";
import { put, take } from "redux-saga/effects";

import { winActions } from "readium-desktop/renderer/redux/actions";

export function* winInitWatcher(): SagaIterator {
    while (true) {
        yield take(winActions.ActionType.InitRequest);
        yield put({type: winActions.ActionType.InitSuccess});
    }
}
