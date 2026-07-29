// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { ISelector } from "readium-desktop/common/readium/annotation/annotationModel.type";
import type {
    PublicationNote,
    PublicationNoteImportUnresolvedReason,
    PublicationNoteImportUnresolvedState,
} from "readium-desktop/common/publication-notes";
import type { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";

export interface IReadiumAnnotationSelectorResource {
    xmlDom?: Document | undefined;
}

export interface IReadiumAnnotationSelectorControllerContext {
    isReaderLocked: boolean;
    isLcp: boolean;
}

export type TReadiumAnnotationSelectorControllerUpdateKind =
    "exportSelector" |
    "importLocator" |
    "importUnresolved";

export interface IReadiumAnnotationSelectorControllerUpdate {
    kind: TReadiumAnnotationSelectorControllerUpdateKind;
    previousNote: PublicationNote;
    note: PublicationNote;
}

type TReadiumAnnotationImportTarget =
    NonNullable<NonNullable<PublicationNote["readiumAnnotation"]>["import"]>["target"];

export type TReadiumAnnotationImportLocatorResolution =
    | {
        status: "resolved";
        locatorExtended: MiniLocatorExtended;
    }
    | {
        status: "unresolved";
        reason: PublicationNoteImportUnresolvedReason;
        source?: string | undefined;
        selectorTypes?: string[] | undefined;
        message?: string | undefined;
    };

export interface IReadiumAnnotationSelectorControllerDependencies {
    getResourceCache: (href: string) => Promise<IReadiumAnnotationSelectorResource | undefined>;
    createExportSelectors: (
        note: PublicationNote,
        isLcp: boolean,
        sourceHref: string,
        xmlDom: Document | undefined,
    ) => Promise<ISelector[]>;
    convertImportTargetToLocatorExtended: (
        target: TReadiumAnnotationImportTarget,
        isBookmark: boolean,
        xmlDom: Document | undefined,
        sourceHref: string,
    ) => Promise<TReadiumAnnotationImportLocatorResolution>;
    hasGeneratedExportSelectors: (note: PublicationNote) => boolean;
    onError?: (error: unknown, note: PublicationNote) => void;
    yieldBeforeNote?: (note: PublicationNote) => Promise<void>;
}

export class ReadiumAnnotationSelectorController {

    public constructor(private readonly dependencies: IReadiumAnnotationSelectorControllerDependencies) {
    }

    public async resolvePublicationNoteUpdates(
        note: PublicationNote,
        context: IReadiumAnnotationSelectorControllerContext,
    ): Promise<IReadiumAnnotationSelectorControllerUpdate[]> {

        const exportUpdatedNote = await this.updateExportSelectorFromLocatorExtended(note, context);
        if (exportUpdatedNote) {
            return [{
                kind: "exportSelector",
                previousNote: note,
                note: exportUpdatedNote,
            }];
        }

        const importUpdate = await this.updateLocatorExtendedFromImportSelector(note, context);
        if (importUpdate) {
            return [{
                kind: importUpdate.kind,
                previousNote: note,
                note: importUpdate.note,
            }];
        }

        return [];
    }

    public async resolvePublicationNotesUpdates(
        notes: PublicationNote[],
        context: IReadiumAnnotationSelectorControllerContext,
    ): Promise<IReadiumAnnotationSelectorControllerUpdate[]> {

        const updates: IReadiumAnnotationSelectorControllerUpdate[] = [];
        for (const note of notes) {
            try {
                await this.dependencies.yieldBeforeNote?.(note);
                updates.push(...await this.resolvePublicationNoteUpdates(note, context));
            } catch (error) {
                this.dependencies.onError?.(error, note);
            }
        }

        return updates;
    }

    private async updateExportSelectorFromLocatorExtended(
        note: PublicationNote,
        context: IReadiumAnnotationSelectorControllerContext,
    ): Promise<PublicationNote | undefined> {

        if (!context.isReaderLocked ||
            !note.locatorExtended ||
            this.dependencies.hasGeneratedExportSelectors(note)) {
            return undefined;
        }

        const sourceHref = note.locatorExtended.locator?.href;
        if (!sourceHref) {
            return undefined;
        }

        const cacheDoc = await this.dependencies.getResourceCache(sourceHref);
        const selector = await this.dependencies.createExportSelectors(
            note,
            context.isLcp,
            sourceHref,
            cacheDoc?.xmlDom,
        );
        if (!selector.length) {
            return undefined;
        }

        return {
            ...note,
            readiumAnnotation: {
                ...(note.readiumAnnotation || {}),
                export: { selector },
            },
        };
    }

    private async updateLocatorExtendedFromImportSelector(
        note: PublicationNote,
        context: IReadiumAnnotationSelectorControllerContext,
    ): Promise<Pick<IReadiumAnnotationSelectorControllerUpdate, "kind" | "note"> | undefined> {

        const target = note.readiumAnnotation?.import?.target;
        if (!context.isReaderLocked ||
            note.locatorExtended ||
            !target?.selector.length ||
            !target.source) {
            return undefined;
        }

        const cacheDoc = await this.dependencies.getResourceCache(target.source);
        if (!cacheDoc?.xmlDom) {
            const noteWithUnresolvedImport = this.updateImportUnresolvedState(
                note,
                target,
                {
                    reason: "source-mismatch",
                    source: target.source,
                    selectorTypes: target.selector
                        .map((selector) => selector.type)
                        .filter((selectorType): selectorType is string => !!selectorType),
                    message: "The annotation source could not be loaded from the publication.",
                },
            );

            return noteWithUnresolvedImport
                ? { kind: "importUnresolved", note: noteWithUnresolvedImport }
                : undefined;
        }

        const resolution = await this.dependencies.convertImportTargetToLocatorExtended(
            target,
            note.group === "bookmark",
            cacheDoc.xmlDom,
            target.source,
        );

        if (resolution.status === "unresolved") {
            const noteWithUnresolvedImport = this.updateImportUnresolvedState(
                note,
                target,
                {
                    reason: resolution.reason,
                    source: resolution.source,
                    selectorTypes: resolution.selectorTypes,
                    message: resolution.message,
                },
            );

            return noteWithUnresolvedImport
                ? { kind: "importUnresolved", note: noteWithUnresolvedImport }
                : undefined;
        }

        return {
            kind: "importLocator",
            note: {
                ...note,
                locatorExtended: resolution.locatorExtended,
                readiumAnnotation: {
                    ...(note.readiumAnnotation || {}),
                    import: {
                        ...(note.readiumAnnotation?.import || {}),
                        target,
                        unresolved: undefined,
                    },
                },
            },
        };
    }

    private updateImportUnresolvedState(
        note: PublicationNote,
        target: TReadiumAnnotationImportTarget,
        unresolved: PublicationNoteImportUnresolvedState,
    ): PublicationNote | undefined {

        const currentUnresolved = note.readiumAnnotation?.import?.unresolved;
        if (
            currentUnresolved?.reason === unresolved.reason &&
            currentUnresolved?.source === unresolved.source &&
            currentUnresolved?.message === unresolved.message &&
            JSON.stringify(currentUnresolved?.selectorTypes || []) === JSON.stringify(unresolved.selectorTypes || [])
        ) {
            return undefined;
        }

        return {
            ...note,
            readiumAnnotation: {
                ...(note.readiumAnnotation || {}),
                import: {
                    ...(note.readiumAnnotation?.import || {}),
                    target,
                    unresolved,
                },
            },
        };
    }
}
