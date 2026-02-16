// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IPropertyConverter } from "./converter";

export class DateConverter implements IPropertyConverter {
    public serialize(property: Date | undefined): string {
        return property ? property.toISOString() : "Invalid Date";
    }

    public deserialize(value: string): Date | undefined {
        const date = new Date(value);
        return isNaN(date.getTime()) ? undefined : date;
    }

    // public collapseArrayWithSingleItem(): boolean {
    //     return false;
    // }
}
