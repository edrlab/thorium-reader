// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { JsonMap } from "readium-desktop/typings/json";

export function manifestContext(manifest: JsonMap): [r2: boolean, w3c: boolean] {

    if (manifest) {
        const context = manifest["@context"];
        const contextArray = Array.isArray(context) ? context : [context];
        if (contextArray.includes("https://www.w3.org/ns/pub-context")) {
            return [false, true];
        } else if (contextArray.includes("https://readium.org/webpub-manifest/context.jsonld") || contextArray.includes("http://readium.org/webpub-manifest/context.jsonld")) {
            return [true, false];
        }
    }
    return [false, false];
}
