// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IColor } from "@r2-navigator-js/electron/common/highlight";
import { IAnnotationUserInterfaceState } from "../../state/annotation";

export const ID = "READER_ANNOTATION_COLOR";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IPayload extends Partial<IAnnotationUserInterfaceState> {
}

export function build(color: IColor):
    Action<typeof ID, IPayload> {

    return {
        type: ID,
        payload: {
            color,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;