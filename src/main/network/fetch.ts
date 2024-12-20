// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import fetchCookie from "fetch-cookie";
import { promises as fsp } from "fs";
import nodeFetch from "node-fetch";
import { ok } from "readium-desktop/common/utils/assert";
import { decryptPersist, encryptPersist } from "readium-desktop/main/fs/persistCrypto";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import { CookieJar } from "tough-cookie";

import { cookiejarFilePath } from "../di";

let fetchLocal: typeof nodeFetch;
let cookieJar: CookieJar;

const CONFIGREPOSITORY_COOKIEJAR = "CONFIGREPOSITORY_COOKIEJAR";



export const cleanCookieJar = async () => {

    if (cookieJar) {
        await cookieJar.removeAllCookies();
    }
};

// src/main/redux/sagas/app.ts
export const fetchCookieJarPersistence = async () => {

    if (!cookieJar) {
        return;
    }

    const str = JSON.stringify(cookieJar.serializeSync());
    const encrypted = encryptPersist(str, CONFIGREPOSITORY_COOKIEJAR, cookiejarFilePath);
    return fsp.writeFile(cookiejarFilePath, encrypted);
};

const fetchFactory = async () => {

    await tryCatch(async () => {

        let data: Buffer | string | undefined = await tryCatch(() => fsp.readFile(cookiejarFilePath), "");
        if (data) {
            data = decryptPersist(data, CONFIGREPOSITORY_COOKIEJAR, cookiejarFilePath);
        }
        ok(data, "NO COOKIE JAR FOUND ON FS");
        cookieJar = CookieJar.deserializeSync(data as string);

    }, "src/main/network/fetch");

    // lazy global var init
    if (!cookieJar) {
        cookieJar = new CookieJar();
    }

    // ignoreError===true because https://github.com/edrlab/thorium-reader/issues/1424
    const _fetch = fetchCookie(nodeFetch as unknown as typeof fetch, cookieJar, true) as unknown as typeof nodeFetch;
    return _fetch;
};

export const absorbDBToJson = async () => {
    console.log("+++++ CookieJar absorbDBToJson ... ");
    fetchLocal = await fetchFactory();
    await fetchCookieJarPersistence();
};

export const fetchWithCookie =
    async (...arg: Parameters<typeof nodeFetch>) =>
        (fetchLocal = fetchLocal || await fetchFactory())(...arg);
