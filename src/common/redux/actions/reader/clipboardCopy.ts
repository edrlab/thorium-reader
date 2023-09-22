
// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import { IEventPayload_R2_EVENT_CLIPBOARD_COPY } from "@r2-navigator-js/electron/common/events";
import { Action } from "readium-desktop/common/models/redux";

export const ID = "READER_CLIPBOARD_COPY";

export interface Payload {
    publicationIdentifier: string,
    clipboardData: IEventPayload_R2_EVENT_CLIPBOARD_COPY
}

export function build(publicationIdentifier: string, clipboardData: IEventPayload_R2_EVENT_CLIPBOARD_COPY):
    Action<typeof ID, Payload> {

    return {
        type: ID,
        payload: {
            publicationIdentifier,
            clipboardData,
        },
    };
}
build.toString = () => ID; // Redux StringableActionCreator
export type TAction = ReturnType<typeof build>;
