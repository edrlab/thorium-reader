// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Readable } from "stream";

// import * as debug_ from "debug";
// const debug = debug_("r2:utils#stream/BufferReadableStream");

export class BufferReadableStream extends Readable {
    public readonly buffer: Buffer;
    private alreadyRead: number;

    constructor(buffer: Buffer) {
        super();
        this.buffer = buffer;
        this.alreadyRead = 0;
    }

    public _read(size: number): void {
        // debug("_read(size): " + size);

        if (this.alreadyRead >= this.buffer.length) {
            this.push(null);
            return;
        }

        let chunk = this.alreadyRead ?
            this.buffer.slice(this.alreadyRead) :
            this.buffer;

        if (size) {
            let l = size;
            if (size > chunk.length) {
                l = chunk.length;
            }

            chunk = chunk.slice(0, l);
        }

        this.alreadyRead += chunk.length;
        this.push(chunk);
    }
}
