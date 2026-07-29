import { describe, expect, it } from "@jest/globals";

import {
    defaultPublicationNotesViewSort,
    publicationNotesViewSortToSelection,
    selectionToEffectivePublicationNotesViewSort,
    selectionToPublicationNotesViewSort,
} from "readium-desktop/renderer/reader/publication-notes/viewFilters";

describe("publication note view filters", () => {

    it("defaults sort selections to the annotation list default", () => {
        expect(Array.from(publicationNotesViewSortToSelection(undefined))).toEqual([defaultPublicationNotesViewSort]);
    });

    it("round trips persisted sort filters through react-aria selections", () => {
        const selection = publicationNotesViewSortToSelection("progression");

        expect(Array.from(selection)).toEqual(["progression"]);
        expect(selectionToPublicationNotesViewSort(selection)).toBe("progression");
        expect(selectionToEffectivePublicationNotesViewSort(new Set([]))).toBe(defaultPublicationNotesViewSort);
    });
});
