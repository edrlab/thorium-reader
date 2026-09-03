import { expect, test } from "@jest/globals";

import {
    PublicationAnnotationsController,
    type PublicationAnnotation,
    type PublicationAnnotationsClock,
    type PublicationAnnotationRepository,
} from "readium-desktop/common/annotations";
import { EDrawType } from "readium-desktop/common/type/note.type";

function createRepository(
    initialAnnotations: PublicationAnnotation[] = [],
): PublicationAnnotationRepository<PublicationAnnotation> & {
    storedAnnotations: Map<string, PublicationAnnotation>;
} {

    const storedAnnotations = new Map(initialAnnotations.map((annotation) => [annotation.uuid, annotation]));

    return {
        storedAnnotations,
        list: async () => Array.from(storedAnnotations.values()),
        get: async (_publicationIdentifier, annotationIdentifier) => storedAnnotations.get(annotationIdentifier),
        create: async (_publicationIdentifier, annotation) => {
            storedAnnotations.set(annotation.uuid, annotation);
        },
        replace: async (_publicationIdentifier, annotation) => {
            storedAnnotations.set(annotation.uuid, annotation);
        },
        update: async (_publicationIdentifier, annotation) => {
            storedAnnotations.set(annotation.uuid, annotation);
        },
        delete: async (_publicationIdentifier, annotationIdentifier) => {
            storedAnnotations.delete(annotationIdentifier);
        },
        deleteByPublication: async () => {
            storedAnnotations.clear();
        },
    };
}

function createController(
    repository: PublicationAnnotationRepository<PublicationAnnotation>,
    options: {
        clock?: PublicationAnnotationsClock;
        ids?: string[];
    } = {},
): PublicationAnnotationsController<PublicationAnnotation> {

    const ids = [...(options.ids || [])];

    return new PublicationAnnotationsController({
        repository,
        clock: options.clock,
        idProvider: {
            next: () => ids.shift(),
        },
    });
}

test("publication annotation controller normalizes repository reads", async () => {
    const repository = createRepository([{
        uuid: "bookmark-1",
        created: 1000,
        drawType: EDrawType.solid_background,
        group: "bookmark",
    }, {
        uuid: "highlight-1",
        created: 2000,
        group: "annotation",
    }, {
        uuid: "unknown-1",
        created: 3000,
    }]);
    const controller = createController(repository);

    const bookmark = await controller.get("publication-1", "bookmark-1");
    const viewState = await controller.list("publication-1");

    expect(bookmark).toEqual(expect.objectContaining({
        drawType: EDrawType.bookmark,
        motivation: "bookmarking",
        group: "bookmark",
    }));
    expect(viewState.byId["highlight-1"]).toEqual(expect.objectContaining({
        drawType: EDrawType.solid_background,
        motivation: "highlighting",
        group: "annotation",
    }));
    expect(viewState.byId["unknown-1"].drawType).toBeUndefined();
    expect(viewState.byId["unknown-1"].motivation).toBeUndefined();
    expect(viewState.byId["unknown-1"].group).toBeUndefined();
});

test("publication annotation controller normalizes repository writes", async () => {
    const repository = createRepository([{
        uuid: "highlight-update-1",
        created: 1000,
        drawType: EDrawType.solid_background,
    }, {
        uuid: "bookmark-replace-1",
        created: 1000,
        group: "bookmark",
    }]);
    const controller = createController(repository, {
        ids: ["bookmark-create-1", "highlight-create-1"],
    });

    const bookmarkChange = await controller.create("publication-1", {
        motivation: "bookmarking",
    });
    const highlightChange = await controller.create("publication-1", {
        group: "annotation",
    });
    const updateChange = await controller.update("publication-1", {
        uuid: "highlight-update-1",
        created: 1000,
        drawType: EDrawType.underline,
    });
    const replaceChange = await controller.replace("publication-1", {
        uuid: "bookmark-replace-1",
        created: 1000,
        motivation: "highlighting",
    });

    expect(bookmarkChange.annotation).toEqual(expect.objectContaining({
        uuid: "bookmark-create-1",
        drawType: EDrawType.bookmark,
        motivation: "bookmarking",
        group: "bookmark",
    }));
    expect(highlightChange.annotation).toEqual(expect.objectContaining({
        uuid: "highlight-create-1",
        drawType: EDrawType.solid_background,
        motivation: "highlighting",
        group: "annotation",
    }));
    expect(updateChange.annotation).toEqual(expect.objectContaining({
        drawType: EDrawType.underline,
        motivation: "highlighting",
        group: "annotation",
    }));
    expect(replaceChange.previousAnnotation).toEqual(expect.objectContaining({
        drawType: EDrawType.bookmark,
        motivation: "bookmarking",
        group: "bookmark",
    }));
    expect(replaceChange.annotation).toEqual(expect.objectContaining({
        drawType: EDrawType.solid_background,
        motivation: "highlighting",
        group: "annotation",
    }));
    expect(repository.storedAnnotations.get("bookmark-create-1")).toEqual(bookmarkChange.annotation);
    expect(repository.storedAnnotations.get("highlight-create-1")).toEqual(highlightChange.annotation);
    expect(repository.storedAnnotations.get("highlight-update-1")).toEqual(updateChange.annotation);
    expect(repository.storedAnnotations.get("bookmark-replace-1")).toEqual(replaceChange.annotation);
});

test("publication annotation controller preserves unclassified annotations", async () => {
    const repository = createRepository();
    const controller = createController(repository, {
        clock: {
            now: () => 4000,
        },
        ids: ["unknown-1"],
    });

    const change = await controller.create("publication-1", {});

    expect(change.annotation).toEqual(expect.objectContaining({
        uuid: "unknown-1",
        created: 4000,
    }));
    expect(change.annotation.drawType).toBeUndefined();
    expect(change.annotation.motivation).toBeUndefined();
    expect(change.annotation.group).toBeUndefined();
    expect(repository.storedAnnotations.get("unknown-1")).toEqual(change.annotation);
});

test("publication annotation controller rejects invalid mutations", async () => {
    const repository = createRepository();
    const controller = new PublicationAnnotationsController({
        repository,
    });

    await expect(controller.create("publication-1", {
        motivation: "bookmarking",
    })).rejects.toThrow("without an identifier");
    await expect(controller.update("publication-1", {
        uuid: "missing-1",
        created: 1000,
    })).rejects.toThrow("does not exist");
    await expect(controller.delete("publication-1", "missing-1")).rejects.toThrow("does not exist");
});
