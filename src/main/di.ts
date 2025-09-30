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
import { ok } from "readium-desktop/common/utils/assert";
// import { LocatorViewConverter } from "readium-desktop/main/converter/locator";
import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { OpdsFeedRepository } from "readium-desktop/main/db/repository/opds";
import { PublicationRepository } from "readium-desktop/main/db/repository/publication";
import { diSymbolTable } from "readium-desktop/main/diSymbolTable";
import { initStore } from "readium-desktop/main/redux/store/memory";
import { DeviceIdManager } from "readium-desktop/main/services/device";
import { LcpManager } from "readium-desktop/main/services/lcp";
import { PublicationStorage } from "readium-desktop/main/storage/publication-storage";
import {
    _APP_NAME,
} from "readium-desktop/preprocessor-directives";
import { type Store } from "redux";
import { SagaMiddleware } from "redux-saga";

import { httpBrowserApi, publicationApi } from "./redux/sagas/api";
import { opdsApi } from "./redux/sagas/api/opds";
import { apiappApi } from "./redux/sagas/api";
import { RootState } from "./redux/states";
import { OpdsService } from "./services/opds";
import { LSDManager } from "./services/lsd";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import { EOL } from "os";

// import { streamer } from "readium-desktop/main/streamerHttp";
// import { Server } from "@r2-streamer-js/http/server";

// Logger
const debug = debug_("readium-desktop:main:di");

const FORCE_PROD_DB_IN_DEV = false;

export const CONFIGREPOSITORY_REDUX_PERSISTENCE = "CONFIGREPOSITORY_REDUX_PERSISTENCE";
const capitalizedAppName = _APP_NAME.charAt(0).toUpperCase() + _APP_NAME.substring(1);

// Check that user data directory is created
//
const userDataPath = app.getPath("userData");
if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath);
}

