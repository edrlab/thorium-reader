// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IEventPayload_R2_EVENT_IMAGE_CLICK } from "@r2-navigator-js/electron/common/events";

import { Action } from "readium-desktop/common/models/redux";
import { IImageClickState, IImageClickStatePlusDomParsing } from "../state/imageClick";

export const ID = "READER_SET_IMAGE_CLICK";

export function build(payload?: IEventPayload_R2_EVENT_IMAGE_CLICK & Partial<IImageClickStatePlusDomParsing>):

    Action<typeof ID, IImageClickState> {

    return {
        type: ID,
        payload: { open: !!payload, ...payload },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
