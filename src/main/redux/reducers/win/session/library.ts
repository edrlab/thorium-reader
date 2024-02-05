// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { winActions } from "readium-desktop/main/redux/actions";
import { IWinSessionLibraryState } from "readium-desktop/main/redux/states/win/session/library";

const initialState: IWinSessionLibraryState = {
    browserWindowId: undefined,
    windowBound: undefined,
    identifier: undefined,
};

function winSessionLibraryReducer_(
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
                    windowBound: action.payload.winBound,
                },
            };

        case winActions.session.unregisterLibrary.ID:
            return {
                ...state,
                ...{
                    browserWindowId: undefined,
                    identifier: undefined,
                },
            };

        case winActions.session.setBound.ID:
            if (state.identifier === action.payload.identifier) {
                return {
                    ...state,
                    ...{
                        windowBound: action.payload.bound,
                    },
                };
            }
        }
    return state;
}

export const winSessionLibraryReducer = winSessionLibraryReducer_ as Reducer<ReturnType<typeof winSessionLibraryReducer_>>;
