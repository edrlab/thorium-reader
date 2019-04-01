// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { applyMiddleware, createStore, Store } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import createSagaMiddleware from "redux-saga";

import { routerMiddleware } from "connected-react-router";

import { History } from "history";
import { reduxSyncMiddleware } from "readium-desktop/renderer/redux/middleware/sync";
import { rootReducer } from "readium-desktop/renderer/redux/reducers";
import { rootSaga } from "readium-desktop/renderer/redux/sagas";
import { RootState } from "readium-desktop/renderer/redux/states";

export function initStore(history: History): Store<RootState> {
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(
        rootReducer(history),
        composeWithDevTools(
            applyMiddleware(
                routerMiddleware(history),
                reduxSyncMiddleware,
                sagaMiddleware,
            ),
        ),
    );
    sagaMiddleware.run(rootSaga);
    return store as Store<RootState>;
}
