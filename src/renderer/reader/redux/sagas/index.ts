// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { winActions } from "readium-desktop/renderer/common/redux/actions";
import * as publicationInfoReaderAndLib from "readium-desktop/renderer/common/redux/sagas/dialog/publicationInfoReaderAndLib";
import * as publicationInfoSyncTag from "readium-desktop/renderer/common/redux/sagas/dialog/publicationInfosSyncTags";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, take } from "redux-saga/effects";

import * as cssUpdate from "./cssUpdate";
import * as highlightHandler from "./highlight/handler";
import * as i18n from "./i18n";
import * as ipc from "./ipc";
import * as search from "./search";
import * as winInit from "./win";
import * as annotation from "./annotation";

// Logger
const filename_ = "readium-desktop:renderer:reader:saga:index";
const debug = debug_(filename_);
debug("_");

export function* rootSaga() {

    yield take(winActions.initRequest.ID);

    yield call(winInit.render);

    yield all([
        i18n.saga(),
        ipc.saga(),

        publicationInfoReaderAndLib.saga(),
        publicationInfoSyncTag.saga(),

        cssUpdate.saga(),

        highlightHandler.saga(),

        search.saga(),

        annotation.saga(),
    ]);
    // initSuccess triggered in reader.tsx didmount and publication loaded
    // yield put(winActions.initSuccess.build());
}
