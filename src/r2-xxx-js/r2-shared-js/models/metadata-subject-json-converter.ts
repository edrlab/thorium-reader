// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IPropertyConverter, JsonValue } from "ta-json-x";

import { TaJsonDeserialize, TaJsonSerialize } from "@r2-lcp-js/serializable";

import { Subject } from "./metadata-subject";

// import { IStringMap } from "./metadata-multilang";

export class JsonSubjectConverter implements IPropertyConverter {
    public serialize(s: Subject): JsonValue {
        if (s.Name &&
            !s.SortAs &&
            !s.Scheme &&
            !s.Code &&
            (!s.Links || !s.Links.length)) {
            if (typeof s.Name === "string") {
                return s.Name;
            }
            // else if (typeof s.Name === "object") {
            //     return s.Name; // IStringMap
            // }
        }
        return TaJsonSerialize(s);
    }

    public deserialize(value: JsonValue): Subject {
        if (typeof value === "string") {
            const s = new Subject();
            s.Name = value as string;
            return s;
        }
        // else if (typeof value === "object" && !(value as any)["name"]) { // tslint:disable-line:no-string-literal
        //     const s = new Subject();
        //     s.Name = {} as IStringMap;
        //     const keys = Object.keys(value as any);
        //     keys.forEach((key: string) => {
        //         // TODO? check key is BCP47 language tag?
        //         const val = (value as any)[key];
        //         if (typeof val === "string") {
        //             (s.Name as IStringMap)[key] = val;
        //         }
        //     });
        //     return s;
        // }
        return TaJsonDeserialize<Subject>(value, Subject);
    }

    public collapseArrayWithSingleItem(): boolean {
        return true;
    }
}
