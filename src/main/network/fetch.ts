// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ok } from "assert";
import { app } from "electron";
import * as nodeFetchCookie from "fetch-cookie";
import { promises as fsp } from "fs";
import nodeFetch from "node-fetch";
import * as path from "path";
import { decryptPersist, encryptPersist } from "readium-desktop/main/fs/persistCrypto";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import * as tough from "tough-cookie";

import { diMainGet } from "../di";

let fetchLocal: typeof nodeFetch;
let cookieJar: tough.CookieJar;

const CONFIGREPOSITORY_COOKIEJAR = "CONFIGREPOSITORY_COOKIEJAR";

const userDataPath = app.getPath("userData");
const DEFAULTS_FILENAME = "cookie_jar.json";
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
    const encrypted = encryptPersist(str, CONFIGREPOSITORY_COOKIEJAR, defaultsFilePath);
    return fsp.writeFile(defaultsFilePath, encrypted);
};

const fetchFactory = async () => {

    await tryCatch(async () => {

        const configRepo = diMainGet("config-repository");

        let data: Buffer | string | undefined = await tryCatch(() => fsp.readFile(defaultsFilePath), "");
        if (!data) {
            data = (await configRepo.get(CONFIGREPOSITORY_COOKIEJAR))?.value as string | undefined;
        } else {
            data = decryptPersist(data, CONFIGREPOSITORY_COOKIEJAR, defaultsFilePath);
        }
        ok(data, "NO COOKIE JAR FOUND ON FS");
        cookieJar = tough.CookieJar.deserializeSync(data);

    }, "src/main/network/fetch");

    if (!cookieJar) {
        cookieJar = new tough.CookieJar();
    }

    // https://github.com/edrlab/thorium-reader/issues/1424
    const _fetch = nodeFetchCookie(nodeFetch, cookieJar, true) as typeof nodeFetch; // ignore errors

    return _fetch;
};

export const fetchWithCookie =
    async (...arg: Parameters<typeof nodeFetch>) =>
        (fetchLocal = fetchLocal || await fetchFactory())(...arg);
