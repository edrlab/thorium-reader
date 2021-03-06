// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call, spawn } from "redux-saga/effects";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => { };

export function spawnLeading(
    worker: () => any,
    cbErr: (e: any) => void = noop,
) {
    return spawn(function*() {
        while (true) {
            try {
                yield call(worker);
            } catch (e) {
                cbErr(e);
            }
        }
    });
}
