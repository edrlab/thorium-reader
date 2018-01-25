import { applyMiddleware, createStore, Store, compose } from "redux";
import createSagaMiddleware from "redux-saga";

// https://github.com/samiskin/redux-electron-store
// import { electronEnhancer } from "redux-electron-store";
// import reduxElectronStore = require("redux-electron-store");
// import * as reduxElectronStore from "redux-electron-store";

// https://github.com/hardchor/electron-redux
// import { forwardToRenderer, triggerAlias, replayActionMain } from require("electron-redux");
// import electronRedux = require("electron-redux");
// import * as electronRedux from "electron-redux";

import { AppState, rootReducer } from "readium-desktop/main/reducers";

import { rootSaga } from "readium-desktop/main/sagas";

const sagaMiddleware = createSagaMiddleware();

// const enhancer = compose(
//     applyMiddleware(sagaMiddleware),
//     reduxElectronStore.electronEnhancer({
//         dispatchProxy: (a: any) => store.dispatch(a),
//     }),
// );

export const store: Store<AppState> = createStore(
    rootReducer,
    // enhancer,
    applyMiddleware(
        // electronRedux.triggerAlias, // optional
        sagaMiddleware,
        // electronRedux.forwardToRenderer, // IMPORTANT! This goes last
    ),
) as (Store<AppState>);

// electronRedux.replayActionMain(store);

sagaMiddleware.run(rootSaga);
