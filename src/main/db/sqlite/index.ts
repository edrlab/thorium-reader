// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { app } from "electron";
import sqlite from "node:sqlite";
import path from "path";
import * as fs from "fs";
import url from "url";

const debug = debug_("readium-desktop:main:db:sqlite");

const { DatabaseSync } = sqlite;
let database: sqlite.DatabaseSync = undefined;

const userDataPath = app.getPath("userData");

const sqliteFolder = path.join(
    userDataPath,
    __TH__IS_DEV__ ? "sqlite-database-dev" : "sqlite-database",
);
const sqlitePath = path.join(
    sqliteFolder,
    "db.sqlite",
);
// const sqlitePathUrl = ":memory:";
const sqlitePathUrl: string = url.pathToFileURL(sqlitePath).toString();

export const getSqliteDatabaseSync = () => {
    if (!database) {
        sqliteInitialisation();
    }
    if (database) {
        return database;
    }
    throw new Error("NO SQLITE DATABASE INSTANTIATED");
};

let once = false;
export const sqliteInitialisation = () => {

    if (once) {
        return ;
    }
    once = true;

    if (sqliteFolder !== ":memory:") {
        if (!fs.existsSync(sqliteFolder)) {
            fs.mkdirSync(sqliteFolder);
        }
    }

    debug("SQLITE", sqlite);
    debug("SQLITE FILEPATH=", sqlitePathUrl);
    if (!database) {
        database = new DatabaseSync(sqlitePathUrl);
    }
    debug("SQLITE INSTANCIATION :", database);

    const queryVersion = database.prepare("select sqlite_version();");
    debug("SQLITE VERSION : ", queryVersion.all());
};
