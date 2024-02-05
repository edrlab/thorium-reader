// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { Action } from "readium-desktop/common/models/redux";
import { diReaderGet } from "readium-desktop/renderer/reader/di";
import { IAnnotationUserInterfaceState } from "readium-desktop/common/redux/states/renderer/annotation";

export const ID = "READER_ANNOTATION_FOCUS";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IPayload extends Partial<IAnnotationUserInterfaceState> {
}

export function build(focusUUId: IAnnotationUserInterfaceState["newFocusAnnotationUUID"]):
    Action<typeof ID, IPayload> {

    const store = diReaderGet("store");
    const { newFocusAnnotationUUID: oldFocusUUId } = store.getState().annotation;
    return {
        type: ID,
        payload: {
            newFocusAnnotationUUID: focusUUId,
            oldFocusAnnotationUUID: oldFocusUUId,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
