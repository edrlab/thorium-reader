// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { catalogActions, i18nActions, keyboardActions } from "readium-desktop/common/redux/actions";
import { winActions } from "readium-desktop/renderer/common/redux/actions";
import * as publicationInfoSyncTags from "readium-desktop/renderer/common/redux/sagas/dialog/publicationInfosSyncTags";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call, put, take } from "redux-saga/effects";
import { put as putTyped } from "typed-redux-saga/macro";

import * as publicationInfoOpds from "../../../common/redux/sagas/dialog/publicationInfoOpds";
import * as publicationInfoReaderAndLib from "../../../common/redux/sagas/dialog/publicationInfoReaderAndLib";
import * as catalog from "./catalog";
import * as history from "./history";
import * as i18n from "./i18n";
import * as lcp from "./lcp";
import * as load from "./load";
import * as opds from "./opds";
import * as sameFileImport from "./sameFileImport";
import * as winInit from "./win";

// Logger
const filename_ = "readium-desktop:renderer:library:saga:index";
const debug = debug_(filename_);
debug("_");

export function* rootSaga() {

    yield i18n.saga();

    yield all({
        win: take(winActions.initRequest.ID),
        i18n: take(i18nActions.setLocale.ID),
        keyboard: take(keyboardActions.setShortcuts.ID),
    });

    yield put(winActions.initSuccess.build());

    yield call(winInit.render);

    yield all([

        publicationInfoOpds.saga(),

        lcp.saga(),
        opds.saga(),

        publicationInfoReaderAndLib.saga(),

        sameFileImport.saga(),
        history.saga(),
        publicationInfoSyncTags.saga(),

        load.saga(),

        // TODO need to update this
        catalog.saga(),

    ]);

    yield* putTyped(catalogActions.getCatalog.build()); // ask to fill catalog view
}
