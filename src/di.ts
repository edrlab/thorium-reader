import { Store } from "redux";
import "reflect-metadata";

import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";

import { Translator } from "./i18n/translator";
import { IAppState } from "./reducers/app";
import { store } from "./store/memory";

let container = new Container();
container.bind<Translator>("translator").to(Translator);
container.bind<Store<IAppState>>("store").toConstantValue(store);

let {
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
