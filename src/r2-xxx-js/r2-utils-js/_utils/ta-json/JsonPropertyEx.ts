// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import "reflect-metadata";

import * as debug_ from "debug";
import { JsonProperty } from "ta-json-x";
import { getDefinition } from "ta-json-x/dist/cjs/classes/object-definition";
import * as util from "util";

const debug = debug_("r2:utils#ta-json-x/JsonPropertyEx");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inspect(obj: any) {
    // breakLength: 100  maxArrayLength: undefined
    console.log(util.inspect(obj,
        { showHidden: false, depth: 1000, colors: true, customInspect: true }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function JsonPropertyEx(propertyName?: string): (target: any, key: string) => void {

    debug("JsonPropertyEx");

    debug("propertyName");
    debug(propertyName);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (target: any, key: string): void => {

        debug("target");
        inspect(target);

        debug("key");
        debug(key);

        debug("Reflect.getMetadata('design:type', target, key)");
        const objectType = Reflect.getMetadata("design:type", target, key);
        inspect(objectType);
        debug(objectType.name);

        debug("target.constructor");
        inspect(target.constructor);

        debug("getDefinition(target.constructor)");
        const objDef = getDefinition(target.constructor);
        inspect(objDef);

        debug("objDef.getProperty(key)");
        const property = objDef.getProperty(key);
        inspect(property);

        return JsonProperty(propertyName)(target, key);
    };
}
