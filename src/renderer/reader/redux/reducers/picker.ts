// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { readerLocalActionPicker } from "../actions";
import { IPickerState } from "readium-desktop/common/redux/states/renderer/picker";

function pickerReducer_(
    state: IPickerState = {open: false, type: "search"},
    action: readerLocalActionPicker.manager.TAction,
): IPickerState {

    switch (action.type) {
        case readerLocalActionPicker.manager.ID:

            return {
                ...state,
                ...action.payload,
            };
        default:
            return state;
    }
}

export const pickerReducer = pickerReducer_ as Reducer<ReturnType<typeof pickerReducer_>>;
