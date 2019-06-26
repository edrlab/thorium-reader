// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { all } from "redux-saga/effects";

import { appInitWatcher } from "./app";

import { netStatusWatcher } from "./net";

import * as reader from "./reader";

import * as api from "./api";

import * as i18n from "./i18n";

import * as streamer from "./streamer";

import {
    updateStatusWatcher,
} from "./update";

export function* rootSaga() {
    yield all([
        api.watchers(),

        // I18N
        i18n.watchers(),

        // App
        appInitWatcher(),

        // Net
        netStatusWatcher(),

        // Reader
        reader.watchers(),

        // Streamer
        streamer.watchers(),

        // Update checker
        updateStatusWatcher(),
    ]);
}
