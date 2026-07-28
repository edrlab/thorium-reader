// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";
import type { PublicationNote, PublicationNoteRepository } from "readium-desktop/common/publication-notes";
import {
    sqliteTableNoteDelete,
    sqliteTableNoteDeleteWherePubId,
    sqliteTableNoteInsert,
    sqliteTableNoteInsertOrReplace,
    sqliteTableNoteUpdate,
    sqliteTableSelectAllNotesWherePubId,
    sqliteTableSelectNoteWherePubIdAndNoteId,
} from "readium-desktop/main/db/sqlite/note";

const debug = debug_("readium-desktop:main:publication-notes:sqlite-repository");

export class SqlitePublicationNoteRepository implements PublicationNoteRepository<PublicationNote> {

    public async list(publicationIdentifier: string): Promise<PublicationNote[]> {
        return sqliteTableSelectAllNotesWherePubId(publicationIdentifier);
    }

    public async get(publicationIdentifier: string, noteIdentifier: string): Promise<PublicationNote | undefined> {
        return sqliteTableSelectNoteWherePubIdAndNoteId(publicationIdentifier, noteIdentifier);
    }

    public async create(publicationIdentifier: string, note: PublicationNote): Promise<void> {
        this.ensureOk(
            sqliteTableNoteInsert(publicationIdentifier, [note]),
            `Cannot create note ${note.uuid} for publication ${publicationIdentifier}`,
        );
    }

    public async replace(publicationIdentifier: string, note: PublicationNote): Promise<void> {
        this.ensureOk(
            sqliteTableNoteInsertOrReplace(publicationIdentifier, [note]),
            `Cannot replace note ${note.uuid} for publication ${publicationIdentifier}`,
        );
    }

    public async update(publicationIdentifier: string, note: PublicationNote): Promise<void> {
        debug("Update note %s for publication %s", note.uuid, publicationIdentifier);
        this.ensureOk(
            sqliteTableNoteUpdate(publicationIdentifier, note),
            `Cannot update note ${note.uuid} for publication ${publicationIdentifier}`,
        );
    }

    public async delete(publicationIdentifier: string, noteIdentifier: string): Promise<void> {
        this.ensureOk(
            sqliteTableNoteDelete(publicationIdentifier, noteIdentifier),
            `Cannot delete note ${noteIdentifier} for publication ${publicationIdentifier}`,
        );
    }

    public async deleteByPublication(publicationIdentifier: string): Promise<void> {
        this.ensureOk(
            sqliteTableNoteDeleteWherePubId(publicationIdentifier),
            `Cannot delete notes for publication ${publicationIdentifier}`,
        );
    }

    private ensureOk(ok: boolean, message: string): void {
        if (!ok) {
            throw new Error(message);
        }
    }
}
