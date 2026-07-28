import { describe, expect, it } from "@jest/globals";
import {
    PublicationNotesController,
    type PublicationNoteEntity,
    type PublicationNoteRepository,
} from "readium-desktop/common/publication-notes";

interface TestNote extends PublicationNoteEntity {
    label: string;
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

    it("serializes a minimal view state from the model snapshot", async () => {
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

        const viewState = await controller.list("pub-a");

        expect(viewState).toMatchObject({
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
            totalCount: 2,
        });
        expect(viewState.view).toEqual({
            filter: {},
            notes: viewState.notes,
            byId: viewState.byId,
            ids: viewState.ids,
            tagIndex: viewState.tagIndex,
            totalCount: 2,
            pagination: {
                notes: viewState.notes,
                byId: viewState.byId,
                ids: viewState.ids,
                page: 1,
                pageSize: 2,
                pageTotal: 1,
                begin: 1,
                end: 2,
                totalCount: 2,
            },
            facets: {
                tagIndex: viewState.tagIndex,
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

        const viewState = await controller.list("pub-a", {
            group: "annotation",
            tags: ["review"],
            sort: "lastCreated",
        });

        expect(viewState.ids).toEqual(["annotation-1", "bookmark-1", "annotation-2"]);
        expect(viewState.view.ids).toEqual(["annotation-2", "annotation-1"]);
        expect(viewState.view.filter).toEqual({
            group: "annotation",
            tags: ["review"],
            sort: "lastCreated",
        });
        expect(viewState.view.pagination).toMatchObject({
            ids: ["annotation-2", "annotation-1"],
            page: 1,
            pageSize: 2,
            pageTotal: 1,
            begin: 1,
            end: 2,
            totalCount: 2,
        });
        expect(viewState.view.facets.tagIndex).toEqual({
            review: 2,
            "chapter-1": 1,
        });
    });

    it("hydrates pagination in the controller view without slicing the filtered command source", async () => {
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

        const viewState = await controller.list("pub-a", {
            group: "annotation",
            sort: "lastCreated",
            pagination: {
                page: 2,
                pageSize: 2,
            },
        });

        expect(viewState.ids).toEqual(["annotation-1", "annotation-2", "annotation-3", "bookmark-1"]);
        expect(viewState.view.ids).toEqual(["annotation-3", "annotation-2", "annotation-1"]);
        expect(viewState.view.pagination.ids).toEqual(["annotation-1"]);
        expect(viewState.view.pagination.notes).toEqual([
            {
                uuid: "annotation-1",
                label: "First annotation",
                created: 1,
                group: "annotation",
            },
        ]);
        expect(viewState.view.pagination).toMatchObject({
            page: 2,
            pageSize: 2,
            pageTotal: 2,
            begin: 3,
            end: 3,
            totalCount: 3,
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

        const viewState = await controller.list("pub-a");

        expect(viewState.byId["note-with-modified"].created).toBe(200);
        expect(viewState.byId["note-without-timestamps"].created).toBe(300);
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
