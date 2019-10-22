// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import { app } from "electron";
import * as fs from "fs";
import { Container } from "inversify";
import * as path from "path";
import * as PouchDBCore from "pouchdb-core";
import { ActionSerializer } from "readium-desktop/common/services/serializer";
import { Translator } from "readium-desktop/common/services/translator";
import { CatalogApi, ICatalogApi } from "readium-desktop/main/api/catalog";
import { ILcpApi, LcpApi } from "readium-desktop/main/api/lcp";
import { IOpdsApi, OpdsApi } from "readium-desktop/main/api/opds";
import { IPublicationApi, PublicationApi } from "readium-desktop/main/api/publication";
import { LocatorViewConverter } from "readium-desktop/main/converter/locator";
import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { LcpSecretRepository } from "readium-desktop/main/db/repository/lcp-secret";
import { LocatorRepository } from "readium-desktop/main/db/repository/locator";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { initStore } from "readium-desktop/main/redux/store/memory";
import { CatalogService } from "readium-desktop/main/services/catalog";
import { DeviceIdManager } from "readium-desktop/main/services/device";
import { Downloader } from "readium-desktop/main/services/downloader";
import { LcpManager } from "readium-desktop/main/services/lcp";
import { WinRegistry } from "readium-desktop/main/services/win-registry";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import { streamer } from "readium-desktop/main/streamer";
import { _NODE_ENV, _POUCHDB_ADAPTER_NAME } from "readium-desktop/preprocessor-directives";
import { Store } from "redux";

import { Server } from "@r2-streamer-js/http/server";

import { IReaderApi, ReaderApi } from "./api/reader";
import { RootState } from "./redux/states";

declare const __POUCHDB_ADAPTER_PACKAGE__: string;

//
// Check that user data directory is created
//
const userDataPath = app.getPath("userData");
if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath);
}

//
// Create databases
//
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
    (_NODE_ENV === "development") ? "db-dev" : "db",
);

if (!fs.existsSync(rootDbPath)) {
    fs.mkdirSync(rootDbPath);
}

// tslint:disable-next-line:no-var-requires
const pouchDbAdapter = require(__POUCHDB_ADAPTER_PACKAGE__);

// tslint:disable-next-line:no-var-requires
const pouchDbFind = require("pouchdb-find");

// tslint:disable-next-line:no-var-requires
const pouchDbSearch = require("pouchdb-quick-search");

// Load PouchDB plugins
PouchDB.plugin(pouchDbAdapter.default ? pouchDbAdapter.default : pouchDbAdapter);
PouchDB.plugin(pouchDbFind.default ? pouchDbFind.default : pouchDbFind);
PouchDB.plugin(pouchDbSearch.default ? pouchDbSearch.default : pouchDbSearch);

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
const opdsFeedRepository = new OpdsFeedRepository(opdsDb);

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

// Lcp secret db
const lcpSecretDb = new PouchDB(
    path.join(rootDbPath, "lcp-secret"),
    dbOpts,
);
const lcpSecretRepository = new LcpSecretRepository(lcpSecretDb);

// Create filesystem storage for publications
const publicationRepositoryPath = path.join(
    userDataPath,
    "publications",
);

if (!fs.existsSync(publicationRepositoryPath)) {
    fs.mkdirSync(publicationRepositoryPath);
}
//
// end of create database
//

//
// Depedency Injection
//
// Create container used for dependency injection
const container = new Container();

// Create store
const store = initStore();
container.bind<Store<RootState>>(diSymbolTable.store).toConstantValue(store);

// Create window registry
container.bind<WinRegistry>(diSymbolTable["win-registry"]).to(WinRegistry).inSingletonScope();

// Create translator
container.bind<Translator>(diSymbolTable.translator).to(Translator).inSingletonScope();

// Create downloader
const downloader = new Downloader(app.getPath("temp"));
container.bind<Downloader>(diSymbolTable.downloader).toConstantValue(downloader);

// Create repositories
container.bind<PublicationRepository>(diSymbolTable["publication-repository"]).toConstantValue(
    publicationRepository,
);
container.bind<OpdsFeedRepository>(diSymbolTable["opds-feed-repository"]).toConstantValue(
    opdsFeedRepository,
);
container.bind<LocatorRepository>(diSymbolTable["locator-repository"]).toConstantValue(
    locatorRepository,
);
container.bind<ConfigRepository>(diSymbolTable["config-repository"]).toConstantValue(
    configRepository,
);
container.bind<LcpSecretRepository>(diSymbolTable["lcp-secret-repository"]).toConstantValue(
    lcpSecretRepository,
);

