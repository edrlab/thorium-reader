// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { TAnnotationTagsIndex } from "readium-desktop/common/redux/states/renderer/annotation";

// push tags and increase number
export const pushTags = (container: TAnnotationTagsIndex, tags: string[] | undefined) => {
    const copy =  {
        ...container,
    };
    for (const t of (tags || [])) {
        copy[t] = (copy[t] || 0) + 1;
    }
    return copy;
}
// pop tags and reduce number, remove them if lower than 1
export const popTags = (container: TAnnotationTagsIndex, tags: string[] | undefined) => {
    const copy = {
        ...container,
    };
    for (const t of (tags || [])) {
        copy[t] = (copy[t] || 0) - 1;
        if (copy[t] < 1) {
            delete copy[t];
        }
    }
    return copy;
}
// update pop and push combine
export const updateTags = (container: TAnnotationTagsIndex, oldTags: string[] | undefined, newTags: string[] | undefined) => {
    return pushTags(popTags(container, oldTags), newTags);
}
