import { SagaIterator } from "redux-saga";
import { put, take } from "redux-saga/effects";

import { appActions } from "readium-desktop/main/redux/actions";

export function* appInitWatcher(): SagaIterator {
    while (true) {
        yield take(appActions.ActionType.InitRequest);
        yield put({type: appActions.ActionType.InitSuccess});
    }
}
