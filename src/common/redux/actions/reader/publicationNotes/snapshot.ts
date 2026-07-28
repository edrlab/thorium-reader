// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { Action } from "readium-desktop/common/models/redux";
import type { WithDestination, WindowReaderPublicationDestination } from "readium-desktop/common/models/sync";
import type { IPublicationNotesViewState } from "readium-desktop/common/redux/states/renderer/publicationNotes";

export const ID = "READER_PUBLICATION_NOTES_SNAPSHOT";

export interface IPayload {
    viewState: IPublicationNotesViewState;
}

export type TPublicationNotesSnapshotDestination =
    WindowReaderPublicationDestination &
    Partial<{ identifier: string }>;

export type TPublicationNotesSnapshotAction =
    Action<typeof ID, IPayload> &
    WithDestination<TPublicationNotesSnapshotDestination>;

export function build(publicationIdentifier: string, viewState: IPublicationNotesViewState, windowIdentifier?: string):
    TPublicationNotesSnapshotAction {

    return {
        type: ID,
        payload: {
            viewState: {
                ...viewState,
                publicationIdentifier,
            },
        },
        destination: {
            publicationIdentifier,
            identifier: windowIdentifier,
        },
    };
}
build.toString = () => ID;
export type TAction = ReturnType<typeof build>;