// Create converters
container.bind<PublicationViewConverter>(diSymbolTable["publication-view-converter"])
    .to(PublicationViewConverter).inSingletonScope();
container.bind<LocatorViewConverter>(diSymbolTable["locator-view-converter"])
    .to(LocatorViewConverter).inSingletonScope();
container.bind<OpdsFeedViewConverter>(diSymbolTable["opds-feed-view-converter"])
    .to(OpdsFeedViewConverter).inSingletonScope();

// Storage
const publicationStorage = new PublicationStorage(publicationRepositoryPath);
container.bind<PublicationStorage>(diSymbolTable["publication-storage"]).toConstantValue(
    publicationStorage,
);

// Bind services
container.bind<Server>(diSymbolTable.streamer).toConstantValue(streamer);

const deviceIdManager = new DeviceIdManager("Thorium", configRepository);
container.bind<DeviceIdManager>(diSymbolTable["device-id-manager"]).toConstantValue(
    deviceIdManager,
);

// Create lcp manager
container.bind<LcpManager>(diSymbolTable["lcp-manager"]).to(LcpManager).inSingletonScope();
container.bind<CatalogService>(diSymbolTable["catalog-service"]).to(CatalogService).inSingletonScope();

// API
container.bind<CatalogApi>(diSymbolTable["catalog-api"]).to(CatalogApi).inSingletonScope();
container.bind<PublicationApi>(diSymbolTable["publication-api"]).to(PublicationApi).inSingletonScope();
container.bind<OpdsApi>(diSymbolTable["opds-api"]).to(OpdsApi).inSingletonScope();
container.bind<LcpApi>(diSymbolTable["lcp-api"]).to(LcpApi).inSingletonScope();
container.bind<ReaderApi>(diSymbolTable["reader-api"]).to(ReaderApi).inSingletonScope();

// module typing
type TCatalogApi = "catalog";
type TPublicationApi = "publication";
type TOpdsApi = "opds";
type TLcpApi = "lcp";
type TReaderApi = "reader";
type TModuleApi = TCatalogApi | TPublicationApi | TOpdsApi | TLcpApi | TReaderApi;

// typing all api method
type TMethodApi = keyof ICatalogApi | keyof IPublicationApi | keyof IOpdsApi | keyof ILcpApi | keyof IReaderApi;

// Create action serializer
container.bind<ActionSerializer>(diSymbolTable["action-serializer"]).to(ActionSerializer).inSingletonScope();

//
// end of create Depedency Injection Container
//

//
// Overload container.get with our own type return
//

// local interface to force type return
interface IGet {
    (s: "store"): Store<RootState>;
    (s: "win-registry"): WinRegistry;
    (s: "translator"): Translator;
    (s: "downloader"): Downloader;
    (s: "publication-repository"): PublicationRepository;
    (s: "opds-feed-repository"): OpdsFeedRepository;
    (s: "locator-repository"): LocatorRepository;
    (s: "config-repository"): ConfigRepository;
    (s: "lcp-secret-repository"): LcpSecretRepository;
    (s: "publication-view-converter"): PublicationViewConverter;
    (s: "locator-view-converter"): LocatorViewConverter;
    (s: "opds-feed-view-converter"): OpdsFeedViewConverter;
    (s: "publication-storage"): PublicationStorage;
    (s: "streamer"): Server;
    (s: "device-id-manager"): DeviceIdManager;
    (s: "lcp-manager"): LcpManager;
    (s: "catalog-service"): CatalogService;
    (s: "catalog-api"): CatalogApi;
    (s: "publication-api"): PublicationApi;
    (s: "opds-api"): OpdsApi;
    (s: "lcp-api"): LcpApi;
    (s: "reader-api"): ReaderApi;
    (s: "action-serializer"): ActionSerializer;
    // minor overload type used in api.ts/LN32
    (s: keyof typeof diSymbolTable): any;
}

// export function to get back depedency from container
// the type any for container.get is overloaded by IGet
const diGet: IGet = (symbol: keyof typeof diSymbolTable) => container.get<any>(diSymbolTable[symbol]);

export {
    diGet as diMainGet,
    TModuleApi,
    TMethodApi,
};
