import { SagaIterator } from "redux-saga";
import { call, fork, put, take } from "redux-saga/effects";

import { OPDS } from "readium-desktop/common/models/opds";

import { container } from "readium-desktop/main/di";

import { OpdsDb } from "readium-desktop/main/db/opds-db";

import { lcpActions } from "readium-desktop/common/redux/actions";

export function* lcpRequestWatcher(): SagaIterator {
    while (true) {
        const requestAction = yield take(lcpActions.ActionType.PassphraseRequest);
        const passphrase: string = requestAction.payload.passphrase;

        console.log("LCP PASSPHRASE :", passphrase);
    }
}
