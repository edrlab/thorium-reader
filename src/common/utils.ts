// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as request from "request";

export async function httpGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        request(url, (error, _response, body) => {
            if (error) {
                reject(error);
            }

            resolve(body);
        });
    });
}

export function convertMultiLangStringToString(item: any): string {
    if (typeof(item) === "string") {
        return item;
    }

    // This is an object
    const langs = Object.keys(item);

    if (langs.length === 0) {
        return null;
    }

    // FIXME: returns the string for a given languae
    const lang = langs[0];
    return item[lang];
}

export function convertContributorArrayToStringArray(items: any): string[] {
    if (!items) {
        return  [];
    }

    const itemParts = items.map((item: any) => {
        return item.Name;
    });

    return itemParts;
}
