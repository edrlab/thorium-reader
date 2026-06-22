import { expect, test } from "@jest/globals";

import { EDrawType } from "readium-desktop/common/redux/states/renderer/note";
import type { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import {
    filterPdfAnnotationNotes,
    noteToPdfAnnotation,
    pdfAnnotationDraftToNote,
} from "readium-desktop/renderer/reader/pdf/pdfAnnotationConverters";
import type { TPdfAnnotationDraftTransport } from "readium-desktop/renderer/reader/pdf/common/pdfAnnotation.type";

const baseColor = {
    red: 12,
    green: 34,
    blue: 56,
};

function createPdfAnnotationNote(overrides: Partial<INoteState> = {}): INoteState {
    return {
        uuid: "note-1",
        index: 1,
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 3,
            rects: [
                { x1: 10, y1: 20, x2: 30, y2: 40 },
                { x1: 50, y1: 60, x2: 70, y2: 80 },
            ],
            quote: "selected text",
        },
        textualValue: "comment",
        color: { ...baseColor },
        drawType: EDrawType.solid_background,
        tags: ["tag-a"],
        created: 1000,
        creator: {
            id: "creator-id",
            urn: "urn:creator",
            type: "Person",
            name: "Creator",
        },
        group: "annotation",
        ...overrides,
    };
}

const baseDraft: TPdfAnnotationDraftTransport = {
    type: "pdf-text-highlight",
    page: 5,
    rects: [
        { x1: 1, y1: 2, x2: 3, y2: 4 },
        { x1: 5, y1: 6, x2: 7, y2: 8 },
    ],
    quote: "draft quote",
};

test("filterPdfAnnotationNotes keeps only annotation notes that contain PDF annotation data", () => {
    const first = createPdfAnnotationNote({ uuid: "first" });
    const second = createPdfAnnotationNote({ uuid: "second" });
    const annotationWithoutTarget = createPdfAnnotationNote({
        uuid: "missing-target",
        pdfAnnotation: undefined,
    });
    const bookmarkWithPdfTarget = createPdfAnnotationNote({
        uuid: "bookmark",
        group: "bookmark",
    });

    expect(filterPdfAnnotationNotes([
        first,
        annotationWithoutTarget,
        bookmarkWithPdfTarget,
        second,
    ])).toEqual([first, second]);
});

test("noteToPdfAnnotation maps note identity and PDF target fields to transport", () => {
    expect(noteToPdfAnnotation(createPdfAnnotationNote())).toEqual({
        id: "note-1",
        type: "pdf-text-highlight",
        page: 3,
        rects: [
            { x1: 10, y1: 20, x2: 30, y2: 40 },
            { x1: 50, y1: 60, x2: 70, y2: 80 },
        ],
        quote: "selected text",
        color: baseColor,
        drawType: "solid_background",
    });
});

test("noteToPdfAnnotation transports edited note color and draw type", () => {
    expect(noteToPdfAnnotation(createPdfAnnotationNote({
        color: {
            red: 90,
            green: 91,
            blue: 92,
        },
        drawType: EDrawType.underline,
    }))).toEqual(expect.objectContaining({
        color: {
            red: 90,
            green: 91,
            blue: 92,
        },
        drawType: "underline",
    }));
});

test("noteToPdfAnnotation falls back to solid PDF draw type for unsupported note styles", () => {
    expect(noteToPdfAnnotation(createPdfAnnotationNote({
        drawType: EDrawType.bookmark,
    }))).toEqual(expect.objectContaining({
        drawType: "solid_background",
    }));
});

test("noteToPdfAnnotation rejects notes that are not renderable PDF annotations", () => {
    expect(noteToPdfAnnotation(createPdfAnnotationNote({
        group: "bookmark",
    }))).toBeUndefined();

    expect(noteToPdfAnnotation(createPdfAnnotationNote({
        pdfAnnotation: undefined,
    }))).toBeUndefined();
});

test("noteToPdfAnnotation deep-copies rects and preserves an undefined quote", () => {
    const note = createPdfAnnotationNote({
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 7,
            rects: [
                { x1: 1, y1: 2, x2: 3, y2: 4 },
            ],
            quote: undefined,
        },
    });
    const transport = noteToPdfAnnotation(note);

    if (!transport || !note.pdfAnnotation) {
        throw new Error("expected transport and note PDF annotation");
    }

    note.pdfAnnotation.rects[0].x1 = 999;
    note.color.red = 999;

    expect(transport).toEqual({
        id: "note-1",
        type: "pdf-text-highlight",
        page: 7,
        rects: [
            { x1: 1, y1: 2, x2: 3, y2: 4 },
        ],
        quote: undefined,
        color: {
            red: 12,
            green: 34,
            blue: 56,
        },
        drawType: "solid_background",
    });
});

test("pdfAnnotationDraftToNote maps draft target fields and first-slice defaults", () => {
    expect(pdfAnnotationDraftToNote(baseDraft, {
        color: baseColor,
        index: 9,
        created: 1234,
    })).toEqual({
        index: 9,
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 5,
            rects: [
                { x1: 1, y1: 2, x2: 3, y2: 4 },
                { x1: 5, y1: 6, x2: 7, y2: 8 },
            ],
            quote: "draft quote",
        },
        textualValue: "",
        color: baseColor,
        drawType: EDrawType.solid_background,
        tags: [],
        created: 1234,
        creator: undefined,
        group: "annotation",
    });
});

test("pdfAnnotationDraftToNote maps context metadata and deep-copies mutable values", () => {
    const draft: TPdfAnnotationDraftTransport = {
        ...baseDraft,
        rects: [
            { x1: 11, y1: 12, x2: 13, y2: 14 },
        ],
    };
    const color = { red: 90, green: 91, blue: 92 };
    const creator = {
        id: "creator-id",
        urn: "urn:creator",
        type: "Person" as const,
        name: "Creator",
    };
    const note = pdfAnnotationDraftToNote(draft, {
        color,
        creator,
        index: 2,
        created: 2222,
    });

    color.red = 0;
    creator.name = "Changed";
    draft.rects[0].x1 = 999;

    expect(note.color).toEqual({ red: 90, green: 91, blue: 92 });
    expect(note.creator).toEqual({
        id: "creator-id",
        urn: "urn:creator",
        type: "Person",
        name: "Creator",
    });
    expect(note.pdfAnnotation?.rects).toEqual([
        { x1: 11, y1: 12, x2: 13, y2: 14 },
    ]);
    expect(note.color).not.toBe(color);
    expect(note.creator).not.toBe(creator);
    expect(note.pdfAnnotation?.rects[0]).not.toBe(draft.rects[0]);
});

test("pdfAnnotationDraftToNote handles missing creator and preserves multi-rect order", () => {
    const note = pdfAnnotationDraftToNote(baseDraft, {
        color: baseColor,
        creator: undefined,
        index: 4,
        created: 4444,
    });

    expect(note.creator).toBeUndefined();
    expect(note.pdfAnnotation?.rects).toEqual([
        { x1: 1, y1: 2, x2: 3, y2: 4 },
        { x1: 5, y1: 6, x2: 7, y2: 8 },
    ]);
});
