// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";
import * as debug_ from "debug";
import * as express from "express";

import { Server } from "./server";

const debug = debug_("r2:streamer#http/server-secure");
const debugHttps = debug_("r2:https");

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

export interface IHTTPHeaderNameValue {
    name: string;
    value: string;
}
export function serverSecureHTTPHeader(server: Server, url: string): IHTTPHeaderNameValue | undefined {

    const info = server.serverInfo();
    if (server.isSecured() &&
        info && info.trustKey && info.trustCheck && info.trustCheckIV) {

        // @ts-except: TS2454 (variable is used before being assigned)
        // instead: exclamation mark "definite assignment"
        let t1!: [number, number];
        if (IS_DEV) {
            t1 = process.hrtime();
        }

        const encrypteds: Buffer[] = [];
        // encrypteds.push(info.trustCheckIV);
        const encryptStream = crypto.createCipheriv("aes-256-cbc",
            info.trustKey,
            info.trustCheckIV);
        encryptStream.setAutoPadding(true);
        // milliseconds since epoch (midnight, 1 Jan 1970)
        const now = Date.now(); // +new Date()
        const jsonStr = `{"url":"${url}","time":${now}}`;
        // const jsonBuff = Buffer.from(jsonStr, "utf8");
        const buff1 = encryptStream.update(jsonStr, "utf8"); // jsonBuff
        if (buff1) {
            encrypteds.push(buff1);
        }
        const buff2 = encryptStream.final();
        if (buff2) {
            encrypteds.push(buff2);
        }
        const encrypted = Buffer.concat(encrypteds);

        const base64 = Buffer.from(encrypted).toString("base64");

        if (IS_DEV) {
            const t2 = process.hrtime(t1);
            const seconds = t2[0];
            const nanoseconds = t2[1];
            const milliseconds = nanoseconds / 1e6;
            // const totalNanoseconds = (seconds * 1e9) + nanoseconds;
            // const totalMilliseconds = totalNanoseconds / 1e6;
            // const totalSeconds = totalNanoseconds / 1e9;

            debugHttps(`< A > ${seconds}s ${milliseconds}ms [ ${url} ]`);
        }

        return { name : "X-" + info.trustCheck, value: base64 };
    }

    return undefined;
}

export function serverSecure(server: Server, topRouter: express.Application) {

    topRouter.use((req: express.Request, res: express.Response, next: express.NextFunction) => {

        if (!server.isSecured()) {
            next();
            return;
        }

        if (req.method.toLowerCase() === "options") {
            next();
            return;
        }

        // let ua = req.get("user-agent");
        // if (ua) {
        //     ua = ua.toLowerCase();
        // }

        // console.log(util.inspect(req,
        // { showHidden: false,
        // depth: 1,
        // colors: true,
        // customInspect: true,
        // breakLength: 100,
        // maxArrayLength: undefined }));

        let doFail = true;

        const serverData = server.serverInfo();

        if (serverData && serverData.trustKey &&
            serverData.trustCheck && serverData.trustCheckIV) {

            // @ts-expect: TS2454 (variable is used before being assigned)
            // instead: exclamation mark "definite assignment"
            let t1!: [number, number];
            if (IS_DEV) {
                t1 = process.hrtime();
            }
            let delta = 0;

            const urlCheck = server.serverUrl() + req.url;

            const base64Val = req.get("X-" + serverData.trustCheck);
            if (base64Val) {
                const decodedVal = Buffer.from(base64Val, "base64"); // .toString("utf8");

                // const AES_BLOCK_SIZE = 16;
                // const iv = decodedVal.slice(0, AES_BLOCK_SIZE);
                const encrypted = decodedVal; // .slice(AES_BLOCK_SIZE);

                const decrypteds: Buffer[] = [];
                const decryptStream = crypto.createDecipheriv("aes-256-cbc",
                    serverData.trustKey,
                    serverData.trustCheckIV);
                decryptStream.setAutoPadding(false);
                const buff1 = decryptStream.update(encrypted);
                if (buff1) {
                    decrypteds.push(buff1);
                }
                const buff2 = decryptStream.final();
                if (buff2) {
                    decrypteds.push(buff2);
                }
                const decrypted = Buffer.concat(decrypteds);
                const nPaddingBytes = decrypted[decrypted.length - 1];
                const size = encrypted.length - nPaddingBytes;
                const decryptedStr = decrypted.slice(0, size).toString("utf8");
                // debug(decryptedStr);
                try {
                    const decryptedJson = JSON.parse(decryptedStr);
                    let url = decryptedJson.url;
                    const time = decryptedJson.time;

                    // milliseconds since epoch (midnight, 1 Jan 1970)
                    const now = Date.now(); // +new Date()
                    delta = now - time;

                    // 3-second time window between HTTP header creation and consumption
                    // this should account for plenty of hypothetical server latency
                    // (typical figures way under 100ms, but there are occasional high-load spikes)
                    if (delta <= 3000) {
                        const i = url.lastIndexOf("#");
                        if (i > 0) {
                            url = url.substr(0, i);
                        }
                        if (url === urlCheck) {
                            doFail = false;
                        }
                    }
                } catch (err) {
                    debug(err);
                    debug(decryptedStr);
                }
            }

            if (IS_DEV) {
                const t2 = process.hrtime(t1);
                const seconds = t2[0];
                const nanoseconds = t2[1];
                const milliseconds = nanoseconds / 1e6;
                // const totalNanoseconds = (seconds * 1e9) + nanoseconds;
                // const totalMilliseconds = totalNanoseconds / 1e6;
                // const totalSeconds = totalNanoseconds / 1e9;

                debugHttps(`< B > (${delta}ms) ${seconds}s ${milliseconds}ms [ ${urlCheck} ]`);
            }
        }

        if (doFail) {
            debug("############## X-Debug- FAIL ========================== ");
            debug(req.url);
            // debug(url);
            // Object.keys(req.headers).forEach((header: string) => {
            //     debug(header + " => " + req.headers[header]);
            // });
            res.status(200);
            // res.send("<html><body> </body></html>");
            res.end();
            return;
        }

        next();
    });

}
