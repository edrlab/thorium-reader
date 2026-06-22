// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import debug_ from "debug";

import type { INoteCreator } from "readium-desktop/common/redux/states/creator";
import type { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import type {
    IColor,
    TPdfAnnotationCreateSource,
    TPdfAnnotationTransport,
} from "readium-desktop/renderer/reader/pdf/common/pdfAnnotation.type";
import {
    filterPdfAnnotationNotes,
    noteToPdfAnnotation,
    pdfAnnotationDraftToNote,
} from "readium-desktop/renderer/reader/pdf/pdfAnnotationConverters";
import {
    isInvalidPdfAnnotationDraftValidation,
    validatePdfAnnotationDraft,
} from "readium-desktop/renderer/reader/pdf/common/pdfAnnotationValidation";

const debugPdfAnnotationsHost = debug_("readium-desktop:renderer:reader:pdf:annotations:host");

export interface IPdfAnnotationCreateRequestPayload {
    draft?: unknown;
    source?: TPdfAnnotationCreateSource;
}

export interface IPdfAnnotationCreateRequestContext {
    color: IColor;
    creator?: INoteCreator;
    noteTotalCount: number;
    created: number;
}

export interface IPdfAnnotationCreateRequestHostState extends IPdfAnnotationCreateRequestContext {
    publicationIdentifier: string;
    notes: INoteState[];
}

/**
 * Inversion-of-control boundary for the host side of PDF annotation creation.
 *
 * `pdfAnnotationHost` owns deterministic payload construction, but it does not
 * import Redux, the store, or the PDF event bus. `Reader.tsx` provides current
 * host state and adapts external systems into these ports:
 *
 * - `persistNoteInRedux` writes the draft through the existing note action.
 * - `syncAnnotationsToPdfWebview` sends the canonical snapshot through the PDF
 *   event bus.
 */
export interface IPdfAnnotationCreateRequestHostPorts {
    persistNoteInRedux: (
        publicationIdentifier: string,
        newNote: Omit<INoteState, "uuid">,
    ) => {
        payload: {
            newNote: INoteState;
        };
    };
    syncAnnotationsToPdfWebview: (annotations: TPdfAnnotationTransport[]) => void;
}

export interface IPdfAnnotationCreateRequestHostAdapter {
    state: IPdfAnnotationCreateRequestHostState;
    ports: IPdfAnnotationCreateRequestHostPorts;
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

function isValidPdfAnnotationCreateSource(source: unknown): source is TPdfAnnotationCreateSource {
    return source === "highlight:create-from-selection" || source === "instant-selection";
}

export function createPdfAnnotationNoteDraft(
    payload: IPdfAnnotationCreateRequestPayload | undefined,
    context: IPdfAnnotationCreateRequestContext,
): Omit<INoteState, "uuid"> | undefined {
    if (payload?.draft && !isValidPdfAnnotationCreateSource(payload.source)) {
        debugPdfAnnotationsHost("annotation:create-requested ignored invalid source", {
            source: payload.source,
        });
        return undefined;
    }

    const validation = validatePdfAnnotationDraft(payload?.draft);
    if (validation.valid) {
        return pdfAnnotationDraftToNote(validation.draft, {
            color: context.color,
            creator: context.creator,
            index: context.noteTotalCount + 1,
            created: context.created,
        });
    }

    if (isInvalidPdfAnnotationDraftValidation(validation) && validation.reason !== "missing-draft") {
        debugPdfAnnotationsHost("annotation:create-requested ignored invalid draft", {
            reason: validation.reason,
            draft: payload?.draft,
        });
    }
    return undefined;
}

export function handlePdfAnnotationCreateRequested(
    payload: IPdfAnnotationCreateRequestPayload | undefined,
    host: IPdfAnnotationCreateRequestHostAdapter,
) {
    const noteDraft = createPdfAnnotationNoteDraft(payload, host.state);
    if (!noteDraft) {
        return undefined;
    }

    const action = host.ports.persistNoteInRedux(
        host.state.publicationIdentifier,
        noteDraft,
    );
    const createdNote = action.payload.newNote;
    const annotations = buildPdfAnnotationTransportList(
        host.state.notes,
        createdNote,
    );

    host.ports.syncAnnotationsToPdfWebview(annotations);

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
