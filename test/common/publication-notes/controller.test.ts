import { describe, expect, it } from "@jest/globals";
import {
    hydratePublicationNotesView,
    indexPublicationNotes,
    PublicationNotesController,
    type PublicationNoteEntity,
    type PublicationNoteImportUnresolvedState,
    type PublicationNoteRepository,
} from "readium-desktop/common/publication-notes";

interface TestNote extends PublicationNoteEntity {
    label: string;
    readiumAnnotation?: {
        import?: {
            unresolved?: PublicationNoteImportUnresolvedState | undefined;
        } | undefined;
    } | undefined;
}

class MemoryPublicationNoteRepository implements PublicationNoteRepository<TestNote> {
    public readonly notesByPublication = new Map<string, TestNote[]>();

    public async list(publicationIdentifier: string): Promise<TestNote[]> {
        return [...(this.notesByPublication.get(publicationIdentifier) || [])];
    }

    public async get(publicationIdentifier: string, noteIdentifier: string): Promise<TestNote | undefined> {
        return (await this.list(publicationIdentifier)).find((note) => note.uuid === noteIdentifier);
    }

    public async create(publicationIdentifier: string, note: TestNote): Promise<void> {
        const notes = await this.list(publicationIdentifier);
        this.notesByPublication.set(publicationIdentifier, [...notes, note]);
    }

    public async replace(publicationIdentifier: string, note: TestNote): Promise<void> {
        const notes = await this.list(publicationIdentifier);
        this.notesByPublication.set(publicationIdentifier, [...notes.filter(({ uuid }) => uuid !== note.uuid), note]);
    }

