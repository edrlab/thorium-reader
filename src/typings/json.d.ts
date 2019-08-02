// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

declare namespace typed_json {
    type AnyJson = JsonPrimitives | JsonArray | JsonMap;
    type JsonPrimitives = string | number | boolean | null;
    interface JsonMap {
        [key: string]: AnyJson;
    }
    interface JsonArray extends Array<AnyJson> {

    }
}

export = typed_json;
