// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export function removeUTF8BOM(str: string): string {
    // UTF-8 BOM removal (EFBBBF)
    // because Buffer.toString converts to UTF-16 BOM (FEFF)
    // str.charCodeAt(0) === 0xFEFF || str.charCodeAt(0) === 65279
    // str = str.substr(1);
    // str = str.slice(1);
    // str = str.replace(/^\uFEFF/gm, "").replace(/^\u00BB\u00BF/gm,"");
    if (str.charCodeAt(0) === 0xFEFF) {
        str = str.slice(1);
    }
    return str;
}
