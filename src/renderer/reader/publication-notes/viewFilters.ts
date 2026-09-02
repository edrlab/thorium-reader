// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    defaultPublicationNotesViewSort,
    getEffectivePublicationNotesViewSort,
    publicationNotesViewSortValues,
    type PublicationNotesViewSelection,
    type PublicationNotesViewSort,
} from "readium-desktop/common/publication-notes";
import type { Selection } from "react-aria-components";

export { defaultPublicationNotesViewSort };

export function selectionToPublicationNotesViewSelection(selection: Selection): PublicationNotesViewSelection | undefined {

    if (selection === "all") {
        return "all";
    }

    const values = Array.from(selection)
        .map((value) => `${value}`)
        .filter((value) => !!value);

    return values.length ? values : undefined;
}

export function selectionToPublicationNotesViewSort(selection: Selection): PublicationNotesViewSort | undefined {

    if (selection === "all") {
        return undefined;
    }

    for (const sort of publicationNotesViewSortValues) {
        if (selection.has(sort)) {
            return sort;
        }
    }

    return undefined;
}

export function publicationNotesViewSortToSelection(sort: PublicationNotesViewSort | undefined): Selection {

    return new Set([getEffectivePublicationNotesViewSort(sort)]);
}

export function selectionToEffectivePublicationNotesViewSort(selection: Selection): PublicationNotesViewSort {

    return getEffectivePublicationNotesViewSort(selectionToPublicationNotesViewSort(selection));
}
