// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IPropertyConverter, JsonValue } from "ta-json-x";

export class JsonStringConverter implements IPropertyConverter {
    public serialize(property: string): JsonValue {
        return property;
    }

    public deserialize(value: JsonValue): string {
        return value as string;
    }

    public collapseArrayWithSingleItem(): boolean {
        return true;
    }
}
