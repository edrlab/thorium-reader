// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type {
    PublicationNotesHydratedPagination,
    PublicationNoteEntity,
    PublicationNotesHydratedView,
    PublicationNotesSnapshot,
    PublicationNotesViewFilter,
    PublicationNotesViewPagination,
    PublicationNotesViewSelection,
    PublicationNotesViewState,
} from "./model";
import { rgbToHex } from "readium-desktop/common/rgb";
import { EDrawType } from "readium-desktop/common/type/note.type";

interface PublicationNotesViewOptions {
    filter?: PublicationNotesViewFilter | undefined;
    spineItemHrefs?: string[] | undefined;
}

interface PublicationNotesFilterablePdfRect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface PublicationNotesFilterableNote extends PublicationNoteEntity {
    color?: { red: number; green: number; blue: number } | undefined;
    drawType?: number | string | undefined;
    creator?: { name?: string | undefined } | undefined;
    locatorExtended?: {
        locator?: {
            href?: string | undefined;
            locations?: {
                progression?: number | undefined;
            } | undefined;
        } | undefined;
    } | undefined;
    pdfAnnotation?: {
        page?: number | undefined;
        rects?: PublicationNotesFilterablePdfRect[] | undefined;
    } | undefined;
}

const emptyFilter: PublicationNotesViewFilter = {};

export function serializePublicationNotesViewState<TNote extends PublicationNoteEntity>(
    snapshot: PublicationNotesSnapshot<TNote>,
    options: PublicationNotesViewOptions = {},
): PublicationNotesViewState<TNote> {

    const index = indexPublicationNotes(snapshot.notes);

    return {
        ...snapshot,
        ...index,
        totalCount: snapshot.notes.length,
        view: hydratePublicationNotesView(snapshot.notes, options.filter, options.spineItemHrefs),
    };
}

function indexPublicationNotes<TNote extends PublicationNoteEntity>(
    notes: TNote[],
): Pick<PublicationNotesHydratedView<TNote>, "byId" | "ids" | "tagIndex"> {

    const byId: Record<string, TNote> = {};
    const ids: string[] = [];
    const tagIndex: Record<string, number> = {};

    for (const note of notes) {
        byId[note.uuid] = note;
        ids.push(note.uuid);

        for (const tag of note.tags || []) {
            if (!tag) {
                continue;
            }
            tagIndex[tag] = (tagIndex[tag] || 0) + 1;
        }
    }

    return {
        byId,
        ids,
        tagIndex,
    };
}

function hydratePublicationNotesView<TNote extends PublicationNoteEntity>(
    notes: TNote[],
    filter: PublicationNotesViewFilter = emptyFilter,
    spineItemHrefs: string[] = [],
): PublicationNotesHydratedView<TNote> {

    const normalizedFilter = normalizeFilter(filter);
    const facetSource = normalizedFilter.group
        ? notes.filter((note) => note.group === normalizedFilter.group)
        : [...notes];
    const filteredNotes = applyFilter(notes, normalizedFilter);
    const sortedNotes = sortPublicationNotes(filteredNotes, normalizedFilter, spineItemHrefs);
    const index = indexPublicationNotes(sortedNotes);
    const pagination = hydratePublicationNotesPagination(sortedNotes, normalizedFilter.pagination);

    return {
        filter: normalizedFilter,
        notes: sortedNotes,
        ...index,
        totalCount: sortedNotes.length,
        pagination,
        facets: {
            tagIndex: indexPublicationNotes(facetSource).tagIndex,
            creators: getCreatorFacet(facetSource),
        },
    };
}

function normalizeFilter(filter: PublicationNotesViewFilter): PublicationNotesViewFilter {

    const normalizedFilter: PublicationNotesViewFilter = {};
    if (filter.group) {
        normalizedFilter.group = filter.group;
    }

    const tags = normalizeSelection(filter.tags);
    if (tags) {
        normalizedFilter.tags = tags;
    }

    const colors = normalizeSelection(filter.colors, true);
    if (colors) {
        normalizedFilter.colors = colors;
    }

    const drawTypes = normalizeSelection(filter.drawTypes);
    if (drawTypes) {
        normalizedFilter.drawTypes = drawTypes;
    }

    const creators = normalizeSelection(filter.creators);
    if (creators) {
        normalizedFilter.creators = creators;
    }

    if (filter.sort) {
        normalizedFilter.sort = filter.sort;
    }

    const pagination = normalizePagination(filter.pagination);
    if (pagination) {
        normalizedFilter.pagination = pagination;
    }

    return normalizedFilter;
}

