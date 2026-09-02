import * as os from "node:os";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { PublicationNotesController, type PublicationNote } from "readium-desktop/common/publication-notes";
import { EDrawType } from "readium-desktop/common/type/note.type";
import { getSqliteDatabaseSync } from "readium-desktop/main/db/sqlite";
import { sqliteInitTableNote, sqliteTableNoteDeleteWherePubId } from "readium-desktop/main/db/sqlite/note";
import { PublicationNotesImportController } from "readium-desktop/main/publication-notes/importController";
import { SqlitePublicationNoteRepository } from "readium-desktop/main/publication-notes/sqlitePublicationNoteRepository";

function mockUserDataFolderPath(): string {
    return os.tmpdir();
}

jest.mock("electron", () => ({
    app: {
        getPath: () => mockUserDataFolderPath(),
    },
}));

interface SqliteNoteRow {
    note_json: string;
}

const publicationIdentifier = "publication-import-conflict-test";
const testClockNow = Date.parse("2026-07-29T00:00:00.000Z");

let publicationNotesController: PublicationNotesController<PublicationNote>;
let importController: PublicationNotesImportController;

function createNote(overrides: Partial<PublicationNote> = {}): PublicationNote {
    return {
        uuid: "note-import-conflict-test",
        index: 1,
        textualValue: "existing note",
        color: { red: 254, green: 243, blue: 189 },
        drawType: EDrawType.solid_background,
        group: "annotation",
        tags: ["existing"],
        created: Date.parse("2026-01-01T00:00:00.000Z"),
        modified: Date.parse("2026-01-01T00:00:00.000Z"),
        ...overrides,
    };
}

function createDefaultSelector(): unknown {
    return {
        type: "TextQuoteSelector",
        exact: "selected text",
        prefix: "",
        suffix: "",
    };
}

function createAnnotation(
    noteUuid: string,
    value: string,
    modified: string,
    selector: unknown[] = [createDefaultSelector()],
    source = "chapter.xhtml",
): unknown {

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: `urn:uuid:${noteUuid}`,
        created: "2026-01-01T00:00:00.000Z",
        modified,
        type: "Annotation",
        creator: {
            id: "urn:creator:import-test",
            type: "Person",
            name: "Import Test",
        },
        body: {
            type: "TextualBody",
            value,
            color: "pink",
            highlight: "solid",
        },
        target: {
            source,
            selector,
        },
        motivation: "highlighting",
    };
}

function createAnnotationSetFromItems(items: unknown[]): unknown {

    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: "urn:uuid:annotation-import-test-set",
        type: "AnnotationSet",
        about: {},
        items,
    };
}

function createAnnotationSet(noteUuid: string, value: string, modified: string, selector?: unknown[]): unknown {

    return createAnnotationSetFromItems([
        createAnnotation(noteUuid, value, modified, selector),
    ]);
}

function readStoredNoteJson(noteUuid: string): PublicationNote | undefined {
    const row = getSqliteDatabaseSync()
        .prepare("SELECT note_json FROM notes WHERE pub_id=? AND note_id=? LIMIT 1")
        .get(publicationIdentifier, noteUuid) as unknown as SqliteNoteRow | undefined;

    return row ? (JSON.parse(row.note_json) as PublicationNote) : undefined;
}

async function importAnnotation(
    noteUuid: string,
    value: string,
    modified: string,
    decision: "importAll" | "importNoConflict",
) {
    const result = await importController.import({
        publicationIdentifier,
        fileName: noteUuid,
        dataString: JSON.stringify(createAnnotationSet(noteUuid, value, modified)),
        spineItemHrefs: ["chapter.xhtml"],
        decision,
    });

    if (result.status !== "imported") {
        throw new Error(`Expected imported status, got ${result.status}`);
    }

    return result;
}

