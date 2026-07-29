import { describe, expect, it } from "@jest/globals";
import type { PublicationNote, PublicationNotesViewFilter } from "readium-desktop/common/publication-notes";
import type { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { EDrawType } from "readium-desktop/common/type/note.type";
import {
    selectPublicationNoteTagsIndex,
    selectPublicationNotesHydratedView,
    selectPublicationNotesHydratedViewTagsIndex,
} from "readium-desktop/renderer/reader/publication-notes/selectors";

function createNote(overrides: Partial<PublicationNote> = {}): PublicationNote {
    return {
        uuid: "note-1",
        index: 1,
        created: 1,
        color: { red: 255, green: 255, blue: 0 },
        drawType: EDrawType.solid_background,
        group: "annotation",
        tags: [],
        ...overrides,
    };
}

function createState(notes: PublicationNote[]): IReaderRootState {
    return {
        reader: {
            info: {
                r2Publication: {
                    Spine: [
                        { Href: "chapter-1.xhtml" },
                        { Href: "chapter-2.xhtml" },
                    ],
                },
            },
            publicationNotes: {
                publicationIdentifier: "pub-a",
                notes,
                revision: 1,
            },
        },
    } as unknown as IReaderRootState;
}

describe("publication note selectors", () => {

    it("selects tag indexes from publication note snapshots", () => {
        const state = createState([
            createNote({ uuid: "note-1", tags: ["review"] }),
            createNote({ uuid: "note-2", tags: ["review", "chapter-1"] }),
        ]);

        expect(selectPublicationNoteTagsIndex(state)).toEqual([
            { tag: "review", index: 2 },
            { tag: "chapter-1", index: 1 },
        ]);
    });

    it("returns a stable array while the snapshot notes reference is unchanged", () => {
        const state = createState([
            createNote({ uuid: "note-1", tags: ["review"] }),
            createNote({ uuid: "note-2", tags: ["review"] }),
        ]);

        const first = selectPublicationNoteTagsIndex(state);
        expect(selectPublicationNoteTagsIndex(state)).toBe(first);
    });

    it("returns an empty tag index before publication notes hydration", () => {
        const state = {
            reader: {},
        } as unknown as IReaderRootState;

        expect(selectPublicationNoteTagsIndex(state)).toEqual([]);
    });

    it("derives a filtered, paginated view from the snapshot", () => {
        const state = createState([
            createNote({ uuid: "annotation-1", created: 1, group: "annotation", tags: ["review"] }),
            createNote({ uuid: "bookmark-1", created: 2, group: "bookmark", tags: ["review"] }),
            createNote({ uuid: "annotation-2", created: 3, group: "annotation", tags: ["review", "chapter-1"] }),
        ]);
        const filter = {
            group: "annotation",
            tags: ["review"],
            sort: "lastCreated",
            pagination: {
                page: 1,
                pageSize: 1,
            },
        } satisfies PublicationNotesViewFilter;

        const view = selectPublicationNotesHydratedView(state, filter);

        expect(view.ids).toEqual(["annotation-2", "annotation-1"]);
        expect(view.pagination.ids).toEqual(["annotation-2"]);
        expect(view.pagination).toMatchObject({
            page: 1,
            pageSize: 1,
            pageTotal: 2,
            begin: 1,
            end: 1,
            totalCount: 2,
        });
        expect(selectPublicationNotesHydratedViewTagsIndex(state, filter)).toEqual([
            { tag: "review", index: 2 },
            { tag: "chapter-1", index: 1 },
        ]);
    });
});
