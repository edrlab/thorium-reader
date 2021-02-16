// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// from https://github.com/moroshko/shallow-equal/raw/master/src/objects.js

interface IObj {
    [key: string]: any;
}

export function shallowEqual<ObjA extends IObj, ObjB extends IObj>(objA: ObjA, objB: ObjB) {

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (objA === objB) {
        return true;
    }

    if (!objA || !objB) {
        return false;
    }

    const aKeys = Object.keys(objA);
    const bKeys = Object.keys(objB);
    const len = aKeys.length;

    if (bKeys.length !== aKeys.length) {
        return false;
    }

    for (let i = 0; i < len; i++) {
        const key = aKeys[i];

        if (objA[key] !== objB[key] || !Object.prototype.hasOwnProperty.call(objB, key)) {
            return false;
        }
    }

    return true;
}
