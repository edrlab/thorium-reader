// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { hexToRgb } from "readium-desktop/common/rgb";
import {
    __READIUM_ANNOTATION_AJV_ERRORS,
    isCFIFragmentSelector,
    isCfiSelector,
    isCssSelector,
    isFragmentSelector,
    isIReadiumAnnotationSet,
    isTextPositionSelector,
    isTextQuoteSelector,
    type IReadiumAnnotation,
    type IReadiumAnnotationSet,
} from "readium-desktop/common/readium/annotation/annotationModel.type";
import { resolveReadiumAnnotationSourceHref } from "readium-desktop/common/readium/annotation/sourceHref";
import {
    NOTE_DEFAULT_COLOR,
    noteColorCodeToColorSet,
    noteColorSetToColorCode,
    type PublicationNote,
    type PublicationNoteChange,
    type PublicationNotesController,
} from "readium-desktop/common/publication-notes";
import { EDrawType } from "readium-desktop/common/type/note.type";
import { isNil } from "readium-desktop/utils/nil";
import { tryCatchSync } from "readium-desktop/utils/tryCatch";
import { uuidv4 } from "readium-desktop/utils/uuid";

export type PublicationNotesImportDecision = "importAll" | "importNoConflict";

export interface PublicationNotesImportAnnotationSetView
    extends Partial<Pick<IReadiumAnnotationSet, "about" | "title" | "generated" | "generator">> {}

export interface PublicationNotesImportPreviewReady extends PublicationNotesImportAnnotationSetView {
    status: "ready";
    publicationIdentifier: string;
    annotationsList: PublicationNote[];
    annotationsConflictListOlder: PublicationNote[];
    annotationsConflictListNewer: PublicationNote[];
}

export type PublicationNotesImportPreview =
    | {
          status: "emptyFile" | "publicationCorrupted" | "nothing" | "alreadyImported";
      }
    | {
          status: "invalidAnnotationSet";
          errors: string;
      }
    | {
          status: "rejectedForeignAnnotations";
          sourceHrefs: string[];
      }
    | PublicationNotesImportPreviewReady;

export interface PublicationNotesImportPreviewInput {
    publicationIdentifier: string;
    fileName: string;
    dataString: string;
    spineItemHrefs: string[] | undefined;
}

export interface PublicationNotesImportApplyResult {
    publicationIdentifier: string;
    changes: PublicationNoteChange<PublicationNote>[];
}

export interface PublicationNotesImportInput extends PublicationNotesImportPreviewInput {
    decision: PublicationNotesImportDecision;
}

export type PublicationNotesImportResult =
    | PublicationNotesImportPreview
    | (PublicationNotesImportApplyResult & {
          status: "imported";
          preview: PublicationNotesImportPreviewReady;
      });

export interface PublicationNotesImportControllerDependencies {
    publicationNotesController: PublicationNotesController<PublicationNote>;
    clock?: {
        now: () => number;
    };
    idProvider?: {
        next: () => string;
    };
    logger?: {
        debug: (...args: unknown[]) => void;
    };
}

export class PublicationNotesImportController {
    private readonly publicationNotesController: PublicationNotesController<PublicationNote>;
    private readonly clock: { now: () => number };
    private readonly idProvider: { next: () => string };
    private readonly logger?: { debug: (...args: unknown[]) => void };

    public constructor(dependencies: PublicationNotesImportControllerDependencies) {
        this.publicationNotesController = dependencies.publicationNotesController;
        this.clock = dependencies.clock || { now: () => Date.now() };
        this.idProvider = dependencies.idProvider || { next: () => uuidv4() };
        this.logger = dependencies.logger;
    }

