// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { ToastType } from "readium-desktop/common/models/toast";
import { ActionPayloadToast, ActionType } from "readium-desktop/common/redux/actions/toast";

export interface ToastState extends ActionPayloadToast {
    open: boolean;
}

const initialState: ToastState = {
    open: false,
    type: ToastType.DownloadComplete,
    data: undefined,
};

export function toastReducer(
    state: ToastState = initialState,
    action: Action<string, ActionPayloadToast>,
) {
    switch (action.type) {
        case ActionType.OpenRequest:
            return Object.assign(
                {},
                state,
                {
                    open: true,
                    type: action.payload.type,
                    data: action.payload.data,
                },
            );
        case ActionType.CloseRequest:
            return Object.assign(
                {},
                initialState,
            );
        default:
            return state;
    }
}
