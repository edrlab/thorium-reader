import { Action } from "redux";

import { Publication } from "readium-desktop/models/publication";

// Reader action types
export const READER_INIT = "READER_INIT";
export const READER_OPEN = "READER_OPEN";
export const READER_CLOSE = "READER_CLOSE";

export interface ReaderAction extends Action {
    publication?: Publication;
    manifestUrl?: string;
}

export function init(publication: Publication): ReaderAction {
    return {
        type: READER_INIT,
        publication,
    };
}

export function open(publication: Publication, manifestUrl: string): ReaderAction {
    return {
        type: READER_OPEN,
        publication,
        manifestUrl,
    };
}

export function close(publication: Publication, manifestUrl: string): ReaderAction {
    return {
        type: READER_CLOSE,
        publication,
        manifestUrl,
    };
}
