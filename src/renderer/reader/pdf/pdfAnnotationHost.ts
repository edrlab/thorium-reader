// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IColor } from "@r2-navigator-js/electron/common/highlight";

import type { INoteCreator } from "readium-desktop/common/redux/states/creator";
import type { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import type {
    TPdfAnnotationDraftTransport,
    TPdfAnnotationTransport,
} from "readium-desktop/renderer/reader/pdf/common/pdfReader.type";
import {
    filterPdfAnnotationNotes,
    noteToPdfAnnotation,
    pdfAnnotationDraftToNote,
} from "readium-desktop/renderer/reader/pdf/pdfAnnotationConverters";

export interface IPdfAnnotationCreateRequestPayload {
    draft?: TPdfAnnotationDraftTransport;
}

export interface IPdfAnnotationCreateRequestContext {
    color: IColor;
    creator?: INoteCreator;
    noteTotalCount: number;
    created: number;
}

export interface IPdfAnnotationCreateRequestDependencies extends IPdfAnnotationCreateRequestContext {
    publicationIdentifier: string;
    notes: INoteState[];
    addUpdatePdfAnnotationNote: (
        publicationIdentifier: string,
        newNote: Omit<INoteState, "uuid">,
    ) => {
        payload: {
            newNote: INoteState;
        };
    };
    dispatchAnnotationsSync: (annotations: TPdfAnnotationTransport[]) => void;
}

export function buildPdfAnnotationTransportList(
    notes: INoteState[],
    extraNote?: INoteState,
): TPdfAnnotationTransport[] {
    const annotationsById = new Map<string, TPdfAnnotationTransport>();
    const sourceNotes = extraNote ? [...notes, extraNote] : notes;

    for (const note of filterPdfAnnotationNotes(sourceNotes)) {
        const annotation = noteToPdfAnnotation(note);
        if (annotation) {
            annotationsById.set(annotation.id, annotation);
        }
    }

    return Array.from(annotationsById.values());
}

export function createPdfAnnotationNoteDraft(
    payload: IPdfAnnotationCreateRequestPayload | undefined,
    context: IPdfAnnotationCreateRequestContext,
): Omit<INoteState, "uuid"> | undefined {
    if (!payload?.draft) {
        return undefined;
    }

    return pdfAnnotationDraftToNote(payload.draft, {
        color: context.color,
        creator: context.creator,
        index: context.noteTotalCount + 1,
        created: context.created,
    });
}

export function handlePdfAnnotationCreateRequested(
    payload: IPdfAnnotationCreateRequestPayload | undefined,
    dependencies: IPdfAnnotationCreateRequestDependencies,
) {
    const noteDraft = createPdfAnnotationNoteDraft(payload, dependencies);
    if (!noteDraft) {
        return undefined;
    }

    const action = dependencies.addUpdatePdfAnnotationNote(
        dependencies.publicationIdentifier,
        noteDraft,
    );
    const createdNote = action.payload.newNote;
    const annotations = buildPdfAnnotationTransportList(
        dependencies.notes,
        createdNote,
    );

    dependencies.dispatchAnnotationsSync(annotations);

    return {
        action,
        annotations,
        createdNote,
        noteDraft,
    };
}

export function triggerPdfAnnotation(
    isPdf: boolean,
    fromKeyboard: boolean,
    dispatchPdfHighlightCreateFromSelection: () => void,
    triggerEpubAnnotation: (fromKeyboard: boolean) => void,
) {
    if (isPdf) {
        dispatchPdfHighlightCreateFromSelection();
        return;
    }

    triggerEpubAnnotation(fromKeyboard);
}
