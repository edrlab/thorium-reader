// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END=

const counter = () => {
    let _counter = 0;

    return () => {
        return Number.isSafeInteger(++_counter) ? _counter : _counter = 1;
    };
};
export const getCount = counter();
