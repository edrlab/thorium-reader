// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { IAnnotationState } from "readium-desktop/common/redux/states/annotation";

export const ID = "READER_ANNOTATIONS_POP";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IPayload extends IAnnotationState {
}

export function build(param: IAnnotationState):
    Action<typeof ID, IPayload> {

    return {
        type: ID,
        payload: param,
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
