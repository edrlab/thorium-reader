// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { ActionWithReaderPublicationIdentifierDestination } from "readium-desktop/common/models/sync";
import type { PublicationNotesViewFilter } from "readium-desktop/common/publication-notes";

export const ID = "READER_PUBLICATION_NOTES_EXPORT";

export type TPublicationNotesExportFileType = "annotation" | "html";

export interface IPayload {
    publicationIdentifier: string;
    filter: PublicationNotesViewFilter;
    title?: string | undefined;
    fileType: TPublicationNotesExportFileType;
}

export function build(
    publicationIdentifier: string,
    filter: PublicationNotesViewFilter,
    title: string | undefined,
    fileType: TPublicationNotesExportFileType,
): ActionWithReaderPublicationIdentifierDestination<typeof ID, IPayload> {

    return {
        type: ID,
        payload: {
            publicationIdentifier,
            filter,
            title,
            fileType,
        },
        destination: {
            publicationIdentifier,
        },
    };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
