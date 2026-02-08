// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// tslint:disable-next-line: max-line-length
// node -e 'const parse = (AccessModeSufficient) => console.log(JSON.stringify(AccessModeSufficient.map((ams) => ams.split(",").map((token) => token.trim()).filter((token) => token.length).reduce((pv, cv) => pv.includes(cv) ? pv : pv.concat(cv), [])).filter((arr) => arr.length))); parse([]); parse([""]); parse(["visual,textual"]); parse(["  visual   , textual  "]); parse(["  visual   , textual , visual "]); parse(["  visual   , textual , visual ", "auditory, auditory"]); parse(["", "  visual   , textual ,, visual ", "auditory, auditory,,"]);'
// ====>
// []
// []
// [["visual","textual"]]
// [["visual","textual"]]
// [["visual","textual"]]
// [["visual","textual"],["auditory"]]
// [["visual","textual"],["auditory"]]
export const DelinearizeAccessModeSufficient = (ams: string): string[] => {
    return ams.split(",").
        map((token) => token.trim()).
        filter((token) => token.length).
        reduce((pv, cv) => pv.includes(cv) ? pv : pv.concat(cv), [] as string[]).
        filter((arr) => arr.length);
};
export const DelinearizeAccessModeSufficients = (accessModeSufficients: string[]): (string[])[] => {
    return accessModeSufficients.map((ams) => DelinearizeAccessModeSufficient(ams));
};
export const LinearizeAccessModeSufficients = (accessModeSufficients: (string[])[]): string[] => {
    return accessModeSufficients.map((ams) => ams.join(","));
};

// import { IPropertyConverter, JsonValueArray } from "ta-json-x";
//
// export class JsonStringTokensConverter implements IPropertyConverter {
//     public serialize(property: (string[])[]): JsonValueArray {
//         return LinearizeAccessModeSufficients(property);
//     }

//     public deserialize(value: JsonValueArray): (string[])[] {
//         return DelinearizeAccessModeSufficients(value as string[]);
//     }

//     public collapseArrayWithSingleItem(): boolean {
//         return false;
//     }
// }
