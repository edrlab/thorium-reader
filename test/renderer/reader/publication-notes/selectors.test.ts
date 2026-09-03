import { describe, expect, it } from "@jest/globals";
import type { IReaderRootState } from "readium-desktop/common/redux/states/renderer/readerRootState";
import { selectPublicationNoteTagsIndex } from "readium-desktop/renderer/reader/publication-notes/selectors";

describe("publication note selectors", () => {

    it("selects tag indexes from the normalized publication notes view state", () => {
        const state = {
            reader: {
                publicationNotes: {
                    tagIndex: {
                        review: 2,
                    },
                },
            },
        } as unknown as IReaderRootState;

        expect(selectPublicationNoteTagsIndex(state)).toEqual([
            { tag: "review", index: 2 },
        ]);
    });

    it("returns a stable array while the normalized tag index reference is unchanged", () => {
        const state = {
            reader: {
                publicationNotes: {
                    tagIndex: {
                        review: 2,
                    },
                },
            },
        } as unknown as IReaderRootState;

        const first = selectPublicationNoteTagsIndex(state);
        expect(selectPublicationNoteTagsIndex(state)).toBe(first);
    });

    it("returns an empty tag index before publication notes hydration", () => {
        const state = {
            reader: {},
        } as unknown as IReaderRootState;

        expect(selectPublicationNoteTagsIndex(state)).toEqual([]);
    });
});
