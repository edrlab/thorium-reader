import { StreamerStatus } from "readium-desktop/models/streamer";

import { StreamerAction } from "readium-desktop/main/actions/streamer";
import {
    STREAMER_PUBLICATION_CLOSE,
    STREAMER_PUBLICATION_MANIFEST_OPEN,
    STREAMER_PUBLICATION_OPEN,
    STREAMER_START,
    STREAMER_STOP,
} from "readium-desktop/main/actions/streamer";

export interface StreamerState {
    // Base url of started server
    baseUrl: string;

    status: StreamerStatus;

    openPublicationCounter: { [identifier: string]: number };

    publicationManifestUrl: { [identifier: string]: string };
}

const initialState: StreamerState = {
    // Streamer base url
    baseUrl: undefined,

    // Streamer status
    status: StreamerStatus.Stopped,

    // publication id => number of reader opened with this publication
    openPublicationCounter: {},

    // publication id => manifest url
    publicationManifestUrl: {},
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
            state.publicationManifestUrl = {};
            return state;
        case STREAMER_STOP:
            state.baseUrl = undefined;
            state.status = StreamerStatus.Stopped;
            state.openPublicationCounter = {};
            state.publicationManifestUrl = {};
            return state;
        case STREAMER_PUBLICATION_OPEN:
            return state;
        case STREAMER_PUBLICATION_MANIFEST_OPEN:
            pubId = action.publication.identifier;
            if (state.openPublicationCounter[pubId] === undefined) {
                state.openPublicationCounter[pubId] = 1;
                state.publicationManifestUrl[pubId] = action.manifestUrl;
            } else {
                state.openPublicationCounter[pubId] = state.openPublicationCounter[pubId] + 1;
            }
            return state;
        case STREAMER_PUBLICATION_CLOSE:
            pubId = action.publication.identifier;
            state.openPublicationCounter[pubId] = state.openPublicationCounter[pubId] - 1;

            if (state.openPublicationCounter[pubId] === 0) {
                delete state.openPublicationCounter[pubId];
                delete state.publicationManifestUrl[pubId];
            }
            return state;
        default:
            return state;
    }
}
