// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { defaultRectangle } from "readium-desktop/common/rectangle/window";
import { winActions } from "readium-desktop/main/redux/actions";
import { IWinRegistryLibraryState } from "readium-desktop/main/redux/states/win/registry/library";

const initialState: IWinRegistryLibraryState = {
    browserWindowId: undefined,
    windowBound: defaultRectangle(),
    identifier: undefined,
};

export function winRegistryLibraryReducer(
    state: IWinRegistryLibraryState = initialState,
    action: winActions.registry.registerLibrary.TAction |
        winActions.registry.unregisterLibrary.TAction |
        winActions.registry.setBound.TAction,
): IWinRegistryLibraryState {
    switch (action.type) {

        case winActions.registry.registerLibrary.ID:
            return {
                ...state,
                ...{
                    browserWindowId: action.payload.win.id,
                    identifier: action.payload.identifier,
                },
            };

        case winActions.registry.unregisterLibrary.ID:
            return {
                ...state,
                ...{
                    browserWindowId: undefined,
                    windowBound: defaultRectangle(),
                    identifier: undefined,
                },
            };

        case winActions.registry.setBound.ID:
            return {
                ...state,
                ...{
                    windowBound: action.payload.bound,
                },
            };

        default:
    return state;
}
}
