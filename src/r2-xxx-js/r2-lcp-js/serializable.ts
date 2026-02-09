// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// https://github.com/edcarroll/ta-json
import { JSON as TAJSON } from "ta-json-x";

// import debug_ from "debug";
// const debug = debug_("r2:lcp/serializable");

export type AnyJson = JsonPrimitives | JsonArray | JsonMap;
export type JsonPrimitives = string | number | boolean | null;
export interface JsonMap {
    [key: string]: AnyJson;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface,@typescript-eslint/no-empty-object-type
export interface JsonArray extends Array<AnyJson> {
}

export const KeyToPreserveUnknownJSON = "AdditionalJSON";

export interface IWithAdditionalJSON {
    [KeyToPreserveUnknownJSON]: JsonMap | undefined;
    // SupportedKeys: string[] | undefined;
    // parseAdditionalJSON: (json: JsonMap) => void;
    // generateAdditionalJSON: (json: JsonMap) => void;
}
// export function parseAdditionalJSON(obj: IWithAdditionalJSON, json: JsonMap) {
//     if (!json || typeof json !== "object") {
//         return;
//     }
//     Object.keys(json).forEach((key) => {
//         if (json.hasOwnProperty(key)) {
//             if (obj.SupportedKeys && obj.SupportedKeys.includes(key)) {
//                 return;
//             }
//             if (!obj.AdditionalJSON) {
//                 obj.AdditionalJSON = {};
//             }
//             // warning: reference copy, not deep clone!
//             obj.AdditionalJSON[key] = json[key];
//         }
//     });
// }
// export function generateAdditionalJSON(obj: IWithAdditionalJSON, json: JsonMap) {
//     if (!json || typeof json !== "object") {
//         return;
//     }
//     if (!obj.AdditionalJSON) {
//         return;
//     }
//     const keys = Object.keys(obj.AdditionalJSON);
//     for (const key of keys) {
//         if (obj.AdditionalJSON.hasOwnProperty(key)) {
//             if (obj.SupportedKeys && obj.SupportedKeys.includes(key)) {
//                 continue;
//             }
//             // warning: reference copy, not deep clone!
//             json[key] = obj.AdditionalJSON[key];
//         }
//     }
// }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TConstructor<T> = new(value?: any) => T;
// type TFunction<T> = ObjectConstructor["constructor"] & TConstructor<T>;

// // tslint:disable-next-line: max-line-length
// export function TaJsonDeserialize<T extends IWithAdditionalJSON>(json: any, type: TConstructor<T>): T {
//     // debug("TaJsonDeserialize 1");
//     // debug(json);
//     const obj = TAJSON.deserialize<T>(json, type, { keyToPreserveUnknownJSON: "AdditionalJSON" });
//     // debug("TaJsonDeserialize 2");
//     // debug(obj);
//     // obj.parseAdditionalJSON(json);
//     // debug("TaJsonDeserialize 3");
//     // debug(obj);
//     return obj;
// }

// export function TaJsonSerialize<T extends IWithAdditionalJSON>(obj: T): JsonMap {
//     // debug("TaJsonSerialize 1");
//     // debug(obj);
//     const json = TAJSON.serialize(obj, { keyToPreserveUnknownJSON: "AdditionalJSON" }) as JsonMap;
//     // debug("TaJsonSerialize 2");
//     // debug(json);
//     // obj.generateAdditionalJSON(json);
//     // debug("TaJsonSerialize 3");
//     // debug(json);
//     return json;
// }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TaJsonDeserialize<T>(json: any, type: TConstructor<T>): T {
    return TAJSON.deserialize<T>(json, type, { keyToPreserveUnknownJSON: KeyToPreserveUnknownJSON });
}

export function TaJsonSerialize<T>(obj: T): JsonMap {
    return TAJSON.serialize(obj, { keyToPreserveUnknownJSON: KeyToPreserveUnknownJSON }) as JsonMap;
}