    public async preview(input: PublicationNotesImportPreviewInput): Promise<PublicationNotesImportPreview> {
        const readiumAnnotationFormat = JSON.parse(input.dataString);
        this.logger?.debug("annotation import file size", input.dataString.length);

        if (!isIReadiumAnnotationSet(readiumAnnotationFormat)) {
            return {
                status: "invalidAnnotationSet",
                errors: __READIUM_ANNOTATION_AJV_ERRORS,
            };
        }

        if (!readiumAnnotationFormat.items.length) {
            return { status: "emptyFile" };
        }

        if (!input.spineItemHrefs) {
            return { status: "publicationCorrupted" };
        }

        const normalizedAnnotations = this.normalizeAnnotationSources(
            readiumAnnotationFormat.items,
            input.spineItemHrefs,
        );
        if (normalizedAnnotations.rejectedSourceHrefs.length) {
            return {
                status: "rejectedForeignAnnotations",
                sourceHrefs: normalizedAnnotations.rejectedSourceHrefs,
            };
        }

        const notesView = await this.publicationNotesController.list(input.publicationIdentifier);
        const existingNotes = notesView.notes;
        const currentTimestamp = this.clock.now();
        const annotationsParsedNoConflictArray: PublicationNote[] = [];
        const annotationsParsedConflictOlderArray: PublicationNote[] = [];
        const annotationsParsedConflictNewerArray: PublicationNote[] = [];
        const annotationsParsedAllArray: PublicationNote[] = [];

        for (const incomingAnnotation of normalizedAnnotations.annotations) {
            const annotationParsed = this.convertAnnotationToNote(
                incomingAnnotation,
                input.fileName,
                currentTimestamp,
            );
            if (!annotationParsed) {
                continue;
            }

            annotationsParsedAllArray.push(annotationParsed);

            const annotationSameUUIDFound = existingNotes.find(({ uuid }) => uuid === annotationParsed.uuid);
            if (annotationSameUUIDFound) {
                if (annotationSameUUIDFound.modified && annotationParsed.modified) {
                    if (annotationSameUUIDFound.modified < annotationParsed.modified) {
                        annotationsParsedConflictNewerArray.push(annotationParsed);
                    }
                    if (annotationSameUUIDFound.modified > annotationParsed.modified) {
                        annotationsParsedConflictOlderArray.push(annotationParsed);
                    }
                } else if (annotationSameUUIDFound.modified) {
                    annotationsParsedConflictOlderArray.push(annotationParsed);
                } else if (annotationParsed.modified) {
                    annotationsParsedConflictNewerArray.push(annotationParsed);
                }
            } else {
                annotationsParsedNoConflictArray.push(annotationParsed);
            }
        }

        if (!annotationsParsedAllArray.length) {
            return { status: "nothing" };
        }

        if (
            !(
                annotationsParsedConflictNewerArray.length ||
                annotationsParsedConflictOlderArray.length ||
                annotationsParsedNoConflictArray.length
            )
        ) {
            return { status: "alreadyImported" };
        }

        return {
            status: "ready",
            publicationIdentifier: input.publicationIdentifier,
            about: readiumAnnotationFormat.about ? { ...readiumAnnotationFormat.about } : undefined,
            title: readiumAnnotationFormat.title || "",
            generated: readiumAnnotationFormat.generated || "",
            generator: readiumAnnotationFormat.generator ? { ...readiumAnnotationFormat.generator } : undefined,
            annotationsList: annotationsParsedNoConflictArray,
            annotationsConflictListOlder: annotationsParsedConflictOlderArray,
            annotationsConflictListNewer: annotationsParsedConflictNewerArray,
        };
    }

    public async apply(
        preview: PublicationNotesImportPreviewReady,
        decision: PublicationNotesImportDecision,
    ): Promise<PublicationNotesImportApplyResult> {
        const notesToImport = decision === "importNoConflict"
            ? preview.annotationsList
            : [
                  ...preview.annotationsList,
                  ...preview.annotationsConflictListOlder,
                  ...preview.annotationsConflictListNewer,
              ];
        const changes: PublicationNoteChange<PublicationNote>[] = [];

        for (const note of notesToImport) {
            const existingNote = await this.publicationNotesController.get(preview.publicationIdentifier, note.uuid);
            const change = existingNote
                ? await this.publicationNotesController.update(preview.publicationIdentifier, note)
                : await this.publicationNotesController.create(preview.publicationIdentifier, note);

            changes.push(change);
        }

        return {
            publicationIdentifier: preview.publicationIdentifier,
            changes,
        };
    }

