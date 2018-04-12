// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

/**
 * A Language
 */
export interface Language {
    code: string; // Iso code on 2 or 3 chars
}

export const getMultiLangString = (titleObj: any, lang?: string) => {

    if (!titleObj) {
        return "";
    }

    if (typeof titleObj === "string") {
        return titleObj;
    }

    if (lang && titleObj[lang]) {
        return titleObj[lang];
    }

    const keys = Object.keys(titleObj);
    if (keys && keys.length) {
        return titleObj[keys[0]];
    }

    return "";
};
