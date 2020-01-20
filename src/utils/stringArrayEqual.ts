// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const stringArrayEqual = (a1: string[], a2: string[]): boolean => {
    const s1 = new Set(a1);
    const s2 = new Set(a2);
    if (s1.size !== s2.size) {
        return false;
    }
    for (const str of s1) {
        if (!s2.has(str)) {
            return false;
        }
    }
    return true;
};