    public async import(input: PublicationNotesImportInput): Promise<PublicationNotesImportResult> {
        const preview = await this.preview(input);
        if (preview.status !== "ready") {
            return preview;
        }

        return {
            status: "imported",
            preview,
            ...(await this.apply(preview, input.decision)),
        };
    }

    private normalizeAnnotationSources(
        annotations: IReadiumAnnotation[],
        spineItemHrefs: string[],
    ): {
        annotations: IReadiumAnnotation[];
        rejectedSourceHrefs: string[];
    } {
        const rejectedSourceHrefs: string[] = [];
        const normalizedAnnotations = annotations.map((annotation) => {
            const sourceHref = annotation.target.source;
            const spineHref = resolveReadiumAnnotationSourceHref(sourceHref, spineItemHrefs);

            if (!spineHref) {
                rejectedSourceHrefs.push(sourceHref);
                return annotation;
            }

            if (sourceHref !== spineHref) {
                this.logger?.debug(`Normalize incoming annotation target.source href: "${sourceHref}" => "${spineHref}"`);
            }

            return {
                ...annotation,
                target: {
                    ...annotation.target,
                    source: spineHref,
                },
            };
        });

        return {
            annotations: normalizedAnnotations,
            rejectedSourceHrefs,
        };
    }

    private convertAnnotationToNote(
        incomingAnnotation: IReadiumAnnotation,
        fileName: string,
        currentTimestamp: number,
    ): PublicationNote | undefined {
        const uuid = incomingAnnotation.id.split("urn:uuid:")[1] || this.idProvider.next();
        const cssSelector = incomingAnnotation.target.selector.find(isCssSelector);
        const textQuoteSelector = incomingAnnotation.target.selector.find(isTextQuoteSelector);
        const textPositionSelector = incomingAnnotation.target.selector.find(isTextPositionSelector);
        const cfiSelector = incomingAnnotation.target.selector.find(isCfiSelector);
        const cfiFragmentSelector = incomingAnnotation.target.selector
            .filter(isFragmentSelector)
            .find(isCFIFragmentSelector);

        if (!(cssSelector || textQuoteSelector || textPositionSelector || cfiFragmentSelector || cfiSelector)) {
            this.logger?.debug(
                `for ${uuid} no selector available (cssSelector || textQuoteSelector || textPositionSelector || cfiFragmentSelector || cfiSelector)`,
            );
            return undefined;
        }

        const creator = incomingAnnotation.creator;
        const annotationParsed: PublicationNote = {
            uuid,
            index: -1,
            textualValue: incomingAnnotation.body?.value,
            color: hexToRgb(
                noteColorSetToColorCode[incomingAnnotation.body?.color] ||
                    noteColorSetToColorCode[
                        noteColorCodeToColorSet[incomingAnnotation.body?.color] || NOTE_DEFAULT_COLOR
                    ],
            ),
            drawType:
                EDrawType[
                    isNil(incomingAnnotation.body?.highlight) || incomingAnnotation.body?.highlight === "solid"
                        ? "solid_background"
                        : incomingAnnotation.body.highlight
                ] || EDrawType.solid_background,
            tags: [fileName],
            modified: incomingAnnotation.modified
                ? tryCatchSync(() => new Date(incomingAnnotation.modified).getTime(), fileName)
                : undefined,
            created: tryCatchSync(() => new Date(incomingAnnotation.created).getTime(), fileName) || currentTimestamp,
            creator: creator?.id
                ? {
                      id: creator.id,
                      urn: creator.id,
                      type: creator.type,
                      name: creator.name,
                  }
                : undefined,
            group: incomingAnnotation.motivation === "bookmarking" ? "bookmark" : "annotation",
            readiumAnnotation: {
                import: { target: incomingAnnotation.target },
            },
        };

        if (annotationParsed.modified) {
            if (annotationParsed.modified > currentTimestamp) {
                annotationParsed.modified = currentTimestamp;
            }
            if (annotationParsed.created > annotationParsed.modified) {
                annotationParsed.modified = currentTimestamp;
            }
        }
        if (annotationParsed.created > currentTimestamp) {
            annotationParsed.created = currentTimestamp;
        }

        this.logger?.debug("incoming annotation parsed and ready to be imported", annotationParsed.uuid);

        return annotationParsed;
    }
}
