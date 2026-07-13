// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { ISettingsState } from "readium-desktop/common/redux/states/settings";
import { settingsActions } from "readium-desktop/common/redux/actions";

const initialState: ISettingsState = {
    enableAPIAPP: false,
    minimizeLibraryToTray: false,
    keepLibraryWindowInBackgroundOnReaderOpen: false,
    keepLibraryWindowInBackgroundOnReaderClose: false,
    oneReaderWindowPerPublication: false,
    lcpAutoDeleteExpiredPublications: false,
    lcpAutoDeleteExpiredPublicationsForced: false,
};

function settingsReducer_(
    state: ISettingsState = initialState,
    action:
        settingsActions.enableAPIAPP.TAction |
        settingsActions.keepLibraryWindowInBackgroundOnReaderClose.TAction |
        settingsActions.keepLibraryWindowInBackgroundOnReaderOpen.TAction |
        settingsActions.minimizeLibraryToTray.TAction |
        settingsActions.oneReaderWindowPerPublication.TAction |
        settingsActions.libraryView.TAction |
        settingsActions.lcpAutoDeleteExpiredPublications.TAction |
        settingsActions.lcpAutoDeleteExpiredPublicationsForced.TAction,
):  ISettingsState {
    switch (action.type) {
        case settingsActions.enableAPIAPP.ID:
            return {
                ...initialState,
                ...state,
                enableAPIAPP: action.payload.enableAPIAPP,
            };
        case settingsActions.minimizeLibraryToTray.ID:
            return {
                ...initialState,
                ...state,
                minimizeLibraryToTray: action.payload.minimizeLibraryToTray,
            };
        case settingsActions.keepLibraryWindowInBackgroundOnReaderClose.ID:
            return {
                ...initialState,
                ...state,
                keepLibraryWindowInBackgroundOnReaderClose: action.payload.keepLibraryWindowInBackgroundOnReaderClose,
            };
        case settingsActions.keepLibraryWindowInBackgroundOnReaderOpen.ID:
            return {
                ...initialState,
                ...state,
                keepLibraryWindowInBackgroundOnReaderOpen: action.payload.keepLibraryWindowInBackgroundOnReaderOpen,
            };
        case settingsActions.oneReaderWindowPerPublication.ID:
            return {
                ...initialState,
                ...state,
                oneReaderWindowPerPublication: action.payload.oneReaderWindowPerPublication,
            };
        case settingsActions.libraryView.ID:
            return {
                ...initialState,
                ...state,
                libraryView: {
                    ...(state.libraryView || {}),
                    ...action.payload.libraryView,
                },
            };
        case settingsActions.lcpAutoDeleteExpiredPublications.ID:
            return {
                ...initialState,
                ...state,
                lcpAutoDeleteExpiredPublications: action.payload.lcpAutoDeleteExpiredPublications,
            };
        case settingsActions.lcpAutoDeleteExpiredPublicationsForced.ID:
            return {
                ...initialState,
                ...state,
                lcpAutoDeleteExpiredPublicationsForced: action.payload.lcpAutoDeleteExpiredPublicationsForced,
            };

        default:
            return state;
    }
}

export const settingsReducer = settingsReducer_ as Reducer<ReturnType<typeof settingsReducer_>>;
