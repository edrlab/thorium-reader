import { expect, test } from "@jest/globals";

import {
    convertAnnotationStateArrayToReadiumAnnotationSet,
    convertAnnotationStateToReadiumAnnotation,
    selectSelectorTargetLocatorCandidate,
    type ISelectorTargetLocatorCandidate,
    type TSelectorTargetLocatorCandidateSource,
} from "readium-desktop/common/readium/annotation/converter";
import type { IEPUBCFISelector, ITextQuoteSelector } from "readium-desktop/common/readium/annotation/annotationModel.type";
import type { IRangeInfo, ISelectedTextInfo } from "@r2-navigator-js/electron/common/selection";
import type { PublicationNote } from "readium-desktop/common/publication-notes";
import { EDrawType } from "readium-desktop/common/type/note.type";
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

const epubCfiSelector: IEPUBCFISelector = {
    type: "EPUBCFISelector",
    value: "/4/2,/1:0,/1:13",
};

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

const textInfo: ISelectedTextInfo = {
    cleanBefore: "",
    cleanText: "selected text",
    cleanAfter: "",
    rawBefore: "",
    rawText: "selected text",
    rawAfter: "",
};

function createCandidate(
    selectorType: TSelectorTargetLocatorCandidateSource,
    overrides: Partial<ISelectorTargetLocatorCandidate> = {},
): ISelectorTargetLocatorCandidate {

    return {
        selectorType,
        selectorPriority: selectorType === "CssSelector" ? 40 : 20,
        rangeInfo,
        textInfo,
        ...overrides,
    };
}

function createNote(overrides: Partial<PublicationNote> = {}): PublicationNote {
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
        } as PublicationNote["locatorExtended"],
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

test("Readium annotation export preserves EPUB CFI selector vocabulary", () => {
    const annotation = convertAnnotationStateToReadiumAnnotation(createNote({
        readiumAnnotation: {
            export: {
                selector: [epubCfiSelector],
            },
        },
    }));

    expect(annotation?.target.selector).toContainEqual(epubCfiSelector);
});

test("Readium annotation import locator candidate selection uses explicit selector priority for agreeing ranges", () => {
    const selection = selectSelectorTargetLocatorCandidate([
        createCandidate("TextQuoteSelector"),
        createCandidate("CssSelector"),
    ]);

    expect(selection.status).toBe("resolved");
    if (selection.status === "resolved") {
        expect(selection.candidate.selectorType).toBe("CssSelector");
    }
});

test("Readium annotation import locator candidate selection reports selector disagreement", () => {
    const selection = selectSelectorTargetLocatorCandidate([
        createCandidate("CssSelector"),
        createCandidate("TextQuoteSelector", {
            rangeInfo: {
                ...rangeInfo,
                startOffset: 12,
                endOffset: 26,
            },
        }),
    ]);

    expect(selection).toEqual({
        status: "unresolved",
        reason: "ambiguous-match",
    });
});

test("Readium annotation import locator candidate selection reports selector not found without usable candidates", () => {
    const selection = selectSelectorTargetLocatorCandidate([
        createCandidate("CssSelector", {
            rangeInfo: {
                ...rangeInfo,
                startContainerElementCssSelector: "",
            },
        }),
        createCandidate("TextQuoteSelector", {
            textInfo: {
                ...textInfo,
                rawText: "",
            },
        }),
    ]);

    expect(selection).toEqual({
        status: "unresolved",
        reason: "selector-not-found",
    });
});
