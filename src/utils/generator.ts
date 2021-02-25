// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export function* mapGenerator<T = unknown, TReturn = any, TNext = unknown>(
    effects: Array<Generator<T, TReturn, TNext>>,
) {
    console.log("mapGenerator 1", effects);
    const tasks: TReturn[] = [];
    for (const e of effects) {
        console.log("mapGenerator 2", e);
        const res = yield* e;
        console.log("mapGenerator 3");
        tasks.push(res);
        console.log("mapGenerator 4");
    }

    console.log("mapGenerator 5", tasks);
    return tasks;
}
