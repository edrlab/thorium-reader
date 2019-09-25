// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

/**
 * Obtain the promise return type of a function type
 */
export type ReturnPromiseType<T extends (...args: any) => any> = T extends (...args: any) => Promise<infer R> ? R : any;
