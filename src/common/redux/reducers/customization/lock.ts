// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";
import { ICustomizationProfileLock } from "../../states/customization";
import { customizationActions } from "../../actions";


export const initialState: ICustomizationProfileLock = {
    lockInfo: undefined,
    state: "IDLE",
};

function customizationPackageActivatingLockReducer_(
    state: ICustomizationProfileLock = initialState, // (preloaded state?) see registerReader
    action: customizationActions.lock.TAction,
): ICustomizationProfileLock {
    switch (action.type) {
        case customizationActions.lock.ID:
            return {
                lockInfo: action.payload.lockInfo ? { ...action.payload.lockInfo } : undefined,
                state: action.payload.state,
            };
        default:
            return state;
    }
}
export const customizationPackageActivatingLockReducer = customizationPackageActivatingLockReducer_ as Reducer<ReturnType<typeof customizationPackageActivatingLockReducer_>>;
