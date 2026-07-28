// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type {
    PublicationNoteEntity,
    PublicationNotesSnapshot,
    PublicationNotesViewState,
} from "./model";

export function serializePublicationNotesViewState<TNote extends PublicationNoteEntity>(
    snapshot: PublicationNotesSnapshot<TNote>,
): PublicationNotesViewState<TNote> {

    const byId: Record<string, TNote> = {};
    const ids: string[] = [];
    const tagIndex: Record<string, number> = {};

    for (const note of snapshot.notes) {
        byId[note.uuid] = note;
        ids.push(note.uuid);

        for (const tag of note.tags || []) {
            if (!tag) {
                continue;
            }
            tagIndex[tag] = (tagIndex[tag] || 0) + 1;
        }
    }

    return {
        ...snapshot,
        byId,
        ids,
        tagIndex,
        totalCount: snapshot.notes.length,
    };
}
