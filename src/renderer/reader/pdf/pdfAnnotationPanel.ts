// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { clone } from "ramda";

import { EDrawType } from "readium-desktop/common/redux/states/renderer/note";
import type { INoteState, TDrawType } from "readium-desktop/common/redux/states/renderer/note";
import type {
    IColor,
    TPdfAnnotationNavigationTarget,
    TPdfAnnotationRectTransport,
    TPdfAnnotationSelectionTarget,
} from "readium-desktop/renderer/reader/pdf/common/pdfAnnotation.type";

export interface IAnnotationPanelSaveChanges {
    color: IColor;
    comment: string;
    drawType: TDrawType;
    tags: string[];
    modified: number;
}

export type TAnnotationPanelNavigation =
    | {
        type: "epub";
        locator: NonNullable<INoteState["locatorExtended"]>["locator"];
    }
    | {
        type: "pdf";
        target: TPdfAnnotationNavigationTarget;
    };

export interface IPdfAnnotationSelectionMenuAction {
    open: true;
    section: "tab-annotation";
    id: string;
    focus: true;
    edit: boolean;
}

export function canUseReadiumAnnotationImportExport(isPdf: boolean): boolean {
    return !isPdf;
}

export function isPdfAnnotationPanelNote(annotation: INoteState): boolean {
    return !!annotation.pdfAnnotation;
}

export function canEditAnnotationInPanel(annotation: INoteState): boolean {
    return annotation.group === "annotation";
}

export function canDeleteAnnotationInPanel(annotation: INoteState): boolean {
    return annotation.group === "annotation";
}

export function filterDeletableAnnotationPanelNotes(annotations: INoteState[]): INoteState[] {
    return annotations.filter(canDeleteAnnotationInPanel);
}

export function getAnnotationSelectionText(annotation: INoteState): string | undefined {
    const epubSelectionText = annotation.locatorExtended?.selectionInfo?.cleanText;
    if (epubSelectionText) {
        return epubSelectionText;
    }

    return annotation.pdfAnnotation?.quote || undefined;
}

export function getAnnotationCardText(annotation: INoteState, fallback: string): string {
    return getAnnotationSelectionText(annotation) || fallback;
}

export function getPdfAnnotationPageLabel(annotation: INoteState, pageLabel: string): string | undefined {
    return typeof annotation.pdfAnnotation?.page === "number"
        ? `${pageLabel} ${annotation.pdfAnnotation.page}`
        : undefined;
}

function getPdfAnnotationVisualSortPosition(rect?: TPdfAnnotationRectTransport) {
    if (!rect) {
        return {
            left: 0,
            top: 0,
        };
    }

    return {
        left: Math.min(rect.x1, rect.x2),
        top: Math.max(rect.y1, rect.y2),
    };
}

export function comparePdfAnnotationsByPagePosition(a: INoteState, b: INoteState): number | undefined {
    if (!a.pdfAnnotation || !b.pdfAnnotation) {
        return undefined;
    }

    const pageDiff = a.pdfAnnotation.page - b.pdfAnnotation.page;
    if (pageDiff) {
        return pageDiff;
    }

    const aRect = a.pdfAnnotation.rects[0];
    const bRect = b.pdfAnnotation.rects[0];
    const aPosition = getPdfAnnotationVisualSortPosition(aRect);
    const bPosition = getPdfAnnotationVisualSortPosition(bRect);
    const yDiff = bPosition.top - aPosition.top;
    if (yDiff) {
        return yDiff;
    }

    const xDiff = aPosition.left - bPosition.left;
    if (xDiff) {
        return xDiff;
    }

    return a.uuid.localeCompare(b.uuid);
}

export function compareAnnotationPanelProgression(
    a: INoteState,
    b: INoteState,
    compareEpubProgression: (a: INoteState, b: INoteState) => number,
): number {
    const pdfComparison = comparePdfAnnotationsByPagePosition(a, b);
    if (typeof pdfComparison === "number") {
        return pdfComparison;
    }

    if (!a.locatorExtended || !b.locatorExtended) {
        return 0;
    }

    return compareEpubProgression(a, b);
}

