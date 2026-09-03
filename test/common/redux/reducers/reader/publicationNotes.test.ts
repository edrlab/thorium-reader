import { describe, expect, it } from "@jest/globals";
import type { PublicationNote } from "readium-desktop/common/publication-notes";
import { readerActions } from "readium-desktop/common/redux/actions";
import { readerPublicationNotesSnapshotReducer } from "readium-desktop/common/redux/reducers/reader/publicationNotes";
import { publicationNotesSnapshotInitialState } from "readium-desktop/common/redux/states/renderer/publicationNotes";
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

describe("readerPublicationNotesSnapshotReducer", () => {

    function createSnapshotState() {
        return {
            ...publicationNotesSnapshotInitialState,
            publicationIdentifier: "pub-a",
            revision: 10,
            notes: [createNote()],
        };
    }

    it("hydrates from a controller note snapshot", () => {
        const snapshot = createSnapshotState();

        expect(readerPublicationNotesSnapshotReducer(
            undefined,
            readerActions.publicationNotes.snapshot.build("pub-a", snapshot),
        )).toEqual(snapshot);
    });

    it("ignores note snapshots for a different publication", () => {
        const state = readerPublicationNotesSnapshotReducer(
            undefined,
            readerActions.publicationNotes.snapshot.build("pub-a", createSnapshotState()),
        );
        const snapshot = {
            ...publicationNotesSnapshotInitialState,
            publicationIdentifier: "pub-b",
            revision: 10,
        };

        expect(readerPublicationNotesSnapshotReducer(
            state,
            readerActions.publicationNotes.snapshot.build("pub-b", snapshot),
        )).toBe(state);
    });

    it("ignores publication note save commands", () => {
        const state = readerPublicationNotesSnapshotReducer(
            undefined,
            readerActions.publicationNotes.snapshot.build("pub-a", createSnapshotState()),
        );
        const updatedNote = createNote({
            textualValue: "Updated",
            tags: ["chapter-1"],
        });

        expect(readerPublicationNotesSnapshotReducer(
            state,
            readerActions.publicationNotes.commands.save.build("pub-a", updatedNote, createNote()),
        )).toBe(state);
    });

    it("ignores publication note remove commands", () => {
        const state = readerPublicationNotesSnapshotReducer(
            undefined,
            readerActions.publicationNotes.snapshot.build("pub-a", createSnapshotState()),
        );

        expect(readerPublicationNotesSnapshotReducer(
            state,
            readerActions.publicationNotes.commands.remove.build("pub-a", createNote()),
        )).toBe(state);
    });

    it("ignores publication note commands for a different publication", () => {
        const state = readerPublicationNotesSnapshotReducer(
            undefined,
            readerActions.publicationNotes.snapshot.build("pub-a", createSnapshotState()),
        );

        expect(readerPublicationNotesSnapshotReducer(
            state,
            readerActions.publicationNotes.commands.save.build("pub-b", createNote({ uuid: "note-2" })),
        )).toBe(state);
        expect(readerPublicationNotesSnapshotReducer(
            state,
            readerActions.publicationNotes.commands.remove.build("pub-b", createNote()),
        )).toBe(state);
    });
});
