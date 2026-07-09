// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { ILibraryViewSettingsState } from "../../states/settings";

export const ID = "SETTINGS_LIBRARY_VIEW";

export interface Payload {
    libraryView: Partial<ILibraryViewSettingsState>;
}

export function build(libraryView: Partial<ILibraryViewSettingsState>):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            libraryView,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
