import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "@jest/globals";

import {
    PublicationNotesController,
    type PublicationNote,
    type PublicationNoteRepository,
} from "readium-desktop/common/publication-notes";
import { EDrawType } from "readium-desktop/common/type/note.type";
import { PublicationNotesImportController } from "readium-desktop/main/publication-notes/importController";

const publicationIdentifier = "accessible-epub-3-annotation-file-test";
const testClockNow = Date.parse("2026-07-30T00:00:00.000Z");
const annotationFixturesFolder = path.join(process.cwd(), "test", "annotations");
const accessibleEpub3SpineItemHrefs = [
    "EPUB/cover.xhtml",
    "EPUB/spi-ad.xhtml",
    "EPUB/index.xhtml",
    "EPUB/bk01-toc.xhtml",
    "EPUB/pr01.xhtml",
    "EPUB/pr01s02.xhtml",
    "EPUB/pr01s03.xhtml",
    "EPUB/pr01s04.xhtml",
    "EPUB/pr01s05.xhtml",
    "EPUB/ch01.xhtml",
    "EPUB/ch01s02.xhtml",
    "EPUB/ch02.xhtml",
    "EPUB/ch02s02.xhtml",
    "EPUB/ch02s03.xhtml",
    "EPUB/ch03.xhtml",
    "EPUB/ch03s02.xhtml",
    "EPUB/ch03s03.xhtml",
    "EPUB/ch03s04.xhtml",
    "EPUB/ch03s05.xhtml",
    "EPUB/ch03s06.xhtml",
    "EPUB/ch04.xhtml",
    "EPUB/co01.xhtml",
];

class MemoryPublicationNoteRepository implements PublicationNoteRepository<PublicationNote> {
    public readonly notesByPublication = new Map<string, PublicationNote[]>();

    public async list(publicationIdentifier: string): Promise<PublicationNote[]> {
        return [...(this.notesByPublication.get(publicationIdentifier) || [])];
    }

    public async get(publicationIdentifier: string, noteIdentifier: string): Promise<PublicationNote | undefined> {
        return (await this.list(publicationIdentifier)).find((note) => note.uuid === noteIdentifier);
    }

    public async create(publicationIdentifier: string, note: PublicationNote): Promise<void> {
        const notes = await this.list(publicationIdentifier);
        this.notesByPublication.set(publicationIdentifier, [...notes, note]);
    }

    public async replace(publicationIdentifier: string, note: PublicationNote): Promise<void> {
        const notes = await this.list(publicationIdentifier);
        this.notesByPublication.set(publicationIdentifier, [
            ...notes.filter(({ uuid }) => uuid !== note.uuid),
            note,
        ]);
    }

    public async update(publicationIdentifier: string, note: PublicationNote): Promise<void> {
        await this.replace(publicationIdentifier, note);
    }

    public async delete(publicationIdentifier: string, noteIdentifier: string): Promise<void> {
        const notes = await this.list(publicationIdentifier);
        this.notesByPublication.set(
            publicationIdentifier,
            notes.filter(({ uuid }) => uuid !== noteIdentifier),
        );
    }

    public async deleteByPublication(publicationIdentifier: string): Promise<void> {
        this.notesByPublication.delete(publicationIdentifier);
    }
}

function readAnnotationFixture(fileName: string): string {
    return fs.readFileSync(path.join(annotationFixturesFolder, fileName), { encoding: "utf8" });
}

function createImportController(existingNotes: PublicationNote[] = []): PublicationNotesImportController {
    const repository = new MemoryPublicationNoteRepository();
    repository.notesByPublication.set(publicationIdentifier, existingNotes);

    const publicationNotesController = new PublicationNotesController<PublicationNote>({
        repository,
        clock: {
            now: () => testClockNow,
        },
    });

    return new PublicationNotesImportController({
        publicationNotesController,
        clock: {
            now: () => testClockNow,
        },
    });
}

async function previewFixture(fileName: string, existingNotes: PublicationNote[] = []) {
    return createImportController(existingNotes).preview({
        publicationIdentifier,
        fileName,
        dataString: readAnnotationFixture(fileName),
        spineItemHrefs: accessibleEpub3SpineItemHrefs,
    });
}

