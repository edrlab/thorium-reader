// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { SagaIterator } from "redux-saga";
import { all, put, take } from "redux-saga/effects";

import { lcpActions } from "readium-desktop/common/redux/actions";

import { open } from "readium-desktop/common/redux/actions/dialog";

import { DialogType } from "readium-desktop/common/models/dialog";

export function* lcpUserKeyCheckRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(lcpActions.ActionType.UserKeyCheckRequest);

        const { hint, publication } = action.payload;

        yield put(open(DialogType.LcpAuthentication, {publication, hint}));
    }
}

export function* watchers() {
    yield all([
        lcpUserKeyCheckRequestWatcher(),
    ]);
}
