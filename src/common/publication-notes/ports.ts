// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { PublicationNoteEntity } from "./model";

export interface PublicationNoteRepository<TNote extends PublicationNoteEntity> {
    list(publicationIdentifier: string): Promise<TNote[]>;
    get(publicationIdentifier: string, noteIdentifier: string): Promise<TNote | undefined>;
    create(publicationIdentifier: string, note: TNote): Promise<void>;
    replace(publicationIdentifier: string, note: TNote): Promise<void>;
    update(publicationIdentifier: string, note: TNote): Promise<void>;
    delete(publicationIdentifier: string, noteIdentifier: string): Promise<void>;
    deleteByPublication(publicationIdentifier: string): Promise<void>;
}

export interface PublicationNotesClock {
    now(): number;
}

export interface PublicationNotesIdProvider {
    next(): string;
}

export interface PublicationNotesLogger {
    debug(message: string, ...values: unknown[]): void;
}
