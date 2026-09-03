import { expect, test } from "@jest/globals";

import {
    getPublicationAnnotationKind,
    getPublicationAnnotationMotivation,
    isPublicationBookmarkAnnotation,
    isPublicationHighlightAnnotation,
    normalizePublicationAnnotation,
    type IPdfTextAnnotationTarget,
    type PublicationAnnotation,
    type PublicationHighlightAnnotation,
    type PublicationBookmarkAnnotation,
} from "readium-desktop/common/annotations/model";
import { EDrawType } from "readium-desktop/common/type/note.type";

function createAnnotation(overrides: Partial<PublicationAnnotation> = {}): PublicationAnnotation {
    return {
        uuid: "annotation-1",
        index: 1,
        created: 1000,
        ...overrides,
    } as PublicationAnnotation;
}

function createLocatorExtended(): NonNullable<PublicationAnnotation["locatorExtended"]> {
    return {
        locator: {
            href: "chapter.xhtml",
            locations: {},
        },
    } as NonNullable<PublicationAnnotation["locatorExtended"]>;
}

function createPdfAnnotation(): IPdfTextAnnotationTarget {
    return {
        type: "pdf-text-highlight",
        page: 1,
        rects: [{
            x1: 10,
            y1: 20,
            x2: 30,
            y2: 40,
        }],
    };
}

test("publication annotation guard normalizes legacy bookmarks", () => {
    const annotation = normalizePublicationAnnotation(createAnnotation({
        drawType: EDrawType.solid_background,
        group: "bookmark",
    }));

    expect(annotation).toEqual(expect.objectContaining({
        drawType: EDrawType.bookmark,
        motivation: "bookmarking",
        group: "bookmark",
    }));
    expect(getPublicationAnnotationKind(annotation)).toBe("bookmark");
    expect(getPublicationAnnotationMotivation(annotation)).toBe("bookmarking");
    expect(isPublicationBookmarkAnnotation(annotation)).toBe(true);
});

test("publication annotation guard gives explicit motivation precedence", () => {
    const annotation = normalizePublicationAnnotation(createAnnotation({
        drawType: EDrawType.bookmark,
        motivation: "highlighting",
        group: "bookmark",
    }));

    expect(annotation).toEqual(expect.objectContaining({
        drawType: EDrawType.solid_background,
        motivation: "highlighting",
        group: "annotation",
    }));
    expect(getPublicationAnnotationKind(annotation)).toBe("highlight");
    expect(isPublicationHighlightAnnotation(annotation)).toBe(true);
});

test("publication annotation guard preserves highlight draw styles", () => {
    const annotation = normalizePublicationAnnotation(createAnnotation({
        drawType: EDrawType.underline,
        group: "annotation",
    }));

    expect(annotation).toEqual(expect.objectContaining({
        drawType: EDrawType.underline,
        motivation: "highlighting",
        group: "annotation",
    }));
    expect(isPublicationHighlightAnnotation(annotation)).toBe(true);
});

test("publication annotation guard defaults missing kind fields to highlights", () => {
    const annotation: PublicationBookmarkAnnotation | PublicationHighlightAnnotation = normalizePublicationAnnotation(createAnnotation({
        drawType: undefined,
        motivation: undefined,
        group: undefined,
    }));

    expect(annotation.drawType).toBe(EDrawType.solid_background);
    expect(annotation.motivation).toBe("highlighting");
    expect(annotation.group).toBe("annotation");
    expect(getPublicationAnnotationKind(annotation)).toBe("highlight");
    expect(getPublicationAnnotationMotivation(annotation)).toBe("highlighting");
    expect(isPublicationBookmarkAnnotation(annotation)).toBe(false);
    expect(isPublicationHighlightAnnotation(annotation)).toBe(true);
});

test("publication annotation guard preserves zero indexes", () => {
    const annotation = normalizePublicationAnnotation(createAnnotation({
        index: 0,
        motivation: "highlighting",
    }));

    expect(annotation.index).toBe(0);
});

test("publication annotation guard rejects indexes that are not finite numbers", () => {
    for (const index of [undefined, "1", Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
        expect(() => normalizePublicationAnnotation(createAnnotation({
            index,
            motivation: "highlighting",
        } as any))).toThrow("index must be a finite number");
    }
});

test("publication annotation guard infers bookmark from draw type when legacy fields are absent", () => {
    const annotation = normalizePublicationAnnotation(createAnnotation({
        drawType: EDrawType.bookmark,
    }));

    expect(annotation).toEqual(expect.objectContaining({
        drawType: EDrawType.bookmark,
        motivation: "bookmarking",
        group: "bookmark",
    }));
});

test("publication annotation guard preserves single target annotations", () => {
    const locatorExtended = createLocatorExtended();
    const pdfAnnotation = createPdfAnnotation();

    const locatorAnnotation = normalizePublicationAnnotation(createAnnotation({
        locatorExtended,
        motivation: "highlighting",
    }));
    const pdfTargetAnnotation = normalizePublicationAnnotation(createAnnotation({
        pdfAnnotation,
        motivation: "highlighting",
    }));

    expect(locatorAnnotation.locatorExtended).toBe(locatorExtended);
    expect(locatorAnnotation.pdfAnnotation).toBeUndefined();
    expect(pdfTargetAnnotation.pdfAnnotation).toBe(pdfAnnotation);
    expect(pdfTargetAnnotation.locatorExtended).toBeUndefined();
});

test("publication annotation guard rejects annotations with both locatorExtended and pdfAnnotation targets", () => {
    expect(() => normalizePublicationAnnotation(createAnnotation({
        locatorExtended: createLocatorExtended(),
        pdfAnnotation: createPdfAnnotation(),
        motivation: "highlighting",
    } as Partial<PublicationAnnotation>))).toThrow("both locatorExtended and pdfAnnotation");
});