function normalizePagination(
    pagination: PublicationNotesViewPagination | undefined,
): PublicationNotesViewPagination | undefined {

    if (!pagination) {
        return undefined;
    }

    const page = normalizePositiveInteger(pagination.page);
    const pageSize = normalizePositiveInteger(pagination.pageSize);
    const anchorUuid = normalizeString(pagination.anchorUuid);
    if (!page && !pageSize && !anchorUuid) {
        return undefined;
    }

    return {
        ...(page ? { page } : {}),
        ...(pageSize ? { pageSize } : {}),
        ...(anchorUuid ? { anchorUuid } : {}),
    };
}

function normalizeString(value: string | undefined): string | undefined {

    if (typeof value !== "string") {
        return undefined;
    }

    const normalizedValue = value.trim();
    return normalizedValue ? normalizedValue : undefined;
}

function normalizePositiveInteger(value: number | undefined): number | undefined {

    if (typeof value !== "number" || !Number.isFinite(value)) {
        return undefined;
    }

    const normalizedValue = Math.floor(value);
    return normalizedValue > 0 ? normalizedValue : undefined;
}

function normalizeSelection(
    selection: PublicationNotesViewSelection | undefined,
    uppercase = false,
): PublicationNotesViewSelection | undefined {

    if (selection === "all" || !selection) {
        return selection;
    }

    const values = selection
        .filter((value) => !!value)
        .map((value) => uppercase ? value.toUpperCase() : value);

    return values.length ? values : undefined;
}

function applyFilter<TNote extends PublicationNoteEntity>(
    notes: TNote[],
    filter: PublicationNotesViewFilter,
): TNote[] {

    const groupFilteredNotes = filter.group
        ? notes.filter((note) => note.group === filter.group)
        : [...notes];

    if (!hasFacetFilters(filter)) {
        return groupFilteredNotes;
    }

    return groupFilteredNotes.filter((note) => matchesAnyFacetFilter(note, filter));
}

function hasFacetFilters(filter: PublicationNotesViewFilter): boolean {

    return isSelectionActive(filter.tags) ||
        isSelectionActive(filter.colors) ||
        isSelectionActive(filter.drawTypes) ||
        isSelectionActive(filter.creators);
}

function isSelectionActive(selection: PublicationNotesViewSelection | undefined): boolean {

    return selection === "all" || !!selection?.length;
}

function matchesAnyFacetFilter<TNote extends PublicationNoteEntity>(
    note: TNote,
    filter: PublicationNotesViewFilter,
): boolean {

    return matchesSelection(filter.tags, note.tags || []) ||
        matchesSelection(filter.colors, getNoteColors(note)) ||
        matchesSelection(filter.drawTypes, getNoteDrawTypes(note)) ||
        matchesSelection(filter.creators, getNoteCreators(note));
}

function matchesSelection(
    selection: PublicationNotesViewSelection | undefined,
    values: string[],
): boolean {

    if (!isSelectionActive(selection)) {
        return false;
    }

    const availableValues = values.filter((value) => !!value);
    if (selection === "all") {
        return !!availableValues.length;
    }

    return availableValues.some((value) => selection.includes(value));
}

function getFilterableNote<TNote extends PublicationNoteEntity>(note: TNote): PublicationNotesFilterableNote {

    return note as PublicationNotesFilterableNote;
}

function getNoteColors<TNote extends PublicationNoteEntity>(note: TNote): string[] {

    const color = getFilterableNote(note).color;
    if (!color) {
        return [];
    }

    return [rgbToHex(color)];
}

function getNoteDrawTypes<TNote extends PublicationNoteEntity>(note: TNote): string[] {

    const drawType = getFilterableNote(note).drawType;
    if (typeof drawType === "number") {
        return [EDrawType[drawType]].filter((value) => !!value);
    }

    return drawType ? [drawType] : [];
}

function getNoteCreators<TNote extends PublicationNoteEntity>(note: TNote): string[] {

    const creatorName = getFilterableNote(note).creator?.name;
    return creatorName ? [creatorName] : [];
}

function getCreatorFacet<TNote extends PublicationNoteEntity>(notes: TNote[]): string[] {

    const creators: string[] = [];
    const seen = new Set<string>();

    for (const note of notes) {
        const creatorName = getFilterableNote(note).creator?.name;
        if (!creatorName || seen.has(creatorName)) {
            continue;
        }
        seen.add(creatorName);
        creators.push(creatorName);
    }

    return creators;
}

