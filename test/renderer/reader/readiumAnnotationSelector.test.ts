import { expect, test } from "@jest/globals";

import type { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import { readiumAnnotationSelectorFromNote } from "readium-desktop/renderer/reader/redux/sagas/readiumAnnotation/selector";

test("Readium bookmark export keeps image-only position selectors without a text range", () => {
    const note = {
        group: "bookmark",
        locatorExtended: {
            locator: {
                href: "image.xhtml",
                locations: {
                    cssSelector: "body > img",
                    progression: 0,
                },
            },
            selectionInfo: undefined,
        },
    } as INoteState;

    const generator = readiumAnnotationSelectorFromNote(note, false, "image.xhtml", {} as Document);
    const result = generator.next();

    expect(result.done).toBe(true);
    expect(result.value).toEqual([
        {
            type: "ProgressionSelector",
            value: 0,
        },
        {
            type: "CssSelector",
            value: "body > img",
        },
    ]);
});
