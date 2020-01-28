// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { applyMiddleware, createStore, Store } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import createSagaMiddleware from "redux-saga";

import { reduxSyncMiddleware } from "readium-desktop/main/redux/middleware/sync";
import { rootReducer } from "readium-desktop/main/redux/reducers";
import { RootState } from "readium-desktop/main/redux/states";

import { rootSaga } from "readium-desktop/main/redux/sagas";

import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { CONFIGREPOSITORY_REDUX_WIN_PERSISTENCE } from "readium-desktop/main/di";
import { reduxPersistMiddleware } from "../middleware/persistence";

export async function initStore(configRepository: ConfigRepository<Partial<RootState>>): Promise<Store<RootState>> {

    const preloadedStateRepository = await configRepository.get(CONFIGREPOSITORY_REDUX_WIN_PERSISTENCE);
    const preloadedState = preloadedStateRepository.value?.win
        ? preloadedStateRepository.value
        : undefined;
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(
        rootReducer,
        preloadedState,
        composeWithDevTools(
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
