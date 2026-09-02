import { describe, expect, it } from "@jest/globals";
import type { PublicationNote } from "readium-desktop/common/publication-notes";
import { readerActions } from "readium-desktop/common/redux/actions";
import { readerPublicationNotesViewReducer } from "readium-desktop/common/redux/reducers/reader/publicationNotes";
import { publicationNotesViewInitialState } from "readium-desktop/common/redux/states/renderer/publicationNotes";
import { EDrawType } from "readium-desktop/common/type/note.type";

function createNote(overrides: Partial<PublicationNote> = {}): PublicationNote {
    return {
        uuid: "note-1",
        index: 1,
        created: 1,
        color: { red: 255, green: 255, blue: 0 },
        drawType: EDrawType.solid_background,
        group: "annotation",
        tags: ["review"],
        ...overrides,
    };
}

describe("readerPublicationNotesViewReducer", () => {

    it("hydrates from a controller view snapshot", () => {
        const viewState = {
            ...publicationNotesViewInitialState,
            publicationIdentifier: "pub-a",
            revision: 10,
            notes: [createNote()],
            byId: {
                "note-1": createNote(),
            },
            ids: ["note-1"],
            tagIndex: {
                review: 1,
            },
            totalCount: 1,
        };

        expect(readerPublicationNotesViewReducer(
            undefined,
            readerActions.publicationNotes.snapshot.build("pub-a", viewState),
        )).toEqual(viewState);
    });

    it("ignores view snapshots for a different publication", () => {
        const state = readerPublicationNotesViewReducer(
            undefined,
            readerActions.publicationNotes.commands.save.build("pub-a", createNote()),
        );
        const viewState = {
            ...publicationNotesViewInitialState,
            publicationIdentifier: "pub-b",
            revision: 10,
        };

        expect(readerPublicationNotesViewReducer(
            state,
            readerActions.publicationNotes.snapshot.build("pub-b", viewState),
        )).toBe(state);
    });

    it("keeps the normalized view state in sync with publication note save commands", () => {
        const added = readerPublicationNotesViewReducer(
            undefined,
            readerActions.publicationNotes.commands.save.build("pub-a", createNote()),
        );

        expect(added.ids).toEqual(["note-1"]);
        expect(added.byId["note-1"].tags).toEqual(["review"]);
        expect(added.tagIndex).toEqual({ review: 1 });
        expect(added.totalCount).toBe(1);

        const updatedNote = createNote({
            textualValue: "Updated",
            tags: ["chapter-1"],
        });
        const updated = readerPublicationNotesViewReducer(
            added,
            readerActions.publicationNotes.commands.save.build("pub-a", updatedNote, createNote()),
        );

        expect(updated.byId["note-1"].textualValue).toBe("Updated");
        expect(updated.tagIndex).toEqual({ "chapter-1": 1 });
        expect(updated.totalCount).toBe(1);
    });

    it("removes notes from the normalized view state from publication note remove commands", () => {
        const state = readerPublicationNotesViewReducer(
            undefined,
            readerActions.publicationNotes.commands.save.build("pub-a", createNote()),
        );
        const removed = readerPublicationNotesViewReducer(
            state,
            readerActions.publicationNotes.commands.remove.build("pub-a", createNote()),
        );

        expect(removed).toEqual({
            ...publicationNotesViewInitialState,
            publicationIdentifier: "pub-a",
            revision: 2,
        });
    });

    it("ignores remove commands for missing notes", () => {
        const state = readerPublicationNotesViewReducer(
            undefined,
            readerActions.publicationNotes.commands.save.build("pub-a", createNote()),
        );

        expect(readerPublicationNotesViewReducer(
            state,
            readerActions.publicationNotes.commands.remove.build("pub-a", createNote({ uuid: "missing-note" })),
        )).toBe(state);
    });

    it("ignores publication note commands for a different publication", () => {
        const state = readerPublicationNotesViewReducer(
            undefined,
            readerActions.publicationNotes.commands.save.build("pub-a", createNote()),
        );

        expect(readerPublicationNotesViewReducer(
            state,
            readerActions.publicationNotes.commands.save.build("pub-b", createNote({ uuid: "note-2" })),
        )).toBe(state);
        expect(readerPublicationNotesViewReducer(
            state,
            readerActions.publicationNotes.commands.remove.build("pub-b", createNote()),
        )).toBe(state);
    });
});
