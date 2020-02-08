// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { app } from "electron";
import { LocaleConfigIdentifier, LocaleConfigValueType } from "readium-desktop/common/config";
import { AvailableLanguages } from "readium-desktop/common/services/translator";
import { PromiseAllSettled } from "readium-desktop/common/utils/promise";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { CONFIGREPOSITORY_REDUX_WIN_PERSISTENCE } from "readium-desktop/main/di";
import { reduxSyncMiddleware } from "readium-desktop/main/redux/middleware/sync";
import { rootReducer } from "readium-desktop/main/redux/reducers";
import { rootSaga } from "readium-desktop/main/redux/sagas";
import { RootState } from "readium-desktop/main/redux/states";
import { ObjectKeys } from "readium-desktop/utils/object-keys-values";
import { applyMiddleware, createStore, Store } from "redux";
import createSagaMiddleware from "redux-saga";
import { composeWithDevTools } from "remote-redux-devtools";

import { reduxPersistMiddleware } from "../middleware/persistence";

const REDUX_REMOTE_DEVTOOLS_PORT = 7770;

const defaultLocale = (): LocaleConfigValueType => {
    const loc = app.getLocale().split("-")[0];
    const langCodes = ObjectKeys(AvailableLanguages);
    const lang = langCodes.find((l) => l === loc) || "en";

    return {
        locale: lang,
    };
};

export async function initStore(configRepository: ConfigRepository<any>): Promise<Store<RootState>> {

    let reduxStateRepository: ConfigDocument<Partial<RootState>>;
    let i18nStateRepository: ConfigDocument<LocaleConfigValueType>;

    try {
        const reduxStateRepositoryPromise = configRepository.get(CONFIGREPOSITORY_REDUX_WIN_PERSISTENCE);

        const i18nStateRepositoryPromise = configRepository.get(LocaleConfigIdentifier);

        const [
            reduxStateRepositoryResult,
            i18nStateRepositoryResult,
        ] = await PromiseAllSettled(
            [
                reduxStateRepositoryPromise,
                i18nStateRepositoryPromise,
            ],
        );

        if (reduxStateRepositoryResult.status === "fulfilled") {
            reduxStateRepository = reduxStateRepositoryResult.value;
        }
        if (i18nStateRepositoryResult.status === "fulfilled") {
            i18nStateRepository = i18nStateRepositoryResult.value;
        }
    } catch (_err) {
        // ignore
        // first init
    }

    const preloadedState = {
        ...reduxStateRepository?.value?.win
            ? reduxStateRepository.value
            : undefined,
        ...{
            i18n: i18nStateRepository?.value?.locale
                ? i18nStateRepository.value
                : defaultLocale(),
        },
    };

    const sagaMiddleware = createSagaMiddleware();

    const store = createStore(
        rootReducer,
        preloadedState,
        composeWithDevTools(
            {
                port: REDUX_REMOTE_DEVTOOLS_PORT,
            },
        )(
            applyMiddleware(
                reduxSyncMiddleware,
                sagaMiddleware,
                reduxPersistMiddleware,
            ),
        ),
    );

    sagaMiddleware.run(rootSaga);

    return store as Store<RootState>;
}
