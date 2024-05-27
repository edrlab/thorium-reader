// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";
import { Translator } from "readium-desktop/common/services/translator";
import { initStore } from "readium-desktop/renderer/reader/redux/store/memory";
import { type Store } from "redux";

import { IReaderRootState } from "../../common/redux/states/renderer/readerRootState";
import App from "./components/App";
import { diReaderSymbolTable } from "./diSymbolTable";
import { readerLocalActionSetConfig } from "./redux/actions";

// Create container used for dependency injection
const container = new Container();

const createStoreFromDi = async (preloadedState: Partial<IReaderRootState>) => {

    const store = initStore(preloadedState);

    container.bind<Store<IReaderRootState>>(diReaderSymbolTable.store).toConstantValue(store);

    const locale = store.getState().i18n.locale;
    await translator.setLocale(locale);

    // migration from defaultConfig to config if new keyValue added
    const defaultConfig = store.getState().reader.defaultConfig;
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

        console.log("ANNOTATION MIGRATION !! theme not set migrate from defaultConfig value=", newConfig.theme);
        newConfig.theme = newConfig.night ? "night" : newConfig.sepia ? "sepia" : defaultConfig.theme;
        newConfig.night = false;
        newConfig.sepia = false;
        flag = true;
    }
    if (newConfig.readerDockingMode === undefined) {

        console.log("ANNOTATION MIGRATION !! readerDockingMode not set migrate from defaultConfig value=", newConfig.readerDockingMode);
        newConfig.readerDockingMode = defaultConfig.readerDockingMode;
        flag = true;
    }

    if (flag) {
        console.log(`ANNOTATION MIGRATION : There are a data need to be migrated from defaultConfig to config OLD=${JSON.stringify(store.getState().reader.config, null, 4)} NEW=${JSON.stringify(newConfig, null, 4)}`);
        store.dispatch(readerLocalActionSetConfig.build(newConfig));
        console.log(`ANNOTATION MIGRATION : Data migrated after the dispatch so this is the new data : ${JSON.stringify(store.getState().reader.config, null, 4)}`);
    }
    return store;
};

// Create translator
const translator = new Translator();
container.bind<Translator>(diReaderSymbolTable.translator).toConstantValue(translator);

container.bind<typeof App>(diReaderSymbolTable["react-reader-app"]).toConstantValue(App);

// local interface to force type return
interface IGet {
    (s: "store"): Store<IReaderRootState>;
    (s: "translator"): Translator;
    (s: "react-reader-app"): typeof App;
}

// export function to get back depedency from container
// the type any for container.get is overloaded by IGet
const diGet: IGet = (symbol: keyof typeof diReaderSymbolTable) => container.get<any>(diReaderSymbolTable[symbol]);

const {
    lazyInject,
    lazyInjectNamed,
    lazyInjectTagged,
    lazyMultiInject,
} = getDecorators(container);

export {
    diGet as diReaderGet,
    createStoreFromDi,
    lazyInject,
    lazyInjectNamed,
    lazyInjectTagged,
    lazyMultiInject,
};
