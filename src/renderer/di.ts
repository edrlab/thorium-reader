import "reflect-metadata";

import { Store } from "redux";

import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";

import { ActionSerializer } from "readium-desktop/common/services/serializer";
import { Translator } from "readium-desktop/common/services/translator";
import { RootState } from "readium-desktop/renderer/redux/states";
import { initStore } from "readium-desktop/renderer/redux/store/memory";

const container = new Container();

// Create store
const store = initStore();
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
