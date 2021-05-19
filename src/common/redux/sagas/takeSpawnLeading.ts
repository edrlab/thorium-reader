// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { TakeableChannel } from "redux-saga";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { ActionPattern, call, spawn, take } from "redux-saga/effects";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => { };

export function takeSpawnLeading<P extends ActionPattern>(
    pattern: P,
    worker: (...args: any[]) => any,
    cbErr: (e: any) => void = noop,
) {
    return spawn(function*() {
        while (true) {
            const action: Action<any> = yield take(pattern);
            try {
                yield call(worker, action);
            } catch (e) {
                cbErr(e);
            }
        }
    });
}

export function takeSpawnLeadingChannel<P extends TakeableChannel<any>>(
    pattern: P,
    worker: (...args: any[]) => any,
    cbErr: (e: any) => void = noop,
) {
    return spawn(function*() {
        while (true) {
            const action: Action<any> = yield take(pattern);
            try {
                yield call(worker, action);
            } catch (e) {
                cbErr(e);
            }
        }
    });
}
