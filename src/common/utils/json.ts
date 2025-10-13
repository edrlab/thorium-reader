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
// Also see: https://github.com/ljharb/json-stable-stringify
export const JsonStringifySortedKeys = (json: any, indentSpaces = 0): string => {
    return JSON.stringify(json, (_, val: any) => {
        // https://github.com/lodash/lodash/blob/f299b52f39486275a9e6483b60a410e06520c538/lodash.js#L12076-L12115
        // https://www.npmjs.com/package/lodash.isplainobject
        // isPlainObject(val)
        // https://github.com/jonschlinkert/is-plain-object/blob/0a47f0f6cd10e0d2489beb55a32a8d0ba7b04b25/is-plain-object.js#L8-L32
        // https://github.com/jquery/jquery/blob/d6c1e2388420d97b5291f9bd45f362bedc0a8bcd/src/core.js#L201-L220
        // https://github.com/jashkenas/underscore/blob/0d820ef7292cdec28dd8b5d565921b8100ca3397/modules/isObject.js#L2-L5
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
