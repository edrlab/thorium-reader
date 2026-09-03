// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import type {
    PublicationAnnotation,
    PublicationAnnotationsSnapshot,
    PublicationAnnotationsViewState,
} from "./model";

export function serializePublicationAnnotationsViewState<TAnnotation extends PublicationAnnotation>(
    snapshot: PublicationAnnotationsSnapshot<TAnnotation>,
): PublicationAnnotationsViewState<TAnnotation> {

    const byId: Record<string, TAnnotation> = {};
    const ids: string[] = [];
    const tagIndex: Record<string, number> = {};

    for (const annotation of snapshot.annotations) {
        byId[annotation.uuid] = annotation;
        ids.push(annotation.uuid);

        for (const tag of annotation.tags || []) {
            if (!tag) {
                continue;
            }
            tagIndex[tag] = (tagIndex[tag] || 0) + 1;
        }
    }

    return {
        ...snapshot,
        byId,
        ids,
        tagIndex,
        totalCount: snapshot.annotations.length,
    };
}
