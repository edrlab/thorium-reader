// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import * as debug_ from "debug";
import { app, BrowserWindow } from "electron";
import * as fs from "fs";
import { Container } from "inversify";
import * as path from "path";
import * as PouchDBCore from "pouchdb-core";
import { Translator } from "readium-desktop/common/services/translator";
import { ok } from "readium-desktop/common/utils/assert";
import { CatalogApi } from "readium-desktop/main/api/catalog";
import { LcpApi } from "readium-desktop/main/api/lcp";
import { OpdsApi } from "readium-desktop/main/api/opds";
import { LocatorViewConverter } from "readium-desktop/main/converter/locator";
import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { LcpSecretDocument } from "readium-desktop/main/db/document/lcp-secret";
import { LocatorDocument } from "readium-desktop/main/db/document/locator";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { ConfigRepository } from "readium-desktop/main/db/repository/config";
import { LcpSecretRepository } from "readium-desktop/main/db/repository/lcp-secret";
import { LocatorRepository } from "readium-desktop/main/db/repository/locator";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { initStore } from "readium-desktop/main/redux/store/memory";
import { DeviceIdManager } from "readium-desktop/main/services/device";
import { LcpManager } from "readium-desktop/main/services/lcp";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import {
    _APP_NAME, _CONTINUOUS_INTEGRATION_DEPLOY, _NODE_ENV, _POUCHDB_ADAPTER_NAME,
} from "readium-desktop/preprocessor-directives";
import { PromiseAllSettled } from "readium-desktop/utils/promise";
import { Store } from "redux";
import { SagaMiddleware } from "redux-saga";

import { KeyboardApi } from "./api/keyboard";
import { ReaderApi } from "./api/reader";
import { SessionApi } from "./api/session";
import { publicationApi } from "./redux/sagas/api";
import { RootState } from "./redux/states";
import { OpdsService } from "./services/opds";
import { BrowserApi } from "./api/browser";

// import { streamer } from "readium-desktop/main/streamerHttp";
// import { Server } from "@r2-streamer-js/http/server";

// Logger
const debug = debug_("readium-desktop:main:di");

export const CONFIGREPOSITORY_REDUX_PERSISTENCE = "CONFIGREPOSITORY_REDUX_PERSISTENCE";
const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

declare const __POUCHDB_ADAPTER_PACKAGE__: string;

// const IS_DEV = (_NODE_ENV === "development" || _CONTINUOUS_INTEGRATION_DEPLOY);
//
// Check that user data directory is created
//
const userDataPath = app.getPath("userData");
if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath);
}

const configDataFolderPath = path.join(
    userDataPath,
    `config-data-json${(_NODE_ENV === "development" || _CONTINUOUS_INTEGRATION_DEPLOY) ? "-dev" : ""}`,
);
if (!fs.existsSync(configDataFolderPath)) {
    fs.mkdirSync(configDataFolderPath);
}

const STATE_FILENAME = "state.json";
export const stateFilePath = path.join(
    configDataFolderPath,
    STATE_FILENAME,
);

const PATCH_FILENAME = "state.patch.json";
export const patchFilePath = path.join(
    configDataFolderPath,
    PATCH_FILENAME,
);

const RUN_FILENAME = "state.runtime.json";
export const runtimeStateFilePath = path.join(
    configDataFolderPath,
    RUN_FILENAME,
);

export const backupStateFilePathFn = () => path.join(
    configDataFolderPath,
    `state.${+new Date()}.json`,
);

const COOKIE_JAR_FILENAME = "cookie_jar.json";
export const cookiejarFilePath = path.join(
    configDataFolderPath,
    COOKIE_JAR_FILENAME,
);

const OPDS_AUTH_FILENAME = "opds_auth.json";
export const opdsAuthFilePath = path.join(
    configDataFolderPath,
    OPDS_AUTH_FILENAME,
);

const LCP_HASHES_FILENAME = "lcp_hashes.json";
export const lcpHashesFilePath = path.join(
    configDataFolderPath,
    LCP_HASHES_FILENAME,
);

const LCP_LSD_DEVICES_FILENAME = "lcp_lsd_devices.json";
export const lcpLsdDevicesFilePath = path.join(
    configDataFolderPath,
    LCP_LSD_DEVICES_FILENAME,
);

const MEMORY_LOGGGER_FILENAME = "log.json";
export const memoryLoggerFilename = path.join(
    configDataFolderPath,
    MEMORY_LOGGGER_FILENAME,
);

