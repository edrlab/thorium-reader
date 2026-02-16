// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface IStringKeyedObject { [key: string]: any; }

export function isNullOrUndefined<T>(val: T | undefined | null): val is T {
    // typeof val === "undefined" useful if val not declared (avoids ReferenceError throw)
    // val == undefined loose equality => good for both null and undefined
    // val === undefined srict equality => good for undefined only
    // note that if val === null, typeof val === "object"
    // whereas if val === undefined, typeof val === "undefined"
    return val === undefined || val === null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sortObject(obj: any): any {
    if (obj === null) {
        return null;
    }
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = sortObject(obj[i]);
        }
        return obj;
    } else if (typeof obj !== "object") { //  || obj === null
        return obj;
    }

    const newObj: IStringKeyedObject = {};

    Object.keys(obj).sort().forEach((key) => {
        newObj[key] = sortObject(obj[key]);
    });

    return newObj;
}

function traverseJsonObjects_(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parent: any, keyInParent: any, obj: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    func: (item: any, parent: any, keyInParent: any) => void) {

    func(obj, parent, keyInParent);

    if (obj instanceof Array) {
        for (let index = 0; index < obj.length; index++) {
            const item = obj[index];
            if (!isNullOrUndefined(item)) {
                traverseJsonObjects_(obj, index, item, func);
            }
        }
    } else if (typeof obj === "object" && obj !== null) {
        Object.keys(obj).forEach((key) => {
            if (obj.hasOwnProperty(key)) {
                const item = obj[key];
                if (!isNullOrUndefined(item)) {
                    traverseJsonObjects_(obj, key, item, func);
                }
            }
        });
    }
}

export function traverseJsonObjects(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    func: (item: any, parent: any, keyInParent: any) => void) {

    traverseJsonObjects_(undefined, undefined, obj, func);
}
