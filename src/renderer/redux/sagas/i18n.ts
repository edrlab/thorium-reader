// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { container } from "readium-desktop/renderer/di";

import { Translator } from "readium-desktop/common/services/translator";

import { take } from "redux-saga/effects";

import { i18nActions } from "readium-desktop/common/redux/actions";

export function* localeWatcher() {
    while (true) {
        const action: i18nActions.ActionLocale = yield take(i18nActions.ActionType.Set);
        const translator = container.get("translator") as Translator;
        translator.setLocale(action.payload.locale);
    }
}

export function* watchers() {
    yield [
        localeWatcher(),
    ];
}
