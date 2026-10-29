// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Transformers } from "@r2-shared-js/transform/transformer";
import { RangeStream } from "@r2-utils-js/_utils/stream/RangeStream";
import { IStreamAndLength } from "@r2-utils-js/_utils/zip/zip";

function byteRange(stream: IStreamAndLength, begin: number, end: number): IStreamAndLength {
    return {
        // The response Content-Range needs the full resource length.
        length: stream.length,
        stream: stream.stream.pipe(new RangeStream(begin, end < 0 ? stream.length - 1 : end, stream.length)),
        reset: async () => byteRange(await stream.reset(), begin, end),
    };
}

export async function transformPublicationStream(
    ...args: Parameters<typeof Transformers.tryStream>
): Promise<IStreamAndLength> {
    const [, link, , stream, isPartialByteRangeRequest, begin, end] = args;
    const transformed = await Transformers.tryStream(...args);

    // Encryption metadata makes the protocol handler open the full ZIP entry.
    // Access-restriction metadata can have no matching transformer, leaving that
    // full stream unchanged. Slice it before advertising a partial response.
    // Streams returned by a transformer already have their requested range.
    if (transformed === stream && isPartialByteRangeRequest && link.Properties?.Encrypted) {
        return byteRange(stream, begin, end);
    }

    return transformed;
}