const configDataFolderPath = path.join(
    userDataPath,
    `config-data-json${!FORCE_PROD_DB_IN_DEV && (__TH__IS_DEV__ || __TH__IS_CI__) ? "-dev" : ""}`,
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

// const rootDbPath = path.join(
//     userDataPath,
//     (__TH__IS_DEV__ || __TH__IS_CI__) ? "db-dev-sqlite" : "db",
// );

// if (!fs.existsSync(rootDbPath)) {
//     fs.mkdirSync(rootDbPath);
// }

const publicationRepository = new PublicationRepository();

const opdsFeedRepository = new OpdsFeedRepository();

// Create filesystem storage for publications
const publicationRepositoryPath = path.join(
    userDataPath,
    !FORCE_PROD_DB_IN_DEV && (__TH__IS_DEV__ || __TH__IS_CI__) ? "publications-dev" : "publications",
);

if (!fs.existsSync(publicationRepositoryPath)) {
    fs.mkdirSync(publicationRepositoryPath);
}
//
// end of create database
//

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

// const createStoreProcessLock = (() => {
//     let lock = false;

//     return {
//         get isLock() {
//             return lock;
//         },
//         lock: () => lock = true,
//         release: () => lock = false,
//     };
// })();

//
// Depedency Injection
//
// Create container used for dependency injection
const container = new Container();
// https://inversify.io/docs/guides/migrating-from-v6/


const getStorePromiseFn = async () => {
    // createStoreProcessLock.lock();

    debug("initStore");
    const [store, sagaMiddleware] = await initStore();

    // to test concurrent launch (one interactive app with lock, the other CLI)
    // npm run start:dev (then close app, this is just to compile main.js)
    // .. then launch 2 instances concurrently:
    // npm run start:dev:main:electron -- opds Gallica "http://gallica.bnf.fr/opds" &
    // npm run start:dev:main:electron &
    // ...or the other way around:
    // npm run start:dev:main:electron &
    // npm run start:dev:main:electron -- opds Gallica "http://gallica.bnf.fr/opds" &
    //
    // to test long-running store initialisation:
    // await new Promise((res) => setTimeout(() => res(undefined), 3*1000));

    debug("store loaded");

    container.bind<Store<RootState>>(diSymbolTable.store).toConstantValue(store);
    container.bind<SagaMiddleware>(diSymbolTable["saga-middleware"]).toConstantValue(sagaMiddleware);
    debug("container store and saga binded");

    // createStoreProcessLock.release();

    try {
        const state = diMainGet("store").getState();
        if (!state || typeof state !== "object") {
            throw new Error("state not defined : " + typeof state);
        }
    } catch (err) {
        const message = `REDUX STATE MANAGER CAN NOT BE INITIALIZED [${err}]${EOL}You should remove your 'AppData' folder${EOL}Thorium Exit code 1`;
        throw new Error(message);
    }
    return store;
};
let getStorePromise: ReturnType<typeof getStorePromiseFn>;

const createStoreFromDi = async () => {

    const _store = await tryCatch(() => diMainGet("store"), "Store not init");
    if (_store) {
        return _store;
    }

    // if (createStoreProcessLock.isLock) {

    //     // return promise store
    //     if (!getStorePromise) throw new Error("not reachable !!!");
    //     return getStorePromise;
    // }

    if (!getStorePromise) {
        getStorePromise = getStorePromiseFn();
    }

    return getStorePromise;
};

// Create window registry
// container.bind<WinRegistry>(diSymbolTable["win-registry"]).to(WinRegistry).inSingletonScope();

// Create repositories
container.bind<PublicationRepository>(diSymbolTable["publication-repository"]).toConstantValue(
    publicationRepository,
);
container.bind<OpdsFeedRepository>(diSymbolTable["opds-feed-repository"]).toConstantValue(
    opdsFeedRepository,
);

// Create converters
container.bind<PublicationViewConverter>(diSymbolTable["publication-view-converter"])
    .to(PublicationViewConverter).inSingletonScope();
// container.bind<LocatorViewConverter>(diSymbolTable["locator-view-converter"])
//    .to(LocatorViewConverter).inSingletonScope();
container.bind<OpdsFeedViewConverter>(diSymbolTable["opds-feed-view-converter"])
    .to(OpdsFeedViewConverter).inSingletonScope();

// Storage
const publicationStorage = new PublicationStorage(publicationRepositoryPath);
container.bind<PublicationStorage>(diSymbolTable["publication-storage"]).toConstantValue(
    publicationStorage,
);

// Bind services
// container.bind<Server>(diSymbolTable.streamer).toConstantValue(streamer);

const deviceIdManager = new DeviceIdManager(capitalizedAppName);
container.bind<DeviceIdManager>(diSymbolTable["device-id-manager"]).toConstantValue(
    deviceIdManager,
);

// Create lcp manager
container.bind<LcpManager>(diSymbolTable["lcp-manager"]).to(LcpManager).inSingletonScope();
container.bind<LSDManager>(diSymbolTable["lsd-manager"]).to(LSDManager).inSingletonScope();
container.bind<OpdsService>(diSymbolTable["opds-service"]).to(OpdsService).inSingletonScope();

// API
container.bind(diSymbolTable["publication-api"]).toConstantValue(publicationApi);
container.bind(diSymbolTable["opds-api"]).toConstantValue(opdsApi);
container.bind(diSymbolTable["apiapp-api"]).toConstantValue(apiappApi);
container.bind(diSymbolTable["httpbrowser-api"]).toConstantValue(httpBrowserApi);

let libraryWin: BrowserWindow;

const saveLibraryWindowInDi =
    (libWin: BrowserWindow) => (libraryWin = libWin, libraryWin);

const getLibraryWindowFromDi =
    () => {
        ok(libraryWin, "library window not defined");
        return libraryWin; // we could filter out based on win.isDestroyed() && win.webContents.isDestroyed() but this would change the null/undefined contract of the return value in consumer code, so let's leave it for now (strictNullChecks and stricter typeof id)
    };

const readerWinMap = new Map<string, BrowserWindow>();


const saveReaderWindowInDi =
    (readerWin: BrowserWindow, id: string) => (readerWinMap.set(id, readerWin), readerWin);

const deleteReaderWindowInDi =
    (id: string) => readerWinMap.delete(id);

const getReaderWindowFromDi =
    (id: string) => readerWinMap.get(id); // we could filter out based on win.isDestroyed() && win.webContents.isDestroyed() but this would change the null/undefined contract of the return value in consumer code, so let's leave it for now (strictNullChecks and stricter typeof id)

const getAllReaderWindowFromDi =
    () => {
        // ERROR:
        // No matching bindings found for serviceIdentifier: WIN_REGISTRY_READER
        // return container.getAll<BrowserWindow>("WIN_REGISTRY_READER");

        return Array.from(readerWinMap.values()).filter((w) => {
            return !w.isDestroyed() && !w.webContents.isDestroyed();
        });
    };

// local interface to force type return
interface IGet {
    (s: "store"): Store<RootState>;
    // (s: "win-registry"): WinRegistry;
    (s: "publication-repository"): PublicationRepository;
    (s: "opds-feed-repository"): OpdsFeedRepository;
    (s: "publication-view-converter"): PublicationViewConverter;
    //    (s: "locator-view-converter"): LocatorViewConverter;
    (s: "opds-feed-view-converter"): OpdsFeedViewConverter;
    (s: "publication-storage"): PublicationStorage;
    // (s: "streamer"): Server;
    (s: "device-id-manager"): DeviceIdManager;
    (s: "lcp-manager"): LcpManager;
    (s: "publication-api"): typeof publicationApi;
    (s: "opds-api"): typeof opdsApi;
    (s: "apiapp-api"): typeof apiappApi;
    (s: "httpbrowser-api"): typeof httpBrowserApi;
    (s: "saga-middleware"): SagaMiddleware;
    (s: "opds-service"): OpdsService;
    // minor overload type used in api.ts/LN32
    (s: keyof typeof diSymbolTable): any;
}

// export function to get back dependency from container
// the type any for container.get is overloaded by IGet
const diMainGet: IGet = (symbol: keyof typeof diSymbolTable) => container.get<any>(diSymbolTable[symbol], { autobind: true });

export {
    closeProcessLock,
    diMainGet,
    getLibraryWindowFromDi,
    getReaderWindowFromDi,
    deleteReaderWindowInDi,
    saveLibraryWindowInDi,
    saveReaderWindowInDi,
    getAllReaderWindowFromDi,
    createStoreFromDi,
};
