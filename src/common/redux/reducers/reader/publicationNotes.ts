// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { readerActions } from "readium-desktop/common/redux/actions";
import {
    IPublicationNotesSnapshotState,
    publicationNotesSnapshotInitialState,
} from "readium-desktop/common/redux/states/renderer/publicationNotes";
import type { UnknownAction } from "redux";

export function readerPublicationNotesSnapshotReducer(
    state: IPublicationNotesSnapshotState = publicationNotesSnapshotInitialState,
    action: UnknownAction,
): IPublicationNotesSnapshotState {

    if (action.type === readerActions.publicationNotes.snapshot.ID) {
        const typedAction = action as readerActions.publicationNotes.snapshot.TAction;
        if (state.publicationIdentifier && state.publicationIdentifier !== typedAction.destination.publicationIdentifier) {
            return state;
        }

        return typedAction.payload.snapshot;
    }

    return state;
}
