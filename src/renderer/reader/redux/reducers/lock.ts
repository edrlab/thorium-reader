// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { readerActions } from "readium-desktop/common/redux/actions";

function readerLockReducer_(
    state: boolean =  false, // hydrated from the main
    action: readerActions.setTheLock.TAction,
): boolean {

    switch (action.type) {
        case readerActions.setTheLock.ID:
            console.log("This reader Window has acquired the lock!");
            
            return true;

        default:
            return state;
    }
}

export const readerLockReducer = readerLockReducer_ as Reducer<ReturnType<typeof readerLockReducer_>>;
