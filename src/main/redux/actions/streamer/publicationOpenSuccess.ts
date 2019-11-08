// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { PublicationDocument } from "readium-desktop/main/db/document/publication";

export const ID = "STREAMER_PUBLICATION_OPEN_SUCCESS";

export interface Payload {
    publicationDocument: PublicationDocument;
    manifestUrl: string;
}
export function build(publicationDocument: PublicationDocument, manifestUrl: string):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            publicationDocument,
            manifestUrl,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
