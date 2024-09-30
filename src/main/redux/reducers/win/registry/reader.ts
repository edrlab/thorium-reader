// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { winActions } from "readium-desktop/main/redux/actions";
import { IDictWinRegistryReaderState } from "readium-desktop/main/redux/states/win/registry/reader";
import { IQueueAnnotationState } from "readium-desktop/common/redux/states/renderer/annotation";

const initialState: IDictWinRegistryReaderState = {};

function winRegistryReaderReducer_(
    state: IDictWinRegistryReaderState = initialState,
    action: winActions.registry.registerReaderPublication.TAction
    | winActions.registry.unregisterReaderPublication.TAction
    | winActions.registry.addAnnotationToReaderPublication.TAction,
): IDictWinRegistryReaderState {
    switch (action.type) {

        case winActions.registry.registerReaderPublication.ID: {
            return {
                ...state,
                ...{
                    [action.payload.publicationIdentifier]: {
                        ...state[action.payload.publicationIdentifier],
                        ...{
                            windowBound: action.payload.bound,
                            reduxState: action.payload.reduxStateReader,
                        },
                    },
                },
            };
        }

        case winActions.registry.unregisterReaderPublication.ID: {

            const id = action.payload.publicationIdentifier;

            if (state[id]) {
                const ret = {
                    ...state,
                };
                delete ret[id];
                return ret;
            }
            return state;
        }

        case winActions.registry.addAnnotationToReaderPublication.ID: {

            const { publicationIdentifier: id, annotations } = action.payload;

            if (annotations.length && Array.isArray(state[id]?.reduxState?.annotation)) {
                return {
                    ...state,
                    ...{
                        [id]: {
                            ...state[id],
                            ...{
                                reduxState: {
                                    ...state[id].reduxState,
                                    ...{
                                        annotation: [
                                            ...annotations.map<IQueueAnnotationState>((anno) =>
                                                // TODO: allow to import the annotatiton with the original created date
                                                [anno.created || (new Date()).getTime(), anno]),
                                            ...state[id].reduxState.annotation,
                                        ],
                                    },
                                },
                            },
                        },
                    },
                };

            }
            return state;
        }

        default:
            return state;
    }
}

export const winRegistryReaderReducer = winRegistryReaderReducer_ as Reducer<ReturnType<typeof winRegistryReaderReducer_>>;
