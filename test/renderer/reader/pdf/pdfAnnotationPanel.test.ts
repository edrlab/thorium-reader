import { expect, test } from "@jest/globals";

import { EDrawType } from "readium-desktop/common/redux/states/renderer/note";
import type { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import {
    buildAnnotationPanelSaveNote,
    canDeleteAnnotationInPanel,
    canEditAnnotationInPanel,
    canUseReadiumAnnotationImportExport,
    comparePdfAnnotationsByPagePosition,
    filterDeletableAnnotationPanelNotes,
    getAnnotationCardText,
    getAnnotationPanelNavigation,
    getAnnotationSelectionText,
    getPdfAnnotationNavigationTarget,
    getPdfAnnotationPageLabel,
    isPdfAnnotationPanelNote,
    normalizePdfAnnotationNavigationRect,
} from "readium-desktop/renderer/reader/pdf/pdfAnnotationPanel";

const color = {
    red: 10,
    green: 20,
    blue: 30,
};

function createPdfAnnotationNote(overrides: Partial<INoteState> = {}): INoteState {
    return {
        uuid: "pdf-note",
        index: 1,
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 3,
            rects: [
                { x1: 10, y1: 20, x2: 30, y2: 40 },
            ],
            quote: "PDF quote",
        },
        textualValue: "comment",
        color: { ...color },
        drawType: EDrawType.solid_background,
        tags: ["tag-a"],
        created: 1000,
        group: "annotation",
        ...overrides,
    };
}

function createEpubAnnotationNote(overrides: Partial<INoteState> = {}): INoteState {
    return createPdfAnnotationNote({
        uuid: "epub-note",
        pdfAnnotation: undefined,
        locatorExtended: {
            locator: {
                href: "chapter.xhtml",
            },
            selectionInfo: {
                cleanText: "EPUB quote",
            },
        } as INoteState["locatorExtended"],
        ...overrides,
    });
}

test("Readium annotation import/export stays unavailable in the PDF annotation panel", () => {
    expect(canUseReadiumAnnotationImportExport(true)).toBe(false);
    expect(canUseReadiumAnnotationImportExport(false)).toBe(true);
});

test("annotation panel action model keeps PDF cards read-only and bulk delete excludes them", () => {
    const pdfNote = createPdfAnnotationNote({ uuid: "pdf-readonly" });
    const epubNote = createEpubAnnotationNote({ uuid: "epub-editable" });

    expect(isPdfAnnotationPanelNote(pdfNote)).toBe(true);
    expect(canEditAnnotationInPanel(pdfNote)).toBe(false);
    expect(canDeleteAnnotationInPanel(pdfNote)).toBe(false);
    expect(canEditAnnotationInPanel(epubNote)).toBe(true);
    expect(canDeleteAnnotationInPanel(epubNote)).toBe(true);
    expect(filterDeletableAnnotationPanelNotes([pdfNote, epubNote]).map(({ uuid }) => uuid)).toEqual(["epub-editable"]);
});

test("annotation panel navigation model routes EPUB locators and PDF targets", () => {
    const epubNote = createEpubAnnotationNote();
    const pdfNote = createPdfAnnotationNote({
        uuid: "pdf-navigable",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 7,
            rects: [
                { x1: 40, y1: 50, x2: 10, y2: 20 },
            ],
        },
    });

    expect(getAnnotationPanelNavigation(epubNote)).toEqual({
        type: "epub",
        locator: epubNote.locatorExtended?.locator,
    });
    expect(getAnnotationPanelNavigation(pdfNote)).toEqual({
        type: "pdf",
        target: {
            id: "pdf-navigable",
            page: 7,
            rect: { x1: 10, y1: 20, x2: 40, y2: 50 },
        },
    });
});

test("annotation panel navigation model rejects invalid PDF targets before panel dispatch", () => {
    expect(getAnnotationPanelNavigation(createPdfAnnotationNote({
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 3,
            rects: [
                { x1: 10, y1: 20, x2: 10, y2: 40 },
            ],
        },
    }))).toBeUndefined();
});

test("annotation panel text falls back to pdfAnnotation quote without locatorExtended", () => {
    const note = createPdfAnnotationNote();

    expect(getAnnotationSelectionText(note)).toBe("PDF quote");
    expect(getAnnotationCardText(note, "Fallback title")).toBe("PDF quote");
});

test("annotation panel text keeps EPUB locator text precedence", () => {
    const note = createPdfAnnotationNote({
        locatorExtended: {
            selectionInfo: {
                cleanText: "EPUB selected text",
            },
        } as INoteState["locatorExtended"],
    });

    expect(getAnnotationSelectionText(note)).toBe("EPUB selected text");
});

