// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// used in publcation api import fct
async function PromiseRunAllIgnoreReject<T>(promise: Array<Promise<T>>) {
    const retArray = [];
    for (const i of promise) {
        try {
            retArray.push(await i);
        } catch (e) {
            // ignore;

        }
    }
    return retArray;
}
