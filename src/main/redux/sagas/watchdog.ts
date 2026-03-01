// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as fs from "node:fs";
import debug_ from "debug";
import { call as callTyped, delay as delayTyped, SagaGenerator } from "typed-redux-saga";
import { watchdogFilePath } from "readium-desktop/main/di";
import { ok } from "readium-desktop/common/utils/assert";

// Logger
const filename_ = "readium-desktop:main:redux:sagas:watchdog";
const debug = debug_(filename_);
debug("_");

export const watchdog = function* (): SagaGenerator<void> {

    let counter = 0;

    while (1) {
        counter++;
        if (counter >= Number.MAX_SAFE_INTEGER) {
            counter = 0;
        }
        const time = (new Date()).toISOString();
        const jsonObj = {time, counter};
        const data = JSON.stringify(jsonObj); 
        // debug("WATCHDOG", jsonObj);

        yield* delayTyped(1000); // 1s
        yield* callTyped(async () => await fs.promises.writeFile(watchdogFilePath, data, { encoding: "utf-8" }));
        const dataRead = yield* callTyped(async () => await fs.promises.readFile(watchdogFilePath, { encoding: "utf8" }));
        ok(dataRead === data, "Watchdog error !?");
    }
};

export const resetWatchdog = () => {

    fs.rmSync(watchdogFilePath);
};

export const readWatchdog = async () => {

    const dataRead = await fs.promises.readFile(watchdogFilePath, { encoding: "utf8" });
    const jsonObj = JSON.parse(dataRead);
    const time = new Date(jsonObj.time);
    return time;
};
