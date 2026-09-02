// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    hydratePublicationNotesView,
    indexPublicationNotes,
    type PublicationNote,
    type PublicationNotesHydratedView,
    type PublicationNotesViewFilter,
} from "readium-desktop/common/publication-notes";
import type { IReaderRootState, IReaderStateReader } from "readium-desktop/common/redux/states/renderer/readerRootState";

type TReaderPublicationNotesState = Pick<IReaderStateReader, "publicationNotes">;
export type TPublicationNoteTagIndexItem = { tag: string; index: number };

const emptyPublicationNotes: PublicationNote[] = [];
const emptyPublicationNotesViewFilter: PublicationNotesViewFilter = {};
const emptyTagIndex: Record<string, number> = {};
let tagIndexMemoSource: Record<string, number> | undefined;
let tagIndexMemoResult: TPublicationNoteTagIndexItem[] = [];
let noteTagIndexMemoSource: PublicationNote[] | undefined;
let noteTagIndexMemoResult: Record<string, number> = emptyTagIndex;

export function selectPublicationNotesFromReaderState(reader: TReaderPublicationNotesState): PublicationNote[] {
    return reader.publicationNotes?.notes || emptyPublicationNotes;
}

export function selectPublicationNotes(state: IReaderRootState): PublicationNote[] {
    return selectPublicationNotesFromReaderState(state.reader);
}

let spineItemHrefsMemoSource: unknown;
let spineItemHrefsMemoResult: string[] = [];

export function selectPublicationSpineItemHrefs(state: IReaderRootState): string[] {
    const r2Publication = state.reader.info?.r2Publication;
    if (spineItemHrefsMemoSource === r2Publication) {
        return spineItemHrefsMemoResult;
    }

    spineItemHrefsMemoSource = r2Publication;
    spineItemHrefsMemoResult = ((r2Publication as { Spine?: Array<{ Href?: string | undefined }> } | undefined)?.Spine || [])
        .map((link) => link.Href)
        .filter((href): href is string => !!href);
    return spineItemHrefsMemoResult;
}

let publicationNotesViewMemoNotesSource: PublicationNote[] | undefined;
let publicationNotesViewMemoFilterSource: PublicationNotesViewFilter | undefined;
let publicationNotesViewMemoSpineSource: string[] | undefined;
let publicationNotesViewMemoResult: PublicationNotesHydratedView<PublicationNote> | undefined;

export function selectPublicationNotesHydratedView(
    state: IReaderRootState,
    filter: PublicationNotesViewFilter = emptyPublicationNotesViewFilter,
): PublicationNotesHydratedView<PublicationNote> {
    const notes = selectPublicationNotes(state);
    const spineItemHrefs = selectPublicationSpineItemHrefs(state);
    if (
        publicationNotesViewMemoResult &&
        publicationNotesViewMemoNotesSource === notes &&
        publicationNotesViewMemoFilterSource === filter &&
        publicationNotesViewMemoSpineSource === spineItemHrefs
    ) {
        return publicationNotesViewMemoResult;
    }

    publicationNotesViewMemoNotesSource = notes;
    publicationNotesViewMemoFilterSource = filter;
    publicationNotesViewMemoSpineSource = spineItemHrefs;
    publicationNotesViewMemoResult = hydratePublicationNotesView(notes, filter, spineItemHrefs);
    return publicationNotesViewMemoResult;
}

export function selectPublicationNoteTagsIndex(state: IReaderRootState): TPublicationNoteTagIndexItem[] {
    const notes = selectPublicationNotes(state);
    if (noteTagIndexMemoSource !== notes) {
        noteTagIndexMemoSource = notes;
        noteTagIndexMemoResult = notes === emptyPublicationNotes
            ? emptyTagIndex
            : indexPublicationNotes(notes).tagIndex;
    }

    const tagIndex = noteTagIndexMemoResult;

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

export function selectPublicationNotesHydratedViewTagsIndex(
    state: IReaderRootState,
    filter: PublicationNotesViewFilter = emptyPublicationNotesViewFilter,
): TPublicationNoteTagIndexItem[] {
    const tagIndex = selectPublicationNotesHydratedView(state, filter).facets.tagIndex;

    if (viewTagIndexMemoSource === tagIndex) {
        return viewTagIndexMemoResult;
    }

    viewTagIndexMemoSource = tagIndex;
    viewTagIndexMemoResult = Object.entries(tagIndex)
        .map(([tag, index]) => ({ tag, index }));
    return viewTagIndexMemoResult;
}
