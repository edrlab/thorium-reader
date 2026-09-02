import { describe, expect, it, jest } from "@jest/globals";

import type { ISelector } from "readium-desktop/common/readium/annotation/annotationModel.type";
import type { PublicationNote } from "readium-desktop/common/publication-notes";
import type { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { EDrawType } from "readium-desktop/common/type/note.type";
import {
    IReadiumAnnotationSelectorControllerDependencies,
    ReadiumAnnotationSelectorController,
} from "readium-desktop/renderer/reader/readiumAnnotation/selectorController";

const xmlDom = {} as Document;

const textPositionSelector = {
    type: "TextPositionSelector",
    start: 7,
    end: 21,
} as ISelector;

const locatorExtended = {
    locator: {
        href: "chapter.xhtml",
        locations: {
            cssSelector: "body > p",
            progression: 0.25,
        },
    },
    selectionInfo: {
        textFragment: undefined,
        rangeInfo: {
            startContainerElementCssSelector: "body > p",
            startContainerElementXPath: undefined,
            startContainerChildTextNodeIndex: 0,
            startOffset: 7,
            endContainerElementCssSelector: "body > p",
            endContainerElementXPath: undefined,
            endContainerChildTextNodeIndex: 0,
            endOffset: 21,
            cfi: undefined,
        },
        cleanBefore: "",
        cleanText: "selected text",
        cleanAfter: "",
        rawBefore: "",
        rawText: "selected text",
        rawAfter: "",
    },
} as MiniLocatorExtended;

const importTarget = {
    source: "chapter.xhtml",
    selector: [textPositionSelector],
} as NonNullable<NonNullable<PublicationNote["readiumAnnotation"]>["import"]>["target"];

function createNote(overrides: Partial<PublicationNote> = {}): PublicationNote {

    return {
        uuid: "note-1",
        index: 1,
        created: 1,
        color: { red: 255, green: 255, blue: 0 },
        drawType: EDrawType.solid_background,
        group: "annotation",
        ...overrides,
    };
}

function createDependencies(
    overrides: Partial<IReadiumAnnotationSelectorControllerDependencies> = {},
): IReadiumAnnotationSelectorControllerDependencies {

    return {
        getResourceCache: jest.fn(async () => ({ xmlDom })),
        createExportSelectors: jest.fn(async () => [textPositionSelector]),
        convertImportTargetToLocatorExtended: jest.fn(async () => locatorExtended),
        hasGeneratedExportSelectors: jest.fn(() => false),
        ...overrides,
    };
}

function asMock(fn: unknown): jest.Mock {

    return fn as jest.Mock;
}

describe("ReadiumAnnotationSelectorController", () => {

    it("resolves an export selector update for a locator-backed note", async () => {
        const dependencies = createDependencies();
        const controller = new ReadiumAnnotationSelectorController(dependencies);
        const note = createNote({
            locatorExtended,
            readiumAnnotation: {
                import: {
                    target: importTarget,
                },
            },
        });

        const updates = await controller.resolvePublicationNoteUpdates(
            note,
            { isReaderLocked: true, isLcp: false },
        );

        expect(asMock(dependencies.getResourceCache)).toHaveBeenCalledWith("chapter.xhtml");
        expect(asMock(dependencies.createExportSelectors)).toHaveBeenCalledWith(
            note,
            false,
            "chapter.xhtml",
            xmlDom,
        );
        expect(updates).toEqual([{
            kind: "exportSelector",
            previousNote: note,
            note: {
                ...note,
                readiumAnnotation: {
                    import: {
                        target: importTarget,
                    },
                    export: {
                        selector: [textPositionSelector],
                    },
                },
            },
        }]);
        expect(updates[0].note).not.toBe(note);
    });

    it("skips all selector work when the reader is not locked", async () => {
        const dependencies = createDependencies();
        const controller = new ReadiumAnnotationSelectorController(dependencies);
        const note = createNote({
            locatorExtended,
            readiumAnnotation: {
                import: {
                    target: importTarget,
                },
            },
        });

        const updates = await controller.resolvePublicationNoteUpdates(
            note,
            { isReaderLocked: false, isLcp: false },
        );

        expect(updates).toEqual([]);
        expect(asMock(dependencies.getResourceCache)).not.toHaveBeenCalled();
        expect(asMock(dependencies.createExportSelectors)).not.toHaveBeenCalled();
        expect(asMock(dependencies.convertImportTargetToLocatorExtended)).not.toHaveBeenCalled();
    });

    it("skips export selector work when the note already has generated selectors", async () => {
        const dependencies = createDependencies({
            hasGeneratedExportSelectors: jest.fn(() => true),
        });
        const controller = new ReadiumAnnotationSelectorController(dependencies);
        const note = createNote({ locatorExtended });

        await expect(controller.resolvePublicationNoteUpdates(
            note,
            { isReaderLocked: true, isLcp: false },
        )).resolves.toEqual([]);

        expect(asMock(dependencies.getResourceCache)).not.toHaveBeenCalled();
        expect(asMock(dependencies.createExportSelectors)).not.toHaveBeenCalled();
    });

    it("leaves export selectors retryable when the resource cache has no XML DOM", async () => {
        const dependencies = createDependencies({
            getResourceCache: jest.fn(async () => undefined),
            createExportSelectors: jest.fn(async () => []),
        });
        const controller = new ReadiumAnnotationSelectorController(dependencies);
        const note = createNote({ locatorExtended });

        await expect(controller.resolvePublicationNoteUpdates(
            note,
            { isReaderLocked: true, isLcp: false },
        )).resolves.toEqual([]);

        expect(asMock(dependencies.getResourceCache)).toHaveBeenCalledWith("chapter.xhtml");
        expect(asMock(dependencies.createExportSelectors)).toHaveBeenCalledWith(
            note,
            false,
            "chapter.xhtml",
            undefined,
        );
    });

    it("does not persist empty generated export selectors", async () => {
        const dependencies = createDependencies({
            createExportSelectors: jest.fn(async () => []),
        });
        const controller = new ReadiumAnnotationSelectorController(dependencies);
        const note = createNote({ locatorExtended });

        await expect(controller.resolvePublicationNoteUpdates(
            note,
            { isReaderLocked: true, isLcp: false },
        )).resolves.toEqual([]);

        expect(asMock(dependencies.createExportSelectors)).toHaveBeenCalledWith(
            note,
            false,
            "chapter.xhtml",
            xmlDom,
        );
    });

    it("treats an existing empty export selector array as retryable", async () => {
        const dependencies = createDependencies();
        const controller = new ReadiumAnnotationSelectorController(dependencies);
        const note = createNote({
            locatorExtended,
            readiumAnnotation: {
                export: {
                    selector: [],
                },
            },
        });

        const updates = await controller.resolvePublicationNoteUpdates(
            note,
            { isReaderLocked: true, isLcp: false },
        );

        expect(asMock(dependencies.createExportSelectors)).toHaveBeenCalledWith(
            note,
            false,
            "chapter.xhtml",
            xmlDom,
        );
        expect(updates).toEqual([{
            kind: "exportSelector",
            previousNote: note,
            note: {
                ...note,
                readiumAnnotation: {
                    export: {
                        selector: [textPositionSelector],
                    },
                },
            },
        }]);
    });

    it("resolves a locator update for an imported selector-backed note", async () => {
        const dependencies = createDependencies();
        const controller = new ReadiumAnnotationSelectorController(dependencies);
        const note = createNote({
            group: "bookmark",
            readiumAnnotation: {
                import: {
                    target: importTarget,
                },
            },
        });

        const updates = await controller.resolvePublicationNoteUpdates(
            note,
            { isReaderLocked: true, isLcp: false },
        );

        expect(asMock(dependencies.getResourceCache)).toHaveBeenCalledWith("chapter.xhtml");
        expect(asMock(dependencies.convertImportTargetToLocatorExtended)).toHaveBeenCalledWith(
            importTarget,
            true,
            xmlDom,
            "chapter.xhtml",
        );
        expect(updates).toEqual([{
            kind: "importLocator",
            previousNote: note,
            note: {
                ...note,
                locatorExtended,
            },
        }]);
    });

    it("resolves mixed publication note updates in order", async () => {
        const dependencies = createDependencies();
        const controller = new ReadiumAnnotationSelectorController(dependencies);
        const exportNote = createNote({
            uuid: "export-note",
            locatorExtended,
        });
        const importNote = createNote({
            uuid: "import-note",
            readiumAnnotation: {
                import: {
                    target: importTarget,
                },
            },
        });
        const skippedNote = createNote({
            uuid: "skipped-note",
        });

        const updates = await controller.resolvePublicationNotesUpdates(
            [exportNote, importNote, skippedNote],
            { isReaderLocked: true, isLcp: false },
        );

        expect(updates).toEqual([
            {
                kind: "exportSelector",
                previousNote: exportNote,
                note: {
                    ...exportNote,
                    readiumAnnotation: {
                        export: {
                            selector: [textPositionSelector],
                        },
                    },
                },
            },
            {
                kind: "importLocator",
                previousNote: importNote,
                note: {
                    ...importNote,
                    locatorExtended,
                },
            },
        ]);
    });

    it("uses the injected yield hook before each batch note", async () => {
        const dependencies = createDependencies({
            yieldBeforeNote: jest.fn(async () => undefined),
        });
        const controller = new ReadiumAnnotationSelectorController(dependencies);
        const firstNote = createNote({
            uuid: "first-note",
            locatorExtended,
        });
        const secondNote = createNote({
            uuid: "second-note",
        });

        await controller.resolvePublicationNotesUpdates(
            [firstNote, secondNote],
            { isReaderLocked: true, isLcp: false },
        );

        expect(asMock(dependencies.yieldBeforeNote)).toHaveBeenNthCalledWith(1, firstNote);
        expect(asMock(dependencies.yieldBeforeNote)).toHaveBeenNthCalledWith(2, secondNote);
    });

    it("continues batch processing when one note update fails", async () => {
        const error = new Error("selector failure");
        const dependencies = createDependencies({
            createExportSelectors: jest.fn(async (note: PublicationNote) => {
                if (note.uuid === "failing-note") {
                    throw error;
                }

                return [textPositionSelector];
            }),
            onError: jest.fn(),
        });
        const controller = new ReadiumAnnotationSelectorController(dependencies);
        const failingNote = createNote({
            uuid: "failing-note",
            locatorExtended,
        });
        const importNote = createNote({
            uuid: "import-note",
            readiumAnnotation: {
                import: {
                    target: importTarget,
                },
            },
        });

        const updates = await controller.resolvePublicationNotesUpdates(
            [failingNote, importNote],
            { isReaderLocked: true, isLcp: false },
        );

        expect(updates).toEqual([{
            kind: "importLocator",
            previousNote: importNote,
            note: {
                ...importNote,
                locatorExtended,
            },
        }]);
        expect(asMock(dependencies.onError)).toHaveBeenCalledWith(error, failingNote);
    });

    it("continues batch processing when the injected yield hook fails", async () => {
        const error = new Error("yield failure");
        const dependencies = createDependencies({
            onError: jest.fn(),
            yieldBeforeNote: jest.fn(async (note: PublicationNote) => {
                if (note.uuid === "failing-note") {
                    throw error;
                }
            }),
        });
        const controller = new ReadiumAnnotationSelectorController(dependencies);
        const failingNote = createNote({
            uuid: "failing-note",
            locatorExtended,
        });
        const importNote = createNote({
            uuid: "import-note",
            readiumAnnotation: {
                import: {
                    target: importTarget,
                },
            },
        });

        const updates = await controller.resolvePublicationNotesUpdates(
            [failingNote, importNote],
            { isReaderLocked: true, isLcp: false },
        );

        expect(updates).toEqual([{
            kind: "importLocator",
            previousNote: importNote,
            note: {
                ...importNote,
                locatorExtended,
            },
        }]);
        expect(asMock(dependencies.onError)).toHaveBeenCalledWith(error, failingNote);
        expect(asMock(dependencies.createExportSelectors)).not.toHaveBeenCalledWith(
            failingNote,
            false,
            "chapter.xhtml",
            xmlDom,
        );
    });

    it("skips import selector work when conversion does not return a locator", async () => {
        const dependencies = createDependencies({
            convertImportTargetToLocatorExtended: jest.fn(async () => undefined),
        });
        const controller = new ReadiumAnnotationSelectorController(dependencies);
        const note = createNote({
            readiumAnnotation: {
                import: {
                    target: importTarget,
                },
            },
        });

        await expect(controller.resolvePublicationNoteUpdates(
            note,
            { isReaderLocked: true, isLcp: false },
        )).resolves.toEqual([]);
    });
});
