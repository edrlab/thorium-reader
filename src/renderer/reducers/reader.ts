import {
    READER_CLOSE,
    READER_INIT,
    READER_OPEN,
    ReaderAction,
} from "readium-desktop/renderer/actions/reader";

import { Publication } from "readium-desktop/models/publication";

export enum ReaderStatus {
    Closed,
    Open,
}

export interface ReaderState {
    status: ReaderStatus;
    publication?: Publication;
    manifestUrl?: string;
}

const initialState: ReaderState = {
    status: ReaderStatus.Closed,
    publication: undefined,
    manifestUrl: undefined,
};

export function readerReducer(
    state: ReaderState = initialState,
    action: ReaderAction,
    ): ReaderState {
    switch (action.type) {
        case READER_INIT:
            state.publication = action.publication;
            return state;
        case READER_OPEN:
            state.status = ReaderStatus.Open;
            state.publication = action.publication;
            state.manifestUrl = action.manifestUrl;
            return state;
        case READER_CLOSE:
            state.status = ReaderStatus.Closed;
            state.publication = state.manifestUrl = undefined;
            return state;
        default:
            return state;
    }
}
