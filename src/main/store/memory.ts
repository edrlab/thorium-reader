import { applyMiddleware, createStore, Store } from "redux";
import createSagaMiddleware from "redux-saga";

import { AppState, rootReducer } from "readium-desktop/main/reducers";

import { rootSaga } from "readium-desktop/main/sagas";

const sagaMiddleware = createSagaMiddleware();

export const store: Store<AppState> = createStore(
    rootReducer,
    applyMiddleware(sagaMiddleware),
) as (Store<AppState>);

sagaMiddleware.run(rootSaga);
