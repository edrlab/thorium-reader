// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { StreamerStatus } from "readium-desktop/common/models/streamer";
import { streamerActions } from "readium-desktop/main/redux/actions";
import { StreamerState } from "readium-desktop/main/redux/states/streamer";

import {
    ActionPayloadStreamer, ActionPayloadStreamerPublicationCloseSuccess,
    ActionPayloadStreamerPublicationOpenSuccess, ActionPayloadStreamerStartSuccess,
} from "../actions/streamer";

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

export function streamerReducer(
    state: StreamerState = initialState,
    action: Action<string, ActionPayloadStreamer> |
        Action<string, ActionPayloadStreamerStartSuccess> |
        Action<string, ActionPayloadStreamerPublicationOpenSuccess> |
        Action<string, ActionPayloadStreamerPublicationCloseSuccess>,
): StreamerState {
    let pubId = null;
    const newState = Object.assign({}, state);

    switch (action.type) {
        case streamerActions.ActionType.StartSuccess:
            const act1 = action as Action<string, ActionPayloadStreamerStartSuccess>;
            newState.status = StreamerStatus.Running;
            newState.baseUrl = act1.payload.streamerUrl;
            newState.openPublicationCounter = {};
            newState.publicationManifestUrl = {};
            return newState;
        case streamerActions.ActionType.StopSuccess:
            newState.baseUrl = null;
            newState.status = StreamerStatus.Stopped;
            newState.openPublicationCounter = {};
            newState.publicationManifestUrl = {};
            return newState;
        case streamerActions.ActionType.PublicationOpenSuccess:
            const act2 = action as Action<string, ActionPayloadStreamerPublicationOpenSuccess>;
            pubId = act2.payload.publicationDocument.identifier;

            if (!newState.openPublicationCounter.hasOwnProperty(pubId)) {
                newState.openPublicationCounter[pubId] = 1;
                newState.publicationManifestUrl[pubId] = act2.payload.manifestUrl;
            } else {
                // Increment the number of pubs opened with the streamer
                newState.openPublicationCounter[pubId] = state.openPublicationCounter[pubId] + 1;
            }
            return newState;
        case streamerActions.ActionType.PublicationCloseSuccess:
            const act3 = action as Action<string, ActionPayloadStreamerPublicationCloseSuccess>;
            pubId = act3.payload.publicationDocument.identifier;
            newState.openPublicationCounter[pubId] = newState.openPublicationCounter[pubId] - 1;

            if (newState.openPublicationCounter[pubId] === 0) {
                delete newState.openPublicationCounter[pubId];
                delete newState.publicationManifestUrl[pubId];
            }
            return newState;
        default:
            return state;
    }
}
