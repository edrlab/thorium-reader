import "reflect-metadata";

import * as fs from "fs";
import * as path from "path";

import { app } from "electron";
import { Store } from "redux";

import * as PouchDB from "pouchdb";

import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";

import { Server } from "r2-streamer-js";

import { Downloader } from "readium-desktop/downloader/downloader";
import { Translator } from "readium-desktop/i18n/translator";
import { AppState } from "readium-desktop/main/reducers";
import { OPDSParser } from "readium-desktop/services/opds";

import { store } from "readium-desktop/main/store/memory";
import { streamer } from "readium-desktop/main/streamer";

import { PublicationRepository } from "readium-desktop/main/db/publication-repository";

let container = new Container();

// Create databases
const rootDbPath = path.join(
    app.getPath("userData"),
    "db",
);
fs.mkdirSync(rootDbPath);

// Publication db
const publicationDb = new PouchDB(path.join(
    rootDbPath,
    "publications",
));

// Bind services
container.bind<Translator>("translator").to(Translator);
container.bind<Store<AppState>>("store").toConstantValue(store);
container.bind<Server>("streamer").toConstantValue(streamer);
container.bind<OPDSParser>("opds-parser").to(OPDSParser);
container.bind<Downloader>("downloader").toConstantValue(
    new Downloader(app.getPath("temp"), store),
);
container.bind<PublicationRepository>("publication-repository").toConstantValue(
    new PublicationRepository(publicationDb),
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
