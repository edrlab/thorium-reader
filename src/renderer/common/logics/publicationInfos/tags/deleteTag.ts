
// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IOpdsTagView } from "readium-desktop/common/views/opds";

export const deleteTag =
    (
        tagArray: string[] | IOpdsTagView[],
        setTags: (tagsName: string[]) => void,
    ) =>
        (index: number) => {

            const tags = Array.isArray(tagArray) ? tagArray.slice() : [];

            tags.splice(index, 1);

            const tagsName: string[] = [];
            for (const tag of tags) {
                if (typeof tag === "string") {
                    tagsName.push(tag);
                } else {
                    tagsName.push(tag.name);
                }
            }

            setTags(tagsName);
        };