test("PDF annotation page label uses pdfAnnotation page metadata", () => {
    expect(getPdfAnnotationPageLabel(createPdfAnnotationNote(), "Page")).toBe("Page 3");
});

test("PDF annotations sort by page, vertical position, horizontal position, then id", () => {
    const pageTwo = createPdfAnnotationNote({
        uuid: "page-two",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 2,
            rects: [
                { x1: 1, y1: 1, x2: 2, y2: 2 },
            ],
            quote: "page two",
        },
    });
    const lowerOnPageOne = createPdfAnnotationNote({
        uuid: "lower",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 1,
            rects: [
                { x1: 1, y1: 20, x2: 2, y2: 21 },
            ],
            quote: "lower",
        },
    });
    const upperOnPageOne = createPdfAnnotationNote({
        uuid: "upper",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 1,
            rects: [
                { x1: 10, y1: 5, x2: 11, y2: 6 },
            ],
            quote: "upper",
        },
    });

    const sorted = [pageTwo, lowerOnPageOne, upperOnPageOne]
        .sort((a, b) => comparePdfAnnotationsByPagePosition(a, b) || 0);

    expect(sorted.map(({ uuid }) => uuid)).toEqual(["upper", "lower", "page-two"]);
});

test("PDF annotation navigation target includes id, page, and normalized first rect", () => {
    const note = createPdfAnnotationNote({
        uuid: "target-id",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 4,
            rects: [
                { x1: 30, y1: 40, x2: 10, y2: 20 },
            ],
            quote: "navigable quote",
        },
    });

    expect(getPdfAnnotationNavigationTarget(note)).toEqual({
        id: "target-id",
        page: 4,
        rect: { x1: 10, y1: 20, x2: 30, y2: 40 },
    });
});

test("PDF annotation navigation target rejects invalid page and rect values", () => {
    expect(getPdfAnnotationNavigationTarget(createPdfAnnotationNote({
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 0,
            rects: [
                { x1: 10, y1: 20, x2: 30, y2: 40 },
            ],
        },
    }))).toBeUndefined();
    expect(getPdfAnnotationNavigationTarget(createPdfAnnotationNote({
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 1,
            rects: [
                { x1: 10, y1: 20, x2: Number.NaN, y2: 40 },
            ],
        },
    }))).toBeUndefined();
    expect(normalizePdfAnnotationNavigationRect({ x1: 1, y1: 1, x2: 1, y2: 2 })).toBeUndefined();
});

test("annotation panel save payload preserves and deep-copies pdfAnnotation", () => {
    const source = createPdfAnnotationNote();
    if (!source.pdfAnnotation) {
        throw new Error("expected source PDF annotation");
    }

    const changedColor = { red: 100, green: 110, blue: 120 };
    const changedTags = ["updated-tag"];
    const saved = buildAnnotationPanelSaveNote(source, {
        color: changedColor,
        comment: "updated comment",
        drawType: "underline",
        tags: changedTags,
        modified: 2000,
    });

    expect(saved).toEqual(expect.objectContaining({
        uuid: "pdf-note",
        textualValue: "updated comment",
        drawType: EDrawType.underline,
        tags: ["updated-tag"],
        modified: 2000,
        created: 1000,
        group: "annotation",
        pdfAnnotation: source.pdfAnnotation,
    }));
    expect(saved.pdfAnnotation).not.toBe(source.pdfAnnotation);
    expect(saved.pdfAnnotation?.rects[0]).not.toBe(source.pdfAnnotation?.rects[0]);
    expect(saved.color).not.toBe(changedColor);
    expect(saved.tags).not.toBe(changedTags);

    source.pdfAnnotation.rects[0].x1 = 999;
    changedColor.red = 200;
    changedTags.push("later-change");
    expect(saved.pdfAnnotation?.rects[0].x1).toBe(10);
    expect(saved.color.red).toBe(100);
    expect(saved.tags).toEqual(["updated-tag"]);
});

test("annotation panel save payload preserves EPUB locator data when present", () => {
    const source = createPdfAnnotationNote({
        pdfAnnotation: undefined,
        locatorExtended: {
            selectionInfo: {
                cleanText: "EPUB text",
            },
        } as INoteState["locatorExtended"],
    });
    const saved = buildAnnotationPanelSaveNote(source, {
        color,
        comment: "updated EPUB comment",
        drawType: "solid_background",
        tags: [],
        modified: 3000,
    });

    expect(saved.locatorExtended).toEqual(source.locatorExtended);
    expect(saved.locatorExtended).not.toBe(source.locatorExtended);
    expect(saved.pdfAnnotation).toBeUndefined();
});
