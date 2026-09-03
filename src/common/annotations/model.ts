// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type { IColor } from "@r2-navigator-js/electron/common/highlight";
import type { IReadiumAnnotation, ISelector } from "readium-desktop/common/readium/annotation/annotationModel.type";
import type { INoteCreator } from "readium-desktop/common/redux/states/creator";
import type { MiniLocatorExtended } from "readium-desktop/common/redux/states/locatorInitialState";
import { EDrawType } from "readium-desktop/common/type/note.type";

export interface IPdfAnnotationRect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface IPdfTextAnnotationTarget {
    type: "pdf-text-highlight";
    page: number;
    rects: IPdfAnnotationRect[];
    quote?: string | undefined;
}


// https://www.w3.org/TR/annotation-model/#motivation-and-purpose
// The W3C Web Annotation Data Model uses `motivation` to express why an
// annotation was created. Thorium keeps the legacy `group` field for persisted
// internal state, so existing records do not need a database migration.
export type PublicationAnnotationMotivation = "bookmarking" | "highlighting";
export type PublicationAnnotationGroup = "bookmark" | "annotation";
export type PublicationAnnotationKind = "bookmark" | "highlight";
export type PublicationHighlightDrawType =
    EDrawType.solid_background |
    EDrawType.underline |
    EDrawType.strikethrough |
    EDrawType.outline;

export interface PublicationAnnotationBase {
    uuid: string;
    index: number;
    created: number;
    modified?: number | undefined;

    // comment/note text value
    textualValue?: string | undefined;

    color?: IColor;
    drawType?: EDrawType;
    tags?: string[] | undefined;
    creator?: INoteCreator | undefined;
    motivation?: PublicationAnnotationMotivation | undefined;
    group?: PublicationAnnotationGroup | undefined;
    readiumAnnotation?: {
        export?: {
            selector: ISelector[];
        } | undefined;

        import?: {
            target: IReadiumAnnotation["target"];
        } | undefined;
    } | undefined;
}

export interface PublicationAnnotationWithLocatorTarget {
    locatorExtended: MiniLocatorExtended;
    pdfAnnotation?: undefined;
}

export interface PublicationAnnotationWithPdfTarget {
    locatorExtended?: undefined;
    pdfAnnotation: IPdfTextAnnotationTarget;
}

export interface PublicationAnnotationWithoutTarget {
    locatorExtended?: undefined;
    pdfAnnotation?: undefined;
}

export interface PublicationAnnotationTargetFields {
    locatorExtended?: MiniLocatorExtended | undefined;
    pdfAnnotation?: IPdfTextAnnotationTarget | undefined;
}

export interface PublicationAnnotationIndexFields {
    index?: number | undefined;
}

export type PublicationAnnotationTarget =
    PublicationAnnotationWithLocatorTarget |
    PublicationAnnotationWithPdfTarget |
    PublicationAnnotationWithoutTarget;

export type PublicationAnnotation = PublicationAnnotationBase & PublicationAnnotationTarget;

export type PublicationAnnotationKindFields = Pick<PublicationAnnotation, "drawType" | "motivation" | "group">;

export type PublicationBookmarkAnnotation<TAnnotation extends PublicationAnnotation = PublicationAnnotation> =
    TAnnotation & {
        drawType: EDrawType.bookmark;
        motivation: "bookmarking";
        group: "bookmark";
    };

export type PublicationHighlightAnnotation<TAnnotation extends PublicationAnnotation = PublicationAnnotation> =
    TAnnotation & {
        drawType: PublicationHighlightDrawType;
        motivation: "highlighting";
        group: "annotation";
    };

export type PublicationNormalizedAnnotation<TAnnotation extends PublicationAnnotation = PublicationAnnotation> =
    PublicationBookmarkAnnotation<TAnnotation> |
    PublicationHighlightAnnotation<TAnnotation>;

export const PUBLICATION_ANNOTATION_BOOKMARK_FIELDS = {
    drawType: EDrawType.bookmark,
    motivation: "bookmarking",
    group: "bookmark",
} as const;

export const PUBLICATION_ANNOTATION_DEFAULT_HIGHLIGHT_FIELDS = {
    drawType: EDrawType.solid_background,
    motivation: "highlighting",
    group: "annotation",
} as const;

export function isPublicationHighlightDrawType(drawType: EDrawType | undefined): drawType is PublicationHighlightDrawType {
    return drawType === EDrawType.solid_background ||
        drawType === EDrawType.underline ||
        drawType === EDrawType.strikethrough ||
        drawType === EDrawType.outline;
}

