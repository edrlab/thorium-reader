// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";
import { ICustomizationProfileProvisioned } from "../../states/customization";
import { customizationActions } from "../../actions";


export const initialState: ICustomizationProfileProvisioned[] = [];

function customizationPackageProvisionReducer_(
    state: ICustomizationProfileProvisioned[] = initialState, // (preloaded state?) see registerReader
    action: customizationActions.provisioning.TAction,
): ICustomizationProfileProvisioned[] {
    switch (action.type) {
        case customizationActions.provisioning.ID:
            return [...action.payload.newPackagesProvisioned || []];
        default:
            return state;
    }
}
export const customizationPackageProvisioningReducer = customizationPackageProvisionReducer_ as Reducer<ReturnType<typeof customizationPackageProvisionReducer_>>;
