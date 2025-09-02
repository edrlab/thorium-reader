// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { ICustomizationTheme, TTheme } from "../../states/theme";

export const ID = "SET_APP_THEME";

export interface Payload {
    name: TTheme;
    customization: ICustomizationTheme;
}

export function build(theme?: TTheme, customization?: ICustomizationTheme): Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            name: theme,
            customization,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