function sortPublicationNotes<TNote extends PublicationNoteEntity>(
    notes: TNote[],
    filter: PublicationNotesViewFilter,
    spineItemHrefs: string[],
): TNote[] {

    const sortedNotes = [...notes];
    if (filter.sort === "progression") {
        return sortedNotes.sort((a, b) => comparePublicationNotesProgression(a, b, spineItemHrefs));
    }

    if (filter.sort === "lastModified") {
        return sortedNotes.sort(({ modified: ma }, { modified: mb }) => ma && mb ? mb - ma : ma ? -1 : mb ? 1 : 0);
    }

    if (filter.sort === "lastCreated") {
        return sortedNotes.sort(({ created: ca = 0 }, { created: cb = 0 }) => cb - ca);
    }

    return sortedNotes;
}

function hydratePublicationNotesPagination<TNote extends PublicationNoteEntity>(
    notes: TNote[],
    pagination: PublicationNotesViewPagination | undefined,
): PublicationNotesHydratedPagination<TNote> {

    const totalCount = notes.length;
    if (!pagination?.pageSize) {
        const index = indexPublicationNotes(notes);
        return {
            notes,
            byId: index.byId,
            ids: index.ids,
            page: 1,
            pageSize: totalCount,
            pageTotal: 1,
            begin: totalCount ? 1 : 0,
            end: totalCount,
            totalCount,
        };
    }

    const pageSize = pagination.pageSize;
    const pageTotal = Math.max(Math.ceil(totalCount / pageSize), 1);
    const anchorIndex = pagination.anchorUuid
        ? notes.findIndex((note) => note.uuid === pagination.anchorUuid)
        : -1;
    const anchorPage = anchorIndex >= 0
        ? Math.floor(anchorIndex / pageSize) + 1
        : undefined;
    const requestedPage = anchorPage || pagination.page || 1;
    const page = Math.min(Math.max(requestedPage, 1), pageTotal);
    const startIndex = (page - 1) * pageSize;
    const pagedNotes = notes.slice(startIndex, startIndex + pageSize);
    const index = indexPublicationNotes(pagedNotes);

    return {
        notes: pagedNotes,
        byId: index.byId,
        ids: index.ids,
        page,
        pageSize,
        pageTotal,
        begin: pagedNotes.length ? startIndex + 1 : 0,
        end: Math.min(startIndex + pageSize, totalCount),
        totalCount,
    };
}

function comparePublicationNotesProgression<TNote extends PublicationNoteEntity>(
    a: TNote,
    b: TNote,
    spineItemHrefs: string[],
): number {

    const pdfComparison = comparePdfAnnotationsByPagePosition(a, b);
    if (typeof pdfComparison === "number") {
        return pdfComparison;
    }

    const aLocator = getFilterableNote(a).locatorExtended?.locator;
    const bLocator = getFilterableNote(b).locatorExtended?.locator;
    if (!aLocator || !bLocator) {
        return 0;
    }

    return computeProgression(spineItemHrefs, aLocator) - computeProgression(spineItemHrefs, bLocator);
}

function comparePdfAnnotationsByPagePosition<TNote extends PublicationNoteEntity>(
    a: TNote,
    b: TNote,
): number | undefined {

    const aPdf = getFilterableNote(a).pdfAnnotation;
    const bPdf = getFilterableNote(b).pdfAnnotation;
    if (!aPdf || !bPdf || typeof aPdf.page !== "number" || typeof bPdf.page !== "number") {
        return undefined;
    }

    const pageDiff = aPdf.page - bPdf.page;
    if (pageDiff) {
        return pageDiff;
    }

    const aPosition = getPdfAnnotationVisualSortPosition(aPdf.rects?.[0]);
    const bPosition = getPdfAnnotationVisualSortPosition(bPdf.rects?.[0]);
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

function getPdfAnnotationVisualSortPosition(rect: PublicationNotesFilterablePdfRect | undefined) {

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

function computeProgression(
    spineItemHrefs: string[],
    locator: NonNullable<PublicationNotesFilterableNote["locatorExtended"]>["locator"],
): number {

    let percent = 100;
    if (spineItemHrefs.length && locator?.href) {
        const index = spineItemHrefs.findIndex((href) => href === locator.href);
        if (index >= 0) {
            if (typeof locator.locations?.progression === "number") {
                percent = 100 * ((index + locator.locations.progression) / spineItemHrefs.length);
            } else {
                percent = 100 * (index / spineItemHrefs.length);
            }
            percent = Math.round(percent * 100) / 100;
        }
    }

    return percent;
}
