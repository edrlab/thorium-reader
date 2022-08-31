// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END

// type TUnPromise<T extends any> =
//     T extends Promise<infer R> ? R : any;
// type TReturnPromise<T extends (...args: any) => any> =
//     T extends (...args: any) => Promise<infer R> ? R : any;
// type TUnArray<T extends any> =
//     T extends Array<infer R> ? R : any;

export interface TdestForPageIndex { num: number; gen: number; }
export type TdestObj = { name?: string} | TdestForPageIndex | null;
