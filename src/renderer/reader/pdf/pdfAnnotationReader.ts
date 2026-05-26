// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { TDrawView } from "readium-desktop/common/redux/states/renderer/note";
import type {
    TPdfAnnotationDraftTransport,
} from "readium-desktop/renderer/reader/pdf/common/pdfAnnotation.type";
import {
    createPdfAnnotationNoteDraft,
} from "readium-desktop/renderer/reader/pdf/pdfAnnotationHost";
import type {
    IPdfAnnotationCreateRequestContext,
    IPdfAnnotationCreateRequestPayload,
} from "readium-desktop/renderer/reader/pdf/pdfAnnotationHost";

export type TPdfAnnotationCreatePresentation = "draft-editor" | "persist-immediately";

export interface IPdfAnnotationCreatePresentationOptions {
    annotationPopoverNotOpenOnNoteTaking: boolean;
    skipNextEditor: boolean;
}

export function getPdfAnnotationCreatePresentation(
    payload: IPdfAnnotationCreateRequestPayload | undefined,
    options: IPdfAnnotationCreatePresentationOptions,
): TPdfAnnotationCreatePresentation {
    const canOpenEditor = payload?.source === "highlight:create-from-selection" ||
        payload?.source === "instant-selection";
    const skipEditor = options.annotationPopoverNotOpenOnNoteTaking ||
        options.skipNextEditor;

    return canOpenEditor && !skipEditor
        ? "draft-editor"
        : "persist-immediately";
}

export function buildPdfAnnotationDraftEditorTransport(
    payload: IPdfAnnotationCreateRequestPayload | undefined,
    context: IPdfAnnotationCreateRequestContext,
): TPdfAnnotationDraftTransport | undefined {
    const noteDraft = createPdfAnnotationNoteDraft(payload, context);
    const pdfAnnotation = noteDraft?.pdfAnnotation;
    if (!pdfAnnotation) {
        return undefined;
    }

    return {
        type: pdfAnnotation.type,
        page: pdfAnnotation.page,
        rects: pdfAnnotation.rects.map((rect) => ({ ...rect })),
        quote: pdfAnnotation.quote,
    };
}

export function getPdfAnnotationVisibilityPayload(annotationDefaultDrawView: TDrawView): {
    visible: boolean;
} {
    return {
        visible: annotationDefaultDrawView !== "hide",
    };
}
