// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { LocaleConfigIdentifier, LocaleConfigValueType } from "readium-desktop/common/config";
import { i18nActions } from "readium-desktop/common/redux/actions";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { diMainGet } from "readium-desktop/main/di";
import { all, call, takeEvery } from "redux-saga/effects";

function* setLocale(action: i18nActions.setLocale.TAction) {
    const translator = diMainGet("translator");
    const configRepository: ConfigRepository<LocaleConfigValueType> = diMainGet("config-repository");

    const configRepositorySave = () =>
        configRepository.save({
            identifier: LocaleConfigIdentifier,
            value: {
                locale: action.payload.locale,
            },
        });
    const translatorSetLocale = () =>
        translator.setLocale(action.payload.locale);

    yield all([
        call(configRepositorySave),
        call(translatorSetLocale),
    ]);
}

export function* localeWatcher() {
    yield takeEvery(i18nActions.setLocale.build, setLocale);
}

export function* watchers() {
    yield all([
        call(localeWatcher),
    ]);
}
