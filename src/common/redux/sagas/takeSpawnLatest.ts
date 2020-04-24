// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Task } from "redux-saga";
import { ActionPattern, call, cancel, fork, ForkEffect, spawn, take } from "redux-saga/effects";

// tslint:disable-next-line: no-empty
const noop = () => { };

export function takeSpawnLatest(
    pattern: ActionPattern,
    worker: (...args: any[]) => any,
    cbErr: (e: any) => void = noop,
): ForkEffect<never> {
    return spawn(function*() {
        let lastTask: Task;
        while (true) {
            const action = yield take(pattern);
            if (lastTask) {
                yield cancel(lastTask);
            }
            lastTask = yield fork(function*() {
                try {
                    yield call(worker, action);
                } catch (e) {
                    cbErr(e);
                }
            });
        }
    });
}
