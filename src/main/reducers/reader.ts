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
            // action.publication SHOULD NOT BE NIL
            // action.reader SHOULD BE NIL
            // let winId = uuid.v4();
            console.log("readerReducer INIT (MAIN)");
            return state;
        case READER_OPEN:
            // action.publication SHOULD BE NIL
            // action.reader SHOULD NOT BE NIL
            // action.reader.publication SHOULD NOT BE NIL
            console.log("readerReducer OPEN (MAIN)");
            state.readers[action.reader.identifier] = action.reader;
            return state;
        case READER_CLOSE:
            // action.publication SHOULD BE NIL
            // action.reader SHOULD NOT BE NIL
            // action.reader.publication SHOULD NOT BE NIL
            console.log("readerReducer CLOSE (MAIN)");
            delete state.readers[action.reader.identifier];
            return state;
        default:
            return state;
    }
}