//
// Create databases
//
let PouchDB = PouchDBCore;
// object ready to use (no "default" property) when:
// module.exports = PouchDB$2
// in the CommonJS require'd "pouchdb-core" package ("main" field in package.json)
// otherwise ("default" property) then it means:
// export default PouchDB$2
// in the native ECMAScript module ("jsnext:main" or "module" field in package.json)
if ((PouchDB  as any).default) {
    PouchDB = (PouchDB  as any).default as PouchDB.Static;
}
// ==> this way, with process.env.NODE_ENV === DEV we can have "pouchdb-core" as an external,
// otherwise it gets bundled and the code continues to work in production.

const rootDbPath = path.join(
    userDataPath,
    (_NODE_ENV === "development" || _CONTINUOUS_INTEGRATION_DEPLOY) ? "db-dev-sqlite" : "db",
);

if (!fs.existsSync(rootDbPath)) {
    fs.mkdirSync(rootDbPath);
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pouchDbAdapter = require(__POUCHDB_ADAPTER_PACKAGE__);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pouchDbSearch = require("pouchdb-quick-search");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pouchDbFind = require("pouchdb-find");

// Load PouchDB plugins
PouchDB.plugin(pouchDbAdapter.default ? pouchDbAdapter.default : pouchDbAdapter);

PouchDB.plugin(pouchDbSearch.default ? pouchDbSearch.default : pouchDbSearch);


// indexes bookmarks
PouchDB.plugin(pouchDbFind.default ? pouchDbFind.default : pouchDbFind);

const dbOpts = {
    adapter: _POUCHDB_ADAPTER_NAME,
};

// Publication db
const publicationDb = new PouchDB<PublicationDocument>(
    path.join(rootDbPath, "publication"),
    dbOpts,
);
const publicationRepository = new PublicationRepository(publicationDb);

// OPDS db
const opdsDb = new PouchDB<OpdsFeedDocument>(
    path.join(rootDbPath, "opds"),
    dbOpts,
);
const opdsFeedRepository = new OpdsFeedRepository(opdsDb);

// Config db
const configDb = new PouchDB<ConfigDocument<any>>(
    path.join(rootDbPath, "config"),
    dbOpts,
);
const configRepository = new ConfigRepository(configDb);

// Locator db
const locatorDb = new PouchDB<LocatorDocument>(
    path.join(rootDbPath, "locator"),
    dbOpts,
);
const locatorRepository = new LocatorRepository(locatorDb);

// Lcp secret db
const lcpSecretDb = new PouchDB<LcpSecretDocument>(
    path.join(rootDbPath, "lcp-secret"),
    dbOpts,
);
const lcpSecretRepository = new LcpSecretRepository(lcpSecretDb);

// Create filesystem storage for publications
const publicationRepositoryPath = path.join(
    userDataPath,
    (_NODE_ENV === "development" || _CONTINUOUS_INTEGRATION_DEPLOY) ? "publications-dev" : "publications",
);

if (!fs.existsSync(publicationRepositoryPath)) {
    fs.mkdirSync(publicationRepositoryPath);
}
//
// end of create database
//

// https://pouchdb.com/guides/compact-and-destroy.html
const compactDb = async () => {
    const res = await PromiseAllSettled([
        publicationDb.compact(),
        opdsDb.compact(),
        configDb.compact(),
        locatorDb.compact(),
        lcpSecretDb.compact(),
    ]);

    const done = res.reduce((pv, cv) => pv && cv.status === "fulfilled", true);
    if (!done) {
        throw JSON.stringify(res);
    }
};

const closeProcessLock = (() => {
    let lock = false;

    return {
        get isLock() {
            return lock;
        },
        lock: () => lock = true,
        release: () => lock = false,
    };
})();

//
// Depedency Injection
//
// Create container used for dependency injection
const container = new Container();

const createStoreFromDi = async () => {

    debug("initStore");
    const [store, sagaMiddleware] = await initStore(configRepository);
    debug("store loaded");

    container.bind<Store<RootState>>(diSymbolTable.store).toConstantValue(store);
    container.bind<SagaMiddleware>(diSymbolTable["saga-middleware"]).toConstantValue(sagaMiddleware);
    debug("container store and saga binded");

    return store;
};

// Create window registry
// container.bind<WinRegistry>(diSymbolTable["win-registry"]).to(WinRegistry).inSingletonScope();

// Create translator
container.bind<Translator>(diSymbolTable.translator).to(Translator).inSingletonScope();

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
container.bind<ConfigRepository<any>>(diSymbolTable["config-repository"]).toConstantValue(
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
// container.bind<Server>(diSymbolTable.streamer).toConstantValue(streamer);

const deviceIdManager = new DeviceIdManager(capitalizedAppName, configRepository);
container.bind<DeviceIdManager>(diSymbolTable["device-id-manager"]).toConstantValue(
    deviceIdManager,
);

// Create lcp manager
container.bind<LcpManager>(diSymbolTable["lcp-manager"]).to(LcpManager).inSingletonScope();
container.bind<OpdsService>(diSymbolTable["opds-service"]).to(OpdsService).inSingletonScope();

// API
container.bind<CatalogApi>(diSymbolTable["catalog-api"]).to(CatalogApi).inSingletonScope();
// container.bind<PublicationApi>(diSymbolTable["publication-api"]).to(PublicationApi).inSingletonScope();

container.bind(diSymbolTable["publication-api"]).toConstantValue(publicationApi);

container.bind<OpdsApi>(diSymbolTable["opds-api"]).to(OpdsApi).inSingletonScope();
container.bind<BrowserApi>(diSymbolTable["browser-api"]).to(BrowserApi).inSingletonScope();
container.bind<KeyboardApi>(diSymbolTable["keyboard-api"]).to(KeyboardApi).inSingletonScope();
container.bind<LcpApi>(diSymbolTable["lcp-api"]).to(LcpApi).inSingletonScope();
container.bind<ReaderApi>(diSymbolTable["reader-api"]).to(ReaderApi).inSingletonScope();
container.bind<SessionApi>(diSymbolTable["session-api"]).to(SessionApi).inSingletonScope();

let libraryWin: BrowserWindow;

const saveLibraryWindowInDi =
    (libWin: BrowserWindow) => (libraryWin = libWin, libraryWin);

const getLibraryWindowFromDi =
    () => {
        ok(libraryWin, "library window not defined");
        return libraryWin;
    };

const readerWinMap = new Map<string, BrowserWindow>();

const saveReaderWindowInDi =
    (readerWin: BrowserWindow, id: string) => (readerWinMap.set(id, readerWin), readerWin);

const getReaderWindowFromDi =
    (id: string) => readerWinMap.get(id);

const getAllReaderWindowFromDi =
    () =>
        container.getAll<BrowserWindow>("WIN_REGISTRY_READER");

// local interface to force type return
interface IGet {
    (s: "store"): Store<RootState>;
    // (s: "win-registry"): WinRegistry;
    (s: "translator"): Translator;
    (s: "publication-repository"): PublicationRepository;
    (s: "opds-feed-repository"): OpdsFeedRepository;
    (s: "locator-repository"): LocatorRepository;
    (s: "config-repository"): ConfigRepository<any>;
    (s: "lcp-secret-repository"): LcpSecretRepository;
    (s: "publication-view-converter"): PublicationViewConverter;
    (s: "locator-view-converter"): LocatorViewConverter;
    (s: "opds-feed-view-converter"): OpdsFeedViewConverter;
    (s: "publication-storage"): PublicationStorage;
    // (s: "streamer"): Server;
    (s: "device-id-manager"): DeviceIdManager;
    (s: "lcp-manager"): LcpManager;
    (s: "catalog-api"): CatalogApi;
    (s: "publication-api"): typeof publicationApi;
    (s: "opds-api"): OpdsApi;
    (s: "browser-api"): BrowserApi;
    (s: "keyboard-api"): KeyboardApi;
    (s: "lcp-api"): LcpApi;
    (s: "reader-api"): ReaderApi;
    (s: "saga-middleware"): SagaMiddleware;
    // minor overload type used in api.ts/LN32
    (s: keyof typeof diSymbolTable): any;
}

// export function to get back depedency from container
// the type any for container.get is overloaded by IGet
const diGet: IGet = (symbol: keyof typeof diSymbolTable) => container.get<any>(diSymbolTable[symbol]);

export {
    closeProcessLock,
    compactDb,
    diGet as diMainGet,
    getLibraryWindowFromDi,
    getReaderWindowFromDi,
    saveLibraryWindowInDi,
    saveReaderWindowInDi,
    getAllReaderWindowFromDi,
    createStoreFromDi,
};
