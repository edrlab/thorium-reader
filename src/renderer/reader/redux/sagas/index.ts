// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { error } from "readium-desktop/common/error";
import * as publicationInfoReaderAndLib from "readium-desktop/renderer/common/redux/sagas/dialog/publicationInfoReaderAndLib";
import * as publicationInfoSyncTag from "readium-desktop/renderer/common/redux/sagas/dialog/publicationInfosSyncTags";
import { all, call } from "redux-saga/effects";

// import * as watchdog from "../../../common/redux/sagas/watchdog";
import * as i18n from "./i18n";
import * as ipc from "./ipc";
import * as winInit from "./win";

// Logger
const filename_ = "readium-desktop:renderer:reader:saga:index";
const debug = debug_(filename_);
debug("_");

export function* rootSaga() {

    try {
        yield all([
            call(winInit.watchers),
            call(publicationInfoReaderAndLib.watchers),
            call(publicationInfoSyncTag.watchers),
            call(ipc.watchers),
            call(i18n.watchers),
            // call(watchdog.watchers),
        ]);
    } catch (err) {
        error(filename_, err);
    }
}
