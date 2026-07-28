import { describe, expect, it } from "@jest/globals";
import type { PublicationNote } from "readium-desktop/common/publication-notes";
import { readerActions } from "readium-desktop/common/redux/actions";
import { EDrawType } from "readium-desktop/common/type/note.type";

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

describe("reader publication note command actions", () => {

    it("builds a snapshot action with a consistent publication destination", () => {
        const action = readerActions.publicationNotes.snapshot.build("pub-a", {
            publicationIdentifier: "stale-pub",
            notes: [],
            revision: 1,
            byId: {},
            ids: [],
            tagIndex: {},
            totalCount: 0,
        });

        expect(action.destination.publicationIdentifier).toBe("pub-a");
        expect(action.payload.viewState.publicationIdentifier).toBe("pub-a");
    });

    it("builds a save command with a publication destination and note payload", () => {
        const previousNote = createNote({ textualValue: "Before" });
        const newNote = createNote({ textualValue: "After" });
        const action = readerActions.publicationNotes.commands.save.build("pub-a", newNote, previousNote);

        expect(action.type).toBe(readerActions.publicationNotes.commands.save.ID);
        expect(action.destination.publicationIdentifier).toBe("pub-a");
        expect(action.payload.publicationIdentifier).toBe("pub-a");
        expect(action.payload.previousNote).toBe(previousNote);
        expect(action.payload.newNote).toEqual(newNote);
        expect(action.payload.newNote).not.toBe(newNote);
    });

    it("assigns a note UUID on create commands", () => {
        const noteDraft = {
            index: 1,
            created: 1,
            color: { red: 255, green: 255, blue: 0 },
            drawType: EDrawType.solid_background,
            group: "bookmark",
        } satisfies Omit<PublicationNote, "uuid">;

        const action = readerActions.publicationNotes.commands.save.build("pub-a", noteDraft);

        expect(action.payload.newNote.uuid).toEqual(expect.any(String));
        expect(action.payload.newNote.uuid.length).toBeGreaterThan(0);
        expect(noteDraft).not.toHaveProperty("uuid");
    });

    it("preserves the previous note UUID when an update draft omits one", () => {
        const previousNote = createNote({ uuid: "existing-note" });
        const noteDraft = {
            index: 1,
            created: 1,
            color: { red: 255, green: 255, blue: 0 },
            drawType: EDrawType.solid_background,
            group: "annotation",
            textualValue: "After",
        } satisfies Omit<PublicationNote, "uuid">;
        const action = readerActions.publicationNotes.commands.save.build("pub-a", noteDraft, previousNote);

        expect(action.payload.newNote.uuid).toBe("existing-note");
    });

    it("preserves the previous note UUID when an update draft has another one", () => {
        const previousNote = createNote({ uuid: "existing-note" });
        const action = readerActions.publicationNotes.commands.save.build(
            "pub-a",
            createNote({ uuid: "draft-note" }),
            previousNote,
        );

        expect(action.payload.newNote.uuid).toBe("existing-note");
    });

    it("builds a remove command with the target note", () => {
        const note = createNote();
        const action = readerActions.publicationNotes.commands.remove.build("pub-a", note);

        expect(action.type).toBe(readerActions.publicationNotes.commands.remove.ID);
        expect(action.destination.publicationIdentifier).toBe("pub-a");
        expect(action.payload.publicationIdentifier).toBe("pub-a");
        expect(action.payload.note).toBe(note);
    });
});
