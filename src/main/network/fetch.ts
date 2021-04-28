// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ok } from "assert";
import * as nodeFetchCookie from "fetch-cookie";
import { promises as fsp } from "fs";
import nodeFetch from "node-fetch";
import { decryptPersist, encryptPersist } from "readium-desktop/main/fs/persistCrypto";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import * as tough from "tough-cookie";

import { cookiejarFilePath, diMainGet } from "../di";

let fetchLocal: typeof nodeFetch;
let cookieJar: tough.CookieJar;

const CONFIGREPOSITORY_COOKIEJAR = "CONFIGREPOSITORY_COOKIEJAR";



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

    if (!cookieJar) {
        return;
    }

    const str = JSON.stringify(cookieJar.serializeSync());
    const encrypted = encryptPersist(str, CONFIGREPOSITORY_COOKIEJAR, cookiejarFilePath);
    return fsp.writeFile(cookiejarFilePath, encrypted);
};

const fetchFactory = async () => {

    await tryCatch(async () => {

        const configRepo = diMainGet("config-repository");

        let data: Buffer | string | undefined = await tryCatch(() => fsp.readFile(cookiejarFilePath), "");
        if (!data) {
            data = (await configRepo.get(CONFIGREPOSITORY_COOKIEJAR))?.value as string | undefined;
        } else {
            data = decryptPersist(data, CONFIGREPOSITORY_COOKIEJAR, cookiejarFilePath);
        }
        ok(data, "NO COOKIE JAR FOUND ON FS");
        cookieJar = tough.CookieJar.deserializeSync(data);

    }, "src/main/network/fetch");

    // lazy global var init
    if (!cookieJar) {
        cookieJar = new tough.CookieJar();
    }

    // https://github.com/edrlab/thorium-reader/issues/1424
    const _fetch = nodeFetchCookie(nodeFetch, cookieJar, true) as typeof nodeFetch; // ignore errors

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
