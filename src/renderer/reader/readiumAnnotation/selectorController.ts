// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { ISelector } from "readium-desktop/common/readium/annotation/annotationModel.type";
import type { PublicationNote } from "readium-desktop/common/publication-notes";
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
    "importLocator";

export interface IReadiumAnnotationSelectorControllerUpdate {
    kind: TReadiumAnnotationSelectorControllerUpdateKind;
    previousNote: PublicationNote;
    note: PublicationNote;
}

type TReadiumAnnotationImportTarget =
    NonNullable<NonNullable<PublicationNote["readiumAnnotation"]>["import"]>["target"];

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
    ) => Promise<MiniLocatorExtended | undefined>;
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

        const importUpdatedNote = await this.updateLocatorExtendedFromImportSelector(note, context);
        if (importUpdatedNote) {
            return [{
                kind: "importLocator",
                previousNote: note,
                note: importUpdatedNote,
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
    ): Promise<PublicationNote | undefined> {

        const target = note.readiumAnnotation?.import?.target;
        if (!context.isReaderLocked ||
            note.locatorExtended ||
            !target?.selector.length ||
            !target.source) {
            return undefined;
        }

        const cacheDoc = await this.dependencies.getResourceCache(target.source);
        const locatorExtended = await this.dependencies.convertImportTargetToLocatorExtended(
            target,
            note.group === "bookmark",
            cacheDoc?.xmlDom,
            target.source,
        );

        if (!locatorExtended) {
            return undefined;
        }

        return {
            ...note,
            locatorExtended,
        };
    }
}
