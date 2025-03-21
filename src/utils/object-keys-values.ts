// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// instead of "T extends {}", we could use "T extends ObjectWithStringKeys<T>"
// in order to narrow-down the parameter's object type:
// interface ObjectWithStringKeys<T> { [key: string]: T[keyof T]; }

// string-only keys, but only for compile-time types, not runtime Javascript!
export const ObjectKeys =
    Object.keys as (<T extends {}>(obj: T) => Array<Extract<keyof T, string>>);

// values for string-only keys, but only for compile-time types, not runtime Javascript!
export const ObjectValues =
    Object.values as <T extends {}>(obj: T) => Array<T[Extract<keyof T, string>]>;

// includes key 111 (number) from the example below (in addition to string keys)
export const ObjectKeysAll =
    Object.keys as (<T extends {}>(obj: T) => Array<keyof T>);

// includes the value for key 111 (number) from the example below (in addition to string keys)
export const ObjectValuesAll =
    Object.values as <T extends {}>(obj: T) => Array<T[keyof T]>;

// EXAMPLE:

// Try this in the command line shell:
// node -e 'const obj = { keyForString: "val1", keyForNumber: 2, keyForBool: true, keyForObj: { name: "value", }, 111: { keyIsNumber: true, } }; obj[999] = { otherKeyIsNumber: true }; console.log(Object.keys(obj)); console.log(Object.values(obj));'
//
// NOTE THAT THE ACTUAL JAVASCRIPT OUTPUT
// DOES NOT MATCH TypeScript "forced" expectations, so use carefully!
// ===>
// Object.keys(obj):
// [
//     '111',
//     '999',
//     'keyForString',
//     'keyForNumber',
//     'keyForBool',
//     'keyForObj'
// ]
// Object.values(obj):
// [
//     { keyIsNumber: true },
//     { otherKeyIsNumber: true },
//     'val1',
//     2,
//     true,
//     { name: 'value' }
// ]

// ---------------------------------------------
// UN-COMMENT the section below to test in Visual Studio Code
// (hover for types reveal)
// ---------------------------------------------
// export const obj = {
//     keyForString: "val1",
//     keyForNumber: 2,
//     keyForBool: true,
//     keyForObj: {
//         name: "value",
//     },
//     111: {
//         keyIsNumber: true,
//     },
// };
// // the following fails (because obj is in fact not "any"):
// obj[999] = {
//     otherKeyIsNumber: true,
// };

// export const stringKeysOnly = ObjectKeys(obj);
// export const valuesForStringKeysOnly = ObjectValues(obj);

// export const allKeys = ObjectKeysAll(obj);
// export const valuesForAllKeys = ObjectValuesAll(obj);

// // The test below demonstrates that forcing "dict" to the number-indexed type
// // results in TypeScript not inferring the "222" and "555" possible keys
// // (which is the expected behaviour,
// // as the interface does not impose limitations on the "values" of keys,
// // only constrains their type to number)
// export interface NumberToStringDictionary {
//     [n: number]: string;
// }
// export const dict: Readonly<NumberToStringDictionary> = {
//     222: "two",
//     555: "five",
// };
// // the following fails (because readonly):
// dict[333] = "three";

// export const dictStringKeysOnly = ObjectKeys(dict);
// export const dictValuesForStringKeysOnly = ObjectValues(dict);

// export const dictAllKeys = ObjectKeysAll(dict);
// export const dictValuesForAllKeys = ObjectValuesAll(dict);
// ---------------------------------------------
// ---------------------------------------------
