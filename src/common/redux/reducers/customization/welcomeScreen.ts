// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";
import { ICustomizationProfileWelcomeScreen } from "../../states/customization";
import { customizationActions } from "../../actions";


export const initialState: ICustomizationProfileWelcomeScreen = {
    enable: false,
};

function customizationPackageWelcomeScreenReducer_(
    state: ICustomizationProfileWelcomeScreen = initialState, // (preloaded state?) see registerReader
    action: customizationActions.welcomeScreen.TAction,
): ICustomizationProfileWelcomeScreen {
    switch (action.type) {
        case customizationActions.welcomeScreen.ID:
            return {
                enable: action.payload.enable,
            };
        default:
            return state;
    }
}
export const customizationPackageWelcomeScreenReducer = customizationPackageWelcomeScreenReducer_ as Reducer<ReturnType<typeof customizationPackageWelcomeScreenReducer_>>;
