// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { i18nActions } from "readium-desktop/common/redux/actions";
import { diMainGet } from "readium-desktop/main/di";
import { all, call, take } from "redux-saga/effects";

import { I18NState } from "readium-desktop/common/redux/states/i18n";

export function* localeWatcher() {
    while (true) {
        const action: i18nActions.ActionLocale = yield take(i18nActions.ActionType.Set);
        const translator = diMainGet("translator");
        translator.setLocale(action.payload.locale);

        const configRepository = diMainGet("config-repository");
        yield call(() => configRepository.save({
            identifier: "i18n",
            value: { locale: action.payload.locale } as I18NState,
        }));
    }
}

export function* watchers() {
    yield all([
        call(localeWatcher),
    ]);
}
