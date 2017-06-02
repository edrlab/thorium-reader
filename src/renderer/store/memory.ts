import { applyMiddleware, createStore, Store } from "redux";
import createSagaMiddleware from "redux-saga";

import { RendererState, rootReducer } from "readium-desktop/renderer/reducers";
import { rootSaga } from "readium-desktop/renderer/sagas/root";

const sagaMiddleware = createSagaMiddleware();

export const store: Store<RendererState> = createStore(
    rootReducer,
    applyMiddleware(sagaMiddleware),
) as (Store<RendererState>);

sagaMiddleware.run(rootSaga);
