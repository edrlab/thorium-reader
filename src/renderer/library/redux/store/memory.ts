// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { createReduxHistoryContext } from "redux-first-history";
import { History } from "history";
import { reduxSyncMiddleware } from "readium-desktop/renderer/library/redux/middleware/sync";
import { rootReducer } from "readium-desktop/renderer/library/redux/reducers";
import { rootSaga } from "readium-desktop/renderer/library/redux/sagas";
import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { applyMiddleware, legacy_createStore as createStore, type Store } from "redux";
import { composeWithDevTools } from "@redux-devtools/extension";
import createSagaMiddleware, { SagaMiddleware } from "redux-saga";

import { createHashHistory } from "history";

export function initStore(preloadedState: Partial<ILibraryRootState>):
[Store<ILibraryRootState>, History & {
    listenObject: boolean;
}, SagaMiddleware] {
    const history: History = createHashHistory(); // createBrowserHistory()
    const {
        createReduxHistory,
        routerMiddleware,
        routerReducer,
    } = createReduxHistoryContext({ history: history });

    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(
        rootReducer(routerReducer),
        preloadedState,
        composeWithDevTools(
            applyMiddleware(
                routerMiddleware,
                reduxSyncMiddleware,
                sagaMiddleware,
            ),
        ),
    );
    sagaMiddleware.run(rootSaga);

    const reduxHistory = createReduxHistory(store);
    return [store as Store<ILibraryRootState>, reduxHistory, sagaMiddleware];
}
