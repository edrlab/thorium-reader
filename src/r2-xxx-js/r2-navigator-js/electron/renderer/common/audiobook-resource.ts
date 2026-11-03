// ==LICENSE-BEGIN==
// Copyright 2026 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as path from "node:path";

export function isAudiobookResource(rdfType: string | undefined, mediaType: string | undefined, linkPath: string): boolean {
    if (!rdfType || !/https?:\/\/schema\.org\/Audiobook$/.test(rdfType)) {
        return false;
    }
    const ext = path.extname(path.basename(linkPath));
    return !!mediaType?.startsWith("audio/") ||
        /\.mp[3|4]$/i.test(ext) ||
        /\.m4a$/i.test(ext) ||
        /\.wav$/i.test(ext) ||
        /\.aac$/i.test(ext) ||
        /\.og[g|b|a]$/i.test(ext) ||
        /\.aiff$/i.test(ext) ||
        /\.wma$/i.test(ext) ||
        /\.flac$/i.test(ext);
}
