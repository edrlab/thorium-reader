import { expect, test } from "@jest/globals";

import {
    convertAnnotationStateArrayToReadiumAnnotationSet,
    convertAnnotationStateToReadiumAnnotation,
} from "readium-desktop/common/readium/annotation/converter";
import type { ITextQuoteSelector } from "readium-desktop/common/readium/annotation/annotationModel.type";
import { EDrawType, INoteState } from "readium-desktop/common/redux/states/renderer/note";
import { PublicationView } from "readium-desktop/common/views/publication";

const publicationView = {
    identifier: "pub-1",
    isOpenable: true,
    readingFinished: false,
    documentTitle: "Test publication",
    publicationTitle: "Test publication",
    publicationSubTitle: "",
    authorsLangString: [],
    publishersLangString: [],
} as PublicationView;

const textQuoteSelector: ITextQuoteSelector = {
    type: "TextQuoteSelector",
    exact: "selected text",
    prefix: "",
    suffix: "",
};

function createNote(overrides: Partial<INoteState> = {}): INoteState {
    return {
        uuid: "note-1",
        index: 1,
        locatorExtended: {
            locator: {
                href: "chapter.xhtml",
                locations: {
                    cssSelector: "body > p",
                    progression: 0.25,
                },
            },
            audioPlaybackInfo: undefined,
            paginationInfo: undefined,
            selectionInfo: undefined,
            selectionIsNew: undefined,
            docInfo: undefined,
            epubPage: "5",
            epubPageID: undefined,
            headings: [{ id: undefined, txt: "Chapter", level: 1 }],
            secondWebViewHref: undefined,
        } as INoteState["locatorExtended"],
        textualValue: "note body",
        color: {
            red: 254,
            green: 243,
            blue: 189,
        },
        drawType: EDrawType.solid_background,
        tags: ["tag"],
        created: Date.UTC(2026, 0, 1),
        creator: {
            id: "creator",
            urn: "urn:creator",
            name: "Creator",
            type: "Person",
        },
        group: "annotation",
        readiumAnnotation: {
            export: {
                selector: [textQuoteSelector],
            },
        },
        ...overrides,
    };
}

test("Readium annotation conversion skips PDF annotations", () => {
    const pdfAnnotation = createNote({
        uuid: "pdf-note",
        locatorExtended: undefined,
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 3,
            rects: [{ x1: 1, y1: 2, x2: 3, y2: 4 }],
            quote: "PDF text",
        },
        readiumAnnotation: undefined,
    });

    expect(convertAnnotationStateToReadiumAnnotation(pdfAnnotation)).toBeUndefined();
});

test("Readium annotation set export filters PDF annotations and preserves EPUB annotations", () => {
    const epubAnnotation = createNote({ uuid: "epub-note" });
    const pdfAnnotation = createNote({
        uuid: "pdf-note",
        locatorExtended: undefined,
        pdfAnnotation: {
            type: "pdf-text-highlight",
            page: 3,
            rects: [{ x1: 1, y1: 2, x2: 3, y2: 4 }],
            quote: "PDF text",
        },
        readiumAnnotation: undefined,
    });

    const annotationSet = convertAnnotationStateArrayToReadiumAnnotationSet(
        "en",
        [epubAnnotation, pdfAnnotation],
        publicationView,
        "Export",
    );

    expect(annotationSet.items).toHaveLength(1);
    expect(annotationSet.items[0].id).toBe("urn:uuid:epub-note");
    expect(annotationSet.items[0].target.source).toBe("chapter.xhtml");
});
