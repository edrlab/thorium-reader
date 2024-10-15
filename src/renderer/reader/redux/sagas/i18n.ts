// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { i18nActions } from "readium-desktop/common/redux/actions";
import { takeSpawnEvery } from "readium-desktop/common/redux/sagas/takeSpawnEvery";
import { getTranslator } from "readium-desktop/common/services/translator";
import { call } from "typed-redux-saga";

function* setLocale(action: i18nActions.setLocale.TAction) {
    yield call(() => getTranslator().setLocale(action.payload.locale));
}

export function saga() {
    return takeSpawnEvery(
        i18nActions.setLocale.ID,
        setLocale,
    );
}
