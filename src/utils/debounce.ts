// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/chodorowicz/ts-debounce

/**
 * A function that emits a side effect and does not return anything.
 */

export interface Options {
    isImmediate: boolean;
}

export function debounce<F extends (...args: any[]) => Promise<void> | void>(
    func: F,
    waitMilliseconds = 50,
    options: Options = {
        isImmediate: false,
    },
) {
    let timeoutId: NodeJS.Timer | undefined;

    return (...args: any[]) => {

        const doLater = async () => {
            timeoutId = undefined;
            if (!options.isImmediate) {
                await Promise.resolve(func.apply(this, args));
            }
        };

        const shouldCallNow = options.isImmediate && timeoutId === undefined;

        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }

        // error with TS on Timer return (Number | Timer)
        // clearTimeout and setTimeout has incompatible type
        timeoutId = setTimeout(doLater, waitMilliseconds) as any;

        if (shouldCallNow) {
            Promise.resolve(func.apply(this, args));
        }
    };
}
