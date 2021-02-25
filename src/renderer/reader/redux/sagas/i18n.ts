// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { i18nActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { diReaderGet } from "readium-desktop/renderer/reader/di";
// eslint-disable-next-line local-rules/typed-redux-saga-use-typed-effects
import { call } from "redux-saga/effects";
import { call as callTyped } from "typed-redux-saga/macro";

function* setLocale(action: i18nActions.setLocale.TAction) {
    const translator = yield* callTyped(() => diReaderGet("translator"));

    const translatorSetLocale = async () =>
        await translator.setLocale(action.payload.locale);

    yield call(translatorSetLocale);
}

export function saga() {
    return takeSpawnEvery(
        i18nActions.setLocale.ID,
        setLocale,
    );
}
