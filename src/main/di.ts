import "reflect-metadata";

import * as fs from "fs";
import * as path from "path";

import { app } from "electron";
import { Store } from "redux";

import { Container } from "inversify";
import getDecorators from "inversify-inject-decorators";

import { Server } from "@r2-streamer-js/http/server";

import { Translator } from "readium-desktop/common/services/translator";
import { Downloader } from "readium-desktop/main/services/downloader";
import { WinRegistry } from "readium-desktop/main/services/win-registry";

import { RootState } from "readium-desktop/main/redux/states";
import { OPDSParser } from "readium-desktop/services/opds";

import { initStore } from "readium-desktop/main/redux/store/memory";
import { streamer } from "readium-desktop/main/streamer";

import { OpdsDb } from "readium-desktop/main/db/opds-db";
import { PublicationDb } from "readium-desktop/main/db/publication-db";
import {
    PublicationStorage,
} from "readium-desktop/main/storage/publication-storage";

import * as PouchDBCore from "pouchdb-core";

// Preprocessing directive
declare const __NODE_ENV__: string;
declare const __POUCHDB_ADAPTER_NAME__: string;
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
    (__NODE_ENV__ === "DEV") ? "db-dev" : "db",
);

if (!fs.existsSync(rootDbPath)) {
    fs.mkdirSync(rootDbPath);
}

// tslint:disable-next-line:no-var-requires
const pouchDbAdapter = require(__POUCHDB_ADAPTER_PACKAGE__);

// Load PouchDB plugins
PouchDB.plugin(pouchDbAdapter.default);

const dbOpts = {
    adapter: __POUCHDB_ADAPTER_NAME__,
};

// Publication db
const publicationDb = new PouchDB(
    path.join(rootDbPath, "publications"),
    dbOpts,
);

// OPDS db
const opdsDb = new PouchDB(
    path.join(rootDbPath, "opds-dev"),
    dbOpts,
);

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

// Bind services
container.bind<Server>("streamer").toConstantValue(streamer);
container.bind<OPDSParser>("opds-parser").to(OPDSParser);
container.bind<Downloader>("downloader").toConstantValue(
    new Downloader(app.getPath("temp"), store),
);
container.bind<PublicationDb>("publication-db").toConstantValue(
    new PublicationDb(publicationDb),
);
container.bind<OpdsDb>("opds-db").toConstantValue(
    new OpdsDb(opdsDb),
);
container.bind<PublicationStorage>("publication-storage").toConstantValue(
    new PublicationStorage(publicationRepositoryPath),
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
