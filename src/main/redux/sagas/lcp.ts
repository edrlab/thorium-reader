import { SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import { OPDS } from "readium-desktop/common/models/opds";

import { container } from "readium-desktop/main/di";

import { OpdsDb } from "readium-desktop/main/db/opds-db";

import { lcpActions } from "readium-desktop/common/redux/actions";

export function* lcpPassphraseSubmitRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.PassphraseSubmitRequest);
        const passphrase: string = action.payload.passphrase;

        console.log("LCP PASSPHRASE :", passphrase);
    }
}

export function* lcpUserKeyCheckRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.UserKeyCheckRequest);
        console.log("#### User key check", action);
        yield put({
            type: lcpActions.ActionType.UserKeyCheckError,
            error: true,
        });
    }
}
