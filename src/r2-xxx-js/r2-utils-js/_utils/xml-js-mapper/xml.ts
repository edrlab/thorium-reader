// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// import { serialize } from "./methods/serialize";

import { deserialize } from "./methods/deserialize";
import { FunctionType, IParseOptions } from "./types";

export class XML {
    public static deserialize<T>(
        objectInstance: Document | Element,
        objectType?: FunctionType,
        options?: IParseOptions): T {

        if (objectInstance.nodeType === 9) { // DOCUMENT_NODE
            objectInstance = (objectInstance as Document).documentElement as Element;
        }
        return deserialize(objectInstance as Element, objectType, options);
    }

    // public static serialize(value: any): XmlValue {
    //     return serialize(value);
    // }
}
