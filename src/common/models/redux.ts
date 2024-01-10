// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action as ReduxAction } from "redux";

export interface Action<Type extends string = string, Payload = undefined, Meta = undefined>
    extends ReduxAction<Type> {

    payload?: Payload;
    meta?: Meta;
    error?: boolean;

    // This is to pass the compilation of store.dispatch(),
    // otherwise we would need to cast/coerce the argument type with "as UnknownAction", EVERYWHERE on the calling site!
    // Is there a better way to satisfy the TypeScript types published by Redux??
    //
    // interface Dispatch<A extends Action = UnknownAction> {
    //     <T extends A>(action: T, ...extraArgs: any[]): T;
    // }
    // interface UnknownAction extends Action {
    //     [extraProps: string]: unknown;
    // }
    [extraProps: string]: unknown;
}
