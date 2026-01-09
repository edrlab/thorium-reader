// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";
import { customizationActions } from "../../actions";
import { ICustomizationManifest } from "readium-desktop/common/readium/customization/manifest";


export const initialState: ICustomizationManifest = undefined;

function customizationPackageManifestReducer_(
    state: ICustomizationManifest = null, // (preloaded state?) see registerReader
    action: customizationActions.manifest.TAction,
): ICustomizationManifest {
    switch (action.type) {
        case customizationActions.manifest.ID:
            return JSON.parse(JSON.stringify(action.payload));
        default:
            return state;
    }
}
export const customizationPackageManifestReducer = customizationPackageManifestReducer_ as Reducer<ReturnType<typeof customizationPackageManifestReducer_>>;
