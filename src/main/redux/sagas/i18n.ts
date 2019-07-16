// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ConfigRepository } from "readium-desktop/main/db/repository/config";

import { container } from "readium-desktop/main/di";

import { Translator } from "readium-desktop/common/services/translator";

import { all, call, put, take } from "redux-saga/effects";

import { i18nActions } from "readium-desktop/common/redux/actions";

import { SagaIterator } from "redux-saga";

import { appActions } from "readium-desktop/main/redux/actions";

export function* localeSetRequestWatcher(): SagaIterator {
    while (true) {
        const action = yield take(i18nActions.ActionType.LocaleSetRequest);

        const translator = container.get("translator") as Translator;
        translator.setLocale(action.payload.locale);

        const configRepository: ConfigRepository = container.get("config-repository") as ConfigRepository;

        try {
            yield call(() => configRepository.save({ i18n: { locale: action.payload.locale } }));
            yield put({
                type: i18nActions.ActionType.LocaleSetSuccess,
                payload: {
                    locale: action.payload.locale,
                },
            });
        } catch (error) {
            yield put({ type: i18nActions.ActionType.LocaleSetError, error: true });
        }
    }
}

export function* localeInitWatcher(): SagaIterator {
    // Wait for app initialization
    yield take(appActions.ActionType.InitSuccess);

    const configRepository: ConfigRepository = container
        .get("config-repository") as ConfigRepository;

    try {
        const i18n = yield call(() => configRepository.get("i18n"));

        // Returns the first reader configuration available in database
        yield put({
            type: i18nActions.ActionType.LocaleSetSuccess,
            payload: {
                locale: i18n.locale,
            },
        });
    } catch (error) {
        yield put({
            type: i18nActions.ActionType.LocaleSetError,
            payload: new Error(error),
            error: true,
        });
    }
}

export function* watchers() {
    yield all([
        localeInitWatcher(),
        localeSetRequestWatcher(),
    ]);
}
