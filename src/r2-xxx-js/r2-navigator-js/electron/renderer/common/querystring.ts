// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { ReadiumElectronBrowserWindow } from "../webview/state";

const win = global.window as ReadiumElectronBrowserWindow;

export interface IStringMap { [key: string]: string; }

export const getURLQueryParams = (search?: string): IStringMap => {
    const params: IStringMap = {};

    let query = search || win.location.search;
    if (query && query.length) {
        query = query.substring(1);
        const keyParams = query.split("&");
        keyParams.forEach((keyParam) => {
            const keyVal = keyParam.split("=");
            if (keyVal.length > 1) {
                params[keyVal[0]] = decodeURIComponent(keyVal[1]);
            }
        });
    }

    return params;
};
