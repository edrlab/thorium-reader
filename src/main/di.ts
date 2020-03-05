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
import { CatalogApi } from "readium-desktop/main/api/catalog";
import { LcpApi } from "readium-desktop/main/api/lcp";
import { OpdsApi } from "readium-desktop/main/api/opds";
import { PublicationApi } from "readium-desktop/main/api/publication";
import { LocatorViewConverter } from "readium-desktop/main/converter/locator";
import { OpdsFeedViewConverter } from "readium-desktop/main/converter/opds";
import { PublicationViewConverter } from "readium-desktop/main/converter/publication";
import { ConfigDocument } from "readium-desktop/main/db/document/config";
import { LcpSecretDocument } from "readium-desktop/main/db/document/lcp-secret";
import { LocatorDocument } from "readium-desktop/main/db/document/locator";
import { OpdsFeedDocument } from "readium-desktop/main/db/document/opds";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";
import { AnalyticsDocument } from "readium-desktop/main/db/document/analytics";
import { AnalyticsRepository } from "readium-desktop/main/db/repository/analytics";
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

import { AnalyticsApi } from "./api/analytics";
import { ReaderApi } from "./api/reader";
import { RootState } from "./redux/states";
import { OpdsService } from "./services/opds";
import { exec } from "child_process";

//TODO - get rid of these when moving db generation to another file 
import * as uuid from "uuid";

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

// tslint:disable-next-line:no-var-requires
const pouchDbAuthentication = require("pouchdb-authentication");

// Load PouchDB plugins
PouchDB.plugin(pouchDbAdapter.default ? pouchDbAdapter.default : pouchDbAdapter);
PouchDB.plugin(pouchDbFind.default ? pouchDbFind.default : pouchDbFind);
PouchDB.plugin(pouchDbSearch.default ? pouchDbSearch.default : pouchDbSearch);
PouchDB.plugin(pouchDbAuthentication.default ? pouchDbAuthentication.default : pouchDbAuthentication);

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

// Analytics db
const analyticsDb = new PouchDB<AnalyticsDocument>(
    path.join(rootDbPath, "analytics"),
    dbOpts,
);

const analyticsRepository = new AnalyticsRepository(analyticsDb);

const PouchDBAuth = require("pouchdb-node").default;

const analyticsLoginInfoDb = new PouchDBAuth(path.join(rootDbPath, "couchdb-info"), {skip_setup: true}).default;
//var couchGeneratorBaseUrl = "http://couch-user-generator.brett.dev.simpleconnections.ca/"

var couchGeneratorBaseUrl = "http://couchdb-device-init.azurewebsites.net/"
var couchDbUrl = "http://metrics.ekitabu.com:5984/"

async function getCouchPassword(username : string, handlePassword : any , docToUpdate : any = null, dbToUpdate : any = null) 
{
    try {
        //console.log(' get couch password function')

        const http = require('http');
        
        var password = 'no password set'
        http.get(couchGeneratorBaseUrl + '?dvuuid=' + username, (response : any) => {

            let data = '';

            // A chunk of data has been recieved.
            response.on('data', (chunk : any) => {
                data += chunk;
            });
            
            // The whole response has been received. Print out the result.
            return response.on('end', () => {
                //console.log("response was")
                //console.log(data)
                const parsedData = JSON.parse(data)
                password = parsedData.password
                handlePassword(username,password, docToUpdate,dbToUpdate)
            }).on("error", (err : any) => {
            console.log("The Error Message: " + err.message);
            })

        }).on("error", (err : any) => {
            console.log("The Error Message: " + err.message);
        })    
    }    
    catch {
        console.log("error in the async")

    }
}

var syncDatabase = function (username : string, password : string, docToUpdate : any = null, dbToUpdate : any = null) {
    //console.log('sync the database')
    //console.log("username : " + username)
    //console.log("password : " + password)

    //console.log("database name")
    //console.log('analyticsDb_' + username)
    var analyticsRemoteDb = new PouchDBAuth(couchDbUrl + 'analyticsdb_' + username, 
    {
        auth: {
            username: username,
            password: password 
        }
    })

    if (docToUpdate && dbToUpdate)
    {
        //console.log("updating the database with the password above")
        docToUpdate["password"] = password
        dbToUpdate.put(docToUpdate)
    }
    var analyticsDbAuth = new PouchDBAuth(path.join(rootDbPath, "analytics"), {skip_setup: true});

    //TODO - handle when there is an error or issue
    analyticsDbAuth.sync(analyticsDb, {live: true, retry: true}).on('error', console.log.bind(console));
    analyticsDbAuth.sync(analyticsRemoteDb, {live: true, retry: true}).on('error', console.log.bind(console));
}

