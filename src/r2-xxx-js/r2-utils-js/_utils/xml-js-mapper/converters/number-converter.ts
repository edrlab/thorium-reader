// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IPropertyConverter } from "./converter";

export class NumberConverter implements IPropertyConverter {
    public serialize(property: number | string): string {
        // parseFloat() vs. Number()
        return (typeof property === "string") ? property : property.toString();
    }

    public deserialize(value: string): number {
        // return (typeof value === "string") ? Number(value) : value;
        return Number(value);
    }

    // public collapseArrayWithSingleItem(): boolean {
    //     return false;
    // }
}
