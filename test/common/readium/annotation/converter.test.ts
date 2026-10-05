import { expect, test } from "@jest/globals";

import {
    convertSelectorTargetToLocatorExtended,
    convertAnnotationStateArrayToReadiumAnnotationSet,
    convertAnnotationStateToReadiumAnnotation,
} from "readium-desktop/common/readium/annotation/converter";
import {
    EPUB_ANNOTATION_CONTEXT,
    isIReadiumAnnotationSet,
    LEGACY_ANNOTATION_CONTEXT,
    normalizeReadiumAnnotationTags,
} from "readium-desktop/common/readium/annotation/annotationModel.type";
import type {
    ISelector,
    ICssSelector,
    IEPUBCFISelector,
    IProgressionSelector,
    IReadiumAnnotation,
    ITextQuoteSelector,
} from "readium-desktop/common/readium/annotation/annotationModel.type";
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

const epubCfiSelector: IEPUBCFISelector = {
    type: "EPUBCFISelector",
    value: "/4/2,/1:0,/1:13",
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

test("Readium annotation export preserves EPUB CFI selector vocabulary", () => {
    const annotation = convertAnnotationStateToReadiumAnnotation(
        createNote({
            readiumAnnotation: {
                export: {
                    selector: [epubCfiSelector],
                },
            },
        }),
    );

    expect(annotation?.target.selector).toContainEqual(epubCfiSelector);
});

test("Readium annotation export preserves an imported unsupported selector when no generated selector is available", () => {
    const unsupportedSelector = {
        type: "VendorSelector",
        value: "vendor-location",
        vendorData: {
            version: 1,
        },
        refinedBy: {
            type: "VendorRefinement",
            checksum: "abc123",
        },
    } as unknown as ISelector;
    const importedTarget = {
        source: "chapter.xhtml",
        meta: {
            page: "7",
        },
        selector: [unsupportedSelector],
    };

    const annotation = convertAnnotationStateToReadiumAnnotation(createNote({
        locatorExtended: undefined,
        readiumAnnotation: {
            import: {
                target: importedTarget,
            },
        },
    }));

    expect(annotation?.target).toEqual(importedTarget);
});

test("Readium annotation export prefers generated selectors over imported selectors", () => {
    const unsupportedSelector = {
        type: "VendorSelector",
        value: "vendor-location",
    } as unknown as ISelector;

    const annotation = convertAnnotationStateToReadiumAnnotation(createNote({
        readiumAnnotation: {
            export: {
                selector: [epubCfiSelector],
            },
            import: {
                target: {
                    source: "legacy-chapter.xhtml",
                    selector: [unsupportedSelector],
                },
            },
        },
    }));

    expect(annotation?.target.source).toBe("chapter.xhtml");
    expect(annotation?.target.selector).toEqual([epubCfiSelector]);
});

test("Readium annotation export preserves the imported target when its source has no locator", () => {
    const importedTarget = {
        source: "unresolved/chapter.xhtml",
        meta: {
            page: "7",
        },
        selector: [epubCfiSelector],
    };
    const annotation = convertAnnotationStateToReadiumAnnotation(createNote({
        locatorExtended: undefined,
        readiumAnnotation: {
            import: {
                target: importedTarget,
            },
        },
    }));

    expect(annotation?.target).toEqual(importedTarget);
});

test("Readium bookmark import accepts a progression-only target at zero", async () => {
    const progressionSelector: IProgressionSelector = {
        type: "ProgressionSelector",
        value: 0,
    };
    const target: IReadiumAnnotation["target"] = {
        source: "image.xhtml",
        selector: [progressionSelector],
    };

    const locatorExtended = await convertSelectorTargetToLocatorExtended(
        target,
        undefined,
        true,
        undefined,
        "image.xhtml",
    );

    expect(locatorExtended?.locator).toEqual({
        href: "image.xhtml",
        locations: {
            cssSelector: undefined,
            progression: 0,
        },
    });
    expect(locatorExtended?.selectionInfo).toBeUndefined();
});

test("Readium bookmark import accepts an empty resource-level target", async () => {
    const target: IReadiumAnnotation["target"] = {
        source: "image.xhtml",
        selector: [],
    };

    const locatorExtended = await convertSelectorTargetToLocatorExtended(
        target,
        undefined,
        true,
        undefined,
        "image.xhtml",
    );

    expect(locatorExtended?.locator.href).toBe("image.xhtml");
    expect(locatorExtended?.locator.locations).toEqual({
        cssSelector: undefined,
        progression: undefined,
    });
});

test("Readium bookmark import preserves a non-text element selector", async () => {
    const cssSelector: ICssSelector<undefined> = {
        type: "CssSelector",
        value: "body > img",
    };
    const progressionSelector: IProgressionSelector = {
        type: "ProgressionSelector",
        value: 1,
    };
    const target: IReadiumAnnotation["target"] = {
        source: "image.xhtml",
        selector: [progressionSelector, cssSelector],
    };

    const locatorExtended = await convertSelectorTargetToLocatorExtended(
        target,
        undefined,
        true,
        undefined,
        "image.xhtml",
    );

    expect(locatorExtended?.locator).toEqual({
        href: "image.xhtml",
        locations: {
            cssSelector: "body > img",
            progression: 1,
        },
    });
    expect(locatorExtended?.selectionInfo).toBeUndefined();
});

test("EPUB annotation export uses the W3C context and preserves all tags", () => {
    const annotation = convertAnnotationStateToReadiumAnnotation(createNote({
        tags: ["review", "important"],
    }));

    expect(annotation?.["@context"]).toBe(EPUB_ANNOTATION_CONTEXT);
    expect(annotation?.body.tags).toEqual(["review", "important"]);
    expect(annotation?.body).not.toHaveProperty("tag");
});

test("EPUB annotation export omits tags when the note has none", () => {
    const annotation = convertAnnotationStateToReadiumAnnotation(createNote({ tags: [] }));

    expect(annotation?.body).not.toHaveProperty("tags");
});

test("EPUB annotation sets validate with the W3C context", () => {
    const annotationSet = convertAnnotationStateArrayToReadiumAnnotationSet(
        "en",
        [createNote()],
        publicationView,
        "Export",
    );

    expect(annotationSet["@context"]).toBe(EPUB_ANNOTATION_CONTEXT);
    expect(isIReadiumAnnotationSet(annotationSet)).toBe(true);
});

test("legacy annotation sets remain valid for import", () => {
    const annotationSet = convertAnnotationStateArrayToReadiumAnnotationSet(
        "en",
        [createNote()],
        publicationView,
        "Legacy export",
    );
    annotationSet["@context"] = LEGACY_ANNOTATION_CONTEXT;
    annotationSet.items[0]["@context"] = LEGACY_ANNOTATION_CONTEXT;
    annotationSet.items[0].body.tag = annotationSet.items[0].body.tags?.[0];
    delete annotationSet.items[0].body.tags;

    expect(isIReadiumAnnotationSet(annotationSet)).toBe(true);
});

test("annotation import merges current and legacy tags without duplicates", () => {
    expect(normalizeReadiumAnnotationTags({
        type: "TextualBody",
        value: "Note",
        tags: ["review", "important"],
        tag: "review",
    })).toEqual(["review", "important"]);
});
