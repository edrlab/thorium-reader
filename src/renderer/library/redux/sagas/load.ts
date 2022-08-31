// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { apiActions, loadActions } from "readium-desktop/common/redux/actions";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { put, race, spawn, take } from "redux-saga/effects";

export const saga = () => {
    return spawn(function*() {
        let pending = 0;

        while (true) {

            const { a: request, b: result } = yield race({
                a: take(apiActions.request.ID),
                b: take(apiActions.result.ID),
            });

            if (request) {
                ++pending;
                if (pending === 1) {
                    yield put(loadActions.busy.build());
                }
            } else if (result) {
                --pending;
                if (pending < 1) {
                    pending = 0;
                    yield put(loadActions.idle.build());
                }
            }
        }
    });
};
