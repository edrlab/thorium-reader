// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as request from "request";

export function requestGet(url: string, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const requestOptions = Object.assign(
            {},
            { url },
            { headers: {
                "User-Agent": "readium-desktop",
                },
            },
            options,
        );

        request(requestOptions, (error: any, response: any, body: any) => {
            if (error) {
                return reject(error);
            }

            return resolve({
                response,
                body,
            });
        });
    });
}
