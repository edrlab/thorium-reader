// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IReadiumAnnotationModelSet } from "readium-desktop/common/readium/annotation/annotationModel.type";
import { IAnnotationState } from "readium-desktop/common/redux/states/renderer/annotation";

interface IReadiumAnnotationModelSetView extends Partial<Pick<IReadiumAnnotationModelSet, "about" | "title" | "generated" | "generator">> {

}
export interface IImportAnnotationState extends IReadiumAnnotationModelSetView {
    open: boolean;
    annotationsConflictList: IAnnotationState[]
    annotationsList: IAnnotationState[]
    winId?: string | undefined;
}
