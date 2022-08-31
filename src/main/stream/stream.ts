// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";

import { streamToBufferPromise } from "@r2-utils-js/_utils/stream/BufferUtils";

// Logger
const debug = debug_("readium-desktop:main#utils/stream");
debug("_");

export async function readStreamToBuffer(
    stream: NodeJS.ReadableStream | undefined,
): Promise<Buffer> {

    if (stream) {

        const buffer = await streamToBufferPromise(stream);
        return buffer;

    }
    return undefined;
}
