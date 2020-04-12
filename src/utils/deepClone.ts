// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

const fromEntries = (it: Array<[string, any]>): any =>
    it.reduce<any>(
        (pv, [_key, _value]) =>
            pv[_key] = typeof _value === "object" ? fromEntries(_value) : _value,
        {});

const ObjFromEntries = Object.fromEntries || fromEntries;

export const deepClone = (o: unknown): any => {

    const _clone = (_o: unknown): Array<[string, unknown]> =>
        Object.entries(_o).map<[string, unknown]>(
            ([_key, _value]) =>
                typeof _value === "object" ? [_key, _clone(_value)] : [_key, _value]);

    const entries = _clone(o);
    return ObjFromEntries(entries);
};
