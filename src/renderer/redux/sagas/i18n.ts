// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { i18nActions } from "readium-desktop/common/redux/actions";
import { diRendererGet } from "readium-desktop/renderer/di";
import { all, call, take } from "redux-saga/effects";

export function* localeWatcher() {
    while (true) {
        const action: i18nActions.ActionLocale = yield take(i18nActions.ActionType.Set);
        const translator = diRendererGet("translator");
        translator.setLocale(action.payload.locale);
    }
}

export function* watchers() {
    yield all([
        call(localeWatcher),
    ]);
}