const os = require("os")

var analyticsDbAuth = new PouchDBAuth(path.join(rootDbPath, "analytics"), {skip_setup: true});
analyticsDbAuth.get("deviceInfo").then(function(){
    //console.log("device info we have so far is")
    //console.log(doc)
}).catch(function(err : any) {
    //if OS is win32
    //console.log("no device info yet")
    exec("wmic os get SerialNumber", function (error, stdout) {
        //console.log('serial number')
        //console.log(stdout)
        //console.log(error)
        if (err.reason == "missing") {
            var serial = stdout
            if (error) {
               serial = ""
            }
            var doc = {
            "_id" : "deviceInfo",
            "username":  os.userInfo().username,
            "cpus" : os.cpus(),
            "net-info": os.networkInterfaces(),
            "platform" :os.platform(),
            "platform-version": os.release(),
            "ram": os.totalmem(),
            "architecture": os.arch(),
            "serial": serial
            }

            analyticsDbAuth.put(doc)
        }
    }).on("error", (err : any) => {
            console.log("The Error Message: " + err.message);
            })

})

if (analyticsLoginInfoDb != null ) {
    analyticsLoginInfoDb.get("loginInfo").then(function(doc : any){

        const username = doc['username']

        if (doc["password"] == "")
        {
            //console.log("no password get a password")
            getCouchPassword(username, syncDatabase, doc, analyticsLoginInfoDb)
        }
        else {
            //console.log('time to sync with a real username and password')
            const password = doc["password"]
            syncDatabase(username,password)
        }
    }).catch(function(err : any) {
        if (err.reason == "missing") {
            var username = uuid.v4()
            var doc = {
            "_id" : "loginInfo",
            "username": username,
            "password": ""
            };
            analyticsLoginInfoDb.put(doc)

            getCouchPassword(username, syncDatabase, doc, analyticsLoginInfoDb)
        }
    })
}


//console.log("username is")
//console.log(os.userInfo().username)

//console.log("os cpu is")
//console.log(os.cpus())

//console.log("mac address is")
//console.log(os.networkInterfaces())

//console.log("os platform")
//console.log(os.platform())

//console.log("os is ")
//console.log(os.release())

//console.log("ram is")
//console.log(os.totalmem())

//console.log("arch is")
//console.log(os.arch())

//if OS is win32

//exec("wmic os get SerialNumber", function (error, stdout) {
    //console.log('serial number')
    //console.log(stdout)
    //console.log(error)
//})


/*function makeid(length : number) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }
var doc = {
    "_id": makeid(10),
    "name": "Mittens",
    "occupation": "kitten",
    "age": 3,
    "hobbies": [
        "playing with balls of yarn",
        "chasing laser pointers",
        "lookin' hella cute"
    ]
};

analyticsDbAuth.put(doc)

*/


// Lcp secret db
const lcpSecretDb = new PouchDB<LcpSecretDocument>(
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
const downloader = new Downloader(app.getPath("temp"), configRepository, store);
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
container.bind<ConfigRepository<any>>(diSymbolTable["config-repository"]).toConstantValue(
    configRepository,
);
container.bind<LcpSecretRepository>(diSymbolTable["lcp-secret-repository"]).toConstantValue(
    lcpSecretRepository,
);
container.bind<AnalyticsRepository>(diSymbolTable["analytics-repository"]).toConstantValue(
    analyticsRepository,
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
container.bind<OpdsService>(diSymbolTable["opds-service"]).to(OpdsService).inSingletonScope();

// API
container.bind<CatalogApi>(diSymbolTable["catalog-api"]).to(CatalogApi).inSingletonScope();
container.bind<PublicationApi>(diSymbolTable["publication-api"]).to(PublicationApi).inSingletonScope();
container.bind<OpdsApi>(diSymbolTable["opds-api"]).to(OpdsApi).inSingletonScope();
container.bind<LcpApi>(diSymbolTable["lcp-api"]).to(LcpApi).inSingletonScope();
container.bind<ReaderApi>(diSymbolTable["reader-api"]).to(ReaderApi).inSingletonScope();
container.bind<AnalyticsApi>(diSymbolTable["analytics-api"]).to(AnalyticsApi).inSingletonScope();

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
    (s: "analytics-repository"): AnalyticsRepository;
    (s: "publication-repository"): PublicationRepository;
    (s: "opds-feed-repository"): OpdsFeedRepository;
    (s: "locator-repository"): LocatorRepository;
    (s: "config-repository"): ConfigRepository<any>;
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
};