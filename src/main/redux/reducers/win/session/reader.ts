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

import { readerActions } from "readium-desktop/common/redux/actions";
import { SenderType, WithSender } from "readium-desktop/common/models/sync";

const initialState: IDictWinSessionReaderState = {};

function winSessionReaderReducer_(
    state: IDictWinSessionReaderState = initialState,
    action: winActions.session.registerReader.TAction |
        winActions.session.unregisterReader.TAction |
        winActions.session.setBound.TAction | readerActions.setLocator.TAction |
        readerActions.setOpdsProgressionState.TAction | readerActions.setOpdsProgression.TAction | readerActions.clearOpdsProgression.TAction | readerActions.setTheLock.TAction,
): IDictWinSessionReaderState {
    switch (action.type) {
        case readerActions.setTheLock.ID: {
            const id = action.destination.identifier;
            if (!state[id]) { return state; }
            return { ...state, [id]: { ...state[id], reduxState: { ...state[id].reduxState, lock: true } } };
        }
        case readerActions.clearOpdsProgression.ID: {
            const sender = (action as typeof action & Partial<WithSender>).sender;
            const id = sender?.identifier;
            if (sender?.type !== SenderType.Renderer || !id || !state[id] || sender.reader_pubId !== state[id].publicationIdentifier) { return state; }
            return { ...state, [id]: { ...state[id], reduxState: { ...state[id].reduxState, opdsProgression: { ...state[id].reduxState.opdsProgression, document: undefined } } } };
        }
        case readerActions.setLocator.ID: {
            const sender = (action as typeof action & Partial<WithSender>).sender;
            const id = sender?.identifier;
            if (sender?.type !== SenderType.Renderer || !id || !state[id] || sender.reader_pubId !== state[id].publicationIdentifier) { return state; }
            return { ...state, [id]: { ...state[id], reduxState: { ...state[id].reduxState, locator: action.payload } } };
        }
        case readerActions.setOpdsProgressionState.ID:
        case readerActions.setOpdsProgression.ID: {
            const id = action.destination.identifier;
            if (!state[id]) { return state; }
            const opdsProgression = action.type === readerActions.setOpdsProgressionState.ID ? action.payload.state :
                { ...state[id].reduxState.opdsProgression, document: action.payload.document };
            return { ...state, [id]: { ...state[id], reduxState: { ...state[id].reduxState, opdsProgression } } };
        }


        case winActions.session.registerReader.ID: {

            const id = action.payload.windowIdentifier;
            return {
                ...state,
                ...{
                    [id]: {
                        ...{
                            windowBound: {...action.payload.winBound},
                            windowMaximized: action.payload.windowMaximized,
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
                                ...(action.payload.windowMaximized === undefined ? {} : {
                                    windowMaximized: action.payload.windowMaximized,
                                }),
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
