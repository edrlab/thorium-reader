// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TakeableChannel } from "redux-saga";
import { ActionPattern, call, fork, ForkEffect, spawn, take } from "redux-saga/effects";

// tslint:disable-next-line: no-empty
const noop = () => { };

export function takeSpawnEvery(
    pattern: ActionPattern,
    worker: (...args: any[]) => any,
    cbErr: (e: any) => void = noop,
): ForkEffect<never> {
    return spawn(function*() {
        while (true) {
            const action = yield take(pattern);
            yield fork(function*() {
                try {
                    yield call(worker, action);
                } catch (e) {
                    cbErr(e);
                }
            });
        }
    });
}

export function takeSpawnEveryChannel(
    pattern: TakeableChannel<any>,
    worker: (...args: any[]) => any,
    cbErr: (e: any) => void = noop,
): ForkEffect<never> {
    return spawn(function*() {
        while (true) {
            const action = yield take(pattern);
            yield fork(function*() {
                try {
                    yield call(worker, action);
                } catch (e) {
                    cbErr(e);
                }
            });
        }
    });
}
