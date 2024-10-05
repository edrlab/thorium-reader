// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import { ILibraryRootState } from "readium-desktop/common/redux/states/renderer/libraryRootState";
import { initStore } from "readium-desktop/renderer/library/redux/store/memory";
import { Store } from "redux";
import { IHistoryContext } from "redux-first-history";

export const createStoreFromDi = (preloadedState: Partial<ILibraryRootState>): ReturnType<typeof initStore> => {

    const [store, reduxHistory] = initStore(preloadedState);

    setStore(store);
    __reduxHistory = reduxHistory;

    return [store, reduxHistory];
};


let store: Store<ILibraryRootState> | undefined;
export const getStore = () => {
    if (store) {
        return store;
    }
    throw new Error("STORE is UNDEFINED !!!");
};
export const setStore = (_store: Store<ILibraryRootState>) => {
    if (!store) {
        store = _store;
    }
};


let __reduxHistory: ReturnType<IHistoryContext["createReduxHistory"]>;
export const getReduxHistory = () => {
    if (__reduxHistory) {
        return __reduxHistory;
    }
    throw new Error("reduxHistory is UNDEFINED !!!");
};
