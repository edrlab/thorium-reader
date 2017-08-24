import { Action } from "redux";

import { OPDS } from "readium-desktop/models/opds";

// Catalog action types
export const OPDS_INIT = "OPDS_INIT";
export const OPDS_SET = "OPDS_SET";
export const OPDS_ADD = "OPDS_ADD";
export const OPDS_REMOVE = "OPDS_REMOVE";
export const OPDS_UPDATE = "OPDS_UPDATE";

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

export function update(opds: OPDS): OpdsAction {
    return {
        type: OPDS_UPDATE,
        opds,
    };
}

export function remove(opds: OPDS): OpdsAction {
    return {
        type: OPDS_REMOVE,
        opds,
    };
}
