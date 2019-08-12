// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export function encodeURIComponent_RFC3986(str: string): string {
    return encodeURIComponent(str)
        .replace(/[!'()*]/g, (c: string) => {
            return "%" + c.charCodeAt(0).toString(16);
        });
}

export function parseQueryString(queryString: string) {
    if (!queryString) {
        return {};
    }
    const result: any = {};
    const cleanQueryString = queryString.replace("?", "");
    const splited = cleanQueryString.split("&");

    for (const couple of splited) {
        const splitedCouple = couple.split("=");
        result[splitedCouple[0]] = splitedCouple[1];
    }

    return result;
}
