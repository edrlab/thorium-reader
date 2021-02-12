// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

import * as debug_ from "debug";

export function tryCatchSync<R>(fn: () => (R), errorPath: string, errMessage = ""): R {

    // Logger
    const debug = debug_(errorPath);

    try {
        const res = fn();
        return res;

    } catch (e) {
        if (e instanceof Error) {
            debug(errMessage, e.message, e.stack);
        } else {
            debug(errMessage, e);
        }
    }

    return undefined;
}

export async function tryCatch<R>(fn: () => (R | Promise<R>), errorPath: string, errMessage = ""): Promise<R> {

    // Logger
    const debug = debug_(errorPath);

    try {
        const res = fn();
        return await Promise.resolve(res);

    } catch (e) {
        if (e instanceof Error) {
            debug(errMessage, e.message, e.stack);
        } else {
            debug(errMessage, e);
        }
    }

    return undefined;
}
