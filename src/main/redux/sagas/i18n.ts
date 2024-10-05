// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { i18nActions } from "readium-desktop/common/redux/actions";
import { takeSpawnLeading } from "readium-desktop/common/redux/sagas/takeSpawnLeading";
import {  getTranslator } from "readium-desktop/common/services/translator";
import { error } from "readium-desktop/main/tools/error";
import { call } from "typed-redux-saga";

// Logger
const filename_ = "readium-desktop:main:saga:i18n";
const debug = debug_(filename_);
debug("_");

function* setLocale(action: i18nActions.setLocale.TAction) {

    debug("$$$$$");
    debug("i18n setLocale called", action.payload);
    debug("$$$$$");

    yield call(() => getTranslator().setLocale(action.payload.locale));
}

export function saga() {



    return takeSpawnLeading(
        i18nActions.setLocale.ID,
        setLocale,
        (e) => error(filename_, e),
    );
}