export function getPublicationAnnotationKind(annotation: PublicationAnnotationKindFields): PublicationAnnotationKind | undefined {
    if (annotation.motivation === "bookmarking") {
        return "bookmark";
    }
    if (annotation.motivation === "highlighting") {
        return "highlight";
    }
    if (annotation.group === "bookmark") {
        return "bookmark";
    }
    if (annotation.group === "annotation") {
        return "highlight";
    }
    if (annotation.drawType === EDrawType.bookmark) {
        return "bookmark";
    } else if (isPublicationHighlightDrawType(annotation.drawType)) {
        return "highlight";
    }
    return undefined;
}

export function getPublicationAnnotationMotivation(annotation: PublicationAnnotationKindFields): PublicationAnnotationMotivation | undefined {
    const kind = getPublicationAnnotationKind(annotation);
    if (kind === "bookmark") {
        return "bookmarking";
    }
    if (kind === "highlight") {
        return "highlighting";
    }
    return undefined;
}

export function assertPublicationAnnotationTargetMutualExclusion(annotation: PublicationAnnotationTargetFields) {
    if (annotation.locatorExtended !== undefined && annotation.pdfAnnotation !== undefined) {
        throw new Error("Publication annotation cannot define both locatorExtended and pdfAnnotation targets");
    }
}

export function assertPublicationAnnotationIndex(annotation: PublicationAnnotationIndexFields) {
    if (typeof annotation.index !== "number" || !Number.isFinite(annotation.index)) {
        throw new Error("Publication annotation index must be a finite number");
    }
}

export function normalizePublicationAnnotation<TAnnotation extends PublicationAnnotation>(
    annotation: TAnnotation,
): PublicationNormalizedAnnotation<TAnnotation> {
    assertPublicationAnnotationIndex(annotation);
    assertPublicationAnnotationTargetMutualExclusion(annotation);

    const kind = getPublicationAnnotationKind(annotation);
    if (kind === "bookmark") {
        return {
            ...annotation,
            ...PUBLICATION_ANNOTATION_BOOKMARK_FIELDS,
        } as PublicationBookmarkAnnotation<TAnnotation>;
    }

    return {
        ...annotation,
        ...PUBLICATION_ANNOTATION_DEFAULT_HIGHLIGHT_FIELDS,
        drawType: isPublicationHighlightDrawType(annotation.drawType)
            ? annotation.drawType
            : PUBLICATION_ANNOTATION_DEFAULT_HIGHLIGHT_FIELDS.drawType,
    } as PublicationHighlightAnnotation<TAnnotation>;
}

export function isPublicationBookmarkAnnotation<TAnnotation extends PublicationAnnotation>(
    annotation: TAnnotation,
): annotation is PublicationBookmarkAnnotation<TAnnotation> {
    return annotation.drawType === EDrawType.bookmark &&
        annotation.motivation === "bookmarking" &&
        annotation.group === "bookmark";
}

export function isPublicationHighlightAnnotation<TAnnotation extends PublicationAnnotation>(
    annotation: TAnnotation,
): annotation is PublicationHighlightAnnotation<TAnnotation> {
    return isPublicationHighlightDrawType(annotation.drawType) &&
        annotation.motivation === "highlighting" &&
        annotation.group === "annotation";
}

export type PublicationAnnotationDraft<TAnnotation extends PublicationAnnotation = PublicationAnnotation> =
    Omit<TAnnotation, "uuid" | "created" | "index"> &
    Partial<Pick<TAnnotation, "uuid" | "created" | "index">>;

export interface PublicationAnnotationsSnapshot<TAnnotation extends PublicationAnnotation> {
    publicationIdentifier: string;
    annotations: TAnnotation[];
    revision: number;
}

export interface PublicationAnnotationsViewState<TAnnotation extends PublicationAnnotation> extends PublicationAnnotationsSnapshot<TAnnotation> {
    byId: Record<string, TAnnotation>;
    ids: string[];
    tagIndex: Record<string, number>;
    totalCount: number;
}

export interface PublicationAnnotationChange<TAnnotation extends PublicationAnnotation> {
    publicationIdentifier: string;
    annotation: TAnnotation;
    previousAnnotation?: TAnnotation | undefined;
    revision: number;
}

export interface PublicationAnnotationDeleteChange {
    publicationIdentifier: string;
    annotationIdentifier: string;
    revision: number;
}
