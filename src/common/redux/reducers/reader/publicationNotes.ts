// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { serializePublicationNotesViewState } from "readium-desktop/common/publication-notes";
import { readerActions } from "readium-desktop/common/redux/actions";
import {
    IPublicationNotesViewState,
    publicationNotesViewInitialState,
} from "readium-desktop/common/redux/states/renderer/publicationNotes";
import type { UnknownAction } from "redux";

export function readerPublicationNotesViewReducer(
    state: IPublicationNotesViewState = publicationNotesViewInitialState,
    action: UnknownAction,
): IPublicationNotesViewState {

    if (action.type === readerActions.publicationNotes.snapshot.ID) {
        const typedAction = action as readerActions.publicationNotes.snapshot.TAction;
        if (state.publicationIdentifier && state.publicationIdentifier !== typedAction.destination.publicationIdentifier) {
            return state;
        }

        return typedAction.payload.viewState;
    }

    if (action.type === readerActions.publicationNotes.commands.save.ID) {
        const typedAction = action as readerActions.publicationNotes.commands.save.TAction;
        const { previousNote, newNote } = typedAction.payload;
        if (state.publicationIdentifier && state.publicationIdentifier !== typedAction.payload.publicationIdentifier) {
            return state;
        }
        let notes = state.notes;

        if (previousNote) {
            if (!state.notes.find((note) => note.uuid === previousNote.uuid)) {
                return state;
            }
            notes = state.notes.map((note) => note.uuid === previousNote.uuid ? newNote : note);
        } else {
            notes = [...state.notes.filter((note) => note.uuid !== newNote.uuid), newNote];
        }

        return serializePublicationNotesViewState({
            publicationIdentifier: typedAction.payload.publicationIdentifier,
            notes,
            revision: state.revision + 1,
        });
    }

    if (action.type === readerActions.publicationNotes.commands.remove.ID) {
        const typedAction = action as readerActions.publicationNotes.commands.remove.TAction;
        if (state.publicationIdentifier && state.publicationIdentifier !== typedAction.payload.publicationIdentifier) {
            return state;
        }
        if (!state.notes.find((note) => note.uuid === typedAction.payload.note.uuid)) {
            return state;
        }

        const notes = state.notes.filter((note) => note.uuid !== typedAction.payload.note.uuid);

        return serializePublicationNotesViewState({
            publicationIdentifier: typedAction.payload.publicationIdentifier,
            notes,
            revision: state.revision + 1,
        });
    }

    return state;
}
