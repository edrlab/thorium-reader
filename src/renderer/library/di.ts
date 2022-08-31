// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import { History } from "history";
import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";
import { Translator } from "readium-desktop/common/services/translator";
import {
    diRendererSymbolTable,
} from "readium-desktop/renderer/library/diSymbolTable";
import { ILibraryRootState } from "readium-desktop/renderer/library/redux/states";
import { initStore } from "readium-desktop/renderer/library/redux/store/memory";
import { type Store } from "redux";

import App from "./components/App";

// Create container used for dependency injection
const container = new Container();

// Create store
const [store, reduxHistory] = initStore();
container.bind<Store<ILibraryRootState>>(diRendererSymbolTable.store).toConstantValue(store);

container.bind<History & {
    listenObject: boolean;
}>(diRendererSymbolTable.history).toConstantValue(reduxHistory);

// Create translator
const translator = new Translator();
container.bind<Translator>(diRendererSymbolTable.translator).toConstantValue(translator);

container.bind<typeof App>(diRendererSymbolTable["react-library-app"]).toConstantValue(App);

// local interface to force type return
interface IGet {
    (s: "history"): History;
    (s: "store"): Store<ILibraryRootState>;
    (s: "translator"): Translator;
    (s: "react-library-app"): typeof App;
}

// export function to get back depedency from container
// the type any for container.get is overloaded by IGet
const diGet: IGet = (symbol: keyof typeof diRendererSymbolTable) => container.get<any>(diRendererSymbolTable[symbol]);

const {
    lazyInject,
    lazyInjectNamed,
    lazyInjectTagged,
    lazyMultiInject,
} = getDecorators(container);

export {
    diGet as diLibraryGet,
    lazyInject,
    lazyInjectNamed,
    lazyInjectTagged,
    lazyMultiInject,
};
