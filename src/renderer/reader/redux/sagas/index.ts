// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as publicationInfoReaderAndLib from "readium-desktop/renderer/common/redux/sagas/dialog/publicationInfoReaderAndLib";
import * as publicationInfoSyncTag from "readium-desktop/renderer/common/redux/sagas/dialog/publicationInfosSyncTags";
import { all, call } from "redux-saga/effects";

import * as ipc from "./ipc";
import * as winInit from "./win";

export function* rootSaga() {
    yield all([
        call(winInit.watchers),
        call(publicationInfoReaderAndLib.watchers),
        call(publicationInfoSyncTag.watchers),
        call(ipc.watchers),
    ]);
}
