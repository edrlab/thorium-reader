// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import { Store } from "redux";

import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";

import { createBrowserHistory, History } from "history";

import { ActionSerializer } from "readium-desktop/common/services/serializer";
import { Translator } from "readium-desktop/common/services/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { initStore } from "readium-desktop/renderer/redux/store/memory";

const container = new Container();

// Create store
const history: History = createBrowserHistory();
container.bind<History>("history").toConstantValue(history);

const store = initStore(history);
container.bind<Store<RootState>>("store").toConstantValue(store);

// Create translator
const translator = new Translator();
container.bind<Translator>("translator").toConstantValue(translator);

// Create action serializer
const actionSerializer = new ActionSerializer();
container.bind<ActionSerializer>("action-serializer").toConstantValue(actionSerializer);

const {
    lazyInject,
    lazyInjectNamed,
    lazyInjectTagged,
    lazyMultiInject,
} = getDecorators(container);

export {
    container,
    lazyInject,
    lazyInjectNamed,
    lazyInjectTagged,
    lazyMultiInject,
};
