import {
    OPDS_SET,
} from "readium-desktop/actions/opds";
import {
    OpdsAction,
} from "readium-desktop/actions/opds";
import { OPDS } from "readium-desktop/models/opds";

export interface OpdsState {
    opds: OPDS[];
}

const initialState: OpdsState = {
    opds: undefined,
};

export function opdsReducer(
    state: OpdsState = initialState,
    action: OpdsAction,
    ): OpdsState {
    switch (action.type) {
        case OPDS_SET:
            state.opds = (action as OpdsAction).opdsList;
            return state;
        default:
            return state;
    }
}
