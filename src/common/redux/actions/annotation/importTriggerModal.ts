// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IReadiumAnnotationSet } from "readium-desktop/common/readium/annotation/annotationModel.type";
import { INotePreParsingState } from "readium-desktop/common/redux/states/renderer/note";

export const ID = "ANNOTATION_IMPORT_TRIGGER_MODAL";

export interface IReadiumAnnotationModelSetView extends Partial<Pick<IReadiumAnnotationSet, "about" | "title" | "generated" | "generator">> {

}
export interface Payload extends IReadiumAnnotationModelSetView {
    annotationsList: INotePreParsingState[]
    annotationsConflictListOlder: INotePreParsingState[];
    annotationsConflictListNewer: INotePreParsingState[];
    winId?: string | undefined;
}
export function build(payload: Payload): Action<typeof ID, Payload> {
    return {
        type: ID,
        payload,
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
