// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

async function PromiseAllSettled<T>(promises: Array<Promise<T>>): Promise<Array<({
    status: "fulfilled";
    value: T;
} | {
    status: "rejected";
    reason: any;
})>> {
    return Promise.all(
        promises.map((promise) =>
            promise
                .then<{
                    status: "fulfilled";
                    value: T;
                }>((value) => ({
                    status: "fulfilled",
                    value,
                }))
                .catch((reason) => ({
                    status: "rejected",
                    reason,
                })),
        ),
    );
}
