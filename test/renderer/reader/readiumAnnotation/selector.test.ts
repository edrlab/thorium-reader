import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { IRangeInfo } from "@r2-navigator-js/electron/common/selection";
import type { Publication as R2Publication } from "@r2-shared-js/models/publication";
import type { PublicationNote } from "readium-desktop/common/publication-notes";
import type { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { EDrawType } from "readium-desktop/common/type/note.type";
import { convertRangeInfo } from "@r2-navigator-js/electron/renderer/webview/selection";
import {
    checkIfIsAllSelectorsNoteAreGeneratedForReadiumAnnotation,
    readiumAnnotationSelectorFromNote,
} from "readium-desktop/renderer/reader/readiumAnnotation/selector";

jest.mock("@r2-navigator-js/electron/renderer/webview/selection", () => ({
    convertRangeInfo: jest.fn(),
}));

const rangeInfo: IRangeInfo = {
    startContainerElementCssSelector: "body > p",
    startContainerElementXPath: undefined,
    startContainerChildTextNodeIndex: 0,
    startOffset: 7,
    endContainerElementCssSelector: "body > p",
    endContainerElementXPath: undefined,
    endContainerChildTextNodeIndex: 0,
    endOffset: 21,
    cfi: undefined,
};

const locatorExtended = {
    locator: {
        href: "chapter.xhtml",
        locations: {
            cssSelector: "body > p",
            progression: 0.25,
        },
    },
    selectionInfo: {
        textFragment: undefined,
        rangeInfo,
        cleanBefore: "",
        cleanText: "selected text",
        cleanAfter: "",
        rawBefore: "",
        rawText: "selected text",
        rawAfter: "",
    },
} as MiniLocatorExtended;

const r2Publication = {
    Spine: [
        {
            Href: "chapter.xhtml",
        },
    ],
} as R2Publication;

function createNote(overrides: Partial<PublicationNote> = {}): PublicationNote {

    return {
        uuid: "note-1",
        index: 1,
        created: 1,
        color: { red: 255, green: 255, blue: 0 },
        drawType: EDrawType.solid_background,
        group: "annotation",
        locatorExtended,
        ...overrides,
    };
}

function asMock(fn: unknown): jest.Mock {

    return fn as jest.Mock;
}

describe("readium annotation export selectors", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("does not generate selectors when the XML DOM is unavailable", async () => {
        const note = createNote();

        await expect(readiumAnnotationSelectorFromNote(
            note,
            false,
            "chapter.xhtml",
            undefined,
            r2Publication,
        )).resolves.toEqual([]);

        expect(asMock(convertRangeInfo)).not.toHaveBeenCalled();
    });

    it("returns no selectors for a collapsed restored range", async () => {
        const xmlDom = {
            body: {},
        } as Document;
        asMock(convertRangeInfo).mockReturnValueOnce({ collapsed: true });

        await expect(readiumAnnotationSelectorFromNote(
            createNote(),
            false,
            "chapter.xhtml",
            xmlDom,
            r2Publication,
        )).resolves.toEqual([]);

        expect(asMock(convertRangeInfo)).toHaveBeenCalledWith(xmlDom, rangeInfo);
    });

    it("returns no selectors when range info cannot be restored", async () => {
        const xmlDom = {
            body: {},
        } as Document;
        asMock(convertRangeInfo).mockReturnValueOnce(undefined);

        await expect(readiumAnnotationSelectorFromNote(
            createNote(),
            false,
            "chapter.xhtml",
            xmlDom,
            r2Publication,
        )).resolves.toEqual([]);

        expect(asMock(convertRangeInfo)).toHaveBeenCalledWith(xmlDom, rangeInfo);
    });

    it("does not consider an empty export selector array generated", () => {
        expect(checkIfIsAllSelectorsNoteAreGeneratedForReadiumAnnotation(createNote({
            readiumAnnotation: {
                export: {
                    selector: [],
                },
            },
        }))).toBe(false);
    });
});
