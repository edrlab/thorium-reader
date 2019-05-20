// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { container } from "readium-desktop/main/di";

import { Translator } from "readium-desktop/common/services/translator";

import { i18nActions } from "readium-desktop/common/redux/actions";

import { SagaIterator } from "redux-saga";

import { put, take } from "redux-saga/effects";

import { appActions } from "readium-desktop/main/redux/actions";

import { ConfigRepository } from "readium-desktop/main/db/repository/config";

export function* localeWatcher() {
    while (true) {
        const action = yield take(i18nActions.ActionType.Set);
        const translator = container.get("translator") as Translator;
        const config = container.get("config-repository") as ConfigRepository;
        console.log("main action : " + action.payload.locale);
        console.log(config);
        translator.setLocale(action.payload.locale);
    }
}

export function* localeInitWatcher(): SagaIterator {
    while (true) {
        yield take(appActions.ActionType.InitRequest);
        yield put({type: appActions.ActionType.InitSuccess});
    }
}

export function* watchers() {
    yield [
        localeWatcher(),
        localeInitWatcher(),
    ];
}
