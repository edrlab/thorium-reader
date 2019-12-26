// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { i18nActions } from "readium-desktop/common/redux/actions/";
import { winActions } from "readium-desktop/renderer/redux/actions";
import { SagaIterator } from "redux-saga";
import { all, put, take } from "redux-saga/effects";

export function* winInitWatcher(): SagaIterator {
    while (true) {

        yield all({
            win: take(winActions.initRequest.ID),
            i18n: take(i18nActions.setLocale.ID),
        });

        yield put(winActions.initSuccess.build());
    }
}