    public async update(publicationIdentifier: string, note: TestNote): Promise<void> {
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

describe("PublicationNotesController", () => {
    it("creates notes through the injected repository and applies controller defaults", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 42 },
            idProvider: { next: () => "note-generated" },
        });

        const change = await controller.create("pub-a", {
            uuid: "",
            label: "Created note",
            tags: ["review"],
        });

        expect(change).toEqual({
            publicationIdentifier: "pub-a",
            note: {
                uuid: "note-generated",
                label: "Created note",
                tags: ["review"],
                created: 42,
            },
            revision: 42,
        });
        expect(await repository.list("pub-a")).toEqual([change.note]);
    });

    it("rejects duplicate creates", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 42 },
        });

        await repository.create("pub-a", {
            uuid: "note-1",
            label: "Existing note",
        });

        await expect(
            controller.create("pub-a", {
                uuid: "note-1",
                label: "Duplicate note",
            }),
        ).rejects.toThrow("already exists");
    });

    it("lists a model snapshot that can be derived into a minimal view", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 100 },
        });

        await repository.create("pub-a", {
            uuid: "note-1",
            label: "First",
            created: 1,
            tags: ["review", "chapter-1"],
        });
        await repository.create("pub-a", {
            uuid: "note-2",
            label: "Second",
            created: 2,
            tags: ["review", ""],
        });

        const snapshot = await controller.list("pub-a");
        const index = indexPublicationNotes(snapshot.notes);
        const view = hydratePublicationNotesView(snapshot.notes);

        expect(snapshot).not.toHaveProperty("view");
        expect(snapshot).toEqual({
            publicationIdentifier: "pub-a",
            notes: [
                {
                    uuid: "note-1",
                    label: "First",
                    created: 1,
                    tags: ["review", "chapter-1"],
                },
                {
                    uuid: "note-2",
                    label: "Second",
                    created: 2,
                    tags: ["review", ""],
                },
            ],
            revision: 100,
        });
        expect(index).toEqual({
            byId: {
                "note-1": {
                    uuid: "note-1",
                    label: "First",
                    created: 1,
                    tags: ["review", "chapter-1"],
                },
                "note-2": {
                    uuid: "note-2",
                    label: "Second",
                    created: 2,
                    tags: ["review", ""],
                },
            },
            ids: ["note-1", "note-2"],
            tagIndex: {
                review: 2,
                "chapter-1": 1,
            },
        });
        expect(view).toEqual({
            filter: {},
            notes: snapshot.notes,
            byId: index.byId,
            ids: index.ids,
            tagIndex: index.tagIndex,
            totalCount: 2,
            pagination: {
                notes: snapshot.notes,
                byId: index.byId,
                ids: index.ids,
                page: 1,
                pageSize: 2,
                pageTotal: 1,
                begin: 1,
                end: 2,
                totalCount: 2,
            },
            facets: {
                tagIndex: index.tagIndex,
                creators: [],
            },
        });
    });

    it("hydrates a filtered view without filtering the canonical notes", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 100 },
        });

        await repository.create("pub-a", {
            uuid: "annotation-1",
            label: "First annotation",
            created: 1,
            group: "annotation",
            tags: ["review"],
        });
        await repository.create("pub-a", {
            uuid: "bookmark-1",
            label: "Bookmark",
            created: 2,
            group: "bookmark",
            tags: ["review"],
        });
        await repository.create("pub-a", {
            uuid: "annotation-2",
            label: "Second annotation",
            created: 3,
            group: "annotation",
            tags: ["review", "chapter-1"],
        });

        const snapshot = await controller.list("pub-a");
        const index = indexPublicationNotes(snapshot.notes);
        const view = hydratePublicationNotesView(snapshot.notes, {
            group: "annotation",
            tags: ["review"],
            sort: "lastCreated",
        });

        expect(index.ids).toEqual(["annotation-1", "bookmark-1", "annotation-2"]);
        expect(view.ids).toEqual(["annotation-2", "annotation-1"]);
        expect(view.filter).toEqual({
            group: "annotation",
            tags: ["review"],
            sort: "lastCreated",
        });
        expect(view.pagination).toMatchObject({
            ids: ["annotation-2", "annotation-1"],
            page: 1,
            pageSize: 2,
            pageTotal: 1,
            begin: 1,
            end: 2,
            totalCount: 2,
        });
        expect(view.facets.tagIndex).toEqual({
            review: 2,
            "chapter-1": 1,
        });
    });

    it("hydrates a filtered view for unresolved imported notes", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 100 },
        });

        await repository.create("pub-a", {
            uuid: "annotation-unresolved",
            label: "Unresolved annotation",
            created: 1,
            group: "annotation",
            readiumAnnotation: {
                import: {
                    unresolved: {
                        reason: "selector-not-found",
                    },
                },
            },
        });
        await repository.create("pub-a", {
            uuid: "annotation-resolved",
            label: "Resolved annotation",
            created: 2,
            group: "annotation",
        });
        await repository.create("pub-a", {
            uuid: "bookmark-unresolved",
            label: "Unresolved bookmark",
            created: 3,
            group: "bookmark",
            readiumAnnotation: {
                import: {
                    unresolved: {
                        reason: "source-mismatch",
                    },
                },
            },
        });

        const snapshot = await controller.list("pub-a");
        const inactiveView = hydratePublicationNotesView(snapshot.notes, {
            group: "annotation",
            importReportUnresolvedImportedNotes: false,
        });
        const view = hydratePublicationNotesView(snapshot.notes, {
            group: "annotation",
            importReportUnresolvedImportedNotes: true,
            sort: "lastCreated",
        });

        expect(inactiveView.filter).toEqual({
            group: "annotation",
        });
        expect(inactiveView.ids).toEqual(["annotation-unresolved", "annotation-resolved"]);
        expect(view.filter).toEqual({
            group: "annotation",
            importReportUnresolvedImportedNotes: true,
            sort: "lastCreated",
        });
        expect(view.ids).toEqual(["annotation-unresolved"]);
        expect(view.pagination).toMatchObject({
            ids: ["annotation-unresolved"],
            totalCount: 1,
        });
    });

    it("hydrates pagination in the derived view without slicing the filtered command source", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 100 },
        });

        await repository.create("pub-a", {
            uuid: "annotation-1",
            label: "First annotation",
            created: 1,
            group: "annotation",
        });
        await repository.create("pub-a", {
            uuid: "annotation-2",
            label: "Second annotation",
            created: 2,
            group: "annotation",
        });
        await repository.create("pub-a", {
            uuid: "annotation-3",
            label: "Third annotation",
            created: 3,
            group: "annotation",
        });
        await repository.create("pub-a", {
            uuid: "bookmark-1",
            label: "Bookmark",
            created: 4,
            group: "bookmark",
        });

        const snapshot = await controller.list("pub-a");
        const index = indexPublicationNotes(snapshot.notes);
        const view = hydratePublicationNotesView(snapshot.notes, {
            group: "annotation",
            sort: "lastCreated",
            pagination: {
                page: 2,
                pageSize: 2,
            },
        });

        expect(index.ids).toEqual(["annotation-1", "annotation-2", "annotation-3", "bookmark-1"]);
        expect(view.ids).toEqual(["annotation-3", "annotation-2", "annotation-1"]);
        expect(view.pagination.ids).toEqual(["annotation-1"]);
        expect(view.pagination.notes).toEqual([
            {
                uuid: "annotation-1",
                label: "First annotation",
                created: 1,
                group: "annotation",
            },
        ]);
        expect(view.pagination).toMatchObject({
            page: 2,
            pageSize: 2,
            pageTotal: 2,
            begin: 3,
            end: 3,
            totalCount: 3,
        });
    });

    it("hydrates pagination around an anchored note after filtering and sorting", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 100 },
        });

        for (let index = 1; index <= 5; index++) {
            await repository.create("pub-a", {
                uuid: `annotation-${index}`,
                label: `Annotation ${index}`,
                created: index,
                group: "annotation",
            });
        }
        await repository.create("pub-a", {
            uuid: "bookmark-1",
            label: "Bookmark",
            created: 6,
            group: "bookmark",
        });

        const snapshot = await controller.list("pub-a");
        const index = indexPublicationNotes(snapshot.notes);
        const view = hydratePublicationNotesView(snapshot.notes, {
            group: "annotation",
            sort: "lastCreated",
            pagination: {
                page: 1,
                pageSize: 2,
                anchorUuid: "annotation-2",
            },
        });

        expect(index.ids).toEqual([
            "annotation-1",
            "annotation-2",
            "annotation-3",
            "annotation-4",
            "annotation-5",
            "bookmark-1",
        ]);
        expect(view.ids).toEqual([
            "annotation-5",
            "annotation-4",
            "annotation-3",
            "annotation-2",
            "annotation-1",
        ]);
        expect(view.pagination.ids).toEqual(["annotation-3", "annotation-2"]);
        expect(view.pagination).toMatchObject({
            page: 2,
            pageSize: 2,
            pageTotal: 3,
            begin: 3,
            end: 4,
            totalCount: 5,
        });
        expect(view.filter.pagination).toEqual({
            page: 1,
            pageSize: 2,
            anchorUuid: "annotation-2",
        });
    });

    it("repairs existing notes that predate the created timestamp", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 300 },
        });

        await repository.create("pub-a", {
            uuid: "note-with-modified",
            label: "Use modified",
            modified: 200,
        });
        await repository.create("pub-a", {
            uuid: "note-without-timestamps",
            label: "Use clock",
        });

        const snapshot = await controller.list("pub-a");
        const index = indexPublicationNotes(snapshot.notes);

        expect(index.byId["note-with-modified"].created).toBe(200);
        expect(index.byId["note-without-timestamps"].created).toBe(300);
    });

    it("reads one note through the injected repository", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 400 },
        });

        await repository.create("pub-a", {
            uuid: "note-1",
            label: "Found note",
        });

        await expect(controller.get("pub-a", "note-1")).resolves.toEqual({
            uuid: "note-1",
            label: "Found note",
            created: 400,
        });
        await expect(controller.get("pub-a", "missing")).resolves.toBeUndefined();
    });

    it("returns the previous note when updating", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 200 },
        });

        await repository.create("pub-a", {
            uuid: "note-1",
            label: "Before",
            created: 1,
        });

        await expect(
            controller.update("pub-a", {
                uuid: "note-1",
                label: "After",
                created: 1,
                modified: 2,
            }),
        ).resolves.toEqual({
            publicationIdentifier: "pub-a",
            previousNote: {
                uuid: "note-1",
                label: "Before",
                created: 1,
            },
            note: {
                uuid: "note-1",
                label: "After",
                created: 1,
                modified: 2,
            },
            revision: 200,
        });
    });

    it("rejects updates for missing notes", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 200 },
        });

        await expect(
            controller.update("pub-a", {
                uuid: "missing-note",
                label: "Missing",
            }),
        ).rejects.toThrow("does not exist");
    });

    it("deletes one note within a publication scope", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 500 },
        });

        await repository.create("pub-a", {
            uuid: "same-note-id",
            label: "Deleted",
            created: 1,
        });
        await repository.create("pub-b", {
            uuid: "same-note-id",
            label: "Kept",
            created: 2,
        });

        await expect(controller.delete("pub-a", "same-note-id")).resolves.toEqual({
            publicationIdentifier: "pub-a",
            noteIdentifier: "same-note-id",
            revision: 500,
        });
        await expect(repository.list("pub-a")).resolves.toEqual([]);
        await expect(repository.list("pub-b")).resolves.toEqual([
            {
                uuid: "same-note-id",
                label: "Kept",
                created: 2,
            },
        ]);
    });

    it("rejects deletes for missing notes", async () => {
        const repository = new MemoryPublicationNoteRepository();
        const controller = new PublicationNotesController<TestNote>({
            repository,
            clock: { now: () => 500 },
        });

        await expect(controller.delete("pub-a", "missing-note")).rejects.toThrow("does not exist");
    });
});
