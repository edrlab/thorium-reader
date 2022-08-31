// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export interface PromiseFulfilled<T> {
    status: "fulfilled";
    value: T;
}
export interface PromiseRejected {
    status: "rejected";
    reason: any;
}

export async function PromiseAllSettled<T>(promises: Array<Promise<T>>):
    Promise<Array<(PromiseFulfilled<T> | PromiseRejected)>> {

    const promises_ = promises.map(async (promise) => {
        return promise
            .then<PromiseFulfilled<T>>((value) => {
                return {
                    status: "fulfilled",
                    value,
                };
            })
            .catch((reason) => {
                return {
                    reason,
                    status: "rejected",
                } as PromiseRejected;
            });
    });
    return Promise.all(promises_);
}
