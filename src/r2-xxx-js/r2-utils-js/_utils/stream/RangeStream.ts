// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { Transform } from "stream";

const debug = debug_("r2:utils#stream/RangeStream");

export class RangeStream extends Transform {
    private bytesReceived: number;
    private finished: boolean;
    private isClosed: boolean;

    constructor(readonly streamBegin: number, readonly streamEnd: number, readonly streamLength: number) {
        super();
        this.bytesReceived = 0;
        this.finished = false;
        this.isClosed = false;
        this.on("end", () => {
            // debug("------ RangeStream END");
        });
        this.on("finish", () => {
            // debug("------ RangeStream FINISH");
        });
    }

    public _flush(callback: () => void): void {
        // debug("FLUSH");
        callback();
    }

    public _transform(chunk: Buffer, _encoding: string, callback: () => void): void {
        this.bytesReceived += chunk.length;
        // debug(`_transform bytesReceived ${this.bytesReceived}`);

        if (this.finished) {
            if (!this.isClosed) {
                debug("???? CLOSING...");
                this.isClosed = true;
                this.push(null);
            } else {
                debug("???? STILL PIPE CALLING _transform ??!");
                this.end();
            }
        } else {
            if (this.bytesReceived > this.streamBegin) {

                let chunkBegin = 0;
                let chunkEnd = chunk.length - 1;

                chunkBegin = this.streamBegin - (this.bytesReceived - chunk.length);
                if (chunkBegin < 0) {
                    chunkBegin = 0;
                }

                if (this.bytesReceived > this.streamEnd) {
                    this.finished = true;
                    chunkEnd = chunk.length - (this.bytesReceived - this.streamEnd);
                }
                // console.log(`CHUNK: ${chunkBegin}-${chunkEnd}/${chunk.length}`);
                this.push(chunk.slice(chunkBegin, chunkEnd + 1));

                if (this.finished) {
                    // debug("FINISHING...");
                    this.isClosed = true;
                    this.push(null);
                    this.end();
                }
            } else {
                // NOOP
                // no call to this.push(), we skip the entire current chunk buffer
            }
        }

        callback();
    }
}
