// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type {
    TPdfAnnotationDraftTransport,
    TPdfAnnotationRectTransport,
} from "./pdfAnnotation.type";

export type TPdfAnnotationDraftValidationReason =
    | "missing-draft"
    | "invalid-type"
    | "invalid-page"
    | "invalid-rects"
    | "invalid-quote";

export interface IPdfAnnotationDraftValidationValid {
    valid: true;
    draft: TPdfAnnotationDraftTransport;
}

export interface IPdfAnnotationDraftValidationInvalid {
    valid: false;
    reason: TPdfAnnotationDraftValidationReason;
}

export type TPdfAnnotationDraftValidationResult =
    | IPdfAnnotationDraftValidationValid
    | IPdfAnnotationDraftValidationInvalid;

export function isInvalidPdfAnnotationDraftValidation(
    result: TPdfAnnotationDraftValidationResult,
): result is IPdfAnnotationDraftValidationInvalid {
    return result.valid === false;
}

export function isValidPdfAnnotationRect(rect: unknown): rect is TPdfAnnotationRectTransport {
    if (!rect || typeof rect !== "object") {
        return false;
    }

    const candidate = rect as Partial<TPdfAnnotationRectTransport>;
    const { x1, y1, x2, y2 } = candidate;
    if (![x1, y1, x2, y2].every(Number.isFinite)) {
        return false;
    }

    return x1 !== x2 && y1 !== y2;
}

export function validatePdfAnnotationDraft(draft: unknown): TPdfAnnotationDraftValidationResult {
    if (!draft || typeof draft !== "object") {
        return {
            valid: false,
            reason: "missing-draft",
        };
    }

    const candidate = draft as Partial<TPdfAnnotationDraftTransport>;
    if (candidate.type !== "pdf-text-highlight") {
        return {
            valid: false,
            reason: "invalid-type",
        };
    }

    if (!Number.isInteger(candidate.page) || candidate.page < 1) {
        return {
            valid: false,
            reason: "invalid-page",
        };
    }

    if (!Array.isArray(candidate.rects) || !candidate.rects.length || !candidate.rects.every(isValidPdfAnnotationRect)) {
        return {
            valid: false,
            reason: "invalid-rects",
        };
    }

    if (typeof candidate.quote !== "undefined" && typeof candidate.quote !== "string") {
        return {
            valid: false,
            reason: "invalid-quote",
        };
    }

    return {
        valid: true,
        draft: {
            type: candidate.type,
            page: candidate.page,
            rects: candidate.rects.map((rect) => ({ ...rect })),
            quote: candidate.quote,
        },
    };
}
