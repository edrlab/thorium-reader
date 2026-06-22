import { expect, jest, test } from "@jest/globals";

import { EDrawType } from "readium-desktop/common/redux/states/renderer/note";
import type { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import {
    buildAnnotationPanelSaveNote,
    canDeleteAnnotationInPanel,
    canEditAnnotationInPanel,
    canUseReadiumAnnotationImportExport,
    compareAnnotationPanelProgression,
    comparePdfAnnotationsByPagePosition,
    filterDeletableAnnotationPanelNotes,
    getAnnotationCardText,
    getAnnotationPanelNavigation,
    getAnnotationSelectionText,
    getCreatedPdfAnnotationEditMenuAction,
    getPdfAnnotationSelectionMenuAction,
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
            rects: [{ x1: 10, y1: 20, x2: 30, y2: 40 }],
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

test("annotation panel action model allows editing and deleting PDF annotations", () => {
    const pdfNote = createPdfAnnotationNote({ uuid: "pdf-editable" });
    const epubNote = createEpubAnnotationNote({ uuid: "epub-editable" });

    expect(isPdfAnnotationPanelNote(pdfNote)).toBe(true);
    expect(canEditAnnotationInPanel(pdfNote)).toBe(true);
    expect(canDeleteAnnotationInPanel(pdfNote)).toBe(true);
    expect(canEditAnnotationInPanel(epubNote)).toBe(true);
    expect(canDeleteAnnotationInPanel(epubNote)).toBe(true);
    expect(filterDeletableAnnotationPanelNotes([pdfNote, epubNote]).map(({ uuid }) => uuid)).toEqual([
        "pdf-editable",
        "epub-editable",
    ]);
});

test("annotation panel navigation model routes EPUB locators and PDF targets", () => {
    const epubNote = createEpubAnnotationNote();
    const pdfNote = createPdfAnnotationNote({
        uuid: "pdf-navigable",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 7,
            rects: [{ x1: 40, y1: 50, x2: 10, y2: 20 }],
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
    expect(
        getAnnotationPanelNavigation(
            createPdfAnnotationNote({
                pdfAnnotation: {
                    type: "pdf-text-highlight",
                    page: 3,
                    rects: [{ x1: 10, y1: 20, x2: 10, y2: 40 }],
                },
            }),
        ),
    ).toBeUndefined();
});

test("PDF annotation selection menu action opens the annotation panel without editing by default", () => {
    const pdfNote = createPdfAnnotationNote({ uuid: "selected-pdf" });

    expect(
        getPdfAnnotationSelectionMenuAction(
            {
                id: "selected-pdf",
                page: 3,
                rectIndex: 0,
                rect: { x1: 10, y1: 20, x2: 30, y2: 40 },
                source: "overlay-click",
                shiftKey: false,
                altKey: false,
                ctrlKey: false,
                metaKey: false,
            },
            [pdfNote],
        ),
    ).toEqual({
        open: true,
        section: "tab-annotation",
        id: "selected-pdf",
        focus: true,
        edit: false,
    });
});

test("PDF annotation selection menu action enables controlled editing with shift click", () => {
    const pdfNote = createPdfAnnotationNote({ uuid: "selected-pdf" });

    expect(
        getPdfAnnotationSelectionMenuAction(
            {
                id: "selected-pdf",
                page: 3,
                rectIndex: 0,
                rect: { x1: 10, y1: 20, x2: 30, y2: 40 },
                source: "overlay-click",
                shiftKey: true,
                altKey: false,
                ctrlKey: false,
                metaKey: false,
            },
            [pdfNote],
        ),
    ).toEqual(
        expect.objectContaining({
            id: "selected-pdf",
            edit: true,
        }),
    );
});

test("created PDF annotation menu action opens the annotation panel in edit mode", () => {
    const pdfNote = createPdfAnnotationNote({ uuid: "created-pdf" });

    expect(getCreatedPdfAnnotationEditMenuAction(pdfNote)).toEqual({
        open: true,
        section: "tab-annotation",
        id: "created-pdf",
        focus: true,
        edit: true,
    });
    expect(
        getCreatedPdfAnnotationEditMenuAction(
            createPdfAnnotationNote({
                uuid: "",
            }),
        ),
    ).toBeUndefined();
    expect(
        getCreatedPdfAnnotationEditMenuAction(
            createEpubAnnotationNote({
                uuid: "created-epub",
            }),
        ),
    ).toBeUndefined();
});

test("created PDF annotation menu action is skipped when editor opening is disabled", () => {
    const pdfNote = createPdfAnnotationNote({ uuid: "created-pdf" });

    expect(
        getCreatedPdfAnnotationEditMenuAction(pdfNote, {
            skipEditor: true,
        }),
    ).toBeUndefined();
});

test("PDF annotation selection menu action rejects invalid payloads and non-PDF notes", () => {
    const pdfNote = createPdfAnnotationNote({ uuid: "selected-pdf" });
    const epubNote = createEpubAnnotationNote({ uuid: "selected-epub" });

    expect(getPdfAnnotationSelectionMenuAction(undefined, [pdfNote])).toBeUndefined();
    expect(
        getPdfAnnotationSelectionMenuAction(
            {
                id: "",
                page: 3,
            },
            [pdfNote],
        ),
    ).toBeUndefined();
    expect(
        getPdfAnnotationSelectionMenuAction(
            {
                id: "selected-pdf",
                page: 0,
            },
            [pdfNote],
        ),
    ).toBeUndefined();
    expect(
        getPdfAnnotationSelectionMenuAction(
            {
                id: "missing",
                page: 3,
            },
            [pdfNote],
        ),
    ).toBeUndefined();
    expect(
        getPdfAnnotationSelectionMenuAction(
            {
                id: "selected-epub",
                page: 3,
                rectIndex: 0,
                rect: { x1: 10, y1: 20, x2: 30, y2: 40 },
                source: "overlay-click",
                shiftKey: true,
                altKey: false,
                ctrlKey: false,
                metaKey: false,
            },
            [epubNote],
        ),
    ).toBeUndefined();
    expect(
        getPdfAnnotationSelectionMenuAction(
            {
                id: "selected-pdf",
                page: 3,
                rectIndex: 0,
                rect: { x1: 10, y1: 20, x2: 30, y2: 40 },
                shiftKey: false,
                altKey: false,
                ctrlKey: false,
                metaKey: false,
            },
            [pdfNote],
        ),
    ).toBeUndefined();
    expect(
        getPdfAnnotationSelectionMenuAction(
            {
                id: "selected-pdf",
                page: 3,
                rectIndex: 0,
                rect: { x1: 10, y1: 20, x2: 10, y2: 40 },
                source: "overlay-click",
                shiftKey: false,
                altKey: false,
                ctrlKey: false,
                metaKey: false,
            },
            [pdfNote],
        ),
    ).toBeUndefined();
    expect(
        getPdfAnnotationSelectionMenuAction(
            {
                id: "selected-pdf",
                page: 3,
                rect: { x1: 10, y1: 20, x2: 30, y2: 40 },
                source: "overlay-click",
                shiftKey: false,
                altKey: false,
                ctrlKey: false,
                metaKey: false,
            },
            [pdfNote],
        ),
    ).toBeUndefined();
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

test("PDF annotations sort by page, visual top-to-bottom position, horizontal position, then id", () => {
    const pageTwo = createPdfAnnotationNote({
        uuid: "page-two",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 2,
            rects: [{ x1: 1, y1: 1, x2: 2, y2: 2 }],
            quote: "page two",
        },
    });
    const lowerOnPageOne = createPdfAnnotationNote({
        uuid: "lower",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 1,
            rects: [{ x1: 1, y1: 20, x2: 2, y2: 30 }],
            quote: "lower",
        },
    });
    const upperOnPageOne = createPdfAnnotationNote({
        uuid: "upper",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 1,
            rects: [{ x1: 10, y1: 80, x2: 11, y2: 90 }],
            quote: "upper",
        },
    });
    const leftOnSameLine = createPdfAnnotationNote({
        uuid: "left",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 1,
            rects: [{ x1: 1, y1: 80, x2: 2, y2: 90 }],
            quote: "left",
        },
    });

    const sorted = [pageTwo, lowerOnPageOne, upperOnPageOne, leftOnSameLine].sort(
        (a, b) => comparePdfAnnotationsByPagePosition(a, b) || 0,
    );

    expect(sorted.map(({ uuid }) => uuid)).toEqual(["left", "upper", "lower", "page-two"]);
});

test("annotation panel progression comparator uses PDF visual order before EPUB progression", () => {
    const pdfLower = createPdfAnnotationNote({
        uuid: "pdf-lower",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 1,
            rects: [{ x1: 1, y1: 20, x2: 2, y2: 30 }],
        },
    });
    const pdfUpper = createPdfAnnotationNote({
        uuid: "pdf-upper",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 1,
            rects: [{ x1: 1, y1: 80, x2: 2, y2: 90 }],
        },
    });
    const epubEarly = createEpubAnnotationNote({
        uuid: "epub-early",
        locatorExtended: {
            locator: {
                href: "chapter.xhtml",
                locations: {
                    progression: 0.1,
                },
            },
        } as INoteState["locatorExtended"],
    });
    const epubLate = createEpubAnnotationNote({
        uuid: "epub-late",
        locatorExtended: {
            locator: {
                href: "chapter.xhtml",
                locations: {
                    progression: 0.9,
                },
            },
        } as INoteState["locatorExtended"],
    });
    const compareEpubProgression = jest.fn((left: INoteState, right: INoteState) => {
        return (
            (left.locatorExtended?.locator.locations?.progression || 0) -
            (right.locatorExtended?.locator.locations?.progression || 0)
        );
    });

    expect(compareAnnotationPanelProgression(pdfLower, pdfUpper, compareEpubProgression)).toBeGreaterThan(0);
    expect(compareEpubProgression).not.toHaveBeenCalled();

    expect(compareAnnotationPanelProgression(epubEarly, epubLate, compareEpubProgression)).toBeLessThan(0);
    expect(compareEpubProgression).toHaveBeenCalledTimes(1);
});

test("PDF annotation navigation target includes id, page, and normalized first rect", () => {
    const note = createPdfAnnotationNote({
        uuid: "target-id",
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 4,
            rects: [{ x1: 30, y1: 40, x2: 10, y2: 20 }],
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
    expect(
        getPdfAnnotationNavigationTarget(
            createPdfAnnotationNote({
                pdfAnnotation: {
                    type: "pdf-text-highlight",
                    page: 0,
                    rects: [{ x1: 10, y1: 20, x2: 30, y2: 40 }],
                },
            }),
        ),
    ).toBeUndefined();
    expect(
        getPdfAnnotationNavigationTarget(
            createPdfAnnotationNote({
                pdfAnnotation: {
                    type: "pdf-text-highlight",
                    page: 1,
                    rects: [{ x1: 10, y1: 20, x2: Number.NaN, y2: 40 }],
                },
            }),
        ),
    ).toBeUndefined();
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

    expect(saved).toEqual(
        expect.objectContaining({
            uuid: "pdf-note",
            textualValue: "updated comment",
            drawType: EDrawType.underline,
            tags: ["updated-tag"],
            modified: 2000,
            created: 1000,
            group: "annotation",
            pdfAnnotation: source.pdfAnnotation,
        }),
    );
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
