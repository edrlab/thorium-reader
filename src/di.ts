import { Store } from "redux";
import "reflect-metadata";

import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";

import { Translator } from "readium-desktop/i18n/translator";
import { IAppState } from "readium-desktop/reducers/app";
import { OPDSParser } from "readium-desktop/services/opds";
import { store } from "readium-desktop/store/memory";

let container = new Container();
container.bind<Translator>("translator").to(Translator);
container.bind<Store<IAppState>>("store").toConstantValue(store);
container.bind<OPDSParser>("opds-parser").to(OPDSParser);

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
