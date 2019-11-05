// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as crypto from "crypto";

export function toSha256Hex(data: string) {
    const checkSum = crypto.createHash("sha256");
    checkSum.update(data);
    return checkSum.digest("hex");
}
