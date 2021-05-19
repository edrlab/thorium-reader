// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ok } from "assert";
import * as debug_ from "debug";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
import { SCHEME } from "../getEventChannel";

const filename_ = "readium-desktop:main/modal/request.ts";
const debug = debug_(filename_);

export interface IParseRequestFromCustomProtocol<T = string> {
    url: URL;
    method: "GET" | "POST";
    data: {
        [key in T & string]?: string;
    };
}

// ${SCHEME}://authorize
const hostExpected = "authorize";

export function parseRequestFromCustomProtocol<T = string>(req: Electron.ProtocolRequest)
    : IParseRequestFromCustomProtocol<T> | undefined {

    debug("########");
    debug("request:", req);
    debug("########");

    ok(typeof req === "object", "request is not an object");
    const { method, url, uploadData } = req;

    const urlParsed = tryCatchSync(() => new URL(url), filename_);
    ok(urlParsed instanceof URL, `to parse the ${SCHEME}:// request url`);

    debug(urlParsed);

    const { protocol: urlProtocol, host } = urlParsed;
    ok(host === hostExpected, "host is not equal to " + hostExpected);
    ok(urlProtocol === `${SCHEME}:`, "bad custom protocol " + urlProtocol + " but how can this happen");

    if (method === "POST") {

        debug("POST request", uploadData);
        ok(Array.isArray(uploadData), "body data from post request is not an array");

        const [res] = uploadData;

        if ((res as any).type === "rawData") {
            debug("RAW DATA received");
        }
        const data =
            tryCatchSync(
                () => Buffer.from(res.bytes).toString(),
                filename_,
            ) || "";
        // do not risk showing plaintext password in console / command line shell
        // debug("data", data);

        const keyValue = data.split("&");
        const values = tryCatchSync(
            () => keyValue.reduce(
                (pv, cv) => {
                    const splt = cv.split("=");
                    const key = decodeURIComponent(splt[0]);
                    const val = decodeURIComponent(splt[1]);
                    return {
                        ...pv,
                        [key]: val,
                    };
                },
                {},
            ),
            filename_,
        ) || {};
        // do not risk showing plaintext password in console / command line shell
        // debug(values);

        return {
            url: urlParsed,
            method: "POST",
            data: values,
        };
    }

    if (method === "GET") {
        const urlObject = new URL(url);
        const data = Object
            .entries(urlObject.searchParams)
            .reduce((pv, [key, value]) => ({ ...pv, [key]: value }), {});
        return {
            url: urlParsed,
            method: "GET",
            data,
        };
    }

    return undefined;
}
