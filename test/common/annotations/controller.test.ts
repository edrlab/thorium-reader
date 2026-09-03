import { expect, test } from "@jest/globals";

import {
    PublicationAnnotationsController,
    type IPdfTextAnnotationTarget,
    type PublicationAnnotation,
    type PublicationAnnotationsClock,
    type PublicationAnnotationRepository,
} from "readium-desktop/common/annotations";
import { EDrawType } from "readium-desktop/common/type/note.type";

interface IRecordingRepository extends PublicationAnnotationRepository<PublicationAnnotation> {
    storedAnnotations: Map<string, PublicationAnnotation>;
    calls: {
        list: string[];
        get: Array<[string, string]>;
        create: Array<[string, PublicationAnnotation]>;
        replace: Array<[string, PublicationAnnotation]>;
        update: Array<[string, PublicationAnnotation]>;
        delete: Array<[string, string]>;
        deleteByPublication: string[];
    };
}

function createRepository(
    initialAnnotations: PublicationAnnotation[] = [],
): IRecordingRepository {

    const storedAnnotations = new Map(initialAnnotations.map((annotation) => [annotation.uuid, annotation]));
    const calls: IRecordingRepository["calls"] = {
        list: [],
        get: [],
        create: [],
        replace: [],
        update: [],
        delete: [],
        deleteByPublication: [],
    };

    return {
        storedAnnotations,
        calls,
        list: async (publicationIdentifier) => {
            calls.list.push(publicationIdentifier);
            return Array.from(storedAnnotations.values());
        },
        get: async (publicationIdentifier, annotationIdentifier) => {
            calls.get.push([publicationIdentifier, annotationIdentifier]);
            return storedAnnotations.get(annotationIdentifier);
        },
        create: async (publicationIdentifier, annotation) => {
            calls.create.push([publicationIdentifier, annotation]);
            storedAnnotations.set(annotation.uuid, annotation);
        },
        replace: async (publicationIdentifier, annotation) => {
            calls.replace.push([publicationIdentifier, annotation]);
            storedAnnotations.set(annotation.uuid, annotation);
        },
        update: async (publicationIdentifier, annotation) => {
            calls.update.push([publicationIdentifier, annotation]);
            storedAnnotations.set(annotation.uuid, annotation);
        },
        delete: async (publicationIdentifier, annotationIdentifier) => {
            calls.delete.push([publicationIdentifier, annotationIdentifier]);
            storedAnnotations.delete(annotationIdentifier);
        },
        deleteByPublication: async (publicationIdentifier) => {
            calls.deleteByPublication.push(publicationIdentifier);
            storedAnnotations.clear();
        },
    };
}

function createController(
    repository: PublicationAnnotationRepository<PublicationAnnotation>,
    options: {
        clock?: PublicationAnnotationsClock;
        ids?: string[];
        indexes?: number[];
    } = {},
): PublicationAnnotationsController<PublicationAnnotation> {

    const ids = [...(options.ids || [])];
    const indexes = [...(options.indexes || [])];

    return new PublicationAnnotationsController({
        repository,
        clock: options.clock,
        idProvider: {
            next: () => ids.shift(),
        },
        indexProvider: options.indexes
            ? {
                next: () => indexes.shift() as number,
            }
            : undefined,
    });
}

