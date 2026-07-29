// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { push } from "redux-first-history";
import {
    isPublicationNotesViewSort,
    type PublicationNoteGroup,
    type PublicationNotesViewSort,
} from "readium-desktop/common/publication-notes";
import type { TDispatch } from "readium-desktop/typings/redux";

export type ReaderMenuRouteGroup = Extract<PublicationNoteGroup, "annotation" | "bookmark">;

export const readerMenuRoutePattern = "/reader/menu/:group/:uuid";

export interface ReaderMenuRouteOptions {
    edit?: boolean | undefined;
    sort?: PublicationNotesViewSort | undefined;
}

export function isReaderMenuRouteGroup(group: string | undefined): group is ReaderMenuRouteGroup {
    return group === "annotation" || group === "bookmark";
}

function normalizeReaderMenuRouteOptions(editOrOptions: boolean | ReaderMenuRouteOptions | undefined): ReaderMenuRouteOptions {

    return typeof editOrOptions === "boolean" ? { edit: editOrOptions } : editOrOptions || {};
}

export function buildReaderMenuRoute(group: ReaderMenuRouteGroup, uuid: string, editOrOptions: boolean | ReaderMenuRouteOptions | undefined = false): string {

    const { edit, sort } = normalizeReaderMenuRouteOptions(editOrOptions);
    const route = `/reader/menu/${group}/${encodeURIComponent(uuid)}`;
    const params = new URLSearchParams();
    if (edit) {
        params.set("edit", "1");
    }
    if (isPublicationNotesViewSort(sort)) {
        params.set("sort", sort);
    }

    const search = params.toString();
    return search ? `${route}?${search}` : route;
}

export const dispatchReaderMenuRoutePush = (dispatch: TDispatch) =>
    (group: ReaderMenuRouteGroup, uuid: string, editOrOptions: boolean | ReaderMenuRouteOptions | undefined = false) =>
        dispatch(push(buildReaderMenuRoute(group, uuid, editOrOptions)));
