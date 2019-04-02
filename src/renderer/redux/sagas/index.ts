// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { all } from "redux-saga/effects";

import { winInitWatcher } from "./win";

import * as lcp from "./lcp";
import * as opds from "./opds";

export function* rootSaga() {
    yield all([
        lcp.watchers(),
        opds.watchers(),

        winInitWatcher(),
    ]);
}
