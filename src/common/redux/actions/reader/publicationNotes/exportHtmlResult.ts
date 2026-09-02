// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { ActionWithReaderPublicationIdentifierDestination } from "readium-desktop/common/models/sync";

export const ID = "READER_PUBLICATION_NOTES_EXPORT_HTML_RESULT";

export interface IPayload {
    publicationIdentifier: string;
    html: string;
    title?: string | undefined;
    windowIdentifier?: string | undefined;
}

export function build(
    publicationIdentifier: string,
    html: string,
    title: string | undefined,
    windowIdentifier?: string | undefined,
): ActionWithReaderPublicationIdentifierDestination<typeof ID, IPayload> {

    return {
        type: ID,
        payload: {
            publicationIdentifier,
            html,
            title,
            windowIdentifier,
        },
        destination: {
            publicationIdentifier,
        },
    };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
