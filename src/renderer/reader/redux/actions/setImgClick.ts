// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IEventPayload_R2_EVENT_IMAGE_CLICK } from "@r2-navigator-js/electron/common/events";
import { Action } from "readium-desktop/common/models/redux";

export const ID = "READER_SET_IMAGE_CLICK";

type a = { open: true } & IEventPayload_R2_EVENT_IMAGE_CLICK;
type b = { open: false } & Partial<IEventPayload_R2_EVENT_IMAGE_CLICK>;
type Payload = a | b;

export function build(payload?: IEventPayload_R2_EVENT_IMAGE_CLICK):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: { open: !!payload, ...payload },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