export function normalizePdfAnnotationNavigationRect(rect?: TPdfAnnotationRectTransport): TPdfAnnotationRectTransport | undefined {
    if (!rect) {
        return undefined;
    }

    const { x1, y1, x2, y2 } = rect;
    if (![x1, y1, x2, y2].every(Number.isFinite)) {
        return undefined;
    }

    const left = Math.min(x1, x2);
    const right = Math.max(x1, x2);
    const top = Math.min(y1, y2);
    const bottom = Math.max(y1, y2);
    if (left === right || top === bottom) {
        return undefined;
    }

    return {
        x1: left,
        y1: top,
        x2: right,
        y2: bottom,
    };
}

export function getPdfAnnotationNavigationTarget(annotation: INoteState): TPdfAnnotationNavigationTarget | undefined {
    if (!annotation.uuid || !annotation.pdfAnnotation) {
        return undefined;
    }

    const { page, rects } = annotation.pdfAnnotation;
    if (!Number.isInteger(page) || page < 1) {
        return undefined;
    }

    const rect = normalizePdfAnnotationNavigationRect(rects[0]);
    if (!rect) {
        return undefined;
    }

    return {
        id: annotation.uuid,
        page,
        rect,
    };
}

export function getAnnotationPanelNavigation(annotation: INoteState): TAnnotationPanelNavigation | undefined {
    if (annotation.locatorExtended?.locator) {
        return {
            type: "epub",
            locator: annotation.locatorExtended.locator,
        };
    }

    const target = getPdfAnnotationNavigationTarget(annotation);
    if (target) {
        return {
            type: "pdf",
            target,
        };
    }

    return undefined;
}

export function getPdfAnnotationSelectionMenuAction(
    payload: Partial<TPdfAnnotationSelectionTarget> | undefined,
    notes: INoteState[],
): IPdfAnnotationSelectionMenuAction | undefined {
    const hasModifierState = !!payload &&
        typeof payload.shiftKey === "boolean" &&
        typeof payload.altKey === "boolean" &&
        typeof payload.ctrlKey === "boolean" &&
        typeof payload.metaKey === "boolean";
    if (
        !payload?.id ||
        payload.source !== "overlay-click" ||
        !Number.isInteger(payload.page) ||
        payload.page < 1 ||
        !Number.isInteger(payload.rectIndex) ||
        payload.rectIndex < 0 ||
        !normalizePdfAnnotationNavigationRect(payload.rect) ||
        !hasModifierState
    ) {
        return undefined;
    }

    const annotation = notes.find((note) => note.uuid === payload.id);
    if (!annotation?.pdfAnnotation) {
        return undefined;
    }

    return {
        open: true,
        section: "tab-annotation",
        id: annotation.uuid,
        focus: true,
        edit: !!payload.shiftKey && canEditAnnotationInPanel(annotation),
    };
}

export function getCreatedPdfAnnotationEditMenuAction(
    annotation: INoteState,
    options: {
        skipEditor?: boolean;
    } = {},
): IPdfAnnotationSelectionMenuAction | undefined {
    if (
        options.skipEditor ||
        !annotation.uuid ||
        !annotation.pdfAnnotation ||
        !canEditAnnotationInPanel(annotation)
    ) {
        return undefined;
    }

    return {
        open: true,
        section: "tab-annotation",
        id: annotation.uuid,
        focus: true,
        edit: true,
    };
}

export function buildAnnotationPanelSaveNote(
    annotation: INoteState,
    changes: IAnnotationPanelSaveChanges,
): INoteState {
    const note: INoteState = {
        uuid: annotation.uuid,
        color: clone(changes.color),
        textualValue: changes.comment,
        drawType: EDrawType[changes.drawType],
        tags: [...changes.tags],
        modified: changes.modified,
        created: annotation.created,
        index: annotation.index,
        group: "annotation",
    };

    if (annotation.locatorExtended) {
        note.locatorExtended = clone(annotation.locatorExtended);
    }

    if (annotation.pdfAnnotation) {
        note.pdfAnnotation = clone(annotation.pdfAnnotation);
    }

    if (annotation.creator) {
        note.creator = clone(annotation.creator);
    }

    return note;
}
