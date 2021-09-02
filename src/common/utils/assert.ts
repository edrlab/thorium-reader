// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { deepStrictEqual, ok } from "readium-desktop/common/utils/assert";

import { AssertionError } from "assert";
import * as ramda from "ramda";

// Bizarrely, the 'assert' package started crashing in Thorium builds based on Electron v13/14

export const deepStrictEqual = (p1: any, p2: any, msg?: string) => {
    if (!ramda.equals(p1, p2)) {
        throw new AssertionError({message: msg ? msg : "?!"});
    }
};

export const ok = (p: any, msg?: string) => {
    if (!p) {
        throw new AssertionError({message: msg ? msg : "?!"});
    }
};
