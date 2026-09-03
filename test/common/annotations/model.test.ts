import { expect, test } from "@jest/globals";

import {
    getPublicationAnnotationKind,
    getPublicationAnnotationMotivation,
    isPublicationBookmarkAnnotation,
    isPublicationHighlightAnnotation,
    normalizePublicationAnnotation,
    type PublicationAnnotation,
} from "readium-desktop/common/annotations/model";
import { EDrawType } from "readium-desktop/common/type/note.type";

function createAnnotation(overrides: Partial<PublicationAnnotation> = {}): PublicationAnnotation {
    return {
        uuid: "annotation-1",
        created: 1000,
        ...overrides,
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

test("publication annotation guard leaves missing kind fields unclassified", () => {
    const annotation = normalizePublicationAnnotation(createAnnotation({
        drawType: undefined,
        motivation: undefined,
        group: undefined,
    }));

    expect(annotation.drawType).toBeUndefined();
    expect(annotation.motivation).toBeUndefined();
    expect(annotation.group).toBeUndefined();
    expect(getPublicationAnnotationKind(annotation)).toBeUndefined();
    expect(getPublicationAnnotationMotivation(annotation)).toBeUndefined();
    expect(isPublicationBookmarkAnnotation(annotation)).toBe(false);
    expect(isPublicationHighlightAnnotation(annotation)).toBe(false);
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
