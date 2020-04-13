// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

/**
 *
 * deep clone the value passed in parameter
 * @param o anything: array, object, litteral, null, undefined
 * @returns cloned value
 *
 * @description clone Map and Set with their default copy constructor (not a real deep copy)
 */
export const deepClone = (o: any): any =>
    o && typeof o === "object"
        ? Array.isArray(o)
            ? o.map((value) => deepClone(value))
            : o instanceof Date
                ? new Date(o)
                : o instanceof Map // not a real deep copy
                    ? new Map(o)
                    : o instanceof Set // not a real deep copy
                        ? new Set(o)
                        : [
                            ...Object.keys(o),
                            ...Object.getOwnPropertySymbols(o),
                        ].reduce(
                            (obj, key) => ({
                                ...obj,
                                [key]: deepClone(o[key]),
                            }), {})
        : o;
