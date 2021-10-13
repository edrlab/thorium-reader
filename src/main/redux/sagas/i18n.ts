// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
// import { LocaleConfigIdentifier, LocaleConfigValueType } from "readium-desktop/common/config";
import { i18nActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import { AvailableLanguages } from "readium-desktop/common/services/translator";
// import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { diMainGet } from "readium-desktop/main/di";
import { error } from "readium-desktop/main/tools/error";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { all, call } from "redux-saga/effects";
import { call as callTyped } from "typed-redux-saga/macro";

// Logger
const filename_ = "readium-desktop:main:saga:i18n";
const debug = debug_(filename_);
debug("_");

function* setLocale(action: i18nActions.setLocale.TAction) {

    debug("$$$$$");
    debug("i18n setLocale called", action.payload);
    debug("$$$$$");

    const langKey = Object.keys(AvailableLanguages);
    if (langKey.includes(action.payload.locale)) {

        const translator = yield* callTyped(() => diMainGet("translator"));
        // const configRepository: ConfigRepository<LocaleConfigValueType> = yield call(
        //     () => diMainGet("config-repository"),
        // );

        // // const configRepositorySave = () =>
        // //     configRepository.save({
        // //         identifier: LocaleConfigIdentifier,
        // //         value: {
        // //             locale: action.payload.locale,
        // //         },
        // //     });

        const translatorSetLocale = () =>
            translator.setLocale(action.payload.locale);

        yield all([
            // call(configRepositorySave),
            call(translatorSetLocale),
        ]);

    } else {
        debug("locale not defined!");
    }
}

export function saga() {

    return takeSpawnLeading(
        i18nActions.setLocale.ID,
        setLocale,
        (e) => error(filename_, e),
    );
}
