// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

import { _TELEMETRY_SECRET, _TELEMETRY_URL, _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { call, select } from "typed-redux-saga";
import { RootState } from "../states";
import { version as osVersion } from "os";
import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import { httpPost } from "readium-desktop/main/network/http";
import { Headers } from "node-fetch";
import { createHmac } from "crypto";

interface ITelemetryInfo {
    os_version: string;
    locale: string;
    timestamp: string;
    fresh: boolean;
    type: string;
    current_version: string;
    prev_version: string;
};

// Logger
const filename_ = "readium-desktop:main:redux:sagas:telemetry";
const debug = debug_(filename_);

// set info to a file queue.
const userDataPath = app.getPath("userData");
const folderPath = path.join(
    userDataPath,
    "telemetry",
);
if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath);
}
if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
}
const QUEUE_FILENAME = "queue.json";
const queueFilePath = path.join(
    folderPath,
    QUEUE_FILENAME,
);

const EMPTY_ARRAY: unknown[] = [];
let dataFromFileQueue = JSON.stringify(EMPTY_ARRAY);
try {
    if (!fs.existsSync(queueFilePath)) {
        fs.writeFileSync(queueFilePath, dataFromFileQueue, { encoding: "utf8" });
    } else {
        dataFromFileQueue = fs.readFileSync(queueFilePath, { encoding: "utf-8" });
    }
} catch {
    // ignore
}

function* collectAndSave() {

    const version = yield* select((state: RootState) => state.version);

    // fresh install is equal to en language ?
    const locale = yield* select((state: RootState) => state.i18n.locale);
    // const locale = getTranslator().getLocale();

    // see src/main/redux/sagas/index.ts:107
    // see src/main/redux/reducers/index.ts:74
    // version variable is updated after execution of this function in saga root event
    // so _APP_VERSION is N and version is N-1
    let fresh = false;
    if (_APP_VERSION !== version) {
        debug("VERSION MISMATCH: ", _APP_VERSION, " !== ", version);
        fresh = true;
    }

    const info = {
        os_version: osVersion(),
        locale,
        timestamp: new Date().toISOString(),
        fresh,
        type: "poll", // 'poll' or 'error' enumeration values
        current_version: _APP_VERSION,
        prev_version: `${version}`,
    };

    let queue: Array<ITelemetryInfo> = JSON.parse(dataFromFileQueue);
    if (!Array.isArray(queue)) {
        clearQueue();
        queue = [];
    }

    // queue analysis
    queue = queue.filter((v) => {
        return typeof v.os_version === "string" && v.os_version.length < 1000 &&
        typeof v.locale === "string" && v.locale.length < 10 &&
        typeof v.timestamp === "string" && v.timestamp.length < 100 &&
        typeof v.fresh === "boolean" &&
        (v.type === "poll" || v.type === "error") &&
        typeof v.current_version === "string" && v.current_version.length < 100 &&
        typeof v.prev_version === "string" && v.prev_version.length < 100;
    });
    queue = queue.filter((v) => {
        return Object.keys(v).reduce((pv, cv) => pv && Object.keys(info).includes(cv), true);
    });
    queue = queue.slice(-10, queue.length); // keep last 10th elements
    queue.push(info);

    fs.writeFileSync(queueFilePath, JSON.stringify(queue), { encoding: "utf-8" });

    return queue;
}

const clearQueue = () => {

    fs.writeFileSync(queueFilePath, JSON.stringify(EMPTY_ARRAY), { encoding: "utf-8" });
};

const sendTelemetry = async (queue: ITelemetryInfo[]) => {

    const data = queue;
    const timestamp = new Date().toISOString();

    const body = JSON.stringify({timestamp, data});

    const headers = new Headers();
    headers.append("Authorization", `EDRLAB ${telemetryHmac(body)}`);
    headers.append("Content-Type", "application/json");

    debug("TELEMETRY: ", _TELEMETRY_URL + _APP_VERSION, JSON.stringify({timestamp, data}, null, 4));

    // http post request with HMAC
    const res = await httpPost(_TELEMETRY_URL + _APP_VERSION, {
        headers,
        body,
    });

    return res.isSuccess;
};

const telemetryHmac = (body: string) => {

    const hmac = createHmac("sha1", _TELEMETRY_SECRET);
    hmac.update(body, "utf8");
    return hmac.digest("hex"); // length always 40
};

export function* collectSaveAndSend() {

    // bail out on empty string
    if (!_TELEMETRY_URL || !_TELEMETRY_SECRET) {
        debug("TELEMETRY: N/A");
        return;
    }

    try {
        const queue = yield* call(collectAndSave);

        // try to send the queue to the server
        // if sucessfull 200 OK : clear the file queue
        // else : do nothing
        if (yield* call(sendTelemetry, queue)) {
            clearQueue();
        }
    } catch {
        // ignore
    }
}
