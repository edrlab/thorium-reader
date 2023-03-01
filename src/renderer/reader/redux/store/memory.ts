// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { reduxSyncMiddleware } from "readium-desktop/renderer/reader/redux/middleware/sync";
import { rootReducer } from "readium-desktop/renderer/reader/redux/reducers";
import { rootSaga } from "readium-desktop/renderer/reader/redux/sagas";
import { applyMiddleware, createStore, type Store } from "redux";
import { composeWithDevTools } from "@redux-devtools/extension";
import createSagaMiddleware from "redux-saga";

import { locatorHrefWatcherMiddleware } from "../middleware/locatorHrefWatcher";
import { reduxPersistMiddleware } from "../middleware/persistence";

export function initStore(preloadedState: Partial<IReaderRootState>): Store<IReaderRootState> {
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(
        rootReducer(),
        preloadedState,
        composeWithDevTools(
            applyMiddleware(
                locatorHrefWatcherMiddleware,
                reduxSyncMiddleware,
                reduxPersistMiddleware,
                sagaMiddleware,
            ),
        ),
    );
    sagaMiddleware.run(rootSaga);
    return store;
}
