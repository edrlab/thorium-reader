import { expect, test } from "@jest/globals";

import {
    isValidPdfAnnotationRect,
    validatePdfAnnotationDraft,
} from "readium-desktop/renderer/reader/pdf/common/pdfAnnotationValidation";

const validRect = {
    x1: 1,
    y1: 2,
    x2: 3,
    y2: 4,
};

test("valid PDF annotation draft is accepted and defensively copied", () => {
    const draft = {
        type: "pdf-text-highlight",
        page: 2,
        rects: [
            validRect,
        ],
        quote: "selected text",
    };

    const result = validatePdfAnnotationDraft(draft);

    expect(result).toEqual({
        valid: true,
        draft,
    });
    if (result.valid) {
        expect(result.draft).not.toBe(draft);
        expect(result.draft.rects).not.toBe(draft.rects);
        expect(result.draft.rects[0]).not.toBe(validRect);
    }
});

test("PDF annotation draft validation rejects missing draft, wrong type, and invalid page", () => {
    expect(validatePdfAnnotationDraft(undefined)).toEqual({
        valid: false,
        reason: "missing-draft",
    });
    expect(validatePdfAnnotationDraft({
        type: "bookmark",
        page: 1,
        rects: [
            validRect,
        ],
    })).toEqual({
        valid: false,
        reason: "invalid-type",
    });
    expect(validatePdfAnnotationDraft({
        type: "pdf-text-highlight",
        page: 0,
        rects: [
            validRect,
        ],
    })).toEqual({
        valid: false,
        reason: "invalid-page",
    });
    expect(validatePdfAnnotationDraft({
        type: "pdf-text-highlight",
        page: 1.5,
        rects: [
            validRect,
        ],
    })).toEqual({
        valid: false,
        reason: "invalid-page",
    });
});

test("PDF annotation draft validation rejects empty, non-finite, or zero-area rectangles", () => {
    expect(validatePdfAnnotationDraft({
        type: "pdf-text-highlight",
        page: 1,
        rects: [],
    })).toEqual({
        valid: false,
        reason: "invalid-rects",
    });
    expect(validatePdfAnnotationDraft({
        type: "pdf-text-highlight",
        page: 1,
        rects: [
            { ...validRect, x1: Number.NaN },
        ],
    })).toEqual({
        valid: false,
        reason: "invalid-rects",
    });
    expect(validatePdfAnnotationDraft({
        type: "pdf-text-highlight",
        page: 1,
        rects: [
            { x1: 1, y1: 2, x2: 1, y2: 4 },
        ],
    })).toEqual({
        valid: false,
        reason: "invalid-rects",
    });
    expect(validatePdfAnnotationDraft({
        type: "pdf-text-highlight",
        page: 1,
        rects: [
            { x1: 1, y1: 2, x2: 3, y2: 2 },
        ],
    })).toEqual({
        valid: false,
        reason: "invalid-rects",
    });
});

test("PDF annotation draft validation rejects non-string quotes when provided", () => {
    expect(validatePdfAnnotationDraft({
        type: "pdf-text-highlight",
        page: 1,
        rects: [
            validRect,
        ],
        quote: 42,
    })).toEqual({
        valid: false,
        reason: "invalid-quote",
    });
});

test("PDF annotation rectangle validation accepts finite non-zero rectangles only", () => {
    expect(isValidPdfAnnotationRect(validRect)).toBe(true);
    expect(isValidPdfAnnotationRect(null)).toBe(false);
    expect(isValidPdfAnnotationRect({ ...validRect, x2: 1 })).toBe(false);
    expect(isValidPdfAnnotationRect({ ...validRect, y2: Number.POSITIVE_INFINITY })).toBe(false);
});
