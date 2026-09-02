// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { ActionWithReaderPublicationIdentifierDestination } from "readium-desktop/common/models/sync";
import type { PublicationNote, PublicationNoteDraft } from "readium-desktop/common/publication-notes";
import { uuidv4 } from "readium-desktop/utils/uuid";

export const ID = "READER_PUBLICATION_NOTES_COMMAND_SAVE";

export interface IPayload {
    publicationIdentifier: string;
    previousNote?: PublicationNote | undefined;
    newNote: PublicationNote;
}

export function build(publicationIdentifier: string, newNote: PublicationNoteDraft, previousNote?: PublicationNote):
    ActionWithReaderPublicationIdentifierDestination<typeof ID, IPayload> {

    const note: PublicationNote = {
        ...newNote,
        uuid: previousNote?.uuid || newNote.uuid || uuidv4(),
    };

    return {
        type: ID,
        payload: {
            publicationIdentifier,
            previousNote,
            newNote: note,
        },
        destination: {
            publicationIdentifier,
        },
    };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
