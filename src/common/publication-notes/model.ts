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
import type { EDrawType } from "readium-desktop/common/type/note.type";
import type { TTranslatorKeyParameter } from "readium-desktop/typings/en.translation-keys";

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

export interface PublicationNoteEntity {
    uuid: string;
    index?: number | undefined;
    created?: number | undefined;
    modified?: number | undefined;
    group?: "bookmark" | "annotation" | undefined;
    tags?: string[] | undefined;
}

export type PublicationNoteGroup = NonNullable<PublicationNoteEntity["group"]>;

export type PublicationNotesViewSelection = "all" | string[];

export type PublicationNotesViewSort = "progression" | "lastCreated" | "lastModified";

export type PublicationNoteImportUnresolvedReason =
    "source-mismatch" |
    "unsupported-selector" |
    "selector-not-found" |
    "ambiguous-match";

export const publicationNoteImportUnresolvedReasons: readonly PublicationNoteImportUnresolvedReason[] = [
    "source-mismatch",
    "unsupported-selector",
    "selector-not-found",
    "ambiguous-match",
];

type PublicationNoteImportUnresolvedReasonTranslator = (_: TTranslatorKeyParameter, __?: {}) => string;

export function getPublicationNoteImportUnresolvedReasonLabel(
    reason: PublicationNoteImportUnresolvedReason,
    translate: PublicationNoteImportUnresolvedReasonTranslator,
): string {

    switch (reason) {
        case "source-mismatch":
            return translate("message.annotations.importReportReasonSourceMismatch");
        case "unsupported-selector":
            return translate("message.annotations.importReportReasonUnsupportedSelector");
        case "selector-not-found":
            return translate("message.annotations.importReportReasonSelectorNotFound");
        case "ambiguous-match":
            return translate("message.annotations.importReportReasonAmbiguousMatch");
    }
}

export interface PublicationNoteImportUnresolvedState {
    reason: PublicationNoteImportUnresolvedReason;
    source?: string | undefined;
    selectorTypes?: string[] | undefined;
    message?: string | undefined;
}

export interface PublicationNotesViewPagination {
    page?: number | undefined;
    pageSize?: number | undefined;
    anchorUuid?: string | undefined;
}

export interface PublicationNotesViewFilter {
    group?: PublicationNoteGroup | undefined;
    tags?: PublicationNotesViewSelection | undefined;
    colors?: PublicationNotesViewSelection | undefined;
    drawTypes?: PublicationNotesViewSelection | undefined;
    creators?: PublicationNotesViewSelection | undefined;
    importReportUnresolvedImportedNotes?: boolean | undefined;
    sort?: PublicationNotesViewSort | undefined;
    pagination?: PublicationNotesViewPagination | undefined;
}

export interface PublicationNotesViewFacets {
    tagIndex: Record<string, number>;
    creators: string[];
}

export interface PublicationNotesHydratedPagination<TNote extends PublicationNoteEntity> {
    notes: TNote[];
    byId: Record<string, TNote>;
    ids: string[];
    page: number;
    pageSize: number;
    pageTotal: number;
    begin: number;
    end: number;
    totalCount: number;
}

export interface PublicationNotesHydratedView<TNote extends PublicationNoteEntity> {
    filter: PublicationNotesViewFilter;
    notes: TNote[];
    byId: Record<string, TNote>;
    ids: string[];
    tagIndex: Record<string, number>;
    totalCount: number;
    pagination: PublicationNotesHydratedPagination<TNote>;
    facets: PublicationNotesViewFacets;
}

export interface PublicationNote extends PublicationNoteEntity {
    uuid: string;
    index: number;
    locatorExtended?: MiniLocatorExtended | undefined;
    pdfAnnotation?: IPdfTextAnnotationTarget | undefined;
    textualValue?: string | undefined;
    color: IColor;
    drawType: EDrawType;
    tags?: string[] | undefined;
    modified?: number | undefined;
    created: number;
    creator?: INoteCreator | undefined;
    group: "bookmark" | "annotation";
    readiumAnnotation?: {
        export?: {
            selector: ISelector[];
        } | undefined;

        import?: {
            target: IReadiumAnnotation["target"];
            originalTarget?: IReadiumAnnotation["target"] | undefined;
            unresolved?: PublicationNoteImportUnresolvedState | undefined;
        } | undefined;
    } | undefined;
}

export function getPublicationNoteImportSelectorTypesLabel(
    note: PublicationNote,
    fallback: string,
): string {

    const selectorTypes = note.readiumAnnotation?.import?.unresolved?.selectorTypes || [];
    return selectorTypes.length
        ? selectorTypes.join(", ")
        : fallback;
}

export interface PublicationNotesImportReport {
    sourceMismatch: PublicationNote[];
    unsupportedSelector: PublicationNote[];
    selectorNotFound: PublicationNote[];
    ambiguousMatch: PublicationNote[];
    annotationsConflictListOlder: PublicationNote[];
    annotationsConflictListNewer: PublicationNote[];
    annotationsAlreadyImportedList: PublicationNote[];
}

export function createEmptyPublicationNotesImportReport(): PublicationNotesImportReport {
    return {
        sourceMismatch: [],
        unsupportedSelector: [],
        selectorNotFound: [],
        ambiguousMatch: [],
        annotationsConflictListOlder: [],
        annotationsConflictListNewer: [],
        annotationsAlreadyImportedList: [],
    };
}

export type PublicationNoteDraft =
    Omit<PublicationNote, "uuid"> &
    Partial<Pick<PublicationNote, "uuid">>;

export interface PublicationNotesSnapshot<TNote extends PublicationNoteEntity> {
    publicationIdentifier: string;
    notes: TNote[];
    revision: number;
}

export interface PublicationNoteChange<TNote extends PublicationNoteEntity> {
    publicationIdentifier: string;
    note: TNote;
    previousNote?: TNote | undefined;
    revision: number;
}

export interface PublicationNoteDeleteChange {
    publicationIdentifier: string;
    noteIdentifier: string;
    revision: number;
}
