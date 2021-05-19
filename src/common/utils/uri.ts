// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export function tryDecodeURIComponent(str: string): string {
    try {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent
        // vs.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURI
        return decodeURIComponent(str);
    } catch (err) { // can occur with "%" literal char not used as part of an escaped sequence
        console.log(str, err);
    }

    // unchanged if decode fails
    return str;
}
