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

export function debounce<F extends (...args: any[]) => Promise<any> | any>(
    func: F,
    waitMilliseconds = 50,
    options: Options = {
        isImmediate: false,
    },
): (...args: any[]) => void {

    let timeoutId: NodeJS.Timer | undefined;

    return async function fct(this: any, ...args: any[]) {
        const that = this;

        const doLater = async () => {
            timeoutId = undefined;
            if (!options.isImmediate) {
                await Promise.resolve(func.apply(that, args));
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
            await Promise.resolve(func.apply(that, args));
        }
    };
}
