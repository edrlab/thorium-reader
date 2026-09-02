// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { push } from "redux-first-history";
import type { PublicationNoteGroup } from "readium-desktop/common/publication-notes";
import type { TDispatch } from "readium-desktop/typings/redux";

export type ReaderMenuRouteGroup = Extract<PublicationNoteGroup, "annotation" | "bookmark">;

export const readerMenuRoutePattern = "/reader/menu/:group/:uuid";

export function isReaderMenuRouteGroup(group: string | undefined): group is ReaderMenuRouteGroup {
    return group === "annotation" || group === "bookmark";
}

export function buildReaderMenuRoute(group: ReaderMenuRouteGroup, uuid: string, edit = false): string {
    const route = `/reader/menu/${group}/${encodeURIComponent(uuid)}`;
    return edit ? `${route}?edit=1` : route;
}

export const dispatchReaderMenuRoutePush = (dispatch: TDispatch) =>
    (group: ReaderMenuRouteGroup, uuid: string, edit = false) =>
        dispatch(push(buildReaderMenuRoute(group, uuid, edit)));
