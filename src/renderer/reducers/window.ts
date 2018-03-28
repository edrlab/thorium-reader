// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    WINDOW_INIT,
} from "readium-desktop/renderer/actions/window";

export enum WindowStatus {
    Initializing, // Window is initializing
    Initialized, // Window has been initialized
}

export enum WindowView {
    Catalog, // Catalog view
    Book, // Book view
}

export interface WindowState {
    status: WindowStatus;
    view: WindowView;
}

const initialState: WindowState = {
    status: WindowStatus.Initializing,
    view: WindowView.Catalog,
};

export function windowReducer(
    state: WindowState = initialState,
    action: any,
    ): WindowState {
    switch (action.type) {
        case WINDOW_INIT:
            state.status = WindowStatus.Initialized;
            return state;
        default:
            return state;
    }
}
