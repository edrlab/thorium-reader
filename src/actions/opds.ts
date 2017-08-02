import { Action } from "redux";

import { OPDS } from "readium-desktop/models/opds";

// Catalog action types
export const OPDS_INIT = "OPDS_INIT";
export const OPDS_SET = "OPDS_SET";
export const OPDS_ADD = "OPDS_ADD";

// Load from DB
export const OPDS_LOAD = "OPDS_LOAD";

export interface OpdsAction extends Action {
    opdsList?: OPDS[];
    opds?: OPDS;
}

export function init(): OpdsAction {
    return {
        type: OPDS_INIT,
    };
}

export function set(opdsList: OPDS[]): OpdsAction {
    return {
        type: OPDS_SET,
        opdsList,
    };
}

export function add(opds: OPDS): OpdsAction {
    return {
        type: OPDS_ADD,
        opds,
    };
}

export function load(): OpdsAction {
    return {
        type: OPDS_LOAD,
    };
}
