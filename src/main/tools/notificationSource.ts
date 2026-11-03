// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Never include directories, URL credentials, ports, queries, or fragments in a toast label.
export function notificationSource(value: string): string | undefined {
    if (/^[a-z]:[\\/]/i.test(value)) {
        return path.basename(value) || undefined;
    }
    try {
        const url = new URL(value);
        if (url.protocol === "file:") {
            return path.basename(fileURLToPath(url)) || undefined;
        }
        return url.hostname || undefined;
    } catch {
        // URL-like input that cannot be parsed must not fall back to the full URL.
        if (value.includes("://")) {
            return undefined;
        }
        return path.basename(value) || undefined;
    }
}