describe("Accessible EPUB 3 annotation files", () => {
    it("loads the valid annotation fixture as importable publication notes", async () => {
        const result = await previewFixture("accessible_epub_3-valid-basic.annotation");

        expect(result.status).toBe("ready");
        if (result.status !== "ready") {
            throw new Error(`Expected ready status, got ${result.status}`);
        }

        expect(result.title).toBe("Accessible EPUB 3 - valid annotations");
        expect(result.about?.["dc:identifier"]).toEqual(["urn:isbn:9781449328030"]);
        expect(result.annotationsList.map(({ uuid }) => uuid)).toEqual([
            "accessible-epub-3-basic-text-quote",
            "accessible-epub-3-basic-css",
            "accessible-epub-3-basic-position",
        ]);
        expect(result.annotationsList.map(({ drawType }) => drawType)).toEqual([
            EDrawType.solid_background,
            EDrawType.underline,
            EDrawType.outline,
        ]);
        expect(result.annotationsList.map(({ readiumAnnotation }) => readiumAnnotation?.import?.target.source)).toEqual([
            "EPUB/pr01.xhtml",
            "EPUB/ch01.xhtml",
            "EPUB/ch02.xhtml",
        ]);
        expect(result.importReport.sourceMismatch).toEqual([]);
        expect(result.importReport.unsupportedSelector).toEqual([]);
        expect(result.importReport.annotationsAlreadyImportedList).toEqual([]);
    });

    it("loads a Readium bookmarking annotation as a Thorium bookmark note", async () => {
        const result = await previewFixture("accessible_epub_3-bookmark.annotation");

        expect(result.status).toBe("ready");
        if (result.status !== "ready") {
            throw new Error(`Expected ready status, got ${result.status}`);
        }

        expect(result.annotationsList).toHaveLength(1);
        expect(result.annotationsList[0]).toMatchObject({
            uuid: "accessible-epub-3-bookmark-preface",
            group: "bookmark",
            drawType: EDrawType.bookmark,
            readiumAnnotation: {
                import: {
                    target: {
                        source: "EPUB/pr01.xhtml",
                    },
                },
            },
        });
    });

    it("normalizes absolute annotation source URLs to Accessible EPUB 3 spine hrefs", async () => {
        const result = await previewFixture("accessible_epub_3-source-normalization.annotation");

        expect(result.status).toBe("ready");
        if (result.status !== "ready") {
            throw new Error(`Expected ready status, got ${result.status}`);
        }

        expect(result.annotationsList).toHaveLength(1);
        expect(result.annotationsList[0].readiumAnnotation?.import).toMatchObject({
            target: {
                source: "EPUB/ch01.xhtml",
            },
            originalTarget: {
                source: "https://example.org/publications/accessible-epub-3/EPUB/ch01.xhtml?source=fixture#introduction",
            },
        });
        expect(result.annotationsList[0].readiumAnnotation?.import?.unresolved).toBeUndefined();
    });

    it("keeps source-mismatched annotation files importable and reports them as unresolved", async () => {
        const result = await previewFixture("accessible_epub_3-source-mismatch.annotation");

        expect(result.status).toBe("ready");
        if (result.status !== "ready") {
            throw new Error(`Expected ready status, got ${result.status}`);
        }

        expect(result.importReport.sourceMismatch.map(({ uuid }) => uuid)).toEqual([
            "accessible-epub-3-missing-source",
        ]);
        expect(result.annotationsList[0].readiumAnnotation?.import?.unresolved).toMatchObject({
            reason: "source-mismatch",
            source: "EPUB/missing.xhtml",
            selectorTypes: ["TextQuoteSelector"],
        });
    });

    it("keeps unsupported selector annotation files importable and reports them as unresolved", async () => {
        const result = await previewFixture("accessible_epub_3-unsupported-selector.annotation");

        expect(result.status).toBe("ready");
        if (result.status !== "ready") {
            throw new Error(`Expected ready status, got ${result.status}`);
        }

        expect(result.importReport.unsupportedSelector.map(({ uuid }) => uuid)).toEqual([
            "accessible-epub-3-unsupported-progression",
        ]);
        expect(result.annotationsList[0].readiumAnnotation?.import?.unresolved).toMatchObject({
            reason: "unsupported-selector",
            source: "EPUB/ch01.xhtml",
            selectorTypes: ["ProgressionSelector"],
        });
    });

    it("classifies fixture annotations that conflict with existing notes", async () => {
        const importController = createImportController();
        const seedResult = await importController.import({
            publicationIdentifier,
            fileName: "accessible_epub_3-conflicts-seed.annotation",
            dataString: readAnnotationFixture("accessible_epub_3-conflicts-seed.annotation"),
            spineItemHrefs: accessibleEpub3SpineItemHrefs,
            decision: "importAll",
        });

        expect(seedResult.status).toBe("imported");

        const result = await importController.preview({
            publicationIdentifier,
            fileName: "accessible_epub_3-conflicts.annotation",
            dataString: readAnnotationFixture("accessible_epub_3-conflicts.annotation"),
            spineItemHrefs: accessibleEpub3SpineItemHrefs,
        });

        expect(result.status).toBe("ready");
        if (result.status !== "ready") {
            throw new Error(`Expected ready status, got ${result.status}`);
        }

        expect(result.annotationsList).toEqual([]);
        expect(result.annotationsConflictListNewer.map(({ uuid }) => uuid)).toEqual([
            "accessible-epub-3-conflict-newer",
        ]);
        expect(result.annotationsConflictListOlder.map(({ uuid }) => uuid)).toEqual([
            "accessible-epub-3-conflict-older",
        ]);
        expect(result.importReport.annotationsAlreadyImportedList.map(({ uuid }) => uuid)).toEqual([
            "accessible-epub-3-already-imported",
        ]);
    });

    it("reports an empty Accessible EPUB 3 annotation set fixture", async () => {
        const result = await previewFixture("accessible_epub_3-empty.annotation");

        expect(result).toEqual({
            status: "emptyFile",
        });
    });

    it("reports an Accessible EPUB 3 annotation set fixture that does not match the schema", async () => {
        const result = await previewFixture("accessible_epub_3-invalid-schema.annotation");

        expect(result.status).toBe("invalidAnnotationSet");
        if (result.status !== "invalidAnnotationSet") {
            throw new Error(`Expected invalidAnnotationSet status, got ${result.status}`);
        }

        expect(result.errors).toContain("/@context");
    });
});
