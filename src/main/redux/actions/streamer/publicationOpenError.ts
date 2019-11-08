// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";

export const ID = "STREAMER_PUBLICATION_OPEN_ERROR";

export interface Meta {
    publicationDocument: PublicationDocument;
}

export function build(error: any, publicationDocument: PublicationDocument | undefined):
    Action<typeof ID, any, Meta> {

    return {
        type: ID,
        payload: error,
        error: true,
        meta: {
            publicationDocument,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
