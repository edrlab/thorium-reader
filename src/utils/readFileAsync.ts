// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as fs from "fs";

export const readFile = (path: string): Promise<string> =>
    new Promise((resolve, reject) =>
        fs.readFile(path, { encoding: "utf8" }, (err, data) => err ? reject(err) : resolve(data)));
