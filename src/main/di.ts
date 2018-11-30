// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import * as fs from "fs";
import * as path from "path";

import { app } from "electron";
import { Store } from "redux";

import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";

import { Server } from "@r2-streamer-js/http/server";

import { Translator } from "readium-desktop/common/services/translator";
import { CatalogService } from "readium-desktop/main/services/catalog";
import { Downloader } from "readium-desktop/main/services/downloader";
import { WinRegistry } from "readium-desktop/main/services/win-registry";

import { RootState } from "readium-desktop/main/redux/states";

import { DeviceIdManager } from "readium-desktop/main/services/device";

import { ActionSerializer } from "readium-desktop/common/services/serializer";

import { initStore } from "readium-desktop/main/redux/store/memory";
import { streamer } from "readium-desktop/main/streamer";

import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { LocatorRepository } from "readium-desktop/main/db/repository/locator";
import { OpdsRepository } from "readium-desktop/main/db/repository/opds";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";

import { PublicationViewConverter } from "readium-desktop/main/converter/publication";

import { CatalogApi } from "readium-desktop/main/api/catalog";
import { PublicationApi } from "readium-desktop/main/api/publication";

import {
    PublicationStorage,
} from "readium-desktop/main/storage/publication-storage";

import * as PouchDBCore from "pouchdb-core";

import {
    _NODE_ENV,
    _POUCHDB_ADAPTER_NAME,
    // _POUCHDB_ADAPTER_PACKAGE,
} from "readium-desktop/preprocessor-directives";
declare const __POUCHDB_ADAPTER_PACKAGE__: string;

// Create container used for dependency injection
const container = new Container();

// Check that user data directory is created
const userDataPath = app.getPath("userData");

if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath);
}

// Create databases
let PouchDB = (PouchDBCore as any);
// object ready to use (no "default" property) when:
// module.exports = PouchDB$2
// in the CommonJS require'd "pouchdb-core" package ("main" field in package.json)
// otherwise ("default" property) then it means:
// export default PouchDB$2
// in the native ECMAScript module ("jsnext:main" or "module" field in package.json)
if (PouchDB.default) {
    PouchDB = PouchDB.default;
}
// ==> this way, with process.env.NODE_ENV === DEV we can have "pouchdb-core" as an external,
// otherwise it gets bundled and the code continues to work in production.

const rootDbPath = path.join(
    userDataPath,
    (_NODE_ENV === "DEV") ? "db-dev" : "db",
);

if (!fs.existsSync(rootDbPath)) {
    fs.mkdirSync(rootDbPath);
}

// tslint:disable-next-line:no-var-requires
const pouchDbAdapter = require(__POUCHDB_ADAPTER_PACKAGE__);

// Load PouchDB plugins
PouchDB.plugin(pouchDbAdapter.default ? pouchDbAdapter.default : pouchDbAdapter);
PouchDB.plugin(require("pouchdb-find"));

const dbOpts = {
    adapter: _POUCHDB_ADAPTER_NAME,
};

// Publication db
const publicationDb = new PouchDB(
    path.join(rootDbPath, "publication"),
    dbOpts,
);
const publicationRepository = new PublicationRepository(publicationDb);

// OPDS db
const opdsDb = new PouchDB(
    path.join(rootDbPath, "opds"),
    dbOpts,
);
const opdsRepository = new OpdsRepository(opdsDb);

// Config db
const configDb = new PouchDB(
    path.join(rootDbPath, "config"),
    dbOpts,
);
const configRepository = new ConfigRepository(configDb);

// Locator db
const locatorDb = new PouchDB(
    path.join(rootDbPath, "locator"),
    dbOpts,
);
const locatorRepository = new LocatorRepository(locatorDb);

// Create filesystem storage for publications
const publicationRepositoryPath = path.join(
    userDataPath,
    "publications",
);

if (!fs.existsSync(publicationRepositoryPath)) {
    fs.mkdirSync(publicationRepositoryPath);
}

// Create store
const store = initStore();
container.bind<Store<any>>("store").toConstantValue(store);

// Create window registry
const winRegistry = new WinRegistry();
container.bind<WinRegistry>("win-registry").toConstantValue(winRegistry);

// Create translator
const translator = new Translator();
container.bind<Translator>("translator").toConstantValue(translator);

// Create downloader
const downloader = new Downloader(app.getPath("temp"));
container.bind<Downloader>("downloader").toConstantValue(downloader);

// Create repositories
container.bind<PublicationRepository>("publication-repository").toConstantValue(
    publicationRepository,
);
container.bind<OpdsRepository>("opds-repository").toConstantValue(
    opdsRepository,
);
container.bind<LocatorRepository>("locator-repository").toConstantValue(
    locatorRepository,
);
container.bind<ConfigRepository>("config-repository").toConstantValue(
    configRepository,
);

// Create converters
const publicationViewConverter = new PublicationViewConverter();
container.bind<PublicationViewConverter>("publication-view-converter").toConstantValue(
    publicationViewConverter,
);

// Storage
const publicationStorage = new PublicationStorage(publicationRepositoryPath);
container.bind<PublicationStorage>("publication-storage").toConstantValue(
    publicationStorage,
);

// Bind services
container.bind<Server>("streamer").toConstantValue(streamer);

const catalogService = new CatalogService(publicationRepository, publicationStorage, downloader);
container.bind<CatalogService>("catalog-service").toConstantValue(
    catalogService,
);
container.bind<DeviceIdManager>("device-id-manager").toConstantValue(
    new DeviceIdManager("readium-desktop", configRepository),
);

// API
container.bind<CatalogApi>("catalog-api").toConstantValue(
    new CatalogApi(
        publicationRepository,
        configRepository,
        publicationViewConverter,
        translator,
    ),
);
container.bind<PublicationApi>("publication-api").toConstantValue(
    new PublicationApi(
        publicationRepository,
        publicationViewConverter,
        catalogService,
    ),
);

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
