import { StreamerStatus } from "readium-desktop/models/streamer";

import { StreamerAction } from "readium-desktop/main/actions/streamer";
import {
    STREAMER_PUBLICATION_CLOSE,
    STREAMER_PUBLICATION_OPEN,
    STREAMER_START,
    STREAMER_STOP,
} from "readium-desktop/main/actions/streamer";

export interface StreamerState {
    // Base url of started server
    baseUrl: string;

    status: StreamerStatus;

    openPublicationCounter: { [identifier: string]: number };
}

const initialState: StreamerState = {
    baseUrl: undefined,
    status: StreamerStatus.Stopped,
    openPublicationCounter: {},
};

export function streamerReducer(
    state: StreamerState = initialState,
    action: StreamerAction,
    ): StreamerState {
    let pubId = undefined;

    switch (action.type) {
        case STREAMER_START:
            state.status = StreamerStatus.Running;
            state.baseUrl = action.streamerUrl;
            state.openPublicationCounter = {};
            return state;
        case STREAMER_STOP:
            state.status = StreamerStatus.Stopped;
            state.openPublicationCounter = {};
            return state;
        case STREAMER_PUBLICATION_OPEN:
            pubId = action.publication.identifier;
            if (state.openPublicationCounter[pubId] === undefined) {
                state.openPublicationCounter[pubId] = 1;
            } else {
                state.openPublicationCounter[pubId] = state.openPublicationCounter[pubId] + 1;
            }
            return state;
        case STREAMER_PUBLICATION_CLOSE:
            pubId = action.publication.identifier;
            state.openPublicationCounter[pubId] = state.openPublicationCounter[pubId] - 1;

            if (state.openPublicationCounter[pubId] === 0) {
                delete state.openPublicationCounter[pubId];
            }
            return state;
        default:
            return state;
    }
}
