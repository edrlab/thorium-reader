// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as nodeFetchCookie from "fetch-cookie";
import nodeFetch from "node-fetch";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import * as tougth from "tough-cookie";
import * as path from "path";
import { promises as fsp } from "fs";
import { app } from "electron";
import { diMainGet } from "../di";
import { ok } from "assert";

let fetchLocal: typeof nodeFetch;
let cookieJar: tougth.CookieJar;

const CONFIGREPOSITORY_COOKIEJAR = "CONFIGREPOSITORY_COOKIEJAR";

const userDataPath = app.getPath("userData");
const DEFAULTS_FILENAME = "cookiejar.json";
const defaultsFilePath = path.join(
    userDataPath,
    DEFAULTS_FILENAME,
);

export const cleanCookieJar = async () => {

    if (cookieJar) {
        await cookieJar.removeAllCookies();
    }
};

// src/main/redux/sagas/app.ts
export const fetchCookieJarPersistence = async () => {

    // const configRepo = diMainGet("config-repository");
    // await configRepo.save({
    //     identifier: CONFIGREPOSITORY_COOKIEJAR,
    //     value: cookieJar.serializeSync(),
    // });

    const str = JSON.stringify(cookieJar.serializeSync());
    return fsp.writeFile(defaultsFilePath, str, { encoding: "utf8" });
};

const fetchFactory = async () => {

    await tryCatch(async () => {

        const configRepo = diMainGet("config-repository");

        let data = await tryCatch(() => fsp.readFile(defaultsFilePath, { encoding: "utf8" }), "");
        if (!data) {
            data = (await configRepo.get(CONFIGREPOSITORY_COOKIEJAR))?.value;
        }
        ok(data, "NO COOKIE JAR FOUND ON FS");
        cookieJar = tougth.CookieJar.deserializeSync(data);

    }, "src/main/network/fetch");

    if (!cookieJar) {
        cookieJar = new tougth.CookieJar();
    }

    // https://github.com/edrlab/thorium-reader/issues/1424
    const _fetch = nodeFetchCookie(nodeFetch, cookieJar, true) as typeof nodeFetch; // ignore errors

    return _fetch;
};

export const fetchWithCookie =
    async (...arg: Parameters<typeof nodeFetch>) =>
        (fetchLocal = fetchLocal || await fetchFactory())(...arg);
