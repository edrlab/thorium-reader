import { Action } from "redux";

export const STREAMER_START = "STREAMER_START";
export const STREAMER_STOP = "STREAMER_STOP";

export interface StreamerAction extends Action {
    streamerUrl?: string;
}

export function start(streamerUrl: string): StreamerAction {
    return {
        type: STREAMER_START,
        streamerUrl,
    };
}

export function stop() {
    return {
        type: STREAMER_STOP,
    };
}
