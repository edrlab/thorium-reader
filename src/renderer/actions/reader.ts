// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "redux";

import { Publication } from "readium-desktop/common/models/publication";

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

// export function open(publication: Publication, manifestUrl: string): ReaderAction {
//     return {
//         type: READER_OPEN,
//         publication,
//         manifestUrl,
//     };
// }

// export function close(publication: Publication, manifestUrl: string): ReaderAction {
//     return {
//         type: READER_CLOSE,
//         publication,
//         manifestUrl,
//     };
// }
