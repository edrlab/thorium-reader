import { expect, jest, test } from "@jest/globals";

import { EDrawType } from "readium-desktop/common/redux/states/renderer/note";
import type { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import {
    buildPdfAnnotationTransportList,
    handlePdfAnnotationCreateRequested,
    triggerPdfAnnotation,
} from "readium-desktop/renderer/reader/pdf/pdfAnnotationHost";
import type { IPdfAnnotationCreateRequestDependencies } from "readium-desktop/renderer/reader/pdf/pdfAnnotationHost";
import type { TPdfAnnotationDraftTransport } from "readium-desktop/renderer/reader/pdf/common/pdfReader.type";

const color = {
    red: 10,
    green: 20,
    blue: 30,
};

function createNote(uuid: string, overrides: Partial<INoteState> = {}): INoteState {
    return {
        uuid,
        index: 1,
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 1,
            rects: [
                { x1: 10, y1: 20, x2: 30, y2: 40 },
            ],
            quote: `quote-${uuid}`,
        },
        textualValue: "",
        color: { ...color },
        drawType: EDrawType.solid_background,
        tags: [],
        created: 1000,
        group: "annotation",
        ...overrides,
    };
}

const draft: TPdfAnnotationDraftTransport = {
    type: "pdf-text-highlight",
    page: 4,
    rects: [
        { x1: 1, y1: 2, x2: 3, y2: 4 },
    ],
    quote: "new quote",
};

test("transport list filters, converts, and preserves deterministic note order", () => {
    expect(buildPdfAnnotationTransportList([
        createNote("first"),
        createNote("bookmark", { group: "bookmark" }),
        createNote("missing-target", { pdfAnnotation: undefined }),
        createNote("second", {
            pdfAnnotation: {
                type: "pdf-text-highlight",
                page: 2,
                rects: [
                    { x1: 50, y1: 60, x2: 70, y2: 80 },
                ],
                quote: "second quote",
            },
        }),
    ])).toEqual([
        {
            id: "first",
            type: "pdf-text-highlight",
            page: 1,
            rects: [
                { x1: 10, y1: 20, x2: 30, y2: 40 },
            ],
            quote: "quote-first",
        },
        {
            id: "second",
            type: "pdf-text-highlight",
            page: 2,
            rects: [
                { x1: 50, y1: 60, x2: 70, y2: 80 },
            ],
            quote: "second quote",
        },
    ]);
});

test("transport list includes an extra note and lets it override an existing annotation id", () => {
    const existing = createNote("same-id", {
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 1,
            rects: [
                { x1: 1, y1: 1, x2: 2, y2: 2 },
            ],
            quote: "old",
        },
    });
    const other = createNote("other");
    const extra = createNote("same-id", {
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 9,
            rects: [
                { x1: 9, y1: 9, x2: 10, y2: 10 },
            ],
            quote: "new",
        },
    });

    expect(buildPdfAnnotationTransportList([existing, other], extra)).toEqual([
        {
            id: "same-id",
            type: "pdf-text-highlight",
            page: 9,
            rects: [
                { x1: 9, y1: 9, x2: 10, y2: 10 },
            ],
            quote: "new",
        },
        {
            id: "other",
            type: "pdf-text-highlight",
            page: 1,
            rects: [
                { x1: 10, y1: 20, x2: 30, y2: 40 },
            ],
            quote: "quote-other",
        },
    ]);
});

test("create-request handling ignores missing payload or missing draft", () => {
    const addUpdatePdfAnnotationNote: IPdfAnnotationCreateRequestDependencies["addUpdatePdfAnnotationNote"] = jest.fn(() => {
        throw new Error("addUpdatePdfAnnotationNote should not be called");
    });
    const dispatchAnnotationsSync: IPdfAnnotationCreateRequestDependencies["dispatchAnnotationsSync"] = jest.fn();
    const dependencies: IPdfAnnotationCreateRequestDependencies = {
        publicationIdentifier: "pub-id",
        notes: [],
        color,
        noteTotalCount: 0,
        created: 1234,
        addUpdatePdfAnnotationNote,
        dispatchAnnotationsSync,
    };

    expect(handlePdfAnnotationCreateRequested(undefined, dependencies)).toBeUndefined();
    expect(handlePdfAnnotationCreateRequested({}, dependencies)).toBeUndefined();
    expect(addUpdatePdfAnnotationNote).not.toHaveBeenCalled();
    expect(dispatchAnnotationsSync).not.toHaveBeenCalled();
});

