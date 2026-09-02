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
import { applyMiddleware, legacy_createStore as createStore, type Store } from "redux";
import { composeWithDevTools } from "@redux-devtools/extension";
import createSagaMiddleware, { SagaMiddleware } from "redux-saga";
import { createReduxHistoryContext } from "redux-first-history";
import { createMemoryHistory } from "history";
import type { History } from "history";

import { locatorHrefWatcherMiddleware } from "../middleware/locatorHrefWatcher";

export function initStore(preloadedState: Partial<IReaderRootState>): [
    Store<IReaderRootState>,
    History & {
        listenObject: boolean;
    },
    SagaMiddleware,
] {
    const history: History = createMemoryHistory({
        initialEntries: ["/reader"],
    });
    const {
        createReduxHistory,
        routerMiddleware,
        routerReducer,
    } = createReduxHistoryContext({ history });
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(
        rootReducer(routerReducer),
        preloadedState,
        composeWithDevTools(
            applyMiddleware(
                routerMiddleware,
                locatorHrefWatcherMiddleware,
                reduxSyncMiddleware,
                sagaMiddleware,
            ),
        ),
    );
    sagaMiddleware.run(rootSaga);
    const reduxHistory = createReduxHistory(store);
    return [store, reduxHistory, sagaMiddleware];
}
