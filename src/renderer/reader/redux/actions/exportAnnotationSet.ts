// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { INoteState } from "readium-desktop/common/redux/states/renderer/note";
import { PublicationView } from "readium-desktop/common/views/publication";

export const ID = "READER_EXPORT_ANNOTATION_SET";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Payload   {
    annotationArray: INoteState[];
    publicationView: PublicationView;
    label?: string;
    fileType?: "annotation" | "html";
}

export function build(annotationArray: INoteState[], publicationView: PublicationView, label?: string, fileType?: "annotation" | "html"):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            annotationArray,
            publicationView,
            label,
            fileType,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
