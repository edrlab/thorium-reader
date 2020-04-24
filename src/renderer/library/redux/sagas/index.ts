// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import * as publicationInfoSyncTags from "readium-desktop/renderer/common/redux/sagas/dialog/publicationInfosSyncTags";
import { all, call } from "redux-saga/effects";

import * as publicationInfoOpds from "../../../common/redux/sagas/dialog/publicationInfoOpds";
import * as publicationInfoReaderAndLib from "../../../common/redux/sagas/dialog/publicationInfoReaderAndLib";
import * as watchdog from "../../../common/redux/sagas/watchdog";
import * as history from "./history";
import * as i18n from "./i18n";
import * as lcp from "./lcp";
import * as opds from "./opds";
import * as sameFileImport from "./sameFileImport";
import * as winInit from "./win";

// Logger
const filename_ = "readium-desktop:renderer:library:saga:index";
const debug = debug_(filename_);
debug("_");

export function* rootSaga() {

    yield all([
        watchdog.saga(),
        publicationInfoOpds.saga(),

        call(i18n.watchers),
        call(lcp.watchers),
        call(opds.watchers),
        call(winInit.watchers),
        call(publicationInfoReaderAndLib.watchers),
        call(sameFileImport.watchers),
        call(history.watchers),
        call(publicationInfoSyncTags.watchers),
    ]);

    // try {

    //     yield all([
    //     ]);
    // } catch (err) {
    //     error(filename_, err);
    // }
}
