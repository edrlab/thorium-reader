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
import { isDivinaFn, isPdfFn } from "readium-desktop/common/isManifestType";

// Create container used for dependency injection
// const container = new Container();

let __store: Store<IReaderRootState> | undefined;

export const createStoreFromDi = (preloadedState: Partial<IReaderRootState>): Store<IReaderRootState> => {

    const store = initStore(preloadedState);
    __store = store;

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

    // https://github.com/edrlab/thorium-reader/issues/2811
    if (newConfig.ttsVoices === undefined) {

        console.log("MIGRATION !! ttsVoices not set migrate from defaultConfig value=", newConfig.ttsVoices);
        newConfig.ttsVoices = defaultConfig.ttsVoices;
        flag = true;
    }
    if (newConfig.ttsVoices.length === 0 && (newConfig as any).ttsVoice) {

        console.log("MIGRATION !! ttsVoice to ttsVoices with a 's' (array of ttsVoice) value=", (newConfig as any).ttsVoice);
        newConfig.ttsVoices = [(newConfig as any).ttsVoice];
        (newConfig as any).ttsVoice = null;
        flag = true;
    }

    if (newConfig.readerSettingsSection === undefined) {

        console.log("MIGRATION !! readerSettingsSection not set migrate from defaultConfig value=", newConfig.ttsVoices);
        newConfig.readerSettingsSection = defaultConfig.readerSettingsSection;
        flag = true;
    }
    if (newConfig.readerMenuSection === undefined) {

        console.log("MIGRATION !! readerMenuSection not set migrate from defaultConfig value=", newConfig.readerMenuSection);
        newConfig.readerMenuSection = defaultConfig.readerMenuSection;
        flag = true;
    }

    const state = store.getState();
    const isDivina = isDivinaFn(state.reader.info.r2Publication);
    const isPdf = isPdfFn(state.reader.info.r2Publication);
    if (isDivina || isPdf) {
        newConfig.readerSettingsSection = isDivina ? "tab-divina" : "tab-pdfzoom";
        flag = true;
    }


    if (flag) {
        console.log(`MIGRATION : There are a data need to be migrated from defaultConfig to config OLD=${JSON.stringify(store.getState().reader.config, null, 4)} NEW=${JSON.stringify(newConfig, null, 4)}`);
        store.dispatch(readerLocalActionSetConfig.build(newConfig));
        console.log(`MIGRATION : Data migrated after the dispatch so this is the new data : ${JSON.stringify(store.getState().reader.config, null, 4)}`);
    }
    return store;
};

export const getStore = () => {
    if (__store) {
        return __store;
    }
    throw new Error("STORE is UNDEFINED !!!");
};
