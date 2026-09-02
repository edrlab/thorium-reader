// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { PublicationNote } from "readium-desktop/common/publication-notes";
import type { IReaderRootState, IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";

type TReaderPublicationNotesState = Pick<IReaderStateReader, "publicationNotes">;
export type TPublicationNoteTagIndexItem = { tag: string; index: number };

let tagIndexMemoSource: Record<string, number> | undefined;
let tagIndexMemoResult: TPublicationNoteTagIndexItem[] = [];
const emptyTagIndex: Record<string, number> = {};

export function selectPublicationNotesFromReaderState(reader: TReaderPublicationNotesState): PublicationNote[] {
    return reader.publicationNotes?.notes || [];
}

export function selectPublicationNotes(state: IReaderRootState): PublicationNote[] {
    return selectPublicationNotesFromReaderState(state.reader);
}

export function selectPublicationNoteTagsIndex(state: IReaderRootState): TPublicationNoteTagIndexItem[] {
    const tagIndex = state.reader.publicationNotes?.tagIndex || emptyTagIndex;

    if (tagIndexMemoSource === tagIndex) {
        return tagIndexMemoResult;
    }

    tagIndexMemoSource = tagIndex;
    tagIndexMemoResult = Object.entries(tagIndex)
        .map(([tag, index]) => ({ tag, index }));
    return tagIndexMemoResult;
}
