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
    isCssSelector,
    isEPUBCFISelector,
    isIReadiumAnnotationSet,
    isLegacyCfiSelector,
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
    createEmptyPublicationNotesImportReport,
    type PublicationNote,
    type PublicationNoteChange,
    type PublicationNoteImportUnresolvedReason,
    type PublicationNotesImportReport,
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
    importReport: PublicationNotesImportReport;
}

export type PublicationNotesImportPreview =
    | {
          status: "emptyFile" | "publicationCorrupted";
      }
    | {
          status: "invalidAnnotationSet";
          errors: string;
      }
    | {
          status: "nothing" | "alreadyImported";
          importReport: PublicationNotesImportReport;
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

interface PublicationNotesNormalizedImportAnnotation {
    annotation: IReadiumAnnotation;
    originalTarget?: IReadiumAnnotation["target"] | undefined;
    unresolvedReason?: PublicationNoteImportUnresolvedReason | undefined;
}

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

        const notesView = await this.publicationNotesController.list(input.publicationIdentifier);
        const existingNotes = notesView.notes;
        const currentTimestamp = this.clock.now();
        const annotationsParsedNoConflictArray: PublicationNote[] = [];
        const annotationsParsedConflictOlderArray: PublicationNote[] = [];
        const annotationsParsedConflictNewerArray: PublicationNote[] = [];
        const annotationsParsedAllArray: PublicationNote[] = [];
        const importReport = createEmptyPublicationNotesImportReport();

        for (const incomingAnnotation of normalizedAnnotations) {
            const annotationParsed = this.convertAnnotationToNote(
                incomingAnnotation.annotation,
                input.fileName,
                currentTimestamp,
                incomingAnnotation.unresolvedReason,
                incomingAnnotation.originalTarget,
            );

            annotationsParsedAllArray.push(annotationParsed);
            this.addUnresolvedNoteToReport(importReport, annotationParsed);

            const annotationSameUUIDFound = existingNotes.find(({ uuid }) => uuid === annotationParsed.uuid);
            if (annotationSameUUIDFound) {
                if (annotationSameUUIDFound.modified && annotationParsed.modified) {
                    if (annotationSameUUIDFound.modified < annotationParsed.modified) {
                        annotationsParsedConflictNewerArray.push(annotationParsed);
                        importReport.annotationsConflictListNewer.push(annotationParsed);
                    } else if (annotationSameUUIDFound.modified > annotationParsed.modified) {
                        annotationsParsedConflictOlderArray.push(annotationParsed);
                        importReport.annotationsConflictListOlder.push(annotationParsed);
                    } else {
                        importReport.annotationsAlreadyImportedList.push(annotationParsed);
                    }
                } else if (annotationSameUUIDFound.modified) {
                    annotationsParsedConflictOlderArray.push(annotationParsed);
                    importReport.annotationsConflictListOlder.push(annotationParsed);
                } else if (annotationParsed.modified) {
                    annotationsParsedConflictNewerArray.push(annotationParsed);
                    importReport.annotationsConflictListNewer.push(annotationParsed);
                } else {
                    importReport.annotationsAlreadyImportedList.push(annotationParsed);
                }
            } else {
                annotationsParsedNoConflictArray.push(annotationParsed);
            }
        }

        if (!annotationsParsedAllArray.length) {
            return {
                status: "nothing",
                importReport,
            };
        }

        if (
            !(
                annotationsParsedConflictNewerArray.length ||
                annotationsParsedConflictOlderArray.length ||
                annotationsParsedNoConflictArray.length
            )
        ) {
            return {
                status: "alreadyImported",
                importReport,
            };
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
            importReport,
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

    private addUnresolvedNoteToReport(
        report: PublicationNotesImportReport,
        note: PublicationNote,
    ) {
        switch (note.readiumAnnotation?.import?.unresolved?.reason) {
            case "source-mismatch":
                report.sourceMismatch.push(note);
                break;
            case "unsupported-selector":
                report.unsupportedSelector.push(note);
                break;
            case "selector-not-found":
                report.selectorNotFound.push(note);
                break;
            case "ambiguous-match":
                report.ambiguousMatch.push(note);
                break;
        }
    }

    private normalizeAnnotationSources(
        annotations: IReadiumAnnotation[],
        spineItemHrefs: string[],
    ): PublicationNotesNormalizedImportAnnotation[] {
        return annotations.map((annotation) => {
            const sourceHref = annotation.target.source;
            const spineHref = resolveReadiumAnnotationSourceHref(sourceHref, spineItemHrefs);

            if (!spineHref) {
                return {
                    annotation,
                    unresolvedReason: "source-mismatch",
                };
            }

            if (sourceHref !== spineHref) {
                this.logger?.debug(`Normalize incoming annotation target.source href: "${sourceHref}" => "${spineHref}"`);
                return {
                    annotation: {
                        ...annotation,
                        target: {
                            ...annotation.target,
                            source: spineHref,
                        },
                    },
                    originalTarget: annotation.target,
                };
            }

            return {
                annotation,
            };
        });
    }

    private convertAnnotationToNote(
        incomingAnnotation: IReadiumAnnotation,
        fileName: string,
        currentTimestamp: number,
        sourceUnresolvedReason?: PublicationNoteImportUnresolvedReason,
        originalTarget?: IReadiumAnnotation["target"],
    ): PublicationNote {
        const uuid = incomingAnnotation.id.split("urn:uuid:")[1] || this.idProvider.next();
        const cssSelector = incomingAnnotation.target.selector.find(isCssSelector);
        const textQuoteSelector = incomingAnnotation.target.selector.find(isTextQuoteSelector);
        const textPositionSelector = incomingAnnotation.target.selector.find(isTextPositionSelector);
        const cfiSelector = incomingAnnotation.target.selector.find(isEPUBCFISelector) ||
            incomingAnnotation.target.selector.find(isLegacyCfiSelector);
        const cfiFragmentSelector = incomingAnnotation.target.selector.find(isCFIFragmentSelector);
        const unsupportedSelector = !(cssSelector || textQuoteSelector || textPositionSelector || cfiFragmentSelector || cfiSelector);
        const unresolvedReason: PublicationNoteImportUnresolvedReason | undefined =
            sourceUnresolvedReason || (unsupportedSelector ? "unsupported-selector" : undefined);

        if (unsupportedSelector) {
            this.logger?.debug(
                `for ${uuid} no selector available (cssSelector || textQuoteSelector || textPositionSelector || cfiFragmentSelector || cfiSelector)`,
            );
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
                import: {
                    target: incomingAnnotation.target,
                    originalTarget,
                    unresolved: unresolvedReason
                        ? {
                              reason: unresolvedReason,
                              source: incomingAnnotation.target.source,
                              selectorTypes: incomingAnnotation.target.selector
                                  .map((selector) => selector.type)
                                  .filter((selectorType): selectorType is string => !!selectorType),
                              message: unresolvedReason === "source-mismatch"
                                  ? "The annotation source could not be matched to the publication spine."
                                  : "The annotation does not include a supported selector.",
                          }
                        : undefined,
                },
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
