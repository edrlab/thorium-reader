// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import { initStore } from "readium-desktop/renderer/reader/redux/store/memory";
// import { type Store } from "redux";

import { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
// import { diReaderSymbolTable } from "./diSymbolTable";
import { readerLocalActionSetConfig } from "./redux/actions";
import { readerConfigInitialState } from "readium-desktop/common/redux/states/reader";
import { Store } from "redux";

// Create container used for dependency injection
// const container = new Container();

export const createStoreFromDi = (preloadedState: Partial<IReaderRootState>): Store<IReaderRootState> => {

    const store = initStore(preloadedState);
    setStore(store);

    // see issue https://github.com/edrlab/thorium-reader/issues/2532
    const defaultConfig = readerConfigInitialState;
    const newConfig = { ...store.getState().reader.config };
    let flag = false;

    // Migrate new entry for annotation in READER config
    if (newConfig.annotation_defaultColor === undefined) {

        console.log("ANNOTATION MIGRATION !! defaultColor not set migrate from defaultConfig value=", newConfig.annotation_defaultColor);
        newConfig.annotation_defaultColor = defaultConfig.annotation_defaultColor;
        flag = true;
    }
    if (newConfig.annotation_defaultDrawType === undefined) {

        console.log("ANNOTATION MIGRATION !! defaultDrawType not set migrate from defaultConfig value=", newConfig.annotation_defaultDrawType);
        newConfig.annotation_defaultDrawType = defaultConfig.annotation_defaultDrawType;
        flag = true;
    }
    if (newConfig.annotation_popoverNotOpenOnNoteTaking === undefined) {

        console.log("ANNOTATION MIGRATION !! popoverNotOpenOnNoteTaking (quick annotation mode) not set migrate from defaultConfig value=", newConfig.annotation_popoverNotOpenOnNoteTaking);
        newConfig.annotation_popoverNotOpenOnNoteTaking = defaultConfig.annotation_popoverNotOpenOnNoteTaking;
        flag = true;
    }
    if (newConfig.annotation_defaultDrawView === undefined) {

        console.log("ANNOTATION MIGRATION !! defaultDrawView not set migrate from defaultConfig value=", newConfig.annotation_defaultDrawView);
        newConfig.annotation_defaultDrawView = defaultConfig.annotation_defaultDrawView;
        flag = true;
    }
    if (newConfig.theme === undefined) {

        console.log("MIGRATION !! theme not set migrate from defaultConfig value=", newConfig.theme);
        newConfig.theme = newConfig.night ? "night" : newConfig.sepia ? "sepia" : defaultConfig.theme;
        newConfig.night = false;
        newConfig.sepia = false;
        flag = true;
    }
    if (newConfig.readerDockingMode === undefined) {

        console.log("MIGRATION !! readerDockingMode not set migrate from defaultConfig value=", newConfig.readerDockingMode);
        newConfig.readerDockingMode = defaultConfig.readerDockingMode;
        flag = true;
    }
    if (newConfig.ttsPlaybackRate === undefined) {

        console.log("MIGRATION !! ttsPlaybackRate not set migrate from defaultConfig value=", newConfig.ttsPlaybackRate);
        newConfig.ttsPlaybackRate = defaultConfig.ttsPlaybackRate;
        flag = true;
    }
    if (newConfig.mediaOverlaysPlaybackRate === undefined) {

        console.log("MIGRATION !! mediaOverlaysPlaybackRate not set migrate from defaultConfig value=", newConfig.mediaOverlaysPlaybackRate);
        newConfig.mediaOverlaysPlaybackRate = defaultConfig.mediaOverlaysPlaybackRate;
        flag = true;
    }
    if (newConfig.ttsVoice === undefined) {

        console.log("MIGRATION !! ttsVoice not set migrate from defaultConfig value=", newConfig.ttsVoice);
        newConfig.ttsVoice = defaultConfig.ttsVoice;
        flag = true;
    }


    if (flag) {
        console.log(`ANNOTATION MIGRATION : There are a data need to be migrated from defaultConfig to config OLD=${JSON.stringify(store.getState().reader.config, null, 4)} NEW=${JSON.stringify(newConfig, null, 4)}`);
        store.dispatch(readerLocalActionSetConfig.build(newConfig));
        console.log(`ANNOTATION MIGRATION : Data migrated after the dispatch so this is the new data : ${JSON.stringify(store.getState().reader.config, null, 4)}`);
    }
    return store;
};

let store: Store<IReaderRootState> | undefined;
export const getStore = () => {
    if (store) {
        return store;
    }
    throw new Error("STORE is UNDEFINED !!!");
};
export const setStore = (_store: Store<IReaderRootState>) => {
    if (!store) {
        store = _store;
    }
};
