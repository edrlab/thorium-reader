import * as uuid from "uuid";

import { ReaderAction } from "readium-desktop/main/actions/reader";
import {
    READER_CLOSE,
    READER_INIT,
    READER_OPEN,
} from "readium-desktop/main/actions/reader";

import {
    Reader,
} from "readium-desktop/models/reader";

export interface ReaderState {
    // Base url of started server
    readers: { [identifier: string]: Reader };
}

const initialState: ReaderState = {
    readers: {},
};

export function readerReducer(
    state: ReaderState = initialState,
    action: ReaderAction,
    ): ReaderState {
    switch (action.type) {
        case READER_INIT:
            let winId = uuid.v4();
            return state;
        case READER_OPEN:
            state.readers[action.reader.identifier] = action.reader;
            return state;
        case READER_CLOSE:
            delete state.readers[action.reader.identifier];
            return state;
        default:
            return state;
    }
}
