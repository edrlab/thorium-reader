// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { defaultRectangle } from "readium-desktop/common/rectangle/window";
import { winActions } from "readium-desktop/main/redux/actions";
import { IWinSessionLibraryState } from "readium-desktop/main/redux/states/win/session/library";

const initialState: IWinSessionLibraryState = {
    browserWindowId: undefined,
    windowBound: defaultRectangle(),
    identifier: undefined,
};

export function winSessionLibraryReducer(
    state: IWinSessionLibraryState = initialState,
    action: winActions.session.registerLibrary.TAction |
        winActions.session.unregisterLibrary.TAction |
        winActions.session.setBound.TAction,
): IWinSessionLibraryState {
    switch (action.type) {

        case winActions.session.registerLibrary.ID:
            return {
                ...state,
                ...{
                    browserWindowId: action.payload.win.id,
                    identifier: action.payload.identifier,
                },
            };

        case winActions.session.unregisterLibrary.ID:
            return {
                ...state,
                ...{
                    browserWindowId: undefined,
                    windowBound: defaultRectangle(),
                    identifier: undefined,
                },
            };

        case winActions.session.setBound.ID:
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
