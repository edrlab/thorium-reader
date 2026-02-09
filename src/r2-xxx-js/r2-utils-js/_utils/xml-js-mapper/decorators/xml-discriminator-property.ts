// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { getDefinition } from "../classes/object-definition";
import { FunctionType } from "../types";

export function XmlDiscriminatorProperty(property: string) {
    return (objectType: FunctionType): void => {
        getDefinition(objectType).discriminatorProperty = property;
    };
}
