// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { PublicationNote, PublicationNotesHydratedView } from "readium-desktop/common/publication-notes";
import type { IReaderRootState, IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { publicationNotesViewInitialState } from "readium-desktop/common/redux/states/renderer/publicationNotes";

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

export function selectPublicationNotesViewState(state: IReaderRootState): PublicationNotesHydratedView<PublicationNote> {
    const view = state.reader.publicationNotes?.view;
    if (!view) {
        return publicationNotesViewInitialState.view;
    }

    if (!view.pagination) {
        return {
            ...view,
            pagination: publicationNotesViewInitialState.view.pagination,
        };
    }

    return view;
}

export function selectPublicationNotesView(state: IReaderRootState): PublicationNote[] {
    return selectPublicationNotesViewState(state).notes;
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

let viewTagIndexMemoSource: Record<string, number> | undefined;
let viewTagIndexMemoResult: TPublicationNoteTagIndexItem[] = [];

export function selectPublicationNoteViewTagsIndex(state: IReaderRootState): TPublicationNoteTagIndexItem[] {
    const tagIndex = state.reader.publicationNotes?.view?.facets.tagIndex || emptyTagIndex;

    if (viewTagIndexMemoSource === tagIndex) {
        return viewTagIndexMemoResult;
    }

    viewTagIndexMemoSource = tagIndex;
    viewTagIndexMemoResult = Object.entries(tagIndex)
        .map(([tag, index]) => ({ tag, index }));
    return viewTagIndexMemoResult;
}
