// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { sortObject } from "@r2-utils-js/_utils/JsonUtils";
// export function sortObject(obj: any): any {
//     if (obj === null) {
//         return null;
//     }
//     if (obj instanceof Array) {
//         for (let i = 0; i < obj.length; i++) {
//             obj[i] = sortObject(obj[i]);
//         }
//         return obj;
//     } else if (typeof obj !== "object") { //  || obj === null
//         return obj;
//     }

//     const newObj: IStringKeyedObject = {};

//     Object.keys(obj).sort().forEach((key) => {
//         newObj[key] = sortObject(obj[key]);
//     });

//     return newObj;
// }
// // sortObject modifies the passed object recursively, which is wy we clone the input JSON
// export const JsonStringifySortedKeys = (json: any) => JSON.stringify(sortObject(JSON.parse(JSON.stringify(json))));
// ... whereas the JSON.stringify() replacer intercept values to be stringified and applies a local transform (no actual mutation of the input)
export const JsonStringifySortedKeys = (json: any, indentSpaces = 0): string => {
    return JSON.stringify(json, (_, val: any) => {
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
            const keys = Object.keys(val).sort(); // in-place array mutate
            const obj: Record<string, any> = {};
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                obj[key] = val[key];
            }
            return obj;
        }
        return val;
    }, indentSpaces);
};
