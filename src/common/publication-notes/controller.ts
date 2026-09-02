// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type {
    PublicationNoteChange,
    PublicationNoteDeleteChange,
    PublicationNoteEntity,
    PublicationNotesSnapshot,
    PublicationNotesViewState,
} from "./model";
import type {
    PublicationNoteRepository,
    PublicationNotesClock,
    PublicationNotesIdProvider,
    PublicationNotesLogger,
} from "./ports";
import { serializePublicationNotesViewState } from "./view";

export interface PublicationNotesControllerDependencies<TNote extends PublicationNoteEntity> {
    repository: PublicationNoteRepository<TNote>;
    clock?: PublicationNotesClock | undefined;
    idProvider?: PublicationNotesIdProvider | undefined;
    logger?: PublicationNotesLogger | undefined;
}

export class PublicationNotesController<TNote extends PublicationNoteEntity> {

    private readonly repository: PublicationNoteRepository<TNote>;
    private readonly clock: PublicationNotesClock;
    private readonly idProvider?: PublicationNotesIdProvider | undefined;
    private readonly logger?: PublicationNotesLogger | undefined;

    public constructor(dependencies: PublicationNotesControllerDependencies<TNote>) {
        this.repository = dependencies.repository;
        this.clock = dependencies.clock || {
            now: () => Date.now(),
        };
        this.idProvider = dependencies.idProvider;
        this.logger = dependencies.logger;
    }

    public async list(publicationIdentifier: string): Promise<PublicationNotesViewState<TNote>> {
        const snapshot = await this.snapshot(publicationIdentifier);
        return serializePublicationNotesViewState(snapshot);
    }

    public async get(publicationIdentifier: string, noteIdentifier: string): Promise<TNote | undefined> {
        const note = await this.repository.get(publicationIdentifier, noteIdentifier);
        return note ? this.prepareExistingNote(note) : undefined;
    }

    public async create(publicationIdentifier: string, note: TNote): Promise<PublicationNoteChange<TNote>> {
        const noteWithDefaults = this.prepareNewNote(note);
        const existingNote = await this.repository.get(publicationIdentifier, noteWithDefaults.uuid);
        if (existingNote) {
            throw new Error(`Cannot create publication note ${noteWithDefaults.uuid} because it already exists`);
        }

        await this.repository.create(publicationIdentifier, noteWithDefaults);

        return {
            publicationIdentifier,
            note: noteWithDefaults,
            revision: this.clock.now(),
        };
    }

    public async replace(publicationIdentifier: string, note: TNote): Promise<PublicationNoteChange<TNote>> {
        const previousNote = await this.repository.get(publicationIdentifier, note.uuid);
        const nextNote = this.prepareExistingNote(note);
        await this.repository.replace(publicationIdentifier, nextNote);

        return {
            publicationIdentifier,
            previousNote,
            note: nextNote,
            revision: this.clock.now(),
        };
    }

    public async update(publicationIdentifier: string, note: TNote): Promise<PublicationNoteChange<TNote>> {
        const previousNote = await this.repository.get(publicationIdentifier, note.uuid);
        if (!previousNote) {
            throw new Error(`Cannot update publication note ${note.uuid} because it does not exist`);
        }

        const nextNote = this.prepareExistingNote(note);
        await this.repository.update(publicationIdentifier, nextNote);

        return {
            publicationIdentifier,
            previousNote,
            note: nextNote,
            revision: this.clock.now(),
        };
    }

    public async delete(publicationIdentifier: string, noteIdentifier: string): Promise<PublicationNoteDeleteChange> {
        const previousNote = await this.repository.get(publicationIdentifier, noteIdentifier);
        if (!previousNote) {
            throw new Error(`Cannot delete publication note ${noteIdentifier} because it does not exist`);
        }

        await this.repository.delete(publicationIdentifier, noteIdentifier);

        return {
            publicationIdentifier,
            noteIdentifier,
            revision: this.clock.now(),
        };
    }

    public async deleteByPublication(publicationIdentifier: string): Promise<PublicationNotesSnapshot<TNote>> {
        await this.repository.deleteByPublication(publicationIdentifier);

        return {
            publicationIdentifier,
            notes: [],
            revision: this.clock.now(),
        };
    }

    private async snapshot(publicationIdentifier: string): Promise<PublicationNotesSnapshot<TNote>> {
        const notes = (await this.repository.list(publicationIdentifier))
            .map((note) => this.prepareExistingNote(note));

        return {
            publicationIdentifier,
            notes,
            revision: this.clock.now(),
        };
    }

    private prepareNewNote(note: TNote): TNote {
        let uuid = note.uuid;
        if (!uuid && this.idProvider) {
            uuid = this.idProvider.next();
        }

        if (!uuid) {
            throw new Error("Cannot create a publication note without an identifier");
        }

        const created = note.created || this.clock.now();
        const noteWithDefaults = {
            ...note,
            uuid,
            created,
        };

        this.logger?.debug("Create publication note", uuid);

        return noteWithDefaults;
    }

    private prepareExistingNote(note: TNote): TNote {
        if (note.created) {
            return note;
        }

        return {
            ...note,
            created: note.modified || this.clock.now(),
        };
    }
}
