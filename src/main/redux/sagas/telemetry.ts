// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { _APP_VERSION } from "readium-desktop/preprocessor-directives";
import { call, select } from "typed-redux-saga";
import { RootState } from "../states";
import { version as osVersion } from "os";
import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

interface ITelemetryInfo {
    os_version: string;
    locale: string;
    timestamp: string;
    fresh: boolean;
    type: string;
    actual_version: string;
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

const EMPTY_ARRAY = "[]";
let dataFromFileQueue = EMPTY_ARRAY;
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

    let fresh = false;
    if (_APP_VERSION !== version) {
        debug("VERSION MISMATCH", _APP_VERSION, "vs", version);
        fresh = true;
    }

    const info = {
        os_version: osVersion(),
        locale,
        timestamp: new Date().toISOString(),
        fresh,
        type: "poll", // poll or error emun
        actual_version: _APP_VERSION,
        prev_version: `${version}`,
    };

    let queue: Array<ITelemetryInfo> = JSON.parse(dataFromFileQueue);
    if (!Array.isArray(queue)) {
        clearQueue();
        queue = [];
    }
    queue.push(info);

    fs.writeFileSync(queueFilePath, JSON.stringify(queue), { encoding: "utf-8" });

    return queue;
}

const clearQueue = () => {

    fs.writeFileSync(queueFilePath, JSON.stringify(EMPTY_ARRAY), { encoding: "utf-8" });
};

const sendTelemetry = (queue: ITelemetryInfo[]) => {

    // http post request with HMAC

    return !!queue;
};

export function* collectSaveAndSend() {

    try {
        const queue = yield* call(collectAndSave);

        // try to send the queue to the server
        // if sucessfull 200 OK : clear the file queue
        // else : do nothing
        if (sendTelemetry(queue)) {
            clearQueue();
        }
    } catch {
        // ignore
    }
}