test("create-request handling creates one note action and syncs a snapshot including the created note", () => {
    const createdNote = createNote("created", {
        index: 3,
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 4,
            rects: [
                { x1: 1, y1: 2, x2: 3, y2: 4 },
            ],
            quote: "new quote",
        },
        creator: {
            id: "creator-id",
            urn: "urn:creator",
            type: "Person",
            name: "Creator",
        },
        created: 2222,
    });
    const addUpdatePdfAnnotationNote: IPdfAnnotationCreateRequestDependencies["addUpdatePdfAnnotationNote"] = jest.fn((_publicationIdentifier, _newNote) => ({
        payload: {
            newNote: createdNote,
        },
    }));
    const dispatchAnnotationsSync: IPdfAnnotationCreateRequestDependencies["dispatchAnnotationsSync"] = jest.fn();
    const result = handlePdfAnnotationCreateRequested({ draft }, {
        publicationIdentifier: "pub-id",
        notes: [
            createNote("existing"),
        ],
        color,
        creator: {
            id: "creator-id",
            urn: "urn:creator",
            type: "Person",
            name: "Creator",
        },
        noteTotalCount: 2,
        created: 2222,
        addUpdatePdfAnnotationNote,
        dispatchAnnotationsSync,
    });

    expect(addUpdatePdfAnnotationNote).toHaveBeenCalledTimes(1);
    expect(addUpdatePdfAnnotationNote).toHaveBeenCalledWith("pub-id", {
        index: 3,
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 4,
            rects: [
                { x1: 1, y1: 2, x2: 3, y2: 4 },
            ],
            quote: "new quote",
        },
        textualValue: "",
        color,
        drawType: EDrawType.solid_background,
        tags: [],
        created: 2222,
        creator: {
            id: "creator-id",
            urn: "urn:creator",
            type: "Person",
            name: "Creator",
        },
        group: "annotation",
    });
    expect(dispatchAnnotationsSync).toHaveBeenCalledTimes(1);
    expect(dispatchAnnotationsSync).toHaveBeenCalledWith([
        expect.objectContaining({ id: "existing" }),
        expect.objectContaining({ id: "created" }),
    ]);
    expect(result?.createdNote).toBe(createdNote);
    expect(result?.noteDraft).toEqual(expect.objectContaining({
        pdfAnnotation: createdNote.pdfAnnotation,
        group: "annotation",
    }));
    expect(result?.noteDraft).not.toHaveProperty("uuid");
    expect(result?.action.payload.newNote).toBe(createdNote);
});

test("annotation trigger dispatches PDF selection command when active reader is PDF", () => {
    const dispatchPdfHighlightCreateFromSelection = jest.fn();
    const triggerEpubAnnotation = jest.fn();

    triggerPdfAnnotation(
        true,
        true,
        dispatchPdfHighlightCreateFromSelection,
        triggerEpubAnnotation,
    );

    expect(dispatchPdfHighlightCreateFromSelection).toHaveBeenCalledTimes(1);
    expect(triggerEpubAnnotation).not.toHaveBeenCalled();
});

test("annotation trigger calls the EPUB annotation path when active reader is not PDF", () => {
    const dispatchPdfHighlightCreateFromSelection = jest.fn();
    const triggerEpubAnnotation = jest.fn();

    triggerPdfAnnotation(
        false,
        true,
        dispatchPdfHighlightCreateFromSelection,
        triggerEpubAnnotation,
    );

    expect(dispatchPdfHighlightCreateFromSelection).not.toHaveBeenCalled();
    expect(triggerEpubAnnotation).toHaveBeenCalledWith(true);
});