describe("PublicationNotesImportController", () => {
    beforeAll(() => {
        sqliteInitTableNote();
    });

    beforeEach(() => {
        publicationNotesController = new PublicationNotesController<PublicationNote>({
            repository: new SqlitePublicationNoteRepository(),
        });
        importController = new PublicationNotesImportController({
            publicationNotesController,
            clock: { now: () => testClockNow },
        });
        sqliteTableNoteDeleteWherePubId(publicationIdentifier);
    });

    afterEach(() => {
        sqliteTableNoteDeleteWherePubId(publicationIdentifier);
    });

    afterAll(() => {
        sqliteTableNoteDeleteWherePubId(publicationIdentifier);
    });

    it("persists the incoming newer conflict replacement when importAll is chosen", async () => {
        const noteUuid = "note-import-conflict-newer";
        await publicationNotesController.create(
            publicationIdentifier,
            createNote({
                uuid: noteUuid,
                textualValue: "existing older note",
                modified: Date.parse("2026-01-01T00:00:00.000Z"),
            }),
        );

        const result = await importAnnotation(noteUuid, "incoming newer note", "2026-01-02T00:00:00.000Z", "importAll");

        expect(result.preview.annotationsList).toEqual([]);
        expect(result.preview.annotationsConflictListOlder).toEqual([]);
        expect(result.preview.annotationsConflictListNewer).toHaveLength(1);
        expect(result.changes[0].previousNote?.textualValue).toBe("existing older note");

        expect(readStoredNoteJson(noteUuid)).toMatchObject({
            uuid: noteUuid,
            textualValue: "incoming newer note",
            modified: Date.parse("2026-01-02T00:00:00.000Z"),
            tags: [noteUuid],
            readiumAnnotation: {
                import: {
                    target: {
                        source: "chapter.xhtml",
                    },
                },
            },
        });
    });

    it("persists the incoming older conflict replacement when importAll is chosen", async () => {
        const noteUuid = "note-import-conflict-older";
        await publicationNotesController.create(
            publicationIdentifier,
            createNote({
                uuid: noteUuid,
                textualValue: "existing newer note",
                modified: Date.parse("2026-01-03T00:00:00.000Z"),
            }),
        );

        const result = await importAnnotation(noteUuid, "incoming older note", "2026-01-02T00:00:00.000Z", "importAll");

        expect(result.preview.annotationsList).toEqual([]);
        expect(result.preview.annotationsConflictListOlder).toHaveLength(1);
        expect(result.preview.annotationsConflictListNewer).toEqual([]);
        expect(result.changes[0].previousNote?.textualValue).toBe("existing newer note");

        expect(readStoredNoteJson(noteUuid)).toMatchObject({
            uuid: noteUuid,
            textualValue: "incoming older note",
            modified: Date.parse("2026-01-02T00:00:00.000Z"),
            tags: [noteUuid],
        });
    });

    it("does not overwrite conflicting existing notes when importNoConflict is chosen", async () => {
        const noteUuid = "note-import-conflict-skip";
        await publicationNotesController.create(
            publicationIdentifier,
            createNote({
                uuid: noteUuid,
                textualValue: "existing note kept",
                modified: Date.parse("2026-01-01T00:00:00.000Z"),
            }),
        );

        const result = await importAnnotation(
            noteUuid,
            "incoming conflicting note",
            "2026-01-02T00:00:00.000Z",
            "importNoConflict",
        );

        expect(result.preview.annotationsList).toEqual([]);
        expect(result.preview.annotationsConflictListOlder).toEqual([]);
        expect(result.preview.annotationsConflictListNewer).toHaveLength(1);
        expect(result.changes).toEqual([]);
        expect(readStoredNoteJson(noteUuid)).toMatchObject({
            uuid: noteUuid,
            textualValue: "existing note kept",
            modified: Date.parse("2026-01-01T00:00:00.000Z"),
            tags: ["existing"],
        });
    });

    it("keeps source-mismatched annotations as unresolved import notes", async () => {
        const noteUuid = "note-import-source-mismatch";
        const result = await importController.import({
            publicationIdentifier,
            fileName: noteUuid,
            dataString: JSON.stringify(createAnnotationSetFromItems([
                createAnnotation(
                    noteUuid,
                    "incoming source mismatch note",
                    "2026-01-02T00:00:00.000Z",
                    [createDefaultSelector()],
                    "missing.xhtml",
                ),
            ])),
            spineItemHrefs: ["chapter.xhtml"],
            decision: "importAll",
        });

        if (result.status !== "imported") {
            throw new Error(`Expected imported status, got ${result.status}`);
        }

        expect(result.preview.annotationsList).toHaveLength(1);
        expect(result.preview.importReport.sourceMismatch).toHaveLength(1);
        expect(result.preview.importReport.sourceMismatch[0].uuid).toBe(noteUuid);
        expect(readStoredNoteJson(noteUuid)).toMatchObject({
            uuid: noteUuid,
            readiumAnnotation: {
                import: {
                    target: {
                        source: "missing.xhtml",
                    },
                    unresolved: {
                        reason: "source-mismatch",
                        source: "missing.xhtml",
                        selectorTypes: ["TextQuoteSelector"],
                    },
                },
            },
        });
    });

    it("reports equal incoming notes as already imported", async () => {
        const noteUuid = "note-import-already";
        await publicationNotesController.create(
            publicationIdentifier,
            createNote({
                uuid: noteUuid,
                textualValue: "already imported note",
                modified: Date.parse("2026-01-02T00:00:00.000Z"),
            }),
        );

        const result = await importController.preview({
            publicationIdentifier,
            fileName: noteUuid,
            dataString: JSON.stringify(createAnnotationSet(
                noteUuid,
                "already imported note",
                "2026-01-02T00:00:00.000Z",
            )),
            spineItemHrefs: ["chapter.xhtml"],
        });

        expect(result.status).toBe("alreadyImported");
        if (result.status !== "alreadyImported") {
            throw new Error(`Expected alreadyImported status, got ${result.status}`);
        }

        expect(result.importReport.annotationsAlreadyImportedList).toHaveLength(1);
        expect(result.importReport.annotationsAlreadyImportedList[0].uuid).toBe(noteUuid);
        expect(result.importReport.annotationsConflictListNewer).toEqual([]);
        expect(result.importReport.annotationsConflictListOlder).toEqual([]);
    });

    it("keeps annotations without a supported selector as unresolved import notes", async () => {
        const noteUuid = "note-import-unsupported-selector";
        const result = await importController.preview({
            publicationIdentifier,
            fileName: noteUuid,
            dataString: JSON.stringify(createAnnotationSet(
                noteUuid,
                "incoming unsupported selector note",
                "2026-01-02T00:00:00.000Z",
                [{ type: "RangeSelector" }],
            )),
            spineItemHrefs: ["chapter.xhtml"],
        });

        if (result.status !== "ready") {
            throw new Error(`Expected ready status, got ${result.status}`);
        }

        expect(result.annotationsList).toHaveLength(1);
        expect(result.annotationsList[0]).toMatchObject({
            uuid: noteUuid,
            readiumAnnotation: {
                import: {
                    target: {
                        source: "chapter.xhtml",
                    },
                    unresolved: {
                        reason: "unsupported-selector",
                        source: "chapter.xhtml",
                        selectorTypes: ["RangeSelector"],
                        message: "The annotation does not include a supported selector.",
                    },
                },
            },
        });
        expect(result.importReport.unsupportedSelector).toHaveLength(1);
        expect(result.importReport.unsupportedSelector[0].uuid).toBe(noteUuid);
        expect(result.importReport.selectorNotFound).toEqual([]);
        expect(result.importReport.ambiguousMatch).toEqual([]);
        expect(result.importReport.sourceMismatch).toEqual([]);
    });

    it("keeps importable annotations and reports unresolved annotations in the ready preview", async () => {
        const importableNoteUuid = "note-import-ready";
        const unresolvedNoteUuid = "note-import-ready-unresolved";
        const result = await importController.preview({
            publicationIdentifier,
            fileName: "mixed-import",
            dataString: JSON.stringify(createAnnotationSetFromItems([
                createAnnotation(importableNoteUuid, "incoming supported note", "2026-01-02T00:00:00.000Z"),
                createAnnotation(
                    unresolvedNoteUuid,
                    "incoming unsupported selector note",
                    "2026-01-02T00:00:00.000Z",
                    [{ type: "ProgressionSelector", value: 0.42 }],
                ),
            ])),
            spineItemHrefs: ["chapter.xhtml"],
        });

        if (result.status !== "ready") {
            throw new Error(`Expected ready status, got ${result.status}`);
        }

        expect(result.annotationsList).toHaveLength(2);
        expect(result.annotationsList[0].uuid).toBe(importableNoteUuid);
        expect(result.annotationsList[1]).toMatchObject({
            uuid: unresolvedNoteUuid,
            readiumAnnotation: {
                import: {
                    unresolved: {
                        reason: "unsupported-selector",
                        selectorTypes: ["ProgressionSelector"],
                    },
                },
            },
        });
        expect(result.importReport.unsupportedSelector).toHaveLength(1);
        expect(result.importReport.unsupportedSelector[0].uuid).toBe(unresolvedNoteUuid);
    });
});
