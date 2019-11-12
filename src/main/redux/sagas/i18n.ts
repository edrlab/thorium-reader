// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LocaleConfigIdentifier, LocaleConfigRepositoryType } from "readium-desktop/common/config";
import { i18nActions } from "readium-desktop/common/redux/actions";
import { takeTyped } from "readium-desktop/common/redux/typed-saga";
import { diMainGet } from "readium-desktop/main/di";
import { all, call } from "redux-saga/effects";

export function* localeWatcher() {
    while (true) {
        const action = yield* takeTyped(i18nActions.setLocale.build);
        const translator = diMainGet("translator");
        translator.setLocale(action.payload.locale);

        const configRepository: LocaleConfigRepositoryType = diMainGet("config-repository");
        yield call(() => configRepository.save({
            identifier: LocaleConfigIdentifier,
            value: { locale: action.payload.locale },
        }));
    }
}

export function* watchers() {
    yield all([
        call(localeWatcher),
    ]);
}
