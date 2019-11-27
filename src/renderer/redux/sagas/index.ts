// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { all, call } from "redux-saga/effects";

import * as publicationInfoOpds from "./dialog/publicationInfoOpds";
import * as publicationInfoReaderAndLib from "./dialog/publicationInfoReaderAndLib";
import * as i18n from "./i18n";
import * as lcp from "./lcp";
import * as opds from "./opds";
import * as sameFileImport from "./sameFileImport";
import { winInitWatcher } from "./win";

export function* rootSaga() {
    yield all([
        call(i18n.watchers),
        call(lcp.watchers),
        call(opds.watchers),
        call(winInitWatcher),
        call(publicationInfoOpds.watchers),
        call(publicationInfoReaderAndLib.watchers),
        call(sameFileImport.watchers),
    ]);
}
