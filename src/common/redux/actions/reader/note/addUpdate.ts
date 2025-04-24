// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { v4 as uuidv4 } from "uuid";
import { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import { ActionWithReaderPublicationIdentifierDestination } from "readium-desktop/common/models/sync";

export const ID = "READER_NOTE_ADD_UPDATE";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IPayload {
    previousNote?: INoteState | undefined;
    newNote: INoteState;
}

export function build(publicationIdentifier: string, newNote: Omit<INoteState, "uuid"> & Partial<Pick<INoteState, "uuid">>, previousNote: INoteState = undefined):
    ActionWithReaderPublicationIdentifierDestination<typeof ID, IPayload> {

    if (!previousNote) {
        if (!newNote.uuid) {
            newNote.uuid = uuidv4();
        }
    }

    return {
        type: ID,
        payload: {
            previousNote,
            newNote: newNote as INoteState,
        },
        destination: {
            publicationIdentifier,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;

