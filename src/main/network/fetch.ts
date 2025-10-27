// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import fetchCookie from "fetch-cookie";
import * as fs from "fs";
import * as debug_ from "debug";

// TypeScript GO:
// The current file is a CommonJS module whose imports will produce 'require' calls;
// however, the referenced file is an ECMAScript module and cannot be imported with 'require'.
// Consider writing a dynamic 'import("...")' call instead.
// To convert this file to an ECMAScript module, change its file extension to '.mts',
// or add the field `"type": "module"` to 'package.json'.
// @__ts-expect-error TS1479 (with TypeScript tsc ==> TS2578: Unused '@ts-expect-error' directive)
// e__slint-disable-next-line @typescript-eslint/ban-ts-comment
// @__ts-ignore TS1479
import nodeFetch from "node-fetch";

import { ok } from "readium-desktop/common/utils/assert";
import { decryptPersist, encryptPersist } from "readium-desktop/main/fs/persistCrypto";
import { tryCatch } from "readium-desktop/utils/tryCatch";
import { CookieJar } from "tough-cookie";

import { cookiejarFilePath } from "../di";

// Logger
const filename_ = "readium-desktop:main/network/fetch";
const debug = debug_(filename_);

let fetchLocal: typeof nodeFetch;
let cookieJar: CookieJar;

const CONFIGREPOSITORY_COOKIEJAR = "CONFIGREPOSITORY_COOKIEJAR";


export const removeCookiesFromHost = async (host: string) => {
    if (cookieJar) {
        const cookiesFromDomain = await cookieJar.store.findCookies(host, null);
        if (cookiesFromDomain?.length) {
            debug("FOUND COOKIES FROM", host);
            debug(JSON.stringify(cookiesFromDomain));
            await cookieJar.store.removeCookies(host, null);

            const p = cookiesFromDomain.map(async (cookie) => {
                const domain = cookie["domain"];
                if (domain) {

                    await cookieJar.store.removeCookies(domain, null);
                    const cookiesFromDomainRemoved = await cookieJar.store.findCookies(domain, null);
                    if (cookiesFromDomainRemoved?.length) {
                        debug("COOKIE NOT REMOVED for this domain:", domain);
                        debug(JSON.stringify(cookiesFromDomainRemoved));
                    } else {
                        debug("COOKIE REMOVED for this domain:", domain);
                    }
                }

            });
            try {
                await Promise.all(p);
            } catch {
                // ignore
            }

            const cookiesFromDomainRemoved = await cookieJar.store.findCookies(host, null);
            if (cookiesFromDomainRemoved?.length) {
                debug("COOKIE NOT REMOVED");
                debug(JSON.stringify(cookiesFromDomainRemoved));
            } else {
                debug("COOKIE REMOVED");
            }

        } else {
            debug("NO COOKIES FOUND FROM ", host);
        }
    }
};


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
    if (!encrypted) {
        throw new Error("encryptPersist???! CONFIGREPOSITORY_COOKIEJAR");
    }
    return await fs.promises.writeFile(cookiejarFilePath, encrypted);
};

const fetchFactory = async () => {

    await tryCatch(async () => {

        let data: Buffer | string | undefined = await tryCatch(() => fs.promises.readFile(cookiejarFilePath), "");
        if (data) {
            data = decryptPersist(data, CONFIGREPOSITORY_COOKIEJAR, cookiejarFilePath);
            if (!data) {
                throw new Error("decryptPersist???! CONFIGREPOSITORY_COOKIEJAR");
            }
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
