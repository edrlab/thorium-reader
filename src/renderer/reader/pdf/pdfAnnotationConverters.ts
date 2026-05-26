// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { INoteCreator } from "readium-desktop/common/redux/states/creator";
import { EDrawType } from "readium-desktop/common/redux/states/renderer/note";
import type { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import type {
    IColor,
    TPdfAnnotationDraftTransport,
    TPdfAnnotationDrawType,
    TPdfAnnotationTransport,
} from "readium-desktop/renderer/reader/pdf/common/pdfAnnotation.type";

export interface IPdfAnnotationDraftToNoteContext {
    color: IColor;
    creator?: INoteCreator;
    index: number;
    created: number;
}

export function filterPdfAnnotationNotes(notes: INoteState[]) {
    return notes.filter((note) => note.group === "annotation" && !!note.pdfAnnotation);
}

function noteDrawTypeToPdfDrawType(drawType: EDrawType): TPdfAnnotationDrawType {
    const value = EDrawType[drawType];
    if (
        value === "solid_background" ||
        value === "underline" ||
        value === "strikethrough" ||
        value === "outline"
    ) {
        return value;
    }

    return "solid_background";
}

export function noteToPdfAnnotation(note: INoteState): TPdfAnnotationTransport | undefined {
    if (note.group !== "annotation" || !note.pdfAnnotation) {
        return undefined;
    }

    return {
        id: note.uuid,
        type: note.pdfAnnotation.type,
        page: note.pdfAnnotation.page,
        rects: note.pdfAnnotation.rects.map((rect) => ({
            x1: rect.x1,
            y1: rect.y1,
            x2: rect.x2,
            y2: rect.y2,
        })),
        quote: note.pdfAnnotation.quote,
        color: { ...note.color },
        drawType: noteDrawTypeToPdfDrawType(note.drawType),
    };
}

export function pdfAnnotationDraftToNote(
    draft: TPdfAnnotationDraftTransport,
    context: IPdfAnnotationDraftToNoteContext,
): Omit<INoteState, "uuid"> {

    return {
        index: context.index,
        pdfAnnotation: {
            type: draft.type,
            page: draft.page,
            rects: draft.rects.map((rect) => ({
                x1: rect.x1,
                y1: rect.y1,
                x2: rect.x2,
                y2: rect.y2,
            })),
            quote: draft.quote,
        },
        textualValue: "",
        color: { ...context.color },
        drawType: EDrawType.solid_background,
        tags: [],
        created: context.created,
        creator: context.creator ? { ...context.creator } : undefined,
        group: "annotation",
    };
}
