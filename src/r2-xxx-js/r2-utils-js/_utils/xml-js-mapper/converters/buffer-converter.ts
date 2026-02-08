// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IPropertyConverter } from "./converter";

export class BufferConverter implements IPropertyConverter {
    private encoding: BufferEncoding = "utf8";

    // constructor(encoding: string = "json") {
    //     this.encoding = encoding;
    // }

    public serialize(property: Buffer): string {
        // if (this.encoding === "json") {
        //     return property.toJSON();
        // }
        return property.toString(this.encoding);
    }

    public deserialize(value: string): Buffer {
        // if (this.encoding === "json") {
        //     return Buffer.from((value as any).data);
        // }
        return Buffer.from(value, this.encoding);
    }

    // public collapseArrayWithSingleItem(): boolean {
    //     return false;
    // }
}
