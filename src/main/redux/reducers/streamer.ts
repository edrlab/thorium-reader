// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { type Reducer } from "redux";

import { StreamerStatus } from "readium-desktop/common/models/streamer";
import { streamerActions } from "readium-desktop/main/redux/actions";
import { StreamerState } from "readium-desktop/main/redux/states/streamer";

const initialState: StreamerState = {
    // Streamer base url
    baseUrl: null,

    // Streamer status
    status: StreamerStatus.Stopped,

    // publication id => number of reader opened with this publication
    openPublicationCounter: {},

    // publication id => manifest url
    publicationManifestUrl: {},
};

function streamerReducer_(
    state: StreamerState = initialState,
    action: streamerActions.startSuccess.TAction |
        streamerActions.publicationOpenSuccess.TAction |
        streamerActions.publicationCloseSuccess.TAction |
        streamerActions.stopSuccess.TAction,
): StreamerState {

    switch (action.type) {
        case streamerActions.startSuccess.ID:
            return {
                ...{
                    status: StreamerStatus.Running,
                    baseUrl: action.payload.streamerUrl,
                    openPublicationCounter: {},
                    publicationManifestUrl: {},
                },
            };

        case streamerActions.stopSuccess.ID:
            return {
                ...{
                    status: StreamerStatus.Stopped,
                    baseUrl: undefined,
                    openPublicationCounter: {},
                    publicationManifestUrl: {},
                },
            };

        case streamerActions.publicationOpenSuccess.ID: {
            const pubId = action.payload.publicationIdentifier;

            return {
                ...state,
                ...{
                    openPublicationCounter: {
                        ...state.openPublicationCounter,
                        ...{
                            [pubId]: state.openPublicationCounter[pubId] + 1 || 1,
                        },
                    },
                    publicationManifestUrl: {
                        ...state.publicationManifestUrl,
                        ...{
                            [pubId]: action.payload.manifestUrl,
                        },
                    },
                },
            };
        }

        case streamerActions.publicationCloseSuccess.ID: {
            const pubId = action.payload.publicationIdentifier;

            const ret = {
                ...state,
                ...{
                    openPublicationCounter: {
                        ...state.openPublicationCounter,
                        ...{
                            [pubId]: state.openPublicationCounter[pubId] - 1 < 1
                                ? undefined
                                : state.openPublicationCounter[pubId] - 1,
                        },
                    },
                    publicationManifestUrl: {
                        ...state.publicationManifestUrl,
                        ...{
                            [pubId]: state.openPublicationCounter[pubId] - 1 < 1
                                ? undefined
                                : state.publicationManifestUrl[pubId],
                        },
                    },
                },
            };

            if (!ret.openPublicationCounter[pubId]) {
                delete ret.openPublicationCounter[pubId];
                delete ret.publicationManifestUrl[pubId];
            }

            return ret;
        }
        default:
            return state;
    }
}

export const streamerReducer = streamerReducer_ as Reducer<ReturnType<typeof streamerReducer_>>;
