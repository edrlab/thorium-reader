// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { winActions } from "readium-desktop/main/redux/actions";
import {
    IDictWinSessionReaderState,
} from "readium-desktop/main/redux/states/win/session/reader";

const initialState: IDictWinSessionReaderState = {};

export function winSessionReaderReducer(
    state: IDictWinSessionReaderState = initialState,
    action: winActions.session.registerReader.TAction |
    winActions.session.unregisterReader.TAction |
    winActions.session.setBound.TAction |
    winActions.session.setReduxState.TAction,
): IDictWinSessionReaderState {
    switch (action.type) {

        case winActions.session.registerReader.ID:
            return {
                ...state,
                ...{
                    [action.payload.identifier]: {
                        ...{
                            windowBound: action.payload.winBound,
                        },
                        ...state[action.payload.identifier],
                        ...{
                            browserWindowId: action.payload.win.id,
                            publicationIdentifier: action.payload.publicationIdentifier,
                            manifestUrl: action.payload.manifestUrl,
                            fileSystemPath: action.payload.fileSystemPath,
                            identifier: action.payload.identifier,
                        },
                    },
                },
            };

        case winActions.session.unregisterReader.ID:

            let id;
            for (const key in state) {
                if (state[key]) {
                    if (state[key].publicationIdentifier === action.payload.publicationIdentifier) {
                        id = key;
                    }
                }
            }

            if (id) {
                return {
                    ...state,
                    ...{
                        [id]: undefined,
                    },
                };
            }
            break;

        case winActions.session.setBound.ID:

            if (state[action.payload.identifier]) {
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
            }
            break;

        case winActions.session.setReduxState.ID:

            if (state[action.payload.identifier]) {
                return {
                    ...state,
                    ...{
                        [action.payload.identifier]: {
                            ...state[action.payload.identifier],
                            ...{
                                reduxState: action.payload.reduxState,
                            },
                        },
                    },
                };
            }
    }

    return state;
}
