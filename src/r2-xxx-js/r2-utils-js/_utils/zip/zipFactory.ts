// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as fs from "fs";
import { URL } from "url";

import { isHTTP } from "../http/UrlUtils";
import { IZip } from "./zip";
import { ZipExploded } from "./zip-ex";
import { ZipExplodedHTTP } from "./zip-ex-http";
import { Zip1 } from "./zip1";
import { Zip2 } from "./zip2";

export async function zipLoadPromise(filePath: string): Promise<IZip> {
    if (isHTTP(filePath)) {
        const url = new URL(filePath);
        const p = url.pathname;
        if (p.endsWith("/")) { // bit hacky? :(
            return ZipExplodedHTTP.loadPromise(filePath);
        }
        return Zip2.loadPromise(filePath);
    }

    const stats = fs.lstatSync(filePath);
    if (stats.isDirectory()) {
        return ZipExploded.loadPromise(filePath);
    }

    return Zip1.loadPromise(filePath);
}
