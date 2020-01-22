// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { defaultRectangle } from "readium-desktop/common/rectangle/window";
import { winActions } from "readium-desktop/main/redux/actions";
import {
    IArrayWinRegistryReaderState,
} from "readium-desktop/main/redux/states/win/registry/reader";

const initialState: IArrayWinRegistryReaderState = [];

export function winRegistryReaderReducer(
    state: IArrayWinRegistryReaderState = initialState,
    action: winActions.registry.registerReader.TAction |
    winActions.registry.unregisterReader.TAction |
    winActions.registry.setBound.TAction,
): IArrayWinRegistryReaderState {
    switch (action.type) {

        case winActions.registry.registerReader.ID:
            return {
                ...state,
                ...{
                    [action.payload.identifier]: {
                        browserWindowId: action.payload.win.id,
                        windowBound: defaultRectangle(),
                        publicationIdentifier: action.payload.publicationIdentifier,
                        identifier: action.payload.identifier,
                    },
                },
            };

        case winActions.registry.unregisterReader.ID:
            return {
                ...state,
                ...{
                    [action.payload.identifier]: undefined,
                },
            };

        case winActions.registry.setBound.ID:
            return {
                ...state,
                ...{
                    [action.payload.identifier]: {
                        ...state[action.payload.identifier],
                        ...{
                            windowBound: action.payload.bound,
                        },
                    },
                },
            };

        default:
            return state;
    }
}
