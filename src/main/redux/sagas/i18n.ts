// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { LocaleConfigIdentifier, LocaleConfigValueType } from "readium-desktop/common/config";
import { error } from "readium-desktop/common/error";
import { i18nActions } from "readium-desktop/common/redux/actions";
import { callTyped } from "readium-desktop/common/redux/typed-saga";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { diMainGet } from "readium-desktop/main/di";
import { all, call, takeLeading } from "redux-saga/effects";

// Logger
const filename_ = "readium-desktop:main:saga:i18n";
const debug = debug_(filename_);
debug("_");

function* setLocale(action: i18nActions.setLocale.TAction) {

    const translator = yield* callTyped(() => diMainGet("translator"));
    const configRepository: ConfigRepository<LocaleConfigValueType> = yield* callTyped(() => diMainGet("config-repository"));

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

function* localeWatcher() {
    yield takeLeading(i18nActions.setLocale.build, setLocale);
}

export function* watchers() {
    try {
        yield all([
            call(localeWatcher),
        ]);

    } catch (err) {
        error(filename_, err);
    }
}
