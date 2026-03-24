// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { winActions } from "readium-desktop/main/redux/actions";
import {
    IDictWinSessionReaderState,
} from "readium-desktop/main/redux/states/win/session/reader";

const initialState: IDictWinSessionReaderState = {};

function winSessionReaderReducer_(
    state: IDictWinSessionReaderState = initialState,
    action: winActions.session.registerReader.TAction |
        winActions.session.unregisterReader.TAction |
        winActions.session.setBound.TAction,
): IDictWinSessionReaderState {
    switch (action.type) {

        case winActions.session.registerReader.ID: {

            const id = action.payload.windowIdentifier;
            return {
                ...state,
                ...{
                    [id]: {
                        ...{
                            windowBound: {...action.payload.winBound},
                            reduxState: action.payload.reduxStateReader,
                        },
                        ...state[id],
                        ...{
                            browserWindowId: action.payload.readerWindow.id,
                            publicationIdentifier: action.payload.publicationIdentifier,
                            manifestUrl: action.payload.manifestUrl,
                            fileSystemPath: action.payload.filesystemPath,
                            identifier: id,
                        },
                    },
                },
            };
        }

        case winActions.session.unregisterReader.ID: {

            const id = action.payload.windowIdentifier;

            if (state[id]) {
                const ret = {
                    ...state,
                };
                delete ret[id];
                return ret;
            }
            break;
        }

        case winActions.session.setBound.ID: {

            const id = action.payload.windowIdentifier;

            if (state[id]) {
                return {
                    ...state,
                    ...{
                        [id]: {
                            ...state[id],
                            ...{
                                windowBound: {...action.payload.winBound},
                            },
                        },
                    },
                };
            }
            break;
        }
    }

    return state;
}

export const winSessionReaderReducer = winSessionReaderReducer_ as Reducer<ReturnType<typeof winSessionReaderReducer_>>;
