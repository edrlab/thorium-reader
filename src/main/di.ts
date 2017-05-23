import "reflect-metadata";

import { app } from "electron";
import { Store } from "redux";

import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";

import { Downloader } from "readium-desktop/downloader/downloader";
import { Translator } from "readium-desktop/i18n/translator";
import { AppState } from "readium-desktop/main/reducer";
import { OPDSParser } from "readium-desktop/services/opds";

import { store } from "readium-desktop/main/store/memory";

let container = new Container();

// Bind services
container.bind<Translator>("translator").to(Translator);
container.bind<Store<AppState>>("store").toConstantValue(store);
container.bind<OPDSParser>("opds-parser").to(OPDSParser);
container.bind<Downloader>("downloader").toConstantValue(
    new Downloader(app.getPath("temp"), store),
);

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
