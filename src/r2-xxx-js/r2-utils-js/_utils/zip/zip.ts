// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { RangeStream } from "../stream/RangeStream";

export interface IStreamAndLength {
    stream: NodeJS.ReadableStream;
    length: number;
    reset: () => Promise<IStreamAndLength>;
}

export interface IZip {
    hasEntries: () => boolean;
    entriesCount: () => number;
    hasEntry: (entryPath: string) => boolean;
    getEntries: () => Promise<string[]>;
    entryStreamPromise: (entryPath: string) => Promise<IStreamAndLength>;
    entryStreamRangePromise: (entryPath: string, begin: number, end: number) => Promise<IStreamAndLength>;
    freeDestroy: () => void;
}

export abstract class Zip implements IZip {
    public abstract hasEntries(): boolean;
    public abstract entriesCount(): number;
    public abstract hasEntry(entryPath: string): boolean;
    public abstract getEntries(): Promise<string[]>;
    public abstract entryStreamPromise(entryPath: string): Promise<IStreamAndLength>;
    public abstract freeDestroy(): void;

    public async entryStreamRangePromise(entryPath: string, begin: number, end: number): Promise<IStreamAndLength> {

        let streamAndLength: IStreamAndLength;
        try {
            streamAndLength = await this.entryStreamPromise(entryPath);
        } catch (err) {
            console.log(err);
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            return Promise.reject(err);
        }

        const b = begin < 0 ? 0 : begin;
        const e = end < 0 ? (streamAndLength.length - 1) : end;
        // const length = e - b + 1;
        // debug(`entryStreamRangePromise: ${b}-${e}/${streamAndLength.length}`);

        const stream = new RangeStream(b, e, streamAndLength.length);

        streamAndLength.stream.pipe(stream);

        const sal: IStreamAndLength = {
            length: streamAndLength.length,
            reset: async () => {
                return this.entryStreamRangePromise(entryPath, begin, end);
            },
            stream,
        };
        return sal;
    }
}