function createSequenceClock(values: number[]): PublicationAnnotationsClock {
    const revisions = [...values];

    return {
        now: () => {
            if (!revisions.length) {
                throw new Error("Unexpected publication annotation clock read");
            }

            return revisions.shift() as number;
        },
    };
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

test("publication annotation controller normalizes repository reads", async () => {
    const repository = createRepository([{
        uuid: "bookmark-1",
        index: 1,
        created: 1000,
        drawType: EDrawType.solid_background,
        group: "bookmark",
    }, {
        uuid: "highlight-1",
        index: 2,
        created: 2000,
        group: "annotation",
    }, {
        uuid: "unknown-1",
        index: 3,
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
    expect(viewState.byId["unknown-1"]).toEqual(expect.objectContaining({
        drawType: EDrawType.solid_background,
        motivation: "highlighting",
        group: "annotation",
    }));
});

test("publication annotation controller normalizes repository writes", async () => {
    const repository = createRepository([{
        uuid: "highlight-update-1",
        index: 3,
        created: 1000,
        drawType: EDrawType.solid_background,
    }, {
        uuid: "bookmark-replace-1",
        index: 4,
        created: 1000,
        group: "bookmark",
    }]);
    const controller = createController(repository, {
        ids: ["bookmark-create-1", "highlight-create-1"],
        indexes: [1, 2],
    });

    const bookmarkChange = await controller.create("publication-1", {
        motivation: "bookmarking",
    });
    const highlightChange = await controller.create("publication-1", {
        group: "annotation",
    });
    const updateChange = await controller.update("publication-1", {
        uuid: "highlight-update-1",
        index: 3,
        created: 1000,
        drawType: EDrawType.underline,
    });
    const replaceChange = await controller.replace("publication-1", {
        uuid: "bookmark-replace-1",
        index: 4,
        created: 1000,
        motivation: "highlighting",
    });

    expect(bookmarkChange.annotation).toEqual(expect.objectContaining({
        uuid: "bookmark-create-1",
        index: 1,
        drawType: EDrawType.bookmark,
        motivation: "bookmarking",
        group: "bookmark",
    }));
    expect(highlightChange.annotation).toEqual(expect.objectContaining({
        uuid: "highlight-create-1",
        index: 2,
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

test("publication annotation controller defaults unclassified annotations to highlights", async () => {
    const repository = createRepository();
    const controller = createController(repository, {
        clock: {
            now: () => 4000,
        },
        ids: ["unknown-1"],
        indexes: [1],
    });

    const change = await controller.create("publication-1", {});

    expect(change.annotation).toEqual(expect.objectContaining({
        uuid: "unknown-1",
        index: 1,
        created: 4000,
        drawType: EDrawType.solid_background,
        motivation: "highlighting",
        group: "annotation",
    }));
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
        index: 1,
        created: 1000,
    })).rejects.toThrow("does not exist");
    await expect(controller.delete("publication-1", "missing-1")).rejects.toThrow("does not exist");
});

test("publication annotation controller rejects creates with both locatorExtended and pdfAnnotation targets", async () => {
    const repository = createRepository();
    const controller = createController(repository);

    await expect(controller.create("publication-1", {
        uuid: "mixed-create-1",
        index: 1,
        created: 1000,
        locatorExtended: createLocatorExtended(),
        pdfAnnotation: createPdfAnnotation(),
        motivation: "highlighting",
    } as any)).rejects.toThrow("both locatorExtended and pdfAnnotation");

    expect(repository.calls.get).toHaveLength(0);
    expect(repository.calls.create).toHaveLength(0);
});

test("publication annotation controller rejects updates with both locatorExtended and pdfAnnotation targets", async () => {
    const repository = createRepository([{
        uuid: "mixed-update-1",
        index: 1,
        created: 1000,
        locatorExtended: createLocatorExtended(),
        motivation: "highlighting",
    }]);
    const controller = createController(repository);

    await expect(controller.update("publication-1", {
        uuid: "mixed-update-1",
        index: 1,
        created: 1000,
        locatorExtended: createLocatorExtended(),
        pdfAnnotation: createPdfAnnotation(),
        motivation: "highlighting",
    } as any)).rejects.toThrow("both locatorExtended and pdfAnnotation");

    expect(repository.calls.get).toEqual([["publication-1", "mixed-update-1"]]);
    expect(repository.calls.update).toHaveLength(0);
});

test("publication annotation controller rejects repository reads with both locatorExtended and pdfAnnotation targets", async () => {
    const repository = createRepository([{
        uuid: "mixed-read-1",
        index: 1,
        created: 1000,
        locatorExtended: createLocatorExtended(),
        pdfAnnotation: createPdfAnnotation(),
        motivation: "highlighting",
    } as unknown as PublicationAnnotation]);
    const controller = createController(repository);

    await expect(controller.get("publication-1", "mixed-read-1")).rejects.toThrow("both locatorExtended and pdfAnnotation");
    await expect(controller.list("publication-1")).rejects.toThrow("both locatorExtended and pdfAnnotation");
});

test("publication annotation controller rejects mutations with indexes that are not finite numbers", async () => {
    const repository = createRepository([{
        uuid: "invalid-index-update-1",
        index: 1,
        created: 1000,
        motivation: "highlighting",
    }]);
    const controller = createController(repository);

    await expect(controller.create("publication-1", {
        uuid: "invalid-index-create-1",
        index: "1",
        created: 1000,
        motivation: "highlighting",
    } as any)).rejects.toThrow("without an index");
    await expect(controller.replace("publication-1", {
        uuid: "invalid-index-replace-1",
        index: Number.POSITIVE_INFINITY,
        created: 1000,
        motivation: "highlighting",
    } as any)).rejects.toThrow("index must be a finite number");
    await expect(controller.update("publication-1", {
        uuid: "invalid-index-update-1",
        index: Number.NaN,
        created: 1000,
        motivation: "highlighting",
    } as any)).rejects.toThrow("index must be a finite number");

    expect(repository.calls.create).toHaveLength(0);
    expect(repository.calls.replace).toHaveLength(0);
    expect(repository.calls.update).toHaveLength(0);
});

test("publication annotation controller rejects repository reads with indexes that are not finite numbers", async () => {
    const repository = createRepository([{
        uuid: "invalid-index-read-1",
        index: "1",
        created: 1000,
        motivation: "highlighting",
    } as unknown as PublicationAnnotation]);
    const controller = createController(repository);

    await expect(controller.get("publication-1", "invalid-index-read-1")).rejects.toThrow("index must be a finite number");
    await expect(controller.list("publication-1")).rejects.toThrow("index must be a finite number");
});

test("publication annotation controller rejects duplicate creates without writing", async () => {
    const existingAnnotation: PublicationAnnotation = {
        uuid: "duplicate-1",
        index: 1,
        created: 1000,
        motivation: "bookmarking",
    };
    const repository = createRepository([existingAnnotation]);
    const controller = createController(repository);

    await expect(controller.create("publication-1", {
        uuid: "duplicate-1",
        index: 2,
        created: 2000,
        group: "annotation",
    })).rejects.toThrow("already exists");

    expect(repository.calls.get).toEqual([["publication-1", "duplicate-1"]]);
    expect(repository.calls.create).toHaveLength(0);
    expect(repository.storedAnnotations.get("duplicate-1")).toEqual(existingAnnotation);
});

test("publication annotation controller keeps caller-provided identifiers before generated identifiers", async () => {
    const repository = createRepository();
    let generatedIdentifierReads = 0;
    const controller = new PublicationAnnotationsController({
        repository,
        clock: {
            now: () => 9000,
        },
        idProvider: {
            next: () => {
                generatedIdentifierReads++;
                return "generated-1";
            },
        },
    });

    const change = await controller.create("publication-1", {
        uuid: "provided-1",
        index: 1,
        created: 1200,
        motivation: "bookmarking",
    });

    expect(generatedIdentifierReads).toBe(0);
    expect(change).toEqual({
        publicationIdentifier: "publication-1",
        annotation: expect.objectContaining({
            uuid: "provided-1",
            index: 1,
            created: 1200,
            drawType: EDrawType.bookmark,
            motivation: "bookmarking",
            group: "bookmark",
        }),
        revision: 9000,
    });
    expect(repository.calls.create).toEqual([["publication-1", change.annotation]]);
});

test("publication annotation controller generates identifiers for new annotations when needed", async () => {
    const repository = createRepository();
    const controller = createController(repository, {
        clock: createSequenceClock([4100, 4200]),
        ids: ["generated-1"],
        indexes: [1],
    });

    const change = await controller.create("publication-1", {
        group: "annotation",
    });

    expect(change.annotation).toEqual(expect.objectContaining({
        uuid: "generated-1",
        index: 1,
        created: 4100,
        drawType: EDrawType.solid_background,
        motivation: "highlighting",
        group: "annotation",
    }));
    expect(change.revision).toBe(4200);
    expect(repository.storedAnnotations.get("generated-1")).toEqual(change.annotation);
});

test("publication annotation controller keeps caller-provided indexes before generated indexes", async () => {
    const repository = createRepository();
    let generatedIndexReads = 0;
    const controller = new PublicationAnnotationsController({
        repository,
        clock: {
            now: () => 4300,
        },
        indexProvider: {
            next: () => {
                generatedIndexReads++;
                return 99;
            },
        },
    });

    const change = await controller.create("publication-1", {
        uuid: "provided-index-1",
        index: 0,
        created: 1200,
        motivation: "highlighting",
    });

    expect(generatedIndexReads).toBe(0);
    expect(change.annotation.index).toBe(0);
    expect(repository.calls.create).toEqual([["publication-1", change.annotation]]);
});

test("publication annotation controller generates publication indexes for new annotations when needed", async () => {
    const repository = createRepository();
    const requestedPublicationIdentifiers: string[] = [];
    const controller = new PublicationAnnotationsController({
        repository,
        clock: {
            now: () => 4400,
        },
        indexProvider: {
            next: async (publicationIdentifier) => {
                requestedPublicationIdentifiers.push(publicationIdentifier);
                return 17;
            },
        },
    });

    const change = await controller.create("publication-indexed", {
        uuid: "generated-index-1",
        created: 1200,
        motivation: "highlighting",
    });

    expect(requestedPublicationIdentifiers).toEqual(["publication-indexed"]);
    expect(change.annotation).toEqual(expect.objectContaining({
        uuid: "generated-index-1",
        index: 17,
        created: 1200,
    }));
    expect(repository.storedAnnotations.get("generated-index-1")).toEqual(change.annotation);
});

test("publication annotation controller rejects creates when no usable index is available", async () => {
    const missingIndexRepository = createRepository();
    const missingIndexController = new PublicationAnnotationsController({
        repository: missingIndexRepository,
    });

    await expect(missingIndexController.create("publication-1", {
        uuid: "missing-index-1",
        created: 1000,
        motivation: "highlighting",
    })).rejects.toThrow("without an index");

    expect(missingIndexRepository.calls.get).toHaveLength(0);
    expect(missingIndexRepository.calls.create).toHaveLength(0);

    const invalidIndexRepository = createRepository();
    const invalidIndexController = new PublicationAnnotationsController({
        repository: invalidIndexRepository,
        indexProvider: {
            next: () => Number.NaN,
        },
    });

    await expect(invalidIndexController.create("publication-1", {
        uuid: "invalid-index-1",
        created: 1000,
        motivation: "highlighting",
    })).rejects.toThrow("without an index");

    expect(invalidIndexRepository.calls.get).toHaveLength(0);
    expect(invalidIndexRepository.calls.create).toHaveLength(0);
});

test("publication annotation controller rejects creates when the identifier provider has no identifier", async () => {
    const repository = createRepository();
    const controller = new PublicationAnnotationsController({
        repository,
        idProvider: {
            next: () => undefined as unknown as string,
        },
    });

    await expect(controller.create("publication-1", {
        motivation: "highlighting",
    })).rejects.toThrow("without an identifier");

    expect(repository.calls.get).toHaveLength(0);
    expect(repository.calls.create).toHaveLength(0);
});

test("publication annotation controller preserves explicit create timestamps and defaults absent timestamps", async () => {
    const repository = createRepository();
    const controller = createController(repository, {
        clock: createSequenceClock([5100, 5200, 5300]),
        ids: ["default-created-1"],
        indexes: [2],
    });

    const explicitTimestampChange = await controller.create("publication-1", {
        uuid: "explicit-created-1",
        index: 1,
        created: 0,
        motivation: "bookmarking",
    });
    const defaultTimestampChange = await controller.create("publication-1", {
        motivation: "bookmarking",
    });

    expect(explicitTimestampChange.annotation.created).toBe(0);
    expect(explicitTimestampChange.revision).toBe(5100);
    expect(defaultTimestampChange.annotation.created).toBe(5200);
    expect(defaultTimestampChange.revision).toBe(5300);
});

test("publication annotation controller list returns serialized view state and passes publication identifiers", async () => {
    const first: PublicationAnnotation = {
        uuid: "first-1",
        index: 1,
        created: 1000,
        group: "annotation",
        tags: ["shared", "first-only", ""],
    };
    const second: PublicationAnnotation = {
        uuid: "second-1",
        index: 2,
        created: 2000,
        motivation: "bookmarking",
        tags: ["shared"],
    };
    const repository = createRepository([first, second]);
    const controller = createController(repository, {
        clock: {
            now: () => 6100,
        },
    });

    const viewState = await controller.list("publication-list");

    expect(repository.calls.list).toEqual(["publication-list"]);
    expect(viewState).toEqual({
        publicationIdentifier: "publication-list",
        annotations: [{
            ...first,
            drawType: EDrawType.solid_background,
            motivation: "highlighting",
            group: "annotation",
        }, {
            ...second,
            drawType: EDrawType.bookmark,
            motivation: "bookmarking",
            group: "bookmark",
        }],
        revision: 6100,
        byId: {
            "first-1": {
                ...first,
                drawType: EDrawType.solid_background,
                motivation: "highlighting",
                group: "annotation",
            },
            "second-1": {
                ...second,
                drawType: EDrawType.bookmark,
                motivation: "bookmarking",
                group: "bookmark",
            },
        },
        ids: ["first-1", "second-1"],
        tagIndex: {
            shared: 2,
            "first-only": 1,
        },
        totalCount: 2,
    });
});

test("publication annotation controller get passes identifiers and returns undefined for missing annotations", async () => {
    const repository = createRepository();
    const controller = createController(repository);

    const annotation = await controller.get("publication-get", "missing-1");

    expect(annotation).toBeUndefined();
    expect(repository.calls.get).toEqual([["publication-get", "missing-1"]]);
});

test("publication annotation controller replace works without a previous annotation", async () => {
    const repository = createRepository();
    const controller = createController(repository, {
        clock: {
            now: () => 7100,
        },
    });

    const change = await controller.replace("publication-1", {
        uuid: "replace-1",
        index: 1,
        created: 1000,
        group: "annotation",
    });

    expect(change.previousAnnotation).toBeUndefined();
    expect(change.annotation).toEqual(expect.objectContaining({
        uuid: "replace-1",
        drawType: EDrawType.solid_background,
        motivation: "highlighting",
        group: "annotation",
    }));
    expect(change.revision).toBe(7100);
    expect(repository.calls.get).toEqual([["publication-1", "replace-1"]]);
    expect(repository.calls.replace).toEqual([["publication-1", change.annotation]]);
});

test("publication annotation controller rejects missing updates without writing", async () => {
    const repository = createRepository();
    const controller = createController(repository);

    await expect(controller.update("publication-1", {
        uuid: "missing-update-1",
        index: 1,
        created: 1000,
    })).rejects.toThrow("does not exist");

    expect(repository.calls.get).toEqual([["publication-1", "missing-update-1"]]);
    expect(repository.calls.update).toHaveLength(0);
});

test("publication annotation controller update returns normalized previous and next annotations", async () => {
    const repository = createRepository([{
        uuid: "update-1",
        index: 1,
        created: 1000,
        group: "bookmark",
    }]);
    const controller = createController(repository, {
        clock: {
            now: () => 8100,
        },
    });

    const change = await controller.update("publication-1", {
        uuid: "update-1",
        index: 1,
        created: 2000,
        motivation: "highlighting",
        drawType: EDrawType.outline,
    });

    expect(change.previousAnnotation).toEqual(expect.objectContaining({
        uuid: "update-1",
        index: 1,
        created: 1000,
        drawType: EDrawType.bookmark,
        motivation: "bookmarking",
        group: "bookmark",
    }));
    expect(change.annotation).toEqual(expect.objectContaining({
        uuid: "update-1",
        index: 1,
        created: 2000,
        drawType: EDrawType.outline,
        motivation: "highlighting",
        group: "annotation",
    }));
    expect(change.revision).toBe(8100);
    expect(repository.calls.update).toEqual([["publication-1", change.annotation]]);
});

test("publication annotation controller delete calls the repository and returns a revision", async () => {
    const repository = createRepository([{
        uuid: "delete-1",
        index: 1,
        created: 1000,
    }]);
    const controller = createController(repository, {
        clock: {
            now: () => 9100,
        },
    });

    const change = await controller.delete("publication-1", "delete-1");

    expect(change).toEqual({
        publicationIdentifier: "publication-1",
        annotationIdentifier: "delete-1",
        revision: 9100,
    });
    expect(repository.calls.get).toEqual([["publication-1", "delete-1"]]);
    expect(repository.calls.delete).toEqual([["publication-1", "delete-1"]]);
    expect(repository.storedAnnotations.has("delete-1")).toBe(false);
});

test("publication annotation controller deleteByPublication clears publication annotations", async () => {
    const repository = createRepository([{
        uuid: "delete-publication-1",
        index: 1,
        created: 1000,
    }]);
    const controller = createController(repository, {
        clock: {
            now: () => 10100,
        },
    });

    const snapshot = await controller.deleteByPublication("publication-1");

    expect(repository.calls.deleteByPublication).toEqual(["publication-1"]);
    expect(repository.storedAnnotations.size).toBe(0);
    expect(snapshot).toEqual({
        publicationIdentifier: "publication-1",
        annotations: [],
        revision: 10100,
    });
});

test("publication annotation controller fills missing existing created timestamps from modified", async () => {
    const repository = createRepository([{
        uuid: "modified-created-1",
        index: 1,
        modified: 11100,
        group: "annotation",
    } as PublicationAnnotation]);
    const controller = createController(repository, {
        clock: {
            now: () => 11200,
        },
    });

    const annotation = await controller.get("publication-1", "modified-created-1");

    expect(annotation).toEqual(expect.objectContaining({
        uuid: "modified-created-1",
        index: 1,
        created: 11100,
        modified: 11100,
        drawType: EDrawType.solid_background,
        motivation: "highlighting",
        group: "annotation",
    }));
});

test("publication annotation controller fills missing existing created timestamps from the clock", async () => {
    const repository = createRepository([{
        uuid: "clock-created-1",
        index: 1,
        group: "bookmark",
    } as PublicationAnnotation]);
    const controller = createController(repository, {
        clock: {
            now: () => 12100,
        },
    });

    const annotation = await controller.get("publication-1", "clock-created-1");

    expect(annotation).toEqual(expect.objectContaining({
        uuid: "clock-created-1",
        index: 1,
        created: 12100,
        drawType: EDrawType.bookmark,
        motivation: "bookmarking",
        group: "bookmark",
    }));
});

test("publication annotation controller preserves zero timestamps", async () => {
    const repository = createRepository([{
        uuid: "existing-created-zero-1",
        index: 0,
        created: 0,
        group: "annotation",
    }, {
        uuid: "existing-modified-zero-1",
        index: 1,
        modified: 0,
        group: "bookmark",
    } as PublicationAnnotation]);
    const controller = createController(repository, {
        clock: createSequenceClock([13100, 13200]),
    });

    const existingCreated = await controller.get("publication-1", "existing-created-zero-1");
    const existingModified = await controller.get("publication-1", "existing-modified-zero-1");
    const createdDraft = await controller.create("publication-1", {
        uuid: "draft-created-zero-1",
        index: 2,
        created: 0,
        motivation: "highlighting",
    });

    expect(existingCreated?.created).toBe(0);
    expect(existingModified?.created).toBe(0);
    expect(createdDraft.annotation.created).toBe(0);
    expect(createdDraft.revision).toBe(13100);
});
