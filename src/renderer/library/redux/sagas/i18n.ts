// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { i18nActions } from "readium-desktop/common/redux/actions";
import { diRendererGet } from "readium-desktop/renderer/library/di";
import { all, call, takeEvery } from "redux-saga/effects";

function* setLocale(action: i18nActions.setLocale.TAction) {
    const translator = diRendererGet("translator");

    const translatorSetLocale = async () =>
        await translator.setLocale(action.payload.locale);

    yield call(translatorSetLocale);
}

function* localeWatcher() {
    yield takeEvery(i18nActions.setLocale.build, setLocale);
}

export function* watchers() {
    yield all([
        call(localeWatcher),
    ]);
}
