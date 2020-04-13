// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

const objFromEntries = Object.fromEntries;

export const deepClone = (o: any): any => {

    const match = (_o: any): any =>
        _o && typeof _o === "object"
            ? Array.isArray(_o)
                ? _cloneArr(_o)
                : objFromEntries(_cloneObj(Object.entries(_o)))
            : _o;

    const _cloneArr = (_a: any[]): any[] => _a.map((_value) => match(_value));

    const _cloneObj = (_o: Array<[string, any]>): Array<[string, any]> =>
        _o.map(([_key, _value]) => [_key, match(_value)]);

    return match(o);
};
