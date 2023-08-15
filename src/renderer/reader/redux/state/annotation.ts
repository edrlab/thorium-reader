// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IAnnotationState } from "readium-desktop/common/redux/states/annotation";
import { IColor } from "@r2-navigator-js/electron/common/highlight";

export interface IAnnotationUserInterfaceState {
    enable: boolean;
    newFocusAnnotationUUID: IAnnotationState["uuid"];
    oldFocusAnnotationUUID: IAnnotationState["uuid"];
    color: IColor
}

export const annotationDefaultState = (): IAnnotationUserInterfaceState =>
    ({
        enable: false,
        newFocusAnnotationUUID: "",
        oldFocusAnnotationUUID: "",
        color: {red: 0, green: 0, blue: 0},
    });
