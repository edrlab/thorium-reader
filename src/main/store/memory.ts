import { applyMiddleware, createStore, Store } from "redux";
import createSagaMiddleware from "redux-saga";

import { appReducer, AppState } from "readium-desktop/main/reducer";

import { appSaga } from "readium-desktop/main/sagas/app";

const sagaMiddleware = createSagaMiddleware();

export const store: Store<AppState> = createStore(
    appReducer,
    applyMiddleware(sagaMiddleware),
) as (Store<AppState>);
sagaMiddleware.run(appSaga);
