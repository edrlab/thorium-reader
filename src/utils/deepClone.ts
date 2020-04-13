// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const deepClone = (_o: any): any =>
        _o && typeof _o === "object"
            ? Array.isArray(_o)
                ? _o.map((_value) => deepClone(_value))
                : Object.fromEntries(
                    Object.entries(_o).map(
                        ([_key, _value]) =>
                            [_key, deepClone(_value)]))
            : _o;
