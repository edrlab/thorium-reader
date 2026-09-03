import * as os from "os";
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

function createAnnotationSet(noteUuid: string, value: string, modified: string): unknown {
    return {
        "@context": "http://www.w3.org/ns/anno.jsonld",
        id: `urn:uuid:${noteUuid}-set`,
        type: "AnnotationSet",
        about: {},
        items: [
            {
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
                    source: "chapter.xhtml",
                    selector: [
                        {
                            type: "TextQuoteSelector",
                            exact: "selected text",
                            prefix: "",
                            suffix: "",
                        },
                    ],
                },
                motivation: "highlighting",
            },
        ],
    };
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
});
