import { StreamerStatus } from "readium-desktop/models/streamer";

import { StreamerAction } from "readium-desktop/main/actions/streamer";
import { STREAMER_START, STREAMER_STOP } from "readium-desktop/main/actions/streamer";

export interface StreamerState {
    // Base url of started server
    baseUrl: string;

    status: StreamerStatus;
}

const initialState: StreamerState = {
    baseUrl: undefined,
    status: StreamerStatus.Stopped,
};

export function streamerReducer(
    state: StreamerState = initialState,
    action: StreamerAction,
    ): StreamerState {
    switch (action.type) {
        case STREAMER_START:
            state.status = StreamerStatus.Running;
            state.baseUrl = action.streamerUrl;
            return state;
        case STREAMER_STOP:
            state.status = StreamerStatus.Stopped;
            return state;
        default:
            return state;
    }
}
