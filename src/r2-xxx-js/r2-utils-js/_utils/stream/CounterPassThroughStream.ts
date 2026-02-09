// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Transform } from "stream";

// const debug = debug_("r2:utils#stream/CounterPassThroughStream");

export class CounterPassThroughStream extends Transform {
    public bytesReceived: number;
    public readonly id: number;

    constructor(id: number) {
        super();
        this.id = id;
        this.bytesReceived = 0;
    }

    public _transform(chunk: Buffer, _encoding: string, callback: () => void): void {
        this.bytesReceived += chunk.length;

        this.push(chunk);

        this.emit("progress");

        callback();
    }
}
