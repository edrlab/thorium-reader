// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

// export interface IGenerator<TR> extends Generator<unknown, TR, unknown> {}
export type TGenerator<T> = Generator<unknown, T>;

type TAny<T> = Promise<T> | TGenerator<T>;

/**
 * Obtain the promise or generator return type of a function type
 *
 */
export type TReturnPromiseOrGeneratorType<T extends (...args: any) => any> = T extends (...args: any) => TAny<infer R> ? R : any;
