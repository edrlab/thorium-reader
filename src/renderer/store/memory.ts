import { applyMiddleware, createStore, Store, compose } from "redux";
import createSagaMiddleware from "redux-saga";

// https://github.com/samiskin/redux-electron-store
// import { electronEnhancer } from "redux-electron-store";
// import reduxElectronStore = require("redux-electron-store");
// import * as reduxElectronStore from "redux-electron-store";

// https://github.com/hardchor/electron-redux
// import { forwardToMain, replayActionRenderer, getInitialStateRenderer } from require("electron-redux");
// import electronRedux = require("electron-redux");
// import * as electronRedux from "electron-redux";

import { RendererState, rootReducer } from "readium-desktop/renderer/reducers";
import { rootSaga } from "readium-desktop/renderer/sagas";

const sagaMiddleware = createSagaMiddleware();

// const enhancer = compose(
//     applyMiddleware(sagaMiddleware),
//     reduxElectronStore.electronEnhancer({
//         dispatchProxy: (a: any) => store.dispatch(a),
//     }),
//     // DevTools.instrument()
// );

// const initialState = electronRedux.getInitialStateRenderer();

export const store: Store<RendererState> = createStore(
    rootReducer,
    // initialState,
    // enhancer,
    applyMiddleware(
        // electronRedux.forwardToMain, // IMPORTANT! This goes first
        sagaMiddleware,
    ),
) as (Store<RendererState>);

// electronRedux.replayActionRenderer(store);

sagaMiddleware.run(rootSaga);
